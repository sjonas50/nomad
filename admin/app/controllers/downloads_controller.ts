import type { HttpContext } from '@adonisjs/core/http'
import { DownloadService } from '#services/download_service'
import {
  downloadJobsByFiletypeSchema,
  downloadJobIdSchema,
  downloadPrioritySchema,
} from '#validators/download'
import { inject } from '@adonisjs/core'

@inject()
export default class DownloadsController {
  constructor(private downloadService: DownloadService) {}

  async index() {
    return this.downloadService.listDownloadJobs()
  }

  async filetype({ request }: HttpContext) {
    const payload = await request.validateUsing(downloadJobsByFiletypeSchema)
    return this.downloadService.listDownloadJobs(payload.params.filetype)
  }

  async retry({ request, response }: HttpContext) {
    const { params } = await request.validateUsing(downloadJobIdSchema)
    const success = await this.downloadService.retryJob(params.jobId)
    if (!success) return response.notFound({ message: 'Job not found' })
    return { success: true, message: 'Job retried' }
  }

  async cancel({ request, response }: HttpContext) {
    const { params } = await request.validateUsing(downloadJobIdSchema)
    const success = await this.downloadService.cancelJob(params.jobId)
    if (!success) return response.notFound({ message: 'Job not found' })
    return { success: true, message: 'Job cancelled' }
  }

  async updatePriority({ request, response }: HttpContext) {
    const { params, priority } = await request.validateUsing(downloadPrioritySchema)
    const success = await this.downloadService.updateJobPriority(params.jobId, priority)
    if (!success) return response.notFound({ message: 'Job not found' })
    return { success: true, message: 'Priority updated' }
  }

  async pauseQueue() {
    await this.downloadService.pauseQueue()
    return { success: true, message: 'Download queue paused' }
  }

  async resumeQueue() {
    await this.downloadService.resumeQueue()
    return { success: true, message: 'Download queue resumed' }
  }

  async queueStatus() {
    const paused = await this.downloadService.isQueuePaused()
    return { paused }
  }
}
