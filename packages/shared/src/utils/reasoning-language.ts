/** 只处理供应商返回的可见推理；代码、路径、标识符保持原样。 */
export function reasoningNeedsChinese(text:string):boolean {
 const prose=text.replace(/(```|~~~)[\s\S]*?\1[^\n]*\n?/g,'').replace(/`[^`]*`/g,'').replace(/https?:\/\/\S+/g,'')
 if(/[\u3040-\u30ff\uac00-\ud7af\u0400-\u052f]{3,}/.test(prose))return true
 const words=prose.match(/[A-Za-zÀ-ž]{2,}/g)??[]
 return words.length>=2&&words.join('').length>=10&&words.join('').length>=(prose.match(/[\u3400-\u9fff]/g)?.length??0)*0.55
}
/** 拆分长段落；完整代码围栏作为不可翻译块保留，避免拆开围栏误译代码。 */
export function reasoningTranslationChunks(text:string,max=6000):string[] {
 const chunks:string[]=[]
 const split=(value:string)=>{let rest=value;while(rest.length>max){let end=rest.lastIndexOf('\n\n',max-2);if(end<max/3)end=rest.lastIndexOf('\n',max-1);if(end<max/3)end=max;else end+=rest[end+1]==='\n'?2:1;chunks.push(rest.slice(0,end));rest=rest.slice(end)}if(rest)chunks.push(rest)}
 let offset=0
 for(const match of text.matchAll(/(```|~~~)[\s\S]*?\1[^\n]*\n?/g)){split(text.slice(offset,match.index));chunks.push(match[0]);offset=match.index!+match[0].length}
 split(text.slice(offset));return chunks
}
