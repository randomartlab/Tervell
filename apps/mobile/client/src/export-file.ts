import { native } from './bridge';
import { textChunks } from './model';
let active = false;
/** 共用一个原生临时文件，禁止页面切换导致两次保存互相混入。 */
export async function exportMobileFile(filename: string, mime: string, write: (append: (data: {
  text: string;
} | {
  data: string;
}) => Promise<void>) => Promise<void>) {
  if (active) throw Error('请先完成当前文件保存');
  active = true;
  try {
    await native('export.prepare');
    await write(async part => {
      if ('text' in part) for (const text of textChunks(part.text)) await native('export.chunk', {
        text
      });else await native('export.bytes', part);
    });
    return await native('export', {
      filename,
      mime
    });
  } finally {
    await native('export.cancel').catch(() => {});
    active = false;
  }
}
export function exportMobileText(filename: string, mime: string, content: string) {
  return exportMobileFile(filename, mime, append => append({
    text: content
  }));
}
