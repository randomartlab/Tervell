/** 公开服务入口；不包含注册口令、API密钥、SSH或VLESS共享凭据。 */
export const RANDOM_MARKET = {
  id: 'random-market',
  name: 'Random创造集市',
  origin: 'https://randomai.art',
  connect: 'https://randomai.art/connect/',
  register: 'https://randomai.art/sign-up',
  keys: 'https://randomai.art/keys',
  chat: 'https://randomai.art/v1',
} as const
