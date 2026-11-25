import {test,expect} from 'bun:test'
import {createCipheriv,randomBytes} from 'node:crypto'
import {remotePairingLink} from '../packages/core/src/remote/pairing'
import {decodeRemotePairing} from '../packages/core/src/remote/tunnel-client'
import type {RemotePairing} from '../packages/protocol/src/remote'
const fields={room:'a'.repeat(64),token:'b'.repeat(64),key:'c'.repeat(64),hostId:'fixture-host',deviceId:'fixture-phone',expiresAt:Date.now()+100000}
const variants:RemotePairing[]=[{...fields,v:1,relay:'https://fixture.invalid/'},{...fields,v:2,tunnel:{server:'fixture.invalid',port:443,path:'/fixture_path_12345',clientId:crypto.randomUUID(),targetHost:'127.0.0.1',targetPort:3456}},{...fields,v:3,direct:{url:'https://127.0.0.1:3456',certificateSha256:'d'.repeat(64)}},{...fields,v:4,service:'random-market'}]
for(const input of variants)test(`Given v${input.v}配对 When 电脑生成新二维码 Then统一tervell且加密往返完整`,()=>{const link=remotePairingLink(input);expect(link.startsWith('tervell://pair?code=')).toBe(true);expect(link).not.toContain(input.token);expect(decodeRemotePairing(link)).toEqual(input);expect(()=>decodeRemotePairing(link.replace('tervell:','proma:'))).toThrow()})
test('Given 旧版手机链接 When 升级 Then读取兼容且拒绝参数污染',()=>{const key=randomBytes(32),nonce=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,nonce);cipher.setAAD(Buffer.from('proma-pair-v2'));const body=Buffer.concat([nonce,cipher.update(JSON.stringify(variants[3])),cipher.final(),cipher.getAuthTag()]);const link=`proma://pair?code=${key.toString('base64url')}.${body.toString('base64url')}`;expect(decodeRemotePairing(link)).toEqual(variants[3]!);for(const suffix of ['&other=1','#x','&code=foo'])expect(()=>decodeRemotePairing(link+suffix)).toThrow()})
