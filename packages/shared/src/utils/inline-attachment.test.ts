import {expect,test} from 'bun:test'
import {serializeInlineAttachment,inlineAttachmentParts,resolveInlineAttachments,inlineAttachmentsForModel,parseInlineAttachment} from './inline-attachment'
test('Given 文字图片PDF网址交错 When 绑定保存路径并发送 Then 光标顺序不变且模型收到可读路径',()=>{
 const image=serializeInlineAttachment({id:'image-1',label:'截图.png',mediaType:'image/png'}),pdf=serializeInlineAttachment({id:'pdf-1',label:'项目 申报.pdf',mediaType:'application/pdf'}),url=serializeInlineAttachment({id:'url-1',label:'文档',mediaType:'text/uri-list',url:'https://example.org/docs'})
 const text=`先看图${image}再看附件${pdf}最后参考${url}。`
 const resolved=resolveInlineAttachments(text,[{id:'pdf-1',targetPath:'/project/项目 申报.pdf'},{id:'image-1',targetPath:'/project/截图.png'}])
 expect(inlineAttachmentParts(resolved).filter(p=>p.attachment).map(p=>p.attachment?.label)).toEqual(['截图.png','项目 申报.pdf','文档'])
 expect(inlineAttachmentsForModel(resolved)).toBe('先看图[附件：截图.png] /project/截图.png再看附件[附件：项目 申报.pdf] /project/项目 申报.pdf最后参考https://example.org/docs。')
 expect(resolveInlineAttachments(resolved,[])).toBe(resolved)
})
test('Given 未完成读取或不可信标记 When 提交/解析 Then 未就绪阻止发送且不执行协议',()=>{
 const asset=serializeInlineAttachment({id:'file-1',label:'A.png',mediaType:'image/png'})
 expect(()=>resolveInlineAttachments(asset,[])).toThrow('尚未准备好');expect(parseInlineAttachment(encodeURIComponent(JSON.stringify({id:'x',label:'x',mediaType:'text/uri-list',url:'javascript:alert(1)'})))).toBeUndefined();expect(inlineAttachmentsForModel('原样[[tervell-asset:bad]]文字')).toBe('原样[[tervell-asset:bad]]文字')
})
