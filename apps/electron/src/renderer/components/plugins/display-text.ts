interface Translator {resolve:(value:unknown)=>string}
/** Paseo 标题可为本地化消息或接收页面参数的函数，渲染时才解析。 */
export function resolvePluginText(i18n:Translator,value:unknown,fallback='',params:Record<string,unknown>={}):string {
  try {
    const text=typeof value==='function'?(value as (params:Record<string,unknown>)=>unknown)(params):value
    if(typeof text==='string')return text.trim()||fallback
    if(text===undefined||text===null)return fallback
    return i18n.resolve(text)||fallback
  }catch{return fallback}
}
