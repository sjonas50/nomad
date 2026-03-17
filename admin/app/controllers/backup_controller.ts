import type { HttpContext } from '@adonisjs/core/http'
import { BackupService } from '#services/backup_service'
import { inject } from '@adonisjs/core'
import { NomadBackupManifest } from '../../types/backup.js'

@inject()
export default class BackupController {
  constructor(private backupService: BackupService) {}

  async exportBackup({ response }: HttpContext) {
    const manifest = await this.backupService.exportManifest()
    const filename = `nomad-backup-${new Date().toISOString().slice(0, 10)}.json`

    response.header('Content-Type', 'application/json')
    response.header('Content-Disposition', `attachment; filename="${filename}"`)
    return response.send(JSON.stringify(manifest, null, 2))
  }

  async previewImport({ request, response }: HttpContext) {
    const file = request.file('file', { extnames: ['json'], size: '10mb' })
    if (!file) {
      return response.badRequest({ message: 'No file uploaded' })
    }

    try {
      const content = await this.readUploadedFile(file)
      const manifest = JSON.parse(content) as NomadBackupManifest

      if (!manifest.version || !manifest.installed_resources) {
        return response.badRequest({ message: 'Invalid backup manifest format' })
      }

      const preview = this.backupService.previewManifest(manifest)
      return { success: true, preview }
    } catch (e) {
      return response.badRequest({
        message: `Failed to parse backup file: ${e instanceof Error ? e.message : e}`,
      })
    }
  }

  async importBackup({ request, response }: HttpContext) {
    const file = request.file('file', { extnames: ['json'], size: '10mb' })
    if (!file) {
      return response.badRequest({ message: 'No file uploaded' })
    }

    try {
      const content = await this.readUploadedFile(file)
      const manifest = JSON.parse(content) as NomadBackupManifest

      if (!manifest.version || !manifest.installed_resources) {
        return response.badRequest({ message: 'Invalid backup manifest format' })
      }

      const result = await this.backupService.importManifest(manifest)
      return result
    } catch (e) {
      return response.badRequest({
        message: `Failed to import backup: ${e instanceof Error ? e.message : e}`,
      })
    }
  }

  private async readUploadedFile(file: any): Promise<string> {
    const { readFile } = await import('node:fs/promises')
    return readFile(file.tmpPath!, 'utf-8')
  }
}
