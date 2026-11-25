#!/usr/bin/env python3
"""Proma 易失内存中转：仅 loopback，TLS 由 Nginx 终止；禁止记录请求正文/凭据。"""
import hashlib
import hmac
import json
import os
import re
import threading
import time
from collections import deque
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

MAX_BODY = 950000
MAX_QUEUE = 16
MAX_BYTES = 8 * 1024 * 1024
LOCK = threading.Condition()
ROOMS = {}
RATE = {}
SLOTS = threading.BoundedSemaphore(48)
ENROLLMENT = os.environ.get('PROMA_RELAY_ENROLLMENT', '')
if len(ENROLLMENT) < 32:
    raise RuntimeError('PROMA_RELAY_ENROLLMENT 未配置')


def digest(token):
    return hashlib.sha256(token.encode()).hexdigest()


class Server(ThreadingHTTPServer):
    daemon_threads = True
    def process_request(self, request, address):
        if not SLOTS.acquire(False):
            request.close()
            return
        try:
            super().process_request(request, address)
        except BaseException:
            SLOTS.release()
            raise
    def process_request_thread(self, request, address):
        try:
            super().process_request_thread(request, address)
        finally:
            SLOTS.release()


class Handler(BaseHTTPRequestHandler):
    server_version = 'PromaRelay/1'
    def log_message(self, *_args):
        pass
    def setup(self):
        super().setup()
        self.connection.settimeout(25)
    def reply(self, code, data):
        raw = json.dumps(data, separators=(',', ':')).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)
    def do_GET(self):
        self.reply(200, {'service': 'proma-relay', 'version': 1}) if self.path == '/health' else self.reply(404, {})
    def do_POST(self):
        try:
            self.handle_post()
        except (ValueError, KeyError, TypeError, UnicodeError):
            self.reply(400, {'error': 'invalid request'})
        except (BrokenPipeError, ConnectionError, TimeoutError):
            pass
    def handle_post(self):
        match = re.fullmatch(r'/v1/rooms/([a-f0-9]{64})/(host|device)/(register|poll|push|ack|delete)', self.path)
        if not match:
            self.reply(404, {})
            return
        size = int(self.headers.get('Content-Length', '0'))
        if size < 2 or size > MAX_BODY or self.headers.get('Transfer-Encoding'):
            self.reply(413, {})
            return
        body = json.loads(self.rfile.read(size))
        if not isinstance(body, dict):
            raise ValueError()
        room_id, role, action = match.groups()
        token = self.headers.get('Authorization', '').removeprefix('Bearer ')
        now = time.monotonic()
        with LOCK:
            for key in list(ROOMS):
                if now - ROOMS[key]['touched'] > 180:
                    del ROOMS[key]
            room = ROOMS.get(room_id)
            if action == 'register':
                if role != 'host' or not hmac.compare_digest(body.get('enrollment', ''), ENROLLMENT):
                    self.reply(403, {})
                    return
                if not re.fullmatch(r'[a-f0-9]{64}', token) or not re.fullmatch(r'[a-f0-9]{64}', body.get('deviceTokenHash', '')):
                    raise ValueError()
                if room and not hmac.compare_digest(room['host'], digest(token)):
                    self.reply(403, {})
                    return
                if not room:
                    if len(ROOMS) >= 100:
                        self.reply(503, {})
                        return
                    room = {'host': digest(token), 'device': body['deviceTokenHash'], 'hostQ': deque(), 'deviceQ': deque(), 'touched': now, 'bytes': 0}
                    ROOMS[room_id] = room
                room['device'] = body['deviceTokenHash']
                room['touched'] = now
                self.reply(200, {})
                return
            if not room or not hmac.compare_digest(room[role], digest(token)):
                self.reply(403, {})
                return
            room['touched'] = now
            rate_key = (room_id, role)
            if len(RATE) > 200:
                RATE.clear()
            started, count = RATE.get(rate_key, (now, 0))
            started, count = (now, 0) if now - started > 60 else (started, count)
            RATE[rate_key] = (started, count + 1)
            if count >= 240:
                self.reply(429, {})
                return
            if action == 'delete':
                if role != 'host':
                    self.reply(403, {})
                    return
                del ROOMS[room_id]
                LOCK.notify_all()
                self.reply(200, {})
                return
            own = room[role + 'Q']
            if action == 'poll':
                poll_key = role + 'Polling'
                if room.get(poll_key):
                    self.reply(429, {})
                    return
                room[poll_key] = True
                try:
                    LOCK.wait_for(lambda: bool(own) or room_id not in ROOMS, timeout=18)
                    self.reply(200, {'packet': own[0][1] if own else None})
                finally:
                    room[poll_key] = False
            elif action == 'ack':
                if own and own[0][1].get('seq') == body.get('seq'):
                    room['bytes'] -= own.popleft()[0]
                self.reply(200, {})
            elif action == 'push':
                target = room['deviceQ' if role == 'host' else 'hostQ']
                direction = 'to-device' if role == 'host' else 'to-host'
                if body.get('direction') != direction or not isinstance(body.get('seq'), int):
                    raise ValueError()
                if len(target) >= MAX_QUEUE or room['bytes'] + size > MAX_BYTES or sum(r['bytes'] for r in ROOMS.values()) + size > 32 * 1024 * 1024:
                    self.reply(429, {})
                    return
                target.append((size, body))
                room['bytes'] += size
                LOCK.notify_all()
                self.reply(200, {})


if __name__ == '__main__':
    Server(('127.0.0.1', int(os.environ.get('PROMA_RELAY_PORT', '8769'))), Handler).serve_forever()
