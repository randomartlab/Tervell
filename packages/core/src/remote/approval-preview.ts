/** 远程批准前必须能查看完整工具参数；过大的操作留在桌面确认。 */
export function remoteApprovalPreview(input: Record<string, unknown>, limit = 6000): { inputPreview: string; canApprove: boolean } {
  const value = JSON.stringify(input, null, 2)
  return value.length <= limit
    ? { inputPreview: value, canApprove: true }
    : { inputPreview: `${value.slice(0, limit)}\n［参数较长，须在电脑查看完整内容后批准］`, canApprove: false }
}
