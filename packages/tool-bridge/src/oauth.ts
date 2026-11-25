import { createHash,randomBytes,timingSafeEqual } from 'node:crypto'
import type { OAuthClientProvider } from '@modelcontextprotocol/sdk/client/auth.js'
import { OAuthTokensSchema,OAuthClientInformationSchema } from '@modelcontextprotocol/sdk/shared/auth.js'
import type { OAuthTokens,OAuthClientMetadata,OAuthClientInformationMixed } from '@modelcontextprotocol/sdk/shared/auth.js'
export interface OAuthVault {get(ref:string):Promise<string|undefined>;set(ref:string,value:string):Promise<void>;delete(ref:string):Promise<void>}
/** 一连接一Provider；PKCE verifier与state不入模型、日志或前端持久状态。 */
export class McpOAuthProvider implements OAuthClientProvider {
 private verifier=''
 private pendingState=''
 private expiresAt=0
 readonly clientMetadata:OAuthClientMetadata
 constructor(readonly redirectUrl:string,private readonly id:string,private readonly vault:OAuthVault,private readonly open:(url:URL)=>Promise<void>,private readonly allowedOrigins:readonly string[],clientId?:string){
  this.allowedOrigins=[...allowedOrigins]
  for(const origin of allowedOrigins){const url=new URL(origin);if(url.origin!==origin||!(url.protocol==='https:'||(url.protocol==='http:'&&['127.0.0.1','[::1]','localhost'].includes(url.hostname))))throw new Error('OAuth授权来源必须HTTPS或本机') }
  const redirect=new URL(redirectUrl)
  if(redirect.protocol!=='http:'||!['127.0.0.1','[::1]'].includes(redirect.hostname)||redirect.username||redirect.password||redirect.hash||redirect.search)throw new Error('OAuth回调必须为固定本机回环地址')
  if(!/^[a-zA-Z0-9_-]{1,80}$/.test(id))throw new Error('OAuth连接标识无效')
  this.clientMetadata={redirect_uris:[redirectUrl],token_endpoint_auth_method:'none',grant_types:['authorization_code','refresh_token'],response_types:['code'],client_name:'Proma'}
  this.staticClient=clientId?{client_id:clientId}:undefined
 }
 private readonly staticClient:OAuthClientInformationMixed|undefined
 private ref(suffix:string){const scope=createHash('sha256').update(JSON.stringify([this.redirectUrl,[...this.allowedOrigins].sort()])).digest('hex').slice(0,20);return `mcp:${this.id}:${scope}:${suffix}`}
 async state(){this.pendingState=randomBytes(32).toString('base64url');this.expiresAt=Date.now()+300000;return this.pendingState}
 async clientInformation(){const value=await this.vault.get(this.ref('client'));return value?OAuthClientInformationSchema.parse(JSON.parse(value)):this.staticClient}
 async saveClientInformation(value:OAuthClientInformationMixed){await this.vault.set(this.ref('client'),JSON.stringify(OAuthClientInformationSchema.parse(value)))}
 async tokens():Promise<OAuthTokens|undefined>{const value=await this.vault.get(this.ref('tokens'));return value?OAuthTokensSchema.parse(JSON.parse(value)):undefined}
 async saveTokens(value:OAuthTokens){await this.vault.set(this.ref('tokens'),JSON.stringify(OAuthTokensSchema.parse(value)))}
 async redirectToAuthorization(url:URL){
  if(!this.allowedOrigins.includes(url.origin)||url.searchParams.get('code_challenge_method')!=='S256'||!url.searchParams.get('code_challenge')||url.searchParams.get('state')!==this.pendingState||url.searchParams.get('redirect_uri')!==this.redirectUrl)throw new Error('OAuth授权地址或PKCE状态不匹配')
  await this.open(new URL(url))
 }
 saveCodeVerifier(value:string){if(!/^[A-Za-z0-9._~-]{43,128}$/.test(value))throw new Error('PKCE verifier无效');this.verifier=value}
 codeVerifier(){if(!this.verifier)throw new Error('PKCE verifier缺失');return this.verifier}
 consumeCallback(raw:string):string{
  const url=new URL(raw),expected=new URL(this.redirectUrl),state=url.searchParams.get('state')??''
  if(url.origin!==expected.origin||url.pathname!==expected.pathname||url.username||url.password||url.hash||url.searchParams.getAll('code').length!==1||url.searchParams.getAll('state').length!==1||!this.pendingState||Date.now()>this.expiresAt||Buffer.byteLength(state)!==Buffer.byteLength(this.pendingState)||!timingSafeEqual(Buffer.from(state),Buffer.from(this.pendingState)))throw new Error('OAuth回调来源或state无效')
  const code=url.searchParams.get('code');if(!code||url.searchParams.has('error'))throw new Error('OAuth授权未成功')
  this.pendingState='';return code
 }
 async invalidateCredentials(scope:'all'|'client'|'tokens'|'verifier'|'discovery'){
  if(scope==='all'||scope==='client')await this.vault.delete(this.ref('client'))
  if(scope==='all'||scope==='tokens')await this.vault.delete(this.ref('tokens'))
  if(scope==='all'||scope==='verifier'){this.verifier='';this.pendingState=''}
 }
 clearVerifier(){this.verifier='';this.pendingState=''}
}
