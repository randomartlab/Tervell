import { searchLocalSessionMessages } from './session-message-search'
import type { LocalSearchRecordInput } from './session-message-search'

// 不向主窗口返回全文或逐字索引；用户改词/关闭会话时由主窗口终止整个搜索进程。
self.onmessage = (event: MessageEvent<{ records: LocalSearchRecordInput[]; query: string }>) => {
  self.postMessage(searchLocalSessionMessages(event.data.records, event.data.query))
}
