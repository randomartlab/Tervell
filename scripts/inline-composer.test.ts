import {markdownToHtml} from '../apps/electron/src/renderer/lib/markdown-rich-text'
import {expect,test} from 'bun:test'
import {getSchema} from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import {EditorState,TextSelection} from '@tiptap/pm/state'
import {history,undo,redo,closeHistory} from '@tiptap/pm/history'
import {InlineAttachmentNode} from '../apps/electron/src/renderer/components/ai-elements/inline-attachment-node'
import {serializeInlineAttachment,inlineAttachmentParts} from '../packages/shared/src/utils/inline-attachment'
import {buildQueuedMessageSendPayload,queuedTextToParagraphHtml} from '../apps/electron/src/renderer/lib/agent-message-queue'

test('Given 文本中间粘贴文件 When 继续输入且上传完成 Then 节点位置不变且可撤销重做',()=>{
 const schema=getSchema([StarterKit,InlineAttachmentNode])
 const doc=schema.node('doc',null,[schema.node('paragraph',null,[schema.text('前文后文')])])
 let state=EditorState.create({doc,selection:TextSelection.create(doc,3),plugins:[history()]})
 state=state.apply(state.tr.replaceSelectionWith(schema.node('inlineAttachment',{id:'image',label:'截图.png',mediaType:'image/png',status:'loading'})))
 state=state.apply(closeHistory(state.tr).insertText('解释文字'))
 const positions:number[]=[];state.doc.descendants((node,pos)=>{if(node.type.name==='inlineAttachment')positions.push(pos)})
 expect(positions).toEqual([3]);expect(state.doc.textContent).toBe('前文解释文字后文')
 state=state.apply(state.tr.setNodeMarkup(3,undefined,{...state.doc.nodeAt(3)!.attrs,status:'ready'}).setMeta('addToHistory',false))
 const dispatch=(transaction:Parameters<EditorState['apply']>[0])=>{state=state.apply(transaction)}
 expect(undo(state,dispatch)).toBe(true);expect(state.doc.textContent).toBe('前文后文');expect(state.doc.nodeAt(3)?.attrs.status).toBe('ready')
 expect(redo(state,dispatch)).toBe(true);expect(state.doc.textContent).toBe('前文解释文字后文')
})
test('Given 包含内联图片和网址的排队消息 When 生成发送内容 Then 历史保留位置且SDK不收到内部标记',()=>{
 const image=serializeInlineAttachment({id:'i',label:'A.png',mediaType:'image/png',path:'/project/A.png'})
 const url=serializeInlineAttachment({id:'u',label:'参考',mediaType:'text/uri-list',url:'https://example.org/docs'})
 const payload=buildQueuedMessageSendPayload({id:'q1',createdAt:1,text:`开始${image}说明${url}结尾`})
 expect(inlineAttachmentParts(payload.rawText).filter(part=>part.attachment)).toHaveLength(2)
 expect(payload.sdkText).toBe('开始[附件：A.png] /project/A.png说明https://example.org/docs结尾')
 expect(payload.sdkText).not.toContain('tervell-asset')
 const recalled=queuedTextToParagraphHtml(payload.rawText)
 expect(recalled).toContain('data-type="inline-attachment"')
 expect(recalled).not.toContain('[[tervell-asset:')
 expect(recalled.indexOf('开始')).toBeLessThan(recalled.indexOf('A.png'))
})

test('Given Markdown草稿的内联附件 When 切回会话还原HTML Then 保留真实附件节点不被HTML预览吞掉',()=>{
 const image=serializeInlineAttachment({id:'i1',label:'截图.png',mediaType:'image/png'})
 const html=markdownToHtml(`前文${image}后文`)
 expect(html).toContain('data-type="inline-attachment"')
 expect(html).not.toContain('raw-html-inline')
 expect(html.indexOf('前文')).toBeLessThan(html.indexOf('data-asset-id'))
 expect(html.indexOf('截图.png')).toBeLessThan(html.indexOf('后文'))
})
