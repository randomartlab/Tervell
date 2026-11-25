#!/usr/bin/env python3
"""部署独立的443连接服务；先验证本机产物，保存回滚，保留原Paseo/Xray和网站。"""
import argparse,base64,hashlib,json,subprocess
from pathlib import Path
parser=argparse.ArgumentParser();parser.add_argument('--apply',action='store_true');parser.add_argument('--ssh',default='yuyu');parser.add_argument('--binary',required=True);args=parser.parse_args()
binary=Path(args.binary).resolve();data=binary.read_bytes();digest=hashlib.sha256(data).hexdigest()
if data[:4]!=b'\x7fELF':raise RuntimeError('需要Linux服务端ELF产物')
if not args.apply:
 print(json.dumps({'host':args.ssh,'binarySha256':digest,'publicPath':'/connect/','listen':'127.0.0.1:8771','accountVerifier':'现有集市 /api/user/self','changes':['新增tervell-connect独立服务','新增nginx /connect/路径'],'preserves':['网站API与静态资源','Paseo/Xray入口','SSH与防火墙配置']},ensure_ascii=False,indent=2));raise SystemExit(0)
remote='/tmp/tervell-connect-'+digest[:16]
subprocess.run(['scp','-q',str(binary),args.ssh+':'+remote],check=True)
script=r"""
import hashlib,json,os,subprocess,tempfile,time,urllib.request,shutil
from pathlib import Path
source=Path(SOURCE);expected=DIGEST
if hashlib.sha256(source.read_bytes()).hexdigest()!=expected:raise RuntimeError('上传摘要不符')
nginx=Path('/www/server/panel/vhost/nginx/randomai.art.conf');unit=Path('/etc/systemd/system/tervell-connect.service');base=Path('/opt/tervell-connect');base.mkdir(mode=0o755,exist_ok=True)
backup=base/('rollback-'+time.strftime('%Y%m%d-%H%M%S'));backup.mkdir(mode=0o700)
original=nginx.read_text();(backup/'nginx.conf').write_text(original)
if unit.exists()and'Description=Tervell device connection service'not in unit.read_text():raise RuntimeError('同名服务不归本产品所有')
if unit.exists():shutil.copy2(unit,backup/'service')
output=base/'tervell-connect';previous=output.exists()
if previous:shutil.copy2(output,backup/'binary')
if subprocess.run(['id','-u','tervell-connect'],capture_output=True).returncode:subprocess.run(['useradd','--system','--no-create-home','--shell','/usr/sbin/nologin','tervell-connect'],check=True)
def atomic(path,payload,mode=0o644):
 fd,name=tempfile.mkstemp(prefix='.tervell-',dir=path.parent)
 try:
  with os.fdopen(fd,'wb')as f:f.write(payload);f.flush();os.fsync(f.fileno())
  os.chmod(name,mode);os.replace(name,path)
 finally:
  if os.path.exists(name):os.unlink(name)
unit_text='''[Unit]
Description=Tervell device connection service
After=network.target
[Service]
User=tervell-connect
Group=tervell-connect
StateDirectory=tervell-connect
StateDirectoryMode=0700
ExecStart=/opt/tervell-connect/tervell-connect
Restart=on-failure
RestartSec=3
Environment=TERVELL_CONNECT_LISTEN=127.0.0.1:8771
Environment=TERVELL_CONNECT_ORIGIN=https://randomai.art
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/tervell-connect
RestrictAddressFamilies=AF_INET AF_INET6 AF_UNIX
[Install]
WantedBy=multi-user.target
'''
location='''    # BEGIN Tervell managed connection
    location ^~ /connect/ {
        access_log off;
        client_max_body_size 1m;
        proxy_pass http://127.0.0.1:8771/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_buffering off;
        proxy_read_timeout 70s;
        proxy_send_timeout 30s;
    }
    # END Tervell managed connection
'''
if 'location ^~ /connect/'in original and'# BEGIN Tervell managed connection'not in original:raise RuntimeError('已有/connect/路径，拒绝覆盖')
if '# BEGIN Tervell managed connection'in original:
 start=original.index('    # BEGIN Tervell managed connection');end=original.index('    # END Tervell managed connection',start)+len('    # END Tervell managed connection\n');updated=original[:start]+location+original[end:]
else:
 index=original.index('    server_name ');end=original.index('\n',index)+1;updated=original[:end]+location+original[end:]
try:
 atomic(output,source.read_bytes(),0o755);atomic(unit,unit_text.encode());subprocess.run(['systemctl','daemon-reload'],check=True);subprocess.run(['systemctl','enable','tervell-connect'],check=True,capture_output=True);subprocess.run(['systemctl','restart','tervell-connect'],check=True)
 for i in range(40):
  try:
   with urllib.request.urlopen('http://127.0.0.1:8771/health',timeout=2)as r:
    if json.load(r).get('service')=='tervell-connect':break
  except Exception:time.sleep(.15)
 else:raise RuntimeError('本机服务健康检查失败')
 atomic(nginx,updated.encode());subprocess.run(['nginx','-t'],check=True,capture_output=True);subprocess.run(['systemctl','reload','nginx'],check=True)
except BaseException:
 atomic(nginx,original.encode())
 if previous:atomic(output,(backup/'binary').read_bytes(),0o755)
 if (backup/'service').exists():atomic(unit,(backup/'service').read_bytes())
 else:subprocess.run(['systemctl','disable','--now','tervell-connect'],capture_output=True);unit.unlink(missing_ok=True)
 subprocess.run(['systemctl','daemon-reload'],capture_output=True)
 if previous:subprocess.run(['systemctl','restart','tervell-connect'],capture_output=True)
 subprocess.run(['systemctl','reload','nginx'],capture_output=True);raise
finally:source.unlink(missing_ok=True)
print(json.dumps({'service':'active','path':'/connect/','binarySha256':expected,'rollback':str(backup),'existingWebsiteAndPaseoConfigPreserved':original.replace(location,'')==updated.replace(location,'')},ensure_ascii=False))
""".replace('SOURCE',repr(remote)).replace('DIGEST',repr(digest))
result=subprocess.run(['ssh','-o','BatchMode=yes','-o','ConnectTimeout=10',args.ssh,'python3 -'],input=script,capture_output=True,text=True)
if result.returncode:print(result.stderr[-2500:]);raise SystemExit(result.returncode)
print(result.stdout.strip())
