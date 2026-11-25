import type { JsonValue } from '@proma/protocol';
import { JsonRpcPeer, RpcRemoteError } from '../rpc';

let authenticated = false;
const peer = new JsonRpcPeer(process.stdin, process.stdout, {
  onRequest: async (method, params): Promise<JsonValue> => {
    if (method === 'initialize') return {
      protocolVersion: 1,
      authMethods: [{ id: 'api-key', name: 'API Key' }],
    };
    if (method === 'authenticate') {
      if (!process.env.OPENAI_API_KEY) throw new RpcRemoteError(-32000, 'Authentication required');
      authenticated = true;
      return {};
    }
    if (method === 'session/new') {
      if (process.argv.includes('--network-error')) throw new RpcRemoteError(-32002, 'Network unavailable');
      if (process.argv.includes('--always-auth') || !authenticated) throw new RpcRemoteError(-32000, 'Authentication required');
      return { sessionId: 'authorized', configOptions: [{ id: 'mode', type: 'select', category: 'mode', name: 'Mode', currentValue: 'safe', options: [{ value: 'safe', name: 'Safe' }] }] };
    }
    if (method === 'session/prompt') {
      await peer.notify('session/update', { sessionId: 'authorized', update: { sessionUpdate: 'agent_message_chunk', content: { type: 'text', text: 'authenticated-once' } } });
      return { stopReason: 'end_turn' };
    }
    throw new Error('unsupported fixture request: ' + method);
  },
});
