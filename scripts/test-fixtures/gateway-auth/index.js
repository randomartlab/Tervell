/** 仅用于隔离验收的无依赖合成插件；无网络请求，不读取本机账号。 */
export const TervellSyntheticAuth = async () => ({
 config: async config => {
  config.provider ??= {}
  config.provider['tervell-test-auth'] = {
   name: '合成账号供应商', npm: '@ai-sdk/openai-compatible', api: 'http://127.0.0.1:1/v1',
   models: { 'synthetic-model': { name: 'Synthetic model', limit: { context: 12000, output: 2000 } } },
  }
 },
 auth: {
  provider: 'tervell-test-auth',
  options: [{key:'free-only',label:'仅列出免费模型',default:false}],
  methods: [
   { type: 'oauth', label: '企业浏览器授权', prompts: [
    { type: 'select', key: 'region', message: '登录区域', options: [{ label: '本机测试', value: 'local' }, { label: '企业租户', value: 'team' }] },
    { type: 'text', key: 'tenant', message: '租户名称', when: { key: 'region', op: 'eq', value: 'team' }, validate: value => value.length >= 3 ? undefined : '租户名称至少三个字符' },
   ], authorize: async () => ({ url: 'https://fixture.invalid/authorize', instructions: '合成测试授权，输入 fixture-code', method: 'code', callback: async code => code === 'fixture-code' ? { type: 'success', access: 'synthetic-access', refresh: 'synthetic-refresh', expires: Date.now() + 3600000, accountId: 'test@fixture.invalid' } : { type: 'failed', error: '合成授权被拒绝' } }) },
   { type: 'api', label: '使用供应商密钥' },
  ],
  loader: async () => ({ apiKey: 'synthetic', baseURL: 'http://127.0.0.1:1/v1' }),
 },
})
