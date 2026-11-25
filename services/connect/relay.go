package main

import (
	"context"
	"crypto/ed25519"
	"encoding/base64"
	"encoding/json"
	"github.com/coder/websocket"
	"net/http"
	"sync"
	"time"
)

type Route struct {
	TokenHash     string `json:"tokenHash"`
	BootstrapHash string `json:"bootstrapHash,omitempty"`
	ExpiresAt     int64  `json:"expiresAt"`
}
type HostMessage struct {
	Type      string           `json:"type"`
	ID        string           `json:"id,omitempty"`
	Token     string           `json:"token,omitempty"`
	Routes    map[string]Route `json:"routes,omitempty"`
	Packet    json.RawMessage  `json:"packet,omitempty"`
	HostID    string           `json:"hostId,omitempty"`
	DeviceID  string           `json:"deviceId,omitempty"`
	Nonce     string           `json:"nonce,omitempty"`
	Signature string           `json:"signature,omitempty"`
	SyncID    string           `json:"syncId,omitempty"`
}
type HostConnection struct {
	service *Service
	conn    *websocket.Conn
	hostID  string
	expires time.Time
	mu      sync.Mutex
	routes  map[string]Route
	waits   map[string]chan json.RawMessage
}

func (c *HostConnection) close(reason string) { c.conn.Close(websocket.StatusPolicyViolation, reason) }
func (c *HostConnection) send(value interface{}) error {
	data, err := json.Marshal(value)
	if err != nil {
		return err
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	return c.conn.Write(ctx, websocket.MessageText, data)
}
func (s *Service) hostSocket(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		reply(w, 405, map[string]string{"error": "method"})
		return
	}
	select {
	case s.upgrades <- struct{}{}:
		defer func() { <-s.upgrades }()
	default:
		reply(w, 503, map[string]string{"error": "service busy"})
		return
	}
	conn, err := websocket.Accept(w, r, &websocket.AcceptOptions{CompressionMode: websocket.CompressionDisabled})
	if err != nil {
		return
	}
	conn.SetReadLimit(1050000)
	defer conn.CloseNow()
	nonce := secret(32)
	hello, _ := json.Marshal(HostMessage{Type: "hello", Nonce: nonce})
	if err = conn.Write(r.Context(), websocket.MessageText, hello); err != nil {
		conn.CloseNow()
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 12*time.Second)
	_, data, err := conn.Read(ctx)
	cancel()
	if err != nil {
		conn.CloseNow()
		return
	}
	var auth HostMessage
	if json.Unmarshal(data, &auth) != nil || auth.Type != "auth" {
		conn.Close(websocket.StatusPolicyViolation, "authentication required")
		return
	}
	s.mu.Lock()
	lease, ok := s.lease(auth.Token)
	s.mu.Unlock()
	key, keyErr := base64.RawURLEncoding.DecodeString(lease.Key)
	sig, sigErr := base64.RawURLEncoding.DecodeString(auth.Signature)
	proof := "tervell-connect-ws-v1\n" + lease.HostID + "\n" + nonce + "\n" + auth.Token
	ok = ok && keyErr == nil && sigErr == nil && len(key) == ed25519.PublicKeySize && ed25519.Verify(key, []byte(proof), sig)
	if !ok {
		conn.Close(websocket.StatusPolicyViolation, "device authorization required")
		return
	}
	c := &HostConnection{service: s, conn: conn, hostID: lease.HostID, expires: lease.Expires, routes: map[string]Route{}, waits: map[string]chan json.RawMessage{}}
	s.mu.Lock()
	if len(s.hosts) >= 100 && s.hosts[c.hostID] == nil {
		s.mu.Unlock()
		c.close("service busy")
		return
	}
	previous := s.hosts[c.hostID]
	s.hosts[c.hostID] = c
	s.mu.Unlock()
	if previous != nil {
		previous.close("connection replaced")
	}
	defer func() {
		s.mu.Lock()
		if s.hosts[c.hostID] == c {
			delete(s.hosts, c.hostID)
		}
		s.mu.Unlock()
		c.mu.Lock()
		for _, wait := range c.waits {
			close(wait)
		}
		c.waits = map[string]chan json.RawMessage{}
		c.mu.Unlock()
		conn.CloseNow()
	}()
	if c.send(map[string]interface{}{"type": "ready", "routesAck": true}) != nil {
		return
	}
	done := make(chan struct{})
	defer close(done)
	go func() {
		ticker := time.NewTicker(10 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-done:
				return
			case <-ticker.C:
				c.mu.Lock()
				expires := c.expires
				c.mu.Unlock()
				if !s.now().Before(expires) {
					c.close("lease expired")
					return
				}
				ping, cancel := context.WithTimeout(context.Background(), 8*time.Second)
				err := conn.Ping(ping)
				cancel()
				if err != nil {
					conn.CloseNow()
					return
				}
			}
		}
	}()
	for {
		_, data, err := conn.Read(r.Context())
		if err != nil {
			return
		}
		if !s.allow("host:"+c.hostID, 1200) {
			c.close("rate limit")
			return
		}
		var message HostMessage
		if json.Unmarshal(data, &message) != nil {
			c.close("invalid frame")
			return
		}
		switch message.Type {
		case "routes":
			if message.SyncID != "" && !hex64(message.SyncID) {
				c.close("invalid routes identity")
				return
			}
			if len(message.Routes) > 5 {
				c.close("too many phones")
				return
			}
			valid := true
			for id, route := range message.Routes {
				if len(id) > 128 || !hex64(route.TokenHash) || (route.BootstrapHash != "" && !hex64(route.BootstrapHash)) {
					valid = false
					break
				}
			}
			if !valid {
				c.close("invalid routes")
				return
			}
			c.mu.Lock()
			c.routes = message.Routes
			c.mu.Unlock()
			if message.SyncID != "" && c.send(HostMessage{Type: "routes-ready", SyncID: message.SyncID}) != nil {
				return
			}
		case "renew":
			s.mu.Lock()
			next, valid := s.lease(message.Token)
			s.mu.Unlock()
			if !valid || next.HostID != c.hostID {
				c.close("renewal refused")
				return
			}
			c.mu.Lock()
			c.expires = next.Expires
			c.mu.Unlock()
			if c.send(map[string]string{"type": "renewed"}) != nil {
				return
			}
		case "response":
			if len(message.Packet) > 1000000 {
				c.close("oversized response")
				return
			}
			c.mu.Lock()
			wait := c.waits[message.ID]
			if wait != nil {
				select {
				case wait <- message.Packet:
				default:
				}
			}
			c.mu.Unlock()
		default:
			c.close("invalid message")
			return
		}
	}
}
func hex64(s string) bool {
	if len(s) != 64 {
		return false
	}
	for _, b := range s {
		if !(b >= '0' && b <= '9' || b >= 'a' && b <= 'f') {
			return false
		}
	}
	return true
}

type MobilePacket struct {
	V          int    `json:"v"`
	HostID     string `json:"hostId"`
	DeviceID   string `json:"deviceId"`
	Direction  string `json:"direction"`
	Seq        int64  `json:"seq"`
	Nonce      string `json:"nonce"`
	Ciphertext string `json:"ciphertext"`
}

func (s *Service) exchange(w http.ResponseWriter, r *http.Request) {
	if r.Header.Get("Origin") != "" {
		reply(w, 403, map[string]string{"error": "device requests only"})
		return
	}
	var input struct {
		HostID   string          `json:"hostId"`
		DeviceID string          `json:"deviceId"`
		Packet   json.RawMessage `json:"packet"`
	}
	if !readJSON(w, r, &input, 1000000) {
		return
	}
	var packet MobilePacket
	if json.Unmarshal(input.Packet, &packet) != nil || packet.HostID != input.HostID || packet.DeviceID != input.DeviceID || packet.Direction != "to-host" || packet.V != 1 || packet.Seq < 1 || len(packet.Ciphertext) > 900000 {
		reply(w, 400, map[string]string{"error": "invalid encrypted packet"})
		return
	}
	s.mu.Lock()
	host := s.hosts[input.HostID]
	record := s.state.Hosts[input.HostID]
	revoked := record == nil || record.Revoked
	s.mu.Unlock()
	if host == nil || revoked {
		reply(w, 503, map[string]string{"error": "电脑未在线"})
		return
	}
	if !s.allow("phone:"+input.HostID+":"+input.DeviceID, 240) {
		reply(w, 429, map[string]string{"error": "请稍后再试"})
		return
	}
	host.mu.Lock()
	route, ok := host.routes[input.DeviceID]
	tokenHash := hash(bearer(r))
	authorized := ok && s.now().UnixMilli() < route.ExpiresAt && (tokenHash == route.TokenHash || tokenHash == route.BootstrapHash) && s.now().Before(host.expires)
	if !authorized {
		host.mu.Unlock()
		reply(w, 403, map[string]string{"error": "手机未授权或已撤销"})
		return
	}
	if len(host.waits) >= 8 {
		host.mu.Unlock()
		reply(w, 429, map[string]string{"error": "电脑繁忙"})
		return
	}
	id := secret(16)
	wait := make(chan json.RawMessage, 1)
	host.waits[id] = wait
	host.mu.Unlock()
	defer func() { host.mu.Lock(); delete(host.waits, id); host.mu.Unlock() }()
	if host.send(HostMessage{Type: "request", ID: id, Packet: input.Packet, HostID: input.HostID, DeviceID: input.DeviceID}) != nil {
		reply(w, 503, map[string]string{"error": "电脑正在恢复连接"})
		return
	}
	select {
	case data, open := <-wait:
		if !open {
			reply(w, 503, map[string]string{"error": "电脑正在恢复连接"})
			return
		}
		host.mu.Lock()
		current, ok := host.routes[input.DeviceID]
		host.mu.Unlock()
		s.mu.Lock()
		record = s.state.Hosts[input.HostID]
		stillActive := record != nil && !record.Revoked && s.hosts[input.HostID] == host
		s.mu.Unlock()
		if !stillActive || !ok || s.now().UnixMilli() >= current.ExpiresAt || (tokenHash != current.TokenHash && tokenHash != current.BootstrapHash) {
			reply(w, 403, map[string]string{"error": "设备授权已撤销"})
			return
		}
		var value MobilePacket
		if json.Unmarshal(data, &value) != nil || value.HostID != input.HostID || value.DeviceID != input.DeviceID || value.Direction != "to-device" {
			reply(w, 503, map[string]string{"error": "电脑未完成请求"})
			return
		}
		reply(w, 200, map[string]json.RawMessage{"packet": data})
	case <-r.Context().Done():
		return
	case <-time.After(25 * time.Second):
		reply(w, 504, map[string]string{"error": "电脑暂未响应，请重试"})
	}
}
