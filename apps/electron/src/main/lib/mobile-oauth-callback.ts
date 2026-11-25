/** 手机复制的回调仍必须匹配本次回环地址和OAuth state，不能只取code。 */
export function mobileOAuthCode(value:string,redirectUri:string,state:string):string{
 const returned=new URL(value),target=new URL(redirectUri)
 if(returned.origin!==target.origin||returned.pathname!==target.pathname||returned.username||returned.password||returned.hash||returned.searchParams.has('error')||returned.searchParams.getAll('state').length!==1||returned.searchParams.getAll('code').length!==1||returned.searchParams.get('state')!==state||!returned.searchParams.get('code'))throw new Error('OAuth 回调不属于本次授权')
 return returned.searchParams.get('code')!
}
