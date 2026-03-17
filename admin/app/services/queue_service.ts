import { Queue } from 'bullmq'
import queueConfig from '#config/queue'

export class QueueService {
  private static instance: QueueService | null = null
  private queues: Map<string, Queue> = new Map()

  static getInstance(): QueueService {
    if (!QueueService.instance) {
      QueueService.instance = new QueueService()
    }
    return QueueService.instance
  }

  getQueue(name: string): Queue {
    if (!this.queues.has(name)) {
      const queue = new Queue(name, {
        connection: queueConfig.connection,
      })
      this.queues.set(name, queue)
    }
    return this.queues.get(name)!
  }

  async close() {
    for (const queue of this.queues.values()) {
      await queue.close()
    }
    QueueService.instance = null
  }
}
