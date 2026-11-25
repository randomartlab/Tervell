/** 扫码/手动连接优先于较早的自动恢复，晚到的响应不能盖掉新配对页。 */
export class ConnectionIntent {
  private epoch = 0;
  recovery(): number { return ++this.epoch; }
  pairing(): void { this.epoch++; }
  current(epoch: number): boolean { return epoch === this.epoch; }
}
