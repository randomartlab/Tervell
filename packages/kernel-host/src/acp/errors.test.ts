import {test,expect} from 'bun:test';
import {acpPromptFailureMessage} from './errors';
import {RpcRemoteError} from './rpc';

test('Given 真实RPC异常带认证信息 When 转成可见错误 Then 原因保留但密钥URL查询和堆栈不泄漏',()=>{
 const error=new RpcRemoteError(-32603,'Upstream unavailable https://user:pass@host.test/v1?token=123 Authorization=Bearer-secret\n at private/file.ts:2');
 const message=acpPromptFailureMessage(error,['Bearer-secret']);
 expect(message).toContain('RPC -32603');expect(message).toContain('Upstream unavailable');expect(message).not.toContain('Bearer-secret');expect(message).not.toContain('user:pass');expect(message).not.toContain('token=123');expect(message).not.toContain('private/file.ts');
 expect(acpPromptFailureMessage(Error('ACP 子进程退出'))).toContain('进程已退出');
});
test('Given RPC只给Internal error且具体原因在data与stderr When 显示失败 Then 原因保留而密钥脱敏',()=>{
 const message=acpPromptFailureMessage(new RpcRemoteError(-32603,'Internal error',{details:'Model fixture unavailable'}),['private-fixture-key'],'API_KEY=private-fixture-key\nagent requires Node >=24.9')
 expect(message).toContain('Model fixture unavailable');expect(message).toContain('Node >=24.9');expect(message).not.toContain('private-fixture-key')
})
test('Given ACP将供应商错误嵌套在data.error When 请求失败 Then 保留模型错误原因且仍脱敏',()=>{
 const message=acpPromptFailureMessage(new RpcRemoteError(-32603,'Internal error',{error:{error:{errorMessage:'Model fixture-not-available does not exist',details:'api_key=fixture-hidden-key'}}}),['fixture-hidden-key']);expect(message).toContain('fixture-not-available');expect(message).not.toContain('fixture-hidden-key')
})
test('Given Python长调用栈 When 内核启动失败 Then 展示末尾真实异常而不泄漏路径堆栈或凭据',()=>{
 const stderr='Traceback (most recent call last):\n'+Array.from({length:40},()=>`  File "C:/private/long-path/module.py", line 17, in entry\n    import missing_module`).join('\n')+'\nModuleNotFoundError: No module named win_fixture api_key=private-fixture-key';
 const message=acpPromptFailureMessage(Error('ACP 连接已关闭'),['private-fixture-key'],stderr);expect(message).toContain('ModuleNotFoundError');expect(message).toContain('win_fixture');expect(message).not.toContain('private-fixture-key');expect(message).not.toContain('long-path');expect(message.length).toBeLessThan(1300)
})
