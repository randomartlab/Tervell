package main

import (
	"context"
	"errors"
	"fmt"
	"net"
	"net/http"
	"os"
	"testing"
	"time"
)

// 仅由go test编译；生产二进制不含测试账号、短租约或测试启动入口。
func TestFixture(t *testing.T) {
	if os.Getenv("TERVELL_CONNECT_FIXTURE") != "1" {
		t.Skip("integration fixture only")
	}
	s, err := newService("", "http://127.0.0.1", func(_ context.Context, token string) (int, error) {
		if token == "local-test-owner" {
			return 1, nil
		}
		return 0, errors.New("invalid")
	})
	if err != nil {
		t.Fatal(err)
	}
	s.leaseDuration = 12 * time.Second
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer listener.Close()
	s.origin = "http://" + listener.Addr().String()
	fmt.Println("FIXTURE " + s.origin)
	http.Serve(listener, s.Handler())
}
