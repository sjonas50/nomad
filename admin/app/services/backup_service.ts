import { inject } from '@adonisjs/core'
import InstalledResource from '#models/installed_resource'
import KVStore from '#models/kv_store'
import User from '#models/user'
import WikipediaSelection from '#models/wikipedia_selection'
import { OllamaService } from '#services/ollama_service'
import { SystemService } from '#services/system_service'
import { RunDownloadJob } from '#jobs/run_download_job'
import logger from '@adonisjs/core/services/logger'
import si from 'systeminformation'
import { NomadBackupManifest, BackupImportPreview, BackupImportResult } from '../../types/backup.js'
import { KV_STORE_SCHEMA, KVStoreKey } from '../../types/kv_store.js'
import { randomBytes } from 'node:crypto'
import { assertNotPrivateUrlResolved } from '../validators/common.js'

@inject()
export class BackupService {
  constructor(private ollamaService: OllamaService) {}

  async exportManifest(): Promise<NomadBackupManifest> {
    const [resources, settings, users, wikipedia, osInfo] = await Promise.all([
      InstalledResource.all(),
      this.exportSettings(),
      User.all(),
      WikipediaSelection.first(),
      si.osInfo(),
    ])

    let installedModels: string[] = []
    try {
      const models = await this.ollamaService.getModels()
      installedModels = models?.map((m) => m.name) || []
    } catch {
      logger.warn('[BackupService] Could not fetch installed models')
    }

    return {
      version: '1.0',
      exported_at: new Date().toISOString(),
      source_system: {
        app_version: SystemService.getAppVersion(),
        hostname: osInfo.hostname,
        os: `${osInfo.distro} ${osInfo.release}`,
      },
      installed_resources: resources.map((r) => ({
        resource_id: r.resource_id,
        resource_type: r.resource_type as 'zim' | 'map',
        version: r.version,
        url: r.url,
        file_size_bytes: r.file_size_bytes,
        collection_ref: r.collection_ref,
      })),
      settings,
      wikipedia_selection: wikipedia
        ? {
            option_id: wikipedia.option_id,
            status: wikipedia.status,
            filename: wikipedia.filename,
            url: wikipedia.url,
          }
        : null,
      installed_models: installedModels,
      users: users.map((u) => ({
        username: u.username,
        email: u.email,
        full_name: u.full_name,
        role: u.role as 'admin' | 'operator' | 'viewer',
      })),
    }
  }

  previewManifest(manifest: NomadBackupManifest): BackupImportPreview {
    return {
      resources: manifest.installed_resources.length,
      settings: manifest.settings.length,
      models: manifest.installed_models.length,
      users: manifest.users.length,
      wikipedia: manifest.wikipedia_selection !== null,
    }
  }

  async importManifest(manifest: NomadBackupManifest): Promise<BackupImportResult> {
    const errors: string[] = []
    let resourcesQueued = 0
    let settingsRestored = 0
    let modelsQueued = 0
    let usersCreated = 0
    let wikipediaRestored = false

    // Restore settings
    for (const setting of manifest.settings) {
      try {
        if (setting.key in KV_STORE_SCHEMA) {
          await KVStore.setValue(setting.key as KVStoreKey, setting.value)
          settingsRestored++
        }
      } catch (e) {
        errors.push(`Setting ${setting.key}: ${e instanceof Error ? e.message : e}`)
      }
    }

    // Queue resource downloads
    for (const resource of manifest.installed_resources) {
      try {
        // Validate URL is not pointing to loopback/link-local (with DNS rebinding check)
        await assertNotPrivateUrlResolved(resource.url)

        const storageDir = resource.resource_type === 'zim' ? '/storage/zim' : '/storage/maps'
        const filename = resource.url.split('/').pop() || resource.resource_id
        const filepath = `${storageDir}/${filename}`

        await RunDownloadJob.dispatch({
          url: resource.url,
          filepath,
          timeout: 0,
          allowedMimeTypes: [],
          filetype: resource.resource_type,
          resourceMetadata: {
            resource_id: resource.resource_id,
            version: resource.version,
            collection_ref: resource.collection_ref,
          },
        })
        resourcesQueued++
      } catch (e) {
        errors.push(`Resource ${resource.resource_id}: ${e instanceof Error ? e.message : e}`)
      }
    }

    // Queue model downloads
    for (const modelName of manifest.installed_models) {
      try {
        await this.ollamaService.dispatchModelDownload(modelName)
        modelsQueued++
      } catch (e) {
        errors.push(`Model ${modelName}: ${e instanceof Error ? e.message : e}`)
      }
    }

    // Create users with temporary passwords
    for (const userData of manifest.users) {
      try {
        const existing = await User.findBy('username', userData.username)
        if (!existing) {
          const tempPassword = randomBytes(24).toString('base64url')
          await User.create({
            username: userData.username,
            email: userData.email,
            full_name: userData.full_name,
            role: userData.role,
            password: tempPassword,
            is_active: true,
          })
          usersCreated++
        }
      } catch (e) {
        errors.push(`User ${userData.username}: ${e instanceof Error ? e.message : e}`)
      }
    }

    // Restore Wikipedia selection
    if (manifest.wikipedia_selection) {
      try {
        await WikipediaSelection.updateOrCreate(
          { option_id: manifest.wikipedia_selection.option_id },
          {
            status: manifest.wikipedia_selection.status as any,
            filename: manifest.wikipedia_selection.filename,
            url: manifest.wikipedia_selection.url,
          }
        )
        wikipediaRestored = true
      } catch (e) {
        errors.push(`Wikipedia: ${e instanceof Error ? e.message : e}`)
      }
    }

    return {
      success: errors.length === 0,
      resourcesQueued,
      settingsRestored,
      modelsQueued,
      usersCreated,
      wikipediaRestored,
      errors,
    }
  }

  private async exportSettings(): Promise<Array<{ key: string; value: any }>> {
    const settings: Array<{ key: string; value: any }> = []
    for (const key of Object.keys(KV_STORE_SCHEMA)) {
      const value = await KVStore.getValue(key as KVStoreKey)
      if (value !== null && value !== undefined) {
        settings.push({ key, value })
      }
    }
    return settings
  }
}
