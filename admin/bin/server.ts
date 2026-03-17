/*
|--------------------------------------------------------------------------
| HTTP server entrypoint
|--------------------------------------------------------------------------
|
| The "server.ts" file is the entrypoint for starting the AdonisJS HTTP
| server. Either you can run this file directly or use the "serve"
| command to run this file and monitor file changes
|
*/

import 'reflect-metadata'
import { Ignitor, prettyPrintError } from '@adonisjs/core'

/**
 * URL to the application root. AdonisJS need it to resolve
 * paths to file and directories for scaffolding commands
 */
const APP_ROOT = new URL('../', import.meta.url)

/**
 * The importer is used to import files in context of the
 * application.
 */
const IMPORTER = (filePath: string) => {
  if (filePath.startsWith('./') || filePath.startsWith('../')) {
    return import(new URL(filePath, APP_ROOT).href)
  }
  return import(filePath)
}

new Ignitor(APP_ROOT, { importer: IMPORTER })
  .tap((app) => {
    app.booting(async () => {
      await import('#start/env')
    })
    app.listen('SIGTERM', () => app.terminate())
    app.listenIf(app.managedByPm2, 'SIGINT', () => app.terminate())
    app.ready(async () => {
      try {
        const collectionManifestService = new (
          await import('#services/collection_manifest_service')
        ).CollectionManifestService()
        await collectionManifestService.reconcileFromFilesystem()
      } catch (error) {
        console.error('Error during collection manifest reconciliation:', error)
      }

      // Auto-install core services on startup
      try {
        const { DockerService } = await import('#services/docker_service')
        const dockerService = new DockerService()
        const Service = (await import('#models/service')).default

        // Reset any services stuck in error state so they can be retried
        await Service.query()
          .where('installed', false)
          .where('installation_status', 'error')
          .update({ installation_status: 'idle' })

        // Skip dependency services — they get installed automatically when
        // their dependent service is created (avoids race conditions)
        const uninstalledServices = await Service.query()
          .where('installed', false)
          .where('installation_status', 'idle')
          .where('is_dependency_service', false)
          .orderBy('display_order', 'asc')

        if (uninstalledServices.length > 0) {
          console.log(`[Auto-Install] ${uninstalledServices.length} services to install...`)
          for (const service of uninstalledServices) {
            console.log(
              `[Auto-Install] Installing ${service.friendly_name} (${service.service_name})...`
            )
            try {
              await dockerService.createContainerPreflight(service.service_name)
            } catch (err: any) {
              console.error(
                `[Auto-Install] Failed to install ${service.service_name}: ${err.message}`
              )
            }
          }
        }
      } catch (error: any) {
        console.error('Error during auto-install of services:', error.message)
      }
    })
  })
  .httpServer()
  .start()
  .catch((error) => {
    process.exitCode = 1
    prettyPrintError(error)
  })
