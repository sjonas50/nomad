import { inject } from '@adonisjs/core'
import { QueueService } from './queue_service.js'
import { RunDownloadJob } from '#jobs/run_download_job'
import { DownloadModelJob } from '#jobs/download_model_job'
import { DownloadJobWithProgress } from '../../types/downloads.js'
import { normalize } from 'node:path'

@inject()
export class DownloadService {
  constructor(private queueService: QueueService) {}

  async listDownloadJobs(filetype?: string): Promise<DownloadJobWithProgress[]> {
    // Get regular file download jobs (zim, map, etc.) — include all states
    const queue = this.queueService.getQueue(RunDownloadJob.queue)
    const fileJobs = await queue.getJobs(['waiting', 'active', 'delayed', 'failed', 'completed'])

    const fileDownloads = fileJobs.map((job) => ({
      jobId: job.id!.toString(),
      url: job.data.url,
      progress: Number.parseInt(job.progress.toString(), 10),
      filepath: normalize(job.data.filepath),
      filetype: job.data.filetype,
      state: job.failedReason ? 'failed' : undefined,
      priority: job.opts?.priority,
      attemptsMade: job.attemptsMade,
      maxAttempts: job.opts?.attempts,
      failedReason: job.failedReason || undefined,
    }))

    // Get Ollama model download jobs
    const modelQueue = this.queueService.getQueue(DownloadModelJob.queue)
    const modelJobs = await modelQueue.getJobs([
      'waiting',
      'active',
      'delayed',
      'failed',
      'completed',
    ])

    const modelDownloads = modelJobs.map((job) => ({
      jobId: job.id!.toString(),
      url: job.data.modelName || 'Unknown Model',
      progress: Number.parseInt(job.progress.toString(), 10),
      filepath: job.data.modelName || 'Unknown Model',
      filetype: 'model',
      state: job.failedReason ? 'failed' : undefined,
      priority: job.opts?.priority,
      attemptsMade: job.attemptsMade,
      maxAttempts: job.opts?.attempts,
      failedReason: job.failedReason || undefined,
    }))

    const allDownloads = [...fileDownloads, ...modelDownloads]

    // Filter by filetype if specified
    const filtered = allDownloads.filter((job) => !filetype || job.filetype === filetype)

    // Sort so actively downloading items (progress > 0) appear first, then by progress descending
    return filtered.sort((a, b) => b.progress - a.progress)
  }

  async retryJob(jobId: string): Promise<boolean> {
    const queue = this.queueService.getQueue(RunDownloadJob.queue)
    const job = await queue.getJob(jobId)
    if (!job) return false
    await job.retry()
    return true
  }

  async cancelJob(jobId: string): Promise<boolean> {
    const queue = this.queueService.getQueue(RunDownloadJob.queue)
    const job = await queue.getJob(jobId)
    if (!job) return false
    await job.remove()
    return true
  }

  async updateJobPriority(jobId: string, priority: number): Promise<boolean> {
    const queue = this.queueService.getQueue(RunDownloadJob.queue)
    const job = await queue.getJob(jobId)
    if (!job) return false
    await job.changePriority({ priority })
    return true
  }

  async pauseQueue(): Promise<void> {
    const queue = this.queueService.getQueue(RunDownloadJob.queue)
    await queue.pause()
  }

  async resumeQueue(): Promise<void> {
    const queue = this.queueService.getQueue(RunDownloadJob.queue)
    await queue.resume()
  }

  async isQueuePaused(): Promise<boolean> {
    const queue = this.queueService.getQueue(RunDownloadJob.queue)
    return await queue.isPaused()
  }
}
