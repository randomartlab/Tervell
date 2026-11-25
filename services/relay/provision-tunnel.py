#!/usr/bin/env python3
import json
import os
from pathlib import Path
import subprocess
import tempfile

SERVER = "randomai.art"
SSH_HOST = "yuyu"
REMOTE_SCRIPT = r'''
import json,os,re,secrets,socket,subprocess,tempfile,uuid
from pathlib import Path
root=Path('/opt/proma-tunnel');root.mkdir(mode=0o700,exist_ok=True)
profile_path=root/'profile.json'
nginx_path=Path('/www/server/panel/vhost/nginx/randomai.art.conf')
xray_path=Path('/usr/local/xray/config.json')
def atomic(path,value):
 fd,name=tempfile.mkstemp(prefix='.proma-',dir=path.parent)
 try:
  with os.fdopen(fd,'w') as output:output.write(value);output.flush();os.fsync(output.fileno())
  os.chmod(name,0o600);os.replace(name,path)
 finally:
  if os.path.exists(name):os.unlink(name)
if profile_path.exists():
 profile=json.loads(profile_path.read_text())
else:
 listener=socket.socket();listener.bind(('127.0.0.1',0));port=listener.getsockname()[1];listener.close()
 profile={'version':1,'sshHost':'yuyu','tunnel':{'server':'randomai.art','port':443,'path':'/'+secrets.token_hex(24),'clientId':str(uuid.uuid4()),'targetHost':'127.0.0.1','targetPort':port}}
profile_text=json.dumps(profile,indent=2)
tag='proma-private-mobile'
config=json.loads(xray_path.read_text());nginx=nginx_path.read_text()
existing=next((item for item in config.get('inbounds',[]) if item.get('tag')==tag),None)
dedicated=next((item for item in config.get('outbounds',[]) if item.get('tag')=='proma-local-only'),None)
if dedicated is not None:
 expected={'finalRules':[{'action':'allow','network':'tcp','ip':['127.0.0.1/32'],'port':str(profile['tunnel']['targetPort'])},{'action':'block','blockDelay':'0'}]}
 if dedicated.get('settings')!=expected:
  previous=xray_path.read_text();dedicated['settings']=expected;staged=root/'xray.staged.json';atomic(staged,json.dumps(config,indent=2))
  try:
   check=subprocess.run(['/usr/local/xray/xray','run','-test','-c',str(staged)],stdout=subprocess.PIPE,stderr=subprocess.PIPE)
   if check.returncode:raise RuntimeError('xray local policy validation failed')
   atomic(xray_path,staged.read_text());subprocess.run(['systemctl','restart','xray'],check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
  except BaseException:
   atomic(xray_path,previous);subprocess.run(['systemctl','restart','xray'],stdout=subprocess.PIPE,stderr=subprocess.PIPE);raise
  finally:staged.unlink(missing_ok=True)
if existing is None:
 listener=socket.socket();listener.bind(('127.0.0.1',0));backend_port=listener.getsockname()[1];listener.close()
 config.setdefault('inbounds',[]).append({'tag':tag,'listen':'127.0.0.1','port':backend_port,'protocol':'vless','settings':{'clients':[{'id':profile['tunnel']['clientId']}],'decryption':'none'},'streamSettings':{'network':'ws','wsSettings':{'path':profile['tunnel']['path']}}})
 config.setdefault('outbounds',[]).append({'tag':'proma-deny','protocol':'blackhole'})
 outbound='proma-local-only';config['outbounds'].append({'tag':outbound,'protocol':'freedom','settings':{'finalRules':[{'action':'allow','network':'tcp','ip':['127.0.0.1/32'],'port':str(profile['tunnel']['targetPort'])},{'action':'block','blockDelay':'0'}]}})
 rules=config.setdefault('routing',{}).setdefault('rules',[])
 rules[:0]=[{'type':'field','inboundTag':[tag],'ip':['127.0.0.1'],'port':str(profile['tunnel']['targetPort']),'outboundTag':outbound},{'type':'field','inboundTag':[tag],'outboundTag':'proma-deny'}]
 location="""
    location = %s {
        access_log off;
        proxy_pass http://127.0.0.1:%s;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_buffering off;
        proxy_read_timeout 90s;
        proxy_send_timeout 90s;
    }
"""%(profile['tunnel']['path'],backend_port)
 position=nginx.rfind('}')
 if position<0:raise RuntimeError('nginx structure unavailable')
 nginx=nginx[:position]+location+nginx[position:]
 if not (root/'nginx.original').exists():atomic(root/'nginx.original',nginx_path.read_text())
 if not (root/'xray.original').exists():atomic(root/'xray.original',xray_path.read_text())
 staged=root/'xray.staged.json';atomic(staged,json.dumps(config,indent=2))
 check=subprocess.run(['/usr/local/xray/xray','run','-test','-c',str(staged)],stdout=subprocess.PIPE,stderr=subprocess.PIPE)
 if check.returncode:raise RuntimeError('xray validation failed')
 old_nginx=nginx_path.read_text();old_xray=xray_path.read_text()
 try:
  atomic(nginx_path,nginx);atomic(xray_path,staged.read_text())
  check=subprocess.run(['nginx','-t'],stdout=subprocess.PIPE,stderr=subprocess.PIPE)
  if check.returncode:raise RuntimeError('nginx validation failed')
  subprocess.run(['systemctl','restart','xray'],check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
  subprocess.run(['systemctl','reload','nginx'],check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
  atomic(profile_path,profile_text)
 except BaseException:
  atomic(nginx_path,old_nginx);atomic(xray_path,old_xray)
  subprocess.run(['systemctl','restart','xray'],stdout=subprocess.PIPE,stderr=subprocess.PIPE)
  subprocess.run(['systemctl','reload','nginx'],stdout=subprocess.PIPE,stderr=subprocess.PIPE)
  raise
 finally:staged.unlink(missing_ok=True)
print(json.dumps(profile))
'''

def main():
    result = subprocess.run(['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=10', SSH_HOST, 'python3 -'], input=REMOTE_SCRIPT, capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError('手机连接服务配置未完成；服务器原配置已保留')
    profile = json.loads(result.stdout)
    if profile.get('tunnel', {}).get('server') != SERVER:
        raise RuntimeError('手机连接配置校验失败')
    for name in ['.proma', '.proma-dev']:
        directory = Path.home() / name
        directory.mkdir(mode=0o700, exist_ok=True)
        descriptor, temporary = tempfile.mkstemp(prefix='.remote-tunnel-', dir=directory)
        try:
            with os.fdopen(descriptor, 'w') as output:
                json.dump(profile, output)
                output.flush()
                os.fsync(output.fileno())
            os.replace(temporary, directory / 'remote-tunnel-private.json')
        finally:
            if os.path.exists(temporary): os.unlink(temporary)
    print('默认手机连接已预置；未启用项目访问，未启动桌面端。')

if __name__ == '__main__':
    main()
