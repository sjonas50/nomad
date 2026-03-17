import { inject } from '@adonisjs/core'
import { ZimService } from '#services/zim_service'
import { MapService } from '#services/map_service'
import { OllamaService } from '#services/ollama_service'
import logger from '@adonisjs/core/services/logger'
import type { ScenarioPack } from '../../types/collections.js'

@inject()
export class ScenarioPackService {
  constructor(
    private zimService: ZimService,
    private mapService: MapService,
    private ollamaService: OllamaService
  ) {}

  async installPack(pack: ScenarioPack): Promise<{
    zimDownloadsQueued: number
    mapDownloadsQueued: number
    modelsQueued: number
    wikipediaQueued: boolean
    errors: string[]
  }> {
    const errors: string[] = []
    let zimDownloadsQueued = 0
    let mapDownloadsQueued = 0
    let modelsQueued = 0
    let wikipediaQueued = false

    // Download ZIM category tiers
    for (const tierRef of pack.category_tiers) {
      try {
        const result = await this.zimService.downloadCategoryTier(
          tierRef.category_slug,
          tierRef.tier_slug
        )
        if (result) zimDownloadsQueued += result.length
      } catch (e) {
        const msg = `ZIM ${tierRef.category_slug}/${tierRef.tier_slug}: ${e instanceof Error ? e.message : e}`
        logger.error(`[ScenarioPackService] ${msg}`)
        errors.push(msg)
      }
    }

    // Download map collections
    for (const collSlug of pack.map_collections) {
      try {
        const result = await this.mapService.downloadCollection(collSlug)
        if (result) mapDownloadsQueued += result.length
      } catch (e) {
        const msg = `Map ${collSlug}: ${e instanceof Error ? e.message : e}`
        logger.error(`[ScenarioPackService] ${msg}`)
        errors.push(msg)
      }
    }

    // Select Wikipedia option
    if (pack.wikipedia_option) {
      try {
        await this.zimService.selectWikipedia(pack.wikipedia_option)
        wikipediaQueued = true
      } catch (e) {
        const msg = `Wikipedia ${pack.wikipedia_option}: ${e instanceof Error ? e.message : e}`
        logger.error(`[ScenarioPackService] ${msg}`)
        errors.push(msg)
      }
    }

    // Download models
    for (const modelTag of pack.recommended_models) {
      try {
        await this.ollamaService.dispatchModelDownload(modelTag)
        modelsQueued++
      } catch (e) {
        const msg = `Model ${modelTag}: ${e instanceof Error ? e.message : e}`
        logger.error(`[ScenarioPackService] ${msg}`)
        errors.push(msg)
      }
    }

    return { zimDownloadsQueued, mapDownloadsQueued, modelsQueued, wikipediaQueued, errors }
  }
}
