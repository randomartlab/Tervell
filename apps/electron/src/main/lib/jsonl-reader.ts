import { openSync, readSync, closeSync, createReadStream } from 'node:fs'
import { StringDecoder } from 'node:string_decoder'
import { createInterface } from 'node:readline'

/** 不保留整份文件及 split 产生的副本；内存为单条记录加 64 KiB。 */
export function* jsonlLinesSync(path: string): Generator<{ line: string; number: number }> {
  const fd = openSync(path, 'r')
  const buffer = Buffer.allocUnsafe(64 * 1024)
  const decoder = new StringDecoder('utf8')
  const pieces: string[] = []
  let number = 0
  try {
    for (;;) {
      const size = readSync(fd, buffer, 0, buffer.length, null)
      const text = size ? decoder.write(buffer.subarray(0, size)) : decoder.end()
      let start = 0
      for (let end = text.indexOf('\n'); end >= 0; end = text.indexOf('\n', start)) {
        pieces.push(text.slice(start, end))
        yield { line: pieces.join(''), number: ++number }
        pieces.length = 0
        start = end + 1
      }
      if (start < text.length) pieces.push(text.slice(start))
      if (!size) break
    }
    if (pieces.length) yield { line: pieces.join(''), number: ++number }
  } finally { closeSync(fd) }
}

/** 异步长历史扫描允许 IPC、取消、窗口重绘继续工作。 */
export async function* jsonlLines(path: string): AsyncGenerator<{ line: string; number: number }> {
  const stream = createReadStream(path, { highWaterMark: 64 * 1024 })
  const lines = createInterface({ input: stream, crlfDelay: Infinity })
  let number = 0
  try { for await (const line of lines) yield { line, number: ++number } }
  finally { lines.close(); stream.destroy() }
}
