package main

import (
	"crypto/ed25519"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"sync"
	"time"
)

type HostRecord struct {
	ID        string `json:"id"`
	PublicKey string `json:"publicKey"`
	Name      string `json:"name"`
	Platform  string `json:"platform"`
	UserID    int    `json:"userId"`
	Revoked   bool   `json:"revoked"`
	CreatedAt int64  `json:"createdAt"`
}
type State struct {
	Hosts map[string]*HostRecord `json:"hosts"`
}
type Challenge struct {
	Key, Purpose, Nonce string
	Expires             time.Time
}
type Pending struct {
	ID, Code, Key, HostID, Name, Platform string
	Expires                               time.Time
	Approved                              bool
}
type Lease struct {
	HostID, Key string
	Expires     time.Time
}
type Service struct {
	mu            sync.Mutex
	state         State
	file, origin  string
	challenges    map[string]Challenge
	pending       map[string]*Pending
	leases        map[string]Lease
	hosts         map[string]*HostConnection
	rates         map[string]*Rate
	account       AccountVerifier
	now           func() time.Time
	leaseDuration time.Duration
	upgrades      chan struct{}
}
type Rate struct {
	Start time.Time
	Count int
}

func secret(size int) string {
	b := make([]byte, size)
	if _, err := rand.Read(b); err != nil {
		panic(err)
	}
	return hex.EncodeToString(b)
}
func hash(value string) string {
	sum := sha256.Sum256([]byte(value))
	return hex.EncodeToString(sum[:])
}
func newService(file, origin string, account AccountVerifier) (*Service, error) {
	s := &Service{file: file, origin: origin, account: account, state: State{Hosts: map[string]*HostRecord{}}, challenges: map[string]Challenge{}, pending: map[string]*Pending{}, leases: map[string]Lease{}, hosts: map[string]*HostConnection{}, rates: map[string]*Rate{}, now: time.Now, leaseDuration: 15 * time.Minute, upgrades: make(chan struct{}, 128)}
	if file != "" {
		data, err := os.ReadFile(file)
		if err == nil {
			if err = json.Unmarshal(data, &s.state); err != nil {
				return nil, err
			}
			if s.state.Hosts == nil {
				return nil, errors.New("invalid host store")
			}
		} else if !errors.Is(err, os.ErrNotExist) {
			return nil, err
		}
	}
	return s, nil
}

// 持有锁时原子保存；失败不对外报告登记成功。
func (s *Service) save() error {
	if s.file == "" {
		return nil
	}
	if err := os.MkdirAll(filepath.Dir(s.file), 0700); err != nil {
		return err
	}
	data, err := json.Marshal(s.state)
	if err != nil {
		return err
	}
	f, err := os.CreateTemp(filepath.Dir(s.file), ".hosts-*")
	if err != nil {
		return err
	}
	defer os.Remove(f.Name())
	if err = f.Chmod(0600); err == nil {
		_, err = f.Write(data)
	}
	if err == nil {
		err = f.Sync()
	}
	closeErr := f.Close()
	if err != nil {
		return err
	}
	if closeErr != nil {
		return closeErr
	}
	return os.Rename(f.Name(), s.file)
}
func validKey(value string) bool {
	b, err := base64.RawURLEncoding.DecodeString(value)
	return err == nil && len(b) == ed25519.PublicKeySize
}

type SignedRequest struct {
	ChallengeID string `json:"challengeId"`
	PublicKey   string `json:"publicKey"`
	Payload     string `json:"payload"`
	Signature   string `json:"signature"`
}

func (s *Service) verify(purpose string, input SignedRequest, output interface{}) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	c, ok := s.challenges[input.ChallengeID]
	if !ok || c.Purpose != purpose || c.Key != input.PublicKey || !s.now().Before(c.Expires) {
		return errors.New("challenge expired")
	}
	key, err := base64.RawURLEncoding.DecodeString(input.PublicKey)
	if err != nil {
		return err
	}
	signature, err := base64.RawURLEncoding.DecodeString(input.Signature)
	if err != nil {
		return err
	}
	message := "tervell-connect-v1\n" + purpose + "\n" + input.ChallengeID + "\n" + c.Nonce + "\n" + input.Payload
	if !ed25519.Verify(key, []byte(message), signature) {
		return errors.New("invalid device proof")
	}
	data, err := base64.RawURLEncoding.DecodeString(input.Payload)
	if err != nil || len(data) > 8192 {
		return errors.New("invalid payload")
	}
	if err = json.Unmarshal(data, output); err != nil {
		return err
	}
	delete(s.challenges, input.ChallengeID)
	return nil
}
func (s *Service) issueLease(host *HostRecord) map[string]interface{} {
	now := s.now()
	for key, value := range s.leases {
		if !now.Before(value.Expires) {
			delete(s.leases, key)
		}
	}
	// 每台设备仅保留少量未到期凭据，重试不能无限占用内存。
	count := 0
	for key, value := range s.leases {
		if value.HostID == host.ID {
			count++
			if count >= 3 {
				delete(s.leases, key)
			}
		}
	}
	token := secret(32)
	expires := now.Add(s.leaseDuration)
	s.leases[hash(token)] = Lease{host.ID, host.PublicKey, expires}
	return map[string]interface{}{"hostId": host.ID, "accessToken": token, "expiresAt": expires.UnixMilli(), "renewAfterMs": int64(s.leaseDuration.Milliseconds() * 2 / 3)}
}
func (s *Service) lease(token string) (Lease, bool) {
	value, ok := s.leases[hash(token)]
	host := s.state.Hosts[value.HostID]
	return value, ok && s.now().Before(value.Expires) && host != nil && !host.Revoked && host.PublicKey == value.Key
}
func (s *Service) allow(key string, limit int) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	now := s.now()
	for k, v := range s.rates {
		if now.Sub(v.Start) > time.Minute {
			delete(s.rates, k)
		}
	}
	value := s.rates[key]
	if value == nil {
		if len(s.rates) > 8192 {
			return false
		}
		value = &Rate{Start: now}
		s.rates[key] = value
	}
	value.Count++
	return value.Count <= limit
}
