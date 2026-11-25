package main

import (
	"bytes"
	"context"
	"crypto/ed25519"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"github.com/coder/websocket"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

type fixture struct {
	t            *testing.T
	s            *Service
	server       *httptest.Server
	public, host string
	private      ed25519.PrivateKey
}

func setup(t *testing.T) *fixture {
	s, err := newService("", "https://randomai.art", func(_ context.Context, token string) (int, error) {
		if token == "valid-owner-token" {
			return 1, nil
		}
		if token == "other-owner-token" {
			return 2, nil
		}
		return 0, errors.New("invalid")
	})
	if err != nil {
		t.Fatal(err)
	}
	server := httptest.NewServer(s.Handler())
	t.Cleanup(server.Close)
	pub, key, _ := ed25519.GenerateKey(rand.Reader)
	return &fixture{t, s, server, base64.RawURLEncoding.EncodeToString(pub), "host-" + secret(12), key}
}
func (f *fixture) post(path string, value interface{}, token string) (int, map[string]interface{}) {
	data, _ := json.Marshal(value)
	r, _ := http.NewRequest("POST", f.server.URL+path, bytes.NewReader(data))
	r.Header.Set("Content-Type", "application/json")
	if token != "" {
		r.Header.Set("Authorization", "Bearer "+token)
		r.Header.Set("Origin", "https://randomai.art")
	}
	response, err := http.DefaultClient.Do(r)
	if err != nil {
		f.t.Fatal(err)
	}
	defer response.Body.Close()
	var result map[string]interface{}
	json.NewDecoder(response.Body).Decode(&result)
	return response.StatusCode, result
}
func (f *fixture) signed(purpose string, payload interface{}) SignedRequest {
	code, c := f.post("/challenge", map[string]string{"publicKey": f.public, "purpose": purpose}, "")
	if code != 200 {
		f.t.Fatal(code, c)
	}
	data, _ := json.Marshal(payload)
	encoded := base64.RawURLEncoding.EncodeToString(data)
	id := c["id"].(string)
	message := "tervell-connect-v1\n" + purpose + "\n" + id + "\n" + c["nonce"].(string) + "\n" + encoded
	return SignedRequest{ChallengeID: id, PublicKey: f.public, Payload: encoded, Signature: base64.RawURLEncoding.EncodeToString(ed25519.Sign(f.private, []byte(message)))}
}
func (f *fixture) proof(purpose, path string, payload interface{}) (int, map[string]interface{}) {
	return f.post(path, f.signed(purpose, payload), "")
}
func (f *fixture) approve() string {
	code, start := f.proof("start", "/device/start", map[string]string{"hostId": f.host, "name": "Test PC", "platform": "darwin-arm64", "requestId": secret(16)})
	if code != 200 {
		f.t.Fatal(code, start)
	}
	code, result := f.post("/account/approve", map[string]interface{}{"code": start["userCode"], "confirm": true}, "valid-owner-token")
	if code != 200 {
		f.t.Fatal(code, result)
	}
	code, lease := f.proof("poll", "/device/poll", map[string]interface{}{"requestId": start["requestId"]})
	if code != 200 {
		f.t.Fatal(code, lease)
	}
	return lease["lease"].(map[string]interface{})["accessToken"].(string)
}
func TestGivenDeviceProofWhenReplayOrTamperThenRefused(t *testing.T) {
	f := setup(t)
	payload := map[string]string{"hostId": f.host, "name": "Test", "platform": "win32-x64", "requestId": secret(16)}
	proof := f.signed("start", payload)
	bad := proof
	bad.Payload = base64.RawURLEncoding.EncodeToString([]byte(`{"hostId":"other-host"}`))
	code, _ := f.post("/device/start", bad, "")
	if code != 403 {
		t.Fatal("tampered signature accepted")
	}
	code, start := f.post("/device/start", proof, "")
	if code != 200 {
		t.Fatal(start)
	}
	code, _ = f.post("/device/start", proof, "")
	if code != 403 {
		t.Fatal("proof replay accepted")
	}
	code, _ = f.post("/account/approve", map[string]interface{}{"code": start["userCode"], "confirm": true}, "invalid")
	if code != 401 {
		t.Fatal("anonymous registration")
	}
	code, _ = f.proof("lease", "/lease", map[string]string{"hostId": f.host})
	if code != 403 {
		t.Fatal("unapproved identity got lease")
	}
}
func TestGivenRegisteredHostWhenRenewOrRevokeThenSilentRenewAndImmediateDenial(t *testing.T) {
	f := setup(t)
	token := f.approve()
	if len(token) != 64 {
		t.Fatal("bad lease")
	}
	code, newLease := f.proof("lease", "/lease", map[string]string{"hostId": f.host})
	if code != 200 || newLease["accessToken"] == token {
		t.Fatal("automatic renewal failed")
	}
	code, _ = f.post("/account/revoke", map[string]string{"hostId": f.host}, "other-owner-token")
	if code != 403 {
		t.Fatal("cross-account revoke")
	}
	code, _ = f.post("/account/revoke", map[string]string{"hostId": f.host}, "valid-owner-token")
	if code != 200 {
		t.Fatal("revoke failed")
	}
	code, _ = f.proof("lease", "/lease", map[string]string{"hostId": f.host})
	if code != 403 {
		t.Fatal("revoked lease renewed")
	}
}
func TestGivenRevokedHostWhenOwnerApprovesAgainThenIdentityRetained(t *testing.T) {
	f := setup(t)
	f.approve()
	f.post("/account/revoke", map[string]string{"hostId": f.host}, "valid-owner-token")
	code, start := f.proof("start", "/device/start", map[string]string{"hostId": f.host, "name": "Retry PC", "platform": "test", "requestId": secret(16)})
	if code != 200 || start["state"] != "pending" {
		t.Fatal("revoked identity bypassed fresh confirmation")
	}
	code, _ = f.post("/account/approve", map[string]interface{}{"code": start["userCode"], "confirm": true}, "valid-owner-token")
	if code != 200 {
		t.Fatal("owner cannot reauthorize")
	}
	code, _ = f.proof("lease", "/lease", map[string]string{"hostId": f.host})
	if code != 200 {
		t.Fatal("new confirmation cannot renew")
	}
}

func TestGivenTwoHostsWhenRelayRenewAndRevokeThenNoCrossRouting(t *testing.T) {
	f := setup(t)
	token := f.approve()
	ctx, cancel := context.WithTimeout(context.Background(), 8*time.Second)
	defer cancel()
	conn, _, err := websocket.Dial(ctx, strings.Replace(f.server.URL, "http:", "ws:", 1)+"/host/ws", nil)
	if err != nil {
		t.Fatal(err)
	}
	defer conn.CloseNow()
	send := func(v interface{}) {
		b, _ := json.Marshal(v)
		if err = conn.Write(ctx, websocket.MessageText, b); err != nil {
			t.Fatal(err)
		}
	}
	read := func() map[string]interface{} {
		_, data, e := conn.Read(ctx)
		if e != nil {
			t.Fatal(e)
		}
		var out map[string]interface{}
		json.Unmarshal(data, &out)
		return out
	}
	hello := read()
	proof := "tervell-connect-ws-v1\n" + f.host + "\n" + hello["nonce"].(string) + "\n" + token
	send(map[string]string{"type": "auth", "token": token, "signature": base64.RawURLEncoding.EncodeToString(ed25519.Sign(f.private, []byte(proof)))})
	if read()["type"] != "ready" {
		t.Fatal("no ready")
	}
	phoneToken := secret(32)
	send(map[string]interface{}{"type": "routes", "routes": map[string]Route{"phone": {TokenHash: hash(phoneToken), ExpiresAt: time.Now().Add(time.Hour).UnixMilli()}}})
	_, lease := f.proof("lease", "/lease", map[string]string{"hostId": f.host})
	send(map[string]interface{}{"type": "renew", "token": lease["accessToken"]})
	if read()["type"] != "renewed" {
		t.Fatal("in-place renewal failed")
	}
	packet := MobilePacket{V: 1, HostID: f.host, DeviceID: "phone", Direction: "to-host", Seq: 1, Nonce: secret(12), Ciphertext: secret(32)}
	request := func(host, device, token string) int {
		body, _ := json.Marshal(map[string]interface{}{"hostId": host, "deviceId": device, "packet": packet})
		r, _ := http.NewRequest("POST", f.server.URL+"/exchange", bytes.NewReader(body))
		r.Header.Set("Content-Type", "application/json")
		r.Header.Set("Authorization", "Bearer "+token)
		response, e := http.DefaultClient.Do(r)
		if e != nil {
			t.Error(e)
			return 0
		}
		io.Copy(io.Discard, response.Body)
		response.Body.Close()
		return response.StatusCode
	}
	if request(f.host, "phone", secret(32)) != 403 {
		t.Fatal("wrong phone token accepted")
	}
	result := make(chan int, 1)
	go func() { result <- request(f.host, "phone", phoneToken) }()
	frame := read()
	if frame["hostId"] != f.host || frame["deviceId"] != "phone" {
		t.Fatal("cross routing")
	}
	packet.Direction = "to-device"
	send(map[string]interface{}{"type": "response", "id": frame["id"], "packet": packet})
	if <-result != 200 {
		t.Fatal("relay failed")
	}
	code, _ := f.post("/account/revoke", map[string]string{"hostId": f.host}, "valid-owner-token")
	if code != 200 {
		t.Fatal("revoke failed")
	}
	_, _, err = conn.Read(ctx)
	if err == nil {
		t.Fatal("revocation retained socket")
	}
}
func TestGivenExpiredChallengeAndPersistentStoreWhenRestartThenNoSharedSecretRequired(t *testing.T) {
	f := setup(t)
	token := f.approve()
	_ = token
	f.s.file = t.TempDir() + "/hosts.json"
	f.s.mu.Lock()
	err := f.s.save()
	f.s.mu.Unlock()
	if err != nil {
		t.Fatal(err)
	}
	restored, err := newService(f.s.file, f.s.origin, f.s.account)
	if err != nil || restored.state.Hosts[f.host].PublicKey != f.public {
		t.Fatal("registration lost")
	}
	proof := f.signed("lease", map[string]string{"hostId": f.host})
	f.s.mu.Lock()
	c := f.s.challenges[proof.ChallengeID]
	c.Expires = time.Now().Add(-time.Second)
	f.s.challenges[proof.ChallengeID] = c
	f.s.mu.Unlock()
	code, _ := f.post("/lease", proof, "")
	if code != 403 {
		t.Fatal("expired challenge accepted")
	}
}
func TestGivenWebsiteAccountWhenDisabledOrRedirectThenReject(t *testing.T) {
	api := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if bearer(r) == "valid-owner-token" {
			reply(w, 200, map[string]interface{}{"success": true, "data": map[string]int{"id": 1, "status": 1}})
		} else {
			reply(w, 200, map[string]interface{}{"success": true, "data": map[string]int{"id": 1, "status": 2}})
		}
	}))
	defer api.Close()
	verifier := websiteAccount(api.URL)
	if id, err := verifier(context.Background(), "valid-owner-token"); id != 1 || err != nil {
		t.Fatal("valid site account refused")
	}
	if _, err := verifier(context.Background(), "disabled-account-token"); err == nil {
		t.Fatal("disabled account accepted")
	}
}

func TestGivenTwoActiveComputersWhenPhonesUseSameDeviceIDThenOwnCiphertextOnly(t *testing.T) {
	first := setup(t)
	pub, key, _ := ed25519.GenerateKey(rand.Reader)
	second := &fixture{t: t, s: first.s, server: first.server, public: base64.RawURLEncoding.EncodeToString(pub), host: "host-" + secret(12), private: key}
	tokenA, tokenB := first.approve(), second.approve()
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	attach := func(f *fixture, token string) *websocket.Conn {
		conn, _, err := websocket.Dial(ctx, strings.Replace(f.server.URL, "http:", "ws:", 1)+"/host/ws", nil)
		if err != nil {
			t.Fatal(err)
		}
		_, raw, err := conn.Read(ctx)
		if err != nil {
			t.Fatal(err)
		}
		var hello HostMessage
		json.Unmarshal(raw, &hello)
		proof := "tervell-connect-ws-v1\n" + f.host + "\n" + hello.Nonce + "\n" + token
		data, _ := json.Marshal(HostMessage{Type: "auth", Token: token, Signature: base64.RawURLEncoding.EncodeToString(ed25519.Sign(f.private, []byte(proof)))})
		if err = conn.Write(ctx, websocket.MessageText, data); err != nil {
			t.Fatal(err)
		}
		_, raw, err = conn.Read(ctx)
		if err != nil {
			t.Fatal(err)
		}
		var ready HostMessage
		json.Unmarshal(raw, &ready)
		if ready.Type != "ready" {
			t.Fatal("missing ready")
		}
		return conn
	}
	a, b := attach(first, tokenA), attach(second, tokenB)
	defer a.CloseNow()
	defer b.CloseNow()
	mobileA, mobileB := secret(32), secret(32)
	setRoutes := func(conn *websocket.Conn, token string) {
		data, _ := json.Marshal(HostMessage{Type: "routes", Routes: map[string]Route{"phone": {TokenHash: hash(token), ExpiresAt: time.Now().Add(time.Hour).UnixMilli()}}})
		if err := conn.Write(ctx, websocket.MessageText, data); err != nil {
			t.Fatal(err)
		}
	}
	setRoutes(a, mobileA)
	setRoutes(b, mobileB)
	// 使用renewed作为同一连接上route已处理的确认点。
	barrier := func(conn *websocket.Conn, token string) {
		data, _ := json.Marshal(HostMessage{Type: "renew", Token: token})
		conn.Write(ctx, websocket.MessageText, data)
		_, _, err := conn.Read(ctx)
		if err != nil {
			t.Fatal(err)
		}
	}
	barrier(a, tokenA)
	barrier(b, tokenB)
	exchange := func(host, token string) int {
		packet := MobilePacket{V: 1, HostID: host, DeviceID: "phone", Direction: "to-host", Seq: 1, Nonce: secret(12), Ciphertext: secret(32)}
		body, _ := json.Marshal(map[string]interface{}{"hostId": host, "deviceId": "phone", "packet": packet})
		r, _ := http.NewRequest("POST", first.server.URL+"/exchange", bytes.NewReader(body))
		r.Header.Set("Content-Type", "application/json")
		r.Header.Set("Authorization", "Bearer "+token)
		response, err := http.DefaultClient.Do(r)
		if err != nil {
			t.Error(err)
			return 0
		}
		io.Copy(io.Discard, response.Body)
		response.Body.Close()
		return response.StatusCode
	}
	if exchange(second.host, mobileA) != 403 || exchange(first.host, mobileB) != 403 {
		t.Fatal("cross-host token accepted")
	}
	answer := func(conn *websocket.Conn, expected string, done chan int) {
		_, raw, err := conn.Read(ctx)
		if err != nil {
			t.Error(err)
			done <- 0
			return
		}
		var message HostMessage
		json.Unmarshal(raw, &message)
		if message.HostID != expected {
			t.Error("wrong computer received request")
		}
		var packet MobilePacket
		json.Unmarshal(message.Packet, &packet)
		packet.Direction = "to-device"
		encoded, _ := json.Marshal(packet)
		response, _ := json.Marshal(HostMessage{Type: "response", ID: message.ID, Packet: encoded})
		conn.Write(ctx, websocket.MessageText, response)
		done <- 1
	}
	routed := make(chan int, 2)
	go answer(a, first.host, routed)
	go answer(b, second.host, routed)
	results := make(chan int, 2)
	go func() { results <- exchange(first.host, mobileA) }()
	go func() { results <- exchange(second.host, mobileB) }()
	if <-results != 200 || <-results != 200 || <-routed != 1 || <-routed != 1 {
		t.Fatal("concurrent separate routing failed")
	}
}

func TestGivenPhoneRoutesWhenHostRequestsConfirmationThenAcknowledgedOnlyAfterInstalled(t *testing.T) {
	f := setup(t)
	token := f.approve()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	conn, _, err := websocket.Dial(ctx, strings.Replace(f.server.URL, "http:", "ws:", 1)+"/host/ws", nil)
	if err != nil {
		t.Fatal(err)
	}
	defer conn.CloseNow()
	_, raw, err := conn.Read(ctx)
	if err != nil {
		t.Fatal(err)
	}
	var hello HostMessage
	json.Unmarshal(raw, &hello)
	proof := "tervell-connect-ws-v1\n" + f.host + "\n" + hello.Nonce + "\n" + token
	auth, _ := json.Marshal(HostMessage{Type: "auth", Token: token, Signature: base64.RawURLEncoding.EncodeToString(ed25519.Sign(f.private, []byte(proof)))})
	if err = conn.Write(ctx, websocket.MessageText, auth); err != nil {
		t.Fatal(err)
	}
	_, raw, err = conn.Read(ctx)
	if err != nil {
		t.Fatal(err)
	}
	var ready struct {
		Type      string `json:"type"`
		RoutesAck bool   `json:"routesAck"`
	}
	if json.Unmarshal(raw, &ready) != nil || ready.Type != "ready" || !ready.RoutesAck {
		t.Fatal("route confirmation capability missing")
	}
	id, phoneToken := secret(32), secret(32)
	data, _ := json.Marshal(HostMessage{Type: "routes", SyncID: id, Routes: map[string]Route{"phone": {TokenHash: hash(phoneToken), ExpiresAt: time.Now().Add(time.Hour).UnixMilli()}}})
	if err = conn.Write(ctx, websocket.MessageText, data); err != nil {
		t.Fatal(err)
	}
	_, raw, err = conn.Read(ctx)
	if err != nil {
		t.Fatal(err)
	}
	var ack HostMessage
	if json.Unmarshal(raw, &ack) != nil || ack.Type != "routes-ready" || ack.SyncID != id {
		t.Fatal("route update not acknowledged")
	}
	f.s.mu.Lock()
	host := f.s.hosts[f.host]
	f.s.mu.Unlock()
	host.mu.Lock()
	route, exists := host.routes["phone"]
	host.mu.Unlock()
	if !exists || route.TokenHash != hash(phoneToken) {
		t.Fatal("confirmation sent before route installed")
	}
}

func TestGivenApprovedWebPageWhenAuthorizationCompletesThenHiddenControlsStayHiddenAndNextStepExplicit(t *testing.T) {
	f := setup(t)
	r, err := http.Get(f.server.URL + "/authorize")
	if err != nil {
		t.Fatal(err)
	}
	defer r.Body.Close()
	raw, _ := io.ReadAll(r.Body)
	page := string(raw)
	if !strings.Contains(page, "[hidden]{display:none!important}") {
		t.Fatal("button display overrides hidden state")
	}
	if !strings.Contains(page, "网页确认码不能用于手机配对") || !strings.Contains(page, "生成手机配对码") {
		t.Fatal("computer approval confused with phone pairing")
	}
}
