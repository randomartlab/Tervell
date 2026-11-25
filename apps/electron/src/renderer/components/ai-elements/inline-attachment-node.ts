import { Node, mergeAttributes } from '@tiptap/core'
import { serializeInlineAttachment } from '@proma/shared'

/** 原子内联节点可随文本选取、移动、删除、撤销；异步上传只更新属性。 */
export const InlineAttachmentNode=Node.create({
 name:'inlineAttachment',group:'inline',inline:true,atom:true,selectable:true,draggable:true,
 addAttributes(){return Object.fromEntries(['id','label','mediaType','path','url','previewUrl','status'].map(key=>[key,{default:'',parseHTML:(element:HTMLElement)=>element.getAttribute(`data-asset-${key}`)??'',renderHTML:(attrs:Record<string,unknown>)=>({[`data-asset-${key}`]:String(attrs[key]??'')})}]))},
 parseHTML(){return [{tag:'span[data-type="inline-attachment"]'}]},
 renderHTML({node,HTMLAttributes}){const attrs=node.attrs;const icon=attrs.url?'↗':String(attrs.mediaType).startsWith('image/')?'▧':'▤';return ['span',mergeAttributes(HTMLAttributes,{'data-type':'inline-attachment',class:'inline-attachment-chip',title:attrs.url||attrs.path||attrs.label,contenteditable:'false',role:'button',tabindex:'0','aria-label':`预览附件 ${attrs.label}`}),['span',{'aria-hidden':'true',class:'inline-attachment-icon'},icon],['span',{class:'inline-attachment-label'},attrs.label||'附件'],...(attrs.status==='loading'?[['span',{'aria-label':'正在读取',class:'inline-attachment-loading'},'…']]:[])]},
 renderText({node}){return serializeInlineAttachment({id:String(node.attrs.id),label:String(node.attrs.label),mediaType:String(node.attrs.mediaType),...(node.attrs.path?{path:String(node.attrs.path)}:{}),...(node.attrs.url?{url:String(node.attrs.url)}:{})})},
})
