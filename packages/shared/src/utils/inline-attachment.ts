import {annotationsForModel} from './annotations'
/** 可移植的内联附件标记：顺序属于消息正文，文件清单只负责权限与存储。 */
export interface InlineAttachment { id: string; label: string; mediaType: string; path?: string; url?: string }
const marker = /\[\[tervell-asset:([^\]\r\n]+)\]\]/g
export function serializeInlineAttachment(value:InlineAttachment):string {return `[[tervell-asset:${encodeURIComponent(JSON.stringify(value))}]]`}
export function parseInlineAttachment(value:string):InlineAttachment|undefined {
 try {const data:unknown=JSON.parse(decodeURIComponent(value));if(!data||typeof data!=='object'||Array.isArray(data))return undefined;const row=data as Record<string,unknown>;if(typeof row.id!=='string'||typeof row.label!=='string'||typeof row.mediaType!=='string'||row.label.length>512||row.id.length>256)return undefined;if(row.path!==undefined&&typeof row.path!=='string'||row.url!==undefined&&(typeof row.url!=='string'||!/^https?:\/\//i.test(row.url)))return undefined;return {id:row.id,label:row.label,mediaType:row.mediaType,...(typeof row.path==='string'?{path:row.path}:{}),...(typeof row.url==='string'?{url:row.url}:{})}}catch{return undefined}
}
export interface InlineAttachmentPart { text?: string; attachment?: InlineAttachment }
export function inlineAttachmentParts(text:string):InlineAttachmentPart[] {
 const parts:InlineAttachmentPart[]=[];let offset=0
 for(const match of text.matchAll(new RegExp(marker.source,'g'))){const attachment=parseInlineAttachment(match[1]!);if(!attachment)continue;if(match.index>offset)parts.push({text:text.slice(offset,match.index)});parts.push({attachment});offset=match.index+match[0].length}
 if(offset<text.length)parts.push({text:text.slice(offset)})
 return parts
}
/** 发送前把占位 ID 绑定到已持久化路径；缺失数据必须阻止发送。 */
export function resolveInlineAttachments(text:string,files:Array<{id:string;targetPath:string}>):string {
 return text.replace(new RegExp(marker.source,'g'),(raw,payload:string)=>{const asset=parseInlineAttachment(payload);if(!asset)return raw;if(asset.url||asset.path)return raw;const file=files.find(f=>f.id===asset.id);if(!file)throw new Error(`附件「${asset.label}」尚未准备好，请等待或重新添加`);return serializeInlineAttachment({...asset,path:file.targetPath})})
}
/** 给模型的可读正文；绝不把界面序列化协议送给模型。 */
export function inlineAttachmentsForModel(text:string):string {return annotationsForModel(inlineAttachmentParts(text).map(part=>part.text??(part.attachment?.mediaType==='application/x-tervell-history'?serializeInlineAttachment(part.attachment):part.attachment?.url?part.attachment.url:`[附件：${part.attachment?.label}] ${part.attachment?.path??''}`)).join(''))}
