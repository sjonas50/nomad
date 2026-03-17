import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { CollectionManifestService } from '#services/collection_manifest_service'
import { ScenarioPackService } from '#services/scenario_pack_service'

@inject()
export default class ScenarioPacksController {
  constructor(private scenarioPackService: ScenarioPackService) {}

  async index({}: HttpContext) {
    const manifestService = new CollectionManifestService()
    return await manifestService.getScenarioPacksWithStatus()
  }

  async install({ params, response }: HttpContext) {
    const manifestService = new CollectionManifestService()
    const packs = await manifestService.getScenarioPacksWithStatus()
    const pack = packs.find((p) => p.slug === params.slug)

    if (!pack) {
      return response.notFound({ message: `Scenario pack "${params.slug}" not found` })
    }

    const result = await this.scenarioPackService.installPack(pack)
    return {
      success: result.errors.length === 0,
      ...result,
    }
  }
}
