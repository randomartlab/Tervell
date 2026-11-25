import React, { useEffect, useState } from 'react';
import { Download, Image as ImageIcon } from 'lucide-react';
import { control } from './bridge';
import { exportMobileFile } from './export-file';
import { Notice } from './ui';
export interface ChatAttachment {
  id: string;
  filename: string;
  mediaType: string;
  size: number;
}
export async function uploadChatFile(id: string, file: File, progress: (text: string) => void): Promise<ChatAttachment> {
  if (file.size < 1 || file.size > 20 * 1024 * 1024) throw Error('请选择 20MB 以内的非空附件');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))).map(b => b.toString(16).padStart(2, '0')).join('');
  const start = await control('chat.action', {
    action: 'attachment.start',
    id,
    filename: file.name,
    mediaType: file.type || 'application/octet-stream',
    bytes: bytes.length,
    digest
  });
  const uploadId = String(start.id),
    chunkBytes = Number(start.chunkBytes);
  try {
    for (let offset = 0, index = 0; offset < bytes.length; offset += chunkBytes, index++) {
      progress('上传 ' + file.name + ' · ' + Math.round(offset / bytes.length * 100) + '%');
      let text = '';
      for (const b of bytes.subarray(offset, offset + chunkBytes)) text += String.fromCharCode(b);
      await control('chat.action', {
        action: 'attachment.chunk',
        id,
        uploadId,
        index,
        data: btoa(text)
      });
    }
    const result = await control('chat.action', {
      action: 'attachment.finish',
      id,
      uploadId
    });
    return result.attachment as unknown as ChatAttachment;
  } catch (error) {
    await control('chat.action', {
      action: 'attachment.cancel',
      id,
      uploadId
    }).catch(() => {});
    throw error;
  }
}
export function ChatAsset({
  conversationId,
  messageId,
  attachment
}: {
  conversationId: string;
  messageId: string;
  attachment: ChatAttachment;
}) {
  const [image, setImage] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  useEffect(() => () => {
    if (image) URL.revokeObjectURL(image);
  }, [image]);
  const read = async (preview: boolean) => {
    setBusy(true);
    setError('');
    const parts: BlobPart[] = [];
    const collect = async (append?: (value: {
      data: string;
    }) => Promise<void>) => {
      let offset = 0;
      for (;;) {
        const row = await control('chat.read', {
          action: 'attachment',
          id: conversationId,
          messageId,
          attachmentId: attachment.id,
          offset
        });
        if (preview) {
          if (Number(row.total) > 20 * 1024 * 1024) throw Error('图片过大，请保存到手机后查看');
          const raw = atob(String(row.data)),
            bytes = new Uint8Array(raw.length);
          for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
          parts.push(bytes);
        } else await append?.({
          data: String(row.data)
        });
        if (!row.hasMore) break;
        if (Number(row.nextOffset) <= offset) throw Error('附件读取位置异常，请重新下载');
        offset = Number(row.nextOffset);
      }
      if (preview) setImage(URL.createObjectURL(new Blob(parts, {
        type: attachment.mediaType
      })));
    };
    try {
      if (preview) await collect();else await exportMobileFile(attachment.filename, attachment.mediaType, append => collect(append));
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  return <div className="chat-asset"><div className="button-row">
    <button disabled={busy} onClick={() => void read(false)}><Download size={16} />{busy ? '正在读取…' : attachment.filename}</button>
    {/^image\/(png|jpeg|gif|webp)$/.test(attachment.mediaType) && <button disabled={busy} onClick={() => image ? setImage('') : void read(true)}><ImageIcon size={16} />{image ? '收起图片' : '查看图片'}</button>}
  </div>{image && <img src={image} alt={attachment.filename} style={{
      maxWidth: '100%',
      maxHeight: 420,
      objectFit: 'contain'
    }} />}<Notice text={error} /></div>;
}
