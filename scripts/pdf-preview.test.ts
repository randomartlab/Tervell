import {test,expect} from 'bun:test'
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {extractTextFromFile} from '../apps/electron/src/main/lib/document-parser'
test('Given 合法PDF附件 When 首选解析器失败回退 Then 从运行时PDF.js与worker提取完整正文',async()=>{
 const root=mkdtempSync(join(tmpdir(),'tervell-pdf-')),stream='BT /F1 14 Tf 20 140 Td (Tervell inline PDF preview) Tj ET'
 const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`]
 let pdf='%PDF-1.4\n';const offsets:number[]=[]
 objects.forEach((body,index)=>{offsets.push(Buffer.byteLength(pdf));pdf+=`${index+1} 0 obj\n${body}\nendobj\n`})
 const xref=Buffer.byteLength(pdf);pdf+='xref\n0 6\n0000000000 65535 f \n'+offsets.map(offset=>`${String(offset).padStart(10,'0')} 00000 n \n`).join('')+`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
 try{const path=join(root,'fixture.pdf');writeFileSync(path,pdf);expect(await extractTextFromFile(path)).toContain('Tervell inline PDF preview')}finally{rmSync(root,{recursive:true,force:true})}
})
