import { Transform, TransformCallback } from 'node:stream'

/**
 * A Transform stream that limits throughput to a given bytes-per-second rate.
 * If bytesPerSecond is 0, acts as a passthrough with no throttling.
 */
export class ThrottleTransform extends Transform {
  private bytesPerSecond: number
  private bytesThisWindow: number
  private windowStart: number

  constructor(bytesPerSecond: number) {
    super()
    this.bytesPerSecond = bytesPerSecond
    this.bytesThisWindow = 0
    this.windowStart = Date.now()
  }

  _transform(chunk: Buffer, _encoding: BufferEncoding, callback: TransformCallback) {
    if (this.bytesPerSecond <= 0) {
      this.push(chunk)
      return callback()
    }

    this.bytesThisWindow += chunk.length

    const elapsed = Date.now() - this.windowStart
    const expectedTime = (this.bytesThisWindow / this.bytesPerSecond) * 1000

    if (expectedTime > elapsed) {
      const delay = expectedTime - elapsed
      setTimeout(() => {
        this.push(chunk)
        callback()
      }, delay)
    } else {
      this.push(chunk)
      callback()
    }

    // Reset window every second to prevent drift
    if (elapsed >= 1000) {
      this.bytesThisWindow = 0
      this.windowStart = Date.now()
    }
  }
}
