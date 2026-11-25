package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

type AccountVerifier func(context.Context, string) (int, error)

func websiteAccount(endpoint string) AccountVerifier {
	return func(ctx context.Context, token string) (int, error) {
		if len(token) < 16 || len(token) > 8192 {
			return 0, errors.New("sign in required")
		}
		call, err := http.NewRequestWithContext(ctx, "GET", endpoint, nil)
		if err != nil {
			return 0, err
		}
		call.Header.Set("Authorization", "Bearer "+token)
		client := &http.Client{Timeout: 8 * time.Second, CheckRedirect: func(*http.Request, []*http.Request) error { return errors.New("redirect refused") }}
		response, err := client.Do(call)
		if err != nil {
			return 0, err
		}
		defer response.Body.Close()
		var result struct {
			Success bool `json:"success"`
			Data    struct {
				ID     int `json:"id"`
				Status int `json:"status"`
			} `json:"data"`
		}
		if response.StatusCode != 200 || json.NewDecoder(io.LimitReader(response.Body, 65536)).Decode(&result) != nil || !result.Success || result.Data.ID < 1 || result.Data.Status == 2 {
			return 0, errors.New("sign in required")
		}
		return result.Data.ID, nil
	}
}
func reply(w http.ResponseWriter, code int, value interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(value)
}
func readJSON(w http.ResponseWriter, r *http.Request, output interface{}, limit int64) bool {
	if r.Method != "POST" || !strings.HasPrefix(r.Header.Get("Content-Type"), "application/json") {
		reply(w, 400, map[string]string{"error": "invalid request"})
		return false
	}
	decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, limit))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(output); err != nil {
		reply(w, 400, map[string]string{"error": "invalid request"})
		return false
	}
	var extra interface{}
	if decoder.Decode(&extra) != io.EOF {
		reply(w, 400, map[string]string{"error": "invalid request"})
		return false
	}
	return true
}
func bearer(r *http.Request) string {
	value := r.Header.Get("Authorization")
	if !strings.HasPrefix(value, "Bearer ") {
		return ""
	}
	return strings.TrimPrefix(value, "Bearer ")
}
func validHostID(value string) bool {
	if len(value) < 8 || len(value) > 128 {
		return false
	}
	for _, c := range value {
		if !(c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z' || c >= '0' && c <= '9' || c == '-' || c == '_') {
			return false
		}
	}
	return true
}
func (s *Service) Handler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip, _, _ := net.SplitHostPort(r.RemoteAddr)
		if forwarded := r.Header.Get("X-Real-IP"); (ip == "127.0.0.1" || ip == "::1") && net.ParseIP(forwarded) != nil {
			ip = forwarded
		}
		if !s.allow("ip:"+ip, 600) {
			reply(w, 429, map[string]string{"error": "请稍后再试"})
			return
		}
		if origin := r.Header.Get("Origin"); origin != "" && origin != s.origin {
			reply(w, 403, map[string]string{"error": "origin refused"})
			return
		}
		switch r.URL.Path {
		case "/health":
			reply(w, 200, map[string]interface{}{"service": "tervell-connect", "version": 2})
		case "/authorize":
			s.authorizePage(w, r)
		case "/challenge":
			s.challenge(w, r, ip)
		case "/device/start":
			s.startDevice(w, r, ip)
		case "/device/poll":
			s.pollDevice(w, r)
		case "/lease":
			s.renew(w, r)
		case "/account/devices":
			s.accountDevices(w, r)
		case "/account/approve":
			s.approve(w, r)
		case "/account/revoke":
			s.revoke(w, r)
		case "/host/ws":
			s.hostSocket(w, r)
		case "/exchange":
			s.exchange(w, r)
		default:
			reply(w, 404, map[string]string{"error": "not found"})
		}
	})
}
func (s *Service) challenge(w http.ResponseWriter, r *http.Request, ip string) {
	var input struct {
		PublicKey string `json:"publicKey"`
		Purpose   string `json:"purpose"`
	}
	if !readJSON(w, r, &input, 4096) {
		return
	}
	if !validKey(input.PublicKey) || (input.Purpose != "start" && input.Purpose != "poll" && input.Purpose != "lease") || !s.allow("challenge:"+ip, 180) {
		reply(w, 429, map[string]string{"error": "device proof unavailable"})
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	for id, c := range s.challenges {
		if !s.now().Before(c.Expires) {
			delete(s.challenges, id)
		}
	}
	if len(s.challenges) >= 4096 {
		reply(w, 503, map[string]string{"error": "busy"})
		return
	}
	id, nonce := secret(16), secret(32)
	expires := s.now().Add(time.Minute)
	s.challenges[id] = Challenge{input.PublicKey, input.Purpose, nonce, expires}
	reply(w, 200, map[string]interface{}{"id": id, "nonce": nonce, "expiresAt": expires.UnixMilli()})
}
func (s *Service) startDevice(w http.ResponseWriter, r *http.Request, ip string) {
	var signed SignedRequest
	if !readJSON(w, r, &signed, 16384) {
		return
	}
	var input struct {
		HostID    string `json:"hostId"`
		Name      string `json:"name"`
		Platform  string `json:"platform"`
		RequestID string `json:"requestId"`
	}
	if s.verify("start", signed, &input) != nil || !validHostID(input.HostID) || len(input.Name) > 120 || len(input.Platform) > 40 || len(input.RequestID) < 16 {
		reply(w, 403, map[string]string{"error": "invalid device proof"})
		return
	}
	if !s.allow("start:"+ip, 12) {
		reply(w, 429, map[string]string{"error": "请稍后再试"})
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	if host := s.state.Hosts[input.HostID]; host != nil {
		if host.PublicKey != signed.PublicKey {
			reply(w, 403, map[string]string{"error": "设备已撤销，请重新登记"})
			return
		}
		if !host.Revoked {
			reply(w, 200, map[string]interface{}{"state": "approved", "lease": s.issueLease(host)})
			return
		}
	}
	for id, p := range s.pending {
		if !s.now().Before(p.Expires) {
			delete(s.pending, id)
		} else if p.Key == signed.PublicKey && p.HostID == input.HostID {
			reply(w, 200, map[string]interface{}{"state": "pending", "requestId": p.ID, "userCode": p.Code, "expiresAt": p.Expires.UnixMilli(), "verificationUrl": s.origin + "/connect/authorize?code=" + p.Code})
			return
		}
	}
	if len(s.state.Hosts) >= 10000 {
		reply(w, 503, map[string]string{"error": "service capacity reached"})
		return
	}
	if len(s.pending) >= 1024 {
		reply(w, 503, map[string]string{"error": "busy"})
		return
	}
	id, code := secret(24), strings.ToUpper(secret(6))
	expires := s.now().Add(10 * time.Minute)
	s.pending[id] = &Pending{ID: id, Code: code, Key: signed.PublicKey, HostID: input.HostID, Name: input.Name, Platform: input.Platform, Expires: expires}
	reply(w, 200, map[string]interface{}{"state": "pending", "requestId": id, "userCode": code, "expiresAt": expires.UnixMilli(), "verificationUrl": s.origin + "/connect/authorize?code=" + code})
}
func (s *Service) pollDevice(w http.ResponseWriter, r *http.Request) {
	var signed SignedRequest
	if !readJSON(w, r, &signed, 16384) {
		return
	}
	var input struct {
		RequestID string `json:"requestId"`
	}
	if s.verify("poll", signed, &input) != nil {
		reply(w, 403, map[string]string{"error": "invalid device proof"})
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	p := s.pending[input.RequestID]
	if p == nil || p.Key != signed.PublicKey || !s.now().Before(p.Expires) {
		reply(w, 410, map[string]string{"error": "确认已过期，请重新连接"})
		return
	}
	host := s.state.Hosts[p.HostID]
	if !p.Approved || host == nil {
		reply(w, 200, map[string]string{"state": "pending"})
		return
	}
	if host.Revoked {
		reply(w, 403, map[string]string{"error": "设备已撤销"})
		return
	}
	reply(w, 200, map[string]interface{}{"state": "approved", "lease": s.issueLease(host)})
}
func (s *Service) renew(w http.ResponseWriter, r *http.Request) {
	var signed SignedRequest
	if !readJSON(w, r, &signed, 16384) {
		return
	}
	var input struct {
		HostID string `json:"hostId"`
	}
	if s.verify("lease", signed, &input) != nil {
		reply(w, 403, map[string]string{"error": "invalid device proof"})
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	host := s.state.Hosts[input.HostID]
	if host == nil || host.Revoked || host.PublicKey != signed.PublicKey {
		reply(w, 403, map[string]string{"error": "请重新授权这台电脑"})
		return
	}
	reply(w, 200, s.issueLease(host))
}
func (s *Service) accountUser(w http.ResponseWriter, r *http.Request) (int, bool) {
	if r.Header.Get("Origin") != s.origin {
		reply(w, 403, map[string]string{"error": "请从集市确认页面操作"})
		return 0, false
	}
	user, err := s.account(r.Context(), bearer(r))
	if err != nil {
		reply(w, 401, map[string]string{"error": "请先登录 Random创造集市"})
		return 0, false
	}
	return user, true
}
func (s *Service) accountDevices(w http.ResponseWriter, r *http.Request) {
	user, ok := s.accountUser(w, r)
	if !ok {
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	rows := []map[string]interface{}{}
	for _, host := range s.state.Hosts {
		if host.UserID == user {
			rows = append(rows, map[string]interface{}{"id": host.ID, "name": host.Name, "platform": host.Platform, "revoked": host.Revoked, "online": s.hosts[host.ID] != nil, "createdAt": host.CreatedAt})
		}
	}
	reply(w, 200, map[string]interface{}{"devices": rows})
}
func (s *Service) approve(w http.ResponseWriter, r *http.Request) {
	user, ok := s.accountUser(w, r)
	if !ok {
		return
	}
	var input struct {
		Code    string `json:"code"`
		Confirm bool   `json:"confirm"`
	}
	if !readJSON(w, r, &input, 4096) {
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	var pending *Pending
	for _, p := range s.pending {
		if p.Code == strings.ToUpper(strings.ReplaceAll(input.Code, " ", "")) && s.now().Before(p.Expires) {
			pending = p
			break
		}
	}
	if pending == nil {
		reply(w, 404, map[string]string{"error": "确认码无效或已过期"})
		return
	}
	if !input.Confirm {
		fingerprint := hash(pending.Key)
		reply(w, 200, map[string]interface{}{"name": pending.Name, "platform": pending.Platform, "fingerprint": fingerprint[:16], "approved": pending.Approved})
		return
	}
	if pending.Approved {
		host := s.state.Hosts[pending.HostID]
		if host == nil || host.UserID != user {
			reply(w, 403, map[string]string{"error": "设备已由其他账号确认"})
			return
		}
		reply(w, 200, map[string]bool{"ok": true})
		return
	}
	count := 0
	for _, host := range s.state.Hosts {
		if host.UserID == user && !host.Revoked {
			count++
		}
	}
	if count >= 5 {
		reply(w, 409, map[string]string{"error": "最多启用五台电脑，请先撤销旧设备"})
		return
	}
	previous := s.state.Hosts[pending.HostID]
	if previous != nil && previous.UserID != user {
		reply(w, 403, map[string]string{"error": "请使用原账号重新确认这台电脑"})
		return
	}
	if existing := previous; existing != nil && (!existing.Revoked || existing.PublicKey != pending.Key) {
		reply(w, 409, map[string]string{"error": "电脑身份冲突，请重新登记"})
		return
	}
	s.state.Hosts[pending.HostID] = &HostRecord{ID: pending.HostID, PublicKey: pending.Key, Name: pending.Name, Platform: pending.Platform, UserID: user, CreatedAt: s.now().UnixMilli()}
	if err := s.save(); err != nil {
		if previous != nil {
			s.state.Hosts[pending.HostID] = previous
		} else {
			delete(s.state.Hosts, pending.HostID)
		}
		reply(w, 503, map[string]string{"error": "保存失败，请重试"})
		return
	}
	pending.Approved = true
	reply(w, 200, map[string]bool{"ok": true})
}
func (s *Service) revoke(w http.ResponseWriter, r *http.Request) {
	user, ok := s.accountUser(w, r)
	if !ok {
		return
	}
	var input struct {
		HostID string `json:"hostId"`
	}
	if !readJSON(w, r, &input, 4096) {
		return
	}
	s.mu.Lock()
	host := s.state.Hosts[input.HostID]
	if host == nil || host.UserID != user {
		s.mu.Unlock()
		reply(w, 403, map[string]string{"error": "设备未授权"})
		return
	}
	old := host.Revoked
	host.Revoked = true
	if s.save() != nil {
		host.Revoked = old
		s.mu.Unlock()
		reply(w, 503, map[string]string{"error": "保存失败"})
		return
	}
	connection := s.hosts[host.ID]
	for key, value := range s.leases {
		if value.HostID == host.ID {
			delete(s.leases, key)
		}
	}
	for key, value := range s.pending {
		if value.HostID == host.ID {
			delete(s.pending, key)
		}
	}
	s.mu.Unlock()
	if connection != nil {
		connection.close("device revoked")
	}
	reply(w, 200, map[string]bool{"ok": true})
}
func main() {
	origin := os.Getenv("TERVELL_CONNECT_ORIGIN")
	if origin == "" {
		origin = "https://randomai.art"
	}
	u, err := url.Parse(origin)
	if err != nil || u.Scheme != "https" || u.Host == "" {
		log.Fatal("invalid origin")
	}
	file := os.Getenv("TERVELL_CONNECT_STATE")
	if file == "" {
		file = "/var/lib/tervell-connect/hosts.json"
	}
	s, err := newService(file, origin, websiteAccount("http://127.0.0.1:3000/api/user/self"))
	if err != nil {
		log.Fatal("host store unavailable")
	}
	address := os.Getenv("TERVELL_CONNECT_LISTEN")
	if address == "" {
		address = "127.0.0.1:8771"
	}
	host, _, err := net.SplitHostPort(address)
	if err != nil || net.ParseIP(host) == nil || !net.ParseIP(host).IsLoopback() {
		log.Fatal("listen must be loopback")
	}
	server := &http.Server{Addr: address, Handler: s.Handler(), ReadHeaderTimeout: 8 * time.Second, IdleTimeout: 60 * time.Second, MaxHeaderBytes: 16384}
	fmt.Println("Tervell connect ready on loopback")
	log.Fatal(server.ListenAndServe())
}
