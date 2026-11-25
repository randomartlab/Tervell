#!/usr/bin/env python3
"""只预置登记密钥，不启用远程访问，不创建配对设备。密钥不进入仓库或输出。"""
import json
import os
from pathlib import Path
import subprocess
import tempfile

result = subprocess.run(['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=10', 'yuyu', "python3 -c \"from pathlib import Path; print(Path('/opt/proma-relay/relay.env').read_text().strip().split('=',1)[1])\""], capture_output=True, text=True, check=True)
token = result.stdout.strip()
if len(token) != 64:
    raise RuntimeError('登记密钥格式不正确')
for name in ['.proma', '.proma-dev']:
    directory = Path.home() / name
    directory.mkdir(mode=0o700, exist_ok=True)
    target = directory / 'remote-relay-bootstrap.json'
    if target.exists():
        continue
    fd, path = tempfile.mkstemp(prefix='.remote-bootstrap-', dir=directory)
    try:
        with os.fdopen(fd, 'w') as output:
            json.dump({'relay': 'https://randomai.art/proma-relay/', 'enrollmentToken': token}, output)
        os.replace(path, target)
    finally:
        if os.path.exists(path): os.unlink(path)
print('登记密钥已保存至本机私有引导文件；远程访问仍默认关闭。')
