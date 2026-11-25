#!/usr/bin/env python3
"""使用现有 SSH 配置部署独立中转；不安装包，不输出登记密钥。"""
import argparse
import base64
import pathlib
import subprocess

parser = argparse.ArgumentParser()
parser.add_argument('--ssh', default='yuyu')
args = parser.parse_args()
source = base64.b64encode(pathlib.Path(__file__).with_name('relay.py').read_bytes()).decode()
script = r'''
import base64, datetime, json, os, pathlib, secrets, shutil, subprocess, urllib.request
base = pathlib.Path('/opt/proma-relay')
base.mkdir(mode=0o755, exist_ok=True)
config = pathlib.Path('/www/server/panel/vhost/nginx/randomai.art.conf')
service = pathlib.Path('/etc/systemd/system/proma-relay.service')
if service.exists() and 'Description=Proma encrypted relay' not in service.read_text():
    raise RuntimeError('同名服务已存在且不属于 Proma')
stamp = datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
backup = base / ('rollback-' + stamp)
backup.mkdir(mode=0o700)
shutil.copy2(config, backup / 'nginx.conf')
for file in [base / 'relay.py', service]:
    if file.exists(): shutil.copy2(file, backup / file.name)
env = base / 'relay.env'
if not env.exists():
    fd = os.open(str(env), os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'w') as output: output.write('PROMA_RELAY_ENROLLMENT=' + secrets.token_hex(32) + '\n')
os.chmod(env, 0o600)
(base / 'relay.py').write_bytes(base64.b64decode('SOURCE_BASE64'))
service.write_text("""[Unit]
Description=Proma encrypted relay
After=network.target
[Service]
Type=simple
DynamicUser=yes
EnvironmentFile=/opt/proma-relay/relay.env
ExecStart=/usr/bin/python3 -B /opt/proma-relay/relay.py
Restart=on-failure
RestartSec=3
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=yes
RestrictAddressFamilies=AF_INET AF_INET6
MemoryMax=128M
TasksMax=64
LimitNOFILE=128
StandardOutput=null
StandardError=journal
[Install]
WantedBy=multi-user.target
""")
text = config.read_text()
marker = '    # Proma relay managed location'
location = """    # Proma relay managed location
    location ^~ /proma-relay/ {
        client_max_body_size 950k;
        client_body_timeout 10s;
        proxy_pass http://127.0.0.1:8769/;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_read_timeout 25s;
        proxy_send_timeout 25s;
        proxy_buffering off;
        proxy_request_buffering off;
        access_log off;
    }
"""
if marker not in text:
    if '/proma-relay/' in text: raise RuntimeError('已存在非受管的中转路由')
    position = text.index('    server_name ')
    position = text.index('\n', position) + 1
    config.write_text(text[:position] + location + text[position:])
try:
    subprocess.run(['/usr/bin/nginx', '-t', '-c', '/www/server/nginx/conf/nginx.conf'], check=True, capture_output=True)
    subprocess.run(['systemctl', 'daemon-reload'], check=True)
    subprocess.run(['systemctl', 'enable', '--now', 'proma-relay'], check=True, capture_output=True)
    subprocess.run(['systemctl', 'restart', 'proma-relay'], check=True)
    import time
    for attempt in range(30):
        try:
            with urllib.request.urlopen('http://127.0.0.1:8769/health', timeout=2) as response:
                if json.load(response).get('service') == 'proma-relay': break
        except Exception:
            time.sleep(0.1)
    else: raise RuntimeError('中转健康检查失败')
    subprocess.run(['/usr/bin/nginx', '-s', 'reload', '-c', '/www/server/nginx/conf/nginx.conf'], check=True, capture_output=True)
    print(json.dumps({'deployed': True, 'route': '/proma-relay/', 'port': 8769, 'backup': str(backup)}))
except BaseException:
    shutil.copy2(backup / 'nginx.conf', config)
    if (backup / 'relay.py').exists(): shutil.copy2(backup / 'relay.py', base / 'relay.py')
    if (backup / service.name).exists():
        shutil.copy2(backup / service.name, service)
        subprocess.run(['systemctl', 'daemon-reload'])
        subprocess.run(['systemctl', 'restart', 'proma-relay'])
    else:
        subprocess.run(['systemctl', 'disable', '--now', 'proma-relay'], capture_output=True)
        service.unlink(missing_ok=True)
        subprocess.run(['systemctl', 'daemon-reload'])
    subprocess.run(['/usr/bin/nginx', '-s', 'reload', '-c', '/www/server/nginx/conf/nginx.conf'], capture_output=True)
    raise
'''.replace('SOURCE_BASE64', source)
result = subprocess.run(['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=10', args.ssh, 'python3 -'], input=script, text=True, capture_output=True)
if result.returncode:
    print('部署失败，已尝试恢复原 Nginx 配置。请检查 VPS 上服务状态。')
    print(result.stderr[-2000:])
    raise SystemExit(result.returncode)
print(result.stdout.strip())
