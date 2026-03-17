import { useState } from 'react'
import { Head } from '@inertiajs/react'
import SettingsLayout from '~/layouts/SettingsLayout'
import StyledButton from '~/components/StyledButton'
import { useNotifications } from '~/context/NotificationContext'
import api from '~/lib/api'
import { useQuery } from '@tanstack/react-query'
import type { ScenarioPackWithStatus } from '../../../types/collections'

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  installed: { label: 'Installed', className: 'bg-green-100 text-green-800' },
  partial: { label: 'Partial', className: 'bg-yellow-100 text-yellow-800' },
  not_installed: { label: 'Not Installed', className: 'bg-gray-100 text-gray-600' },
}

function formatSize(mb: number): string {
  if (mb >= 1000) return `~${(mb / 1000).toFixed(0)} GB`
  return `~${mb} MB`
}

function ScenarioPackCard({
  pack,
  onInstall,
  installing,
}: {
  pack: ScenarioPackWithStatus
  onInstall: () => void
  installing: boolean
}) {
  const status = STATUS_BADGES[pack.install_status] || STATUS_BADGES.not_installed
  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-6 flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{pack.name}</h3>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${status.className}`}>
          {status.label}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-4 flex-1">{pack.description}</p>
      <div className="text-xs text-gray-500 mb-4 space-y-1">
        <p>Size: {formatSize(pack.estimated_size_mb)}</p>
        {pack.total_resources > 0 && (
          <p>Resources: {pack.installed_resources}/{pack.total_resources} installed</p>
        )}
      </div>
      <StyledButton
        variant={pack.install_status === 'installed' ? 'secondary' : 'primary'}
        onClick={onInstall}
        loading={installing}
        disabled={pack.install_status === 'installed' || installing}
        icon="IconDownload"
        className="w-full"
      >
        {pack.install_status === 'installed' ? 'Installed' : 'Install'}
      </StyledButton>
    </div>
  )
}

export default function ScenarioPacksPage() {
  const { addNotification } = useNotifications()

  const { data: packs = [], refetch } = useQuery({
    queryKey: ['scenario-packs'],
    queryFn: async () => (await api.getScenarioPacks()) || [],
  })

  const [installingPacks, setInstallingPacks] = useState<Set<string>>(new Set())

  async function handleInstall(slug: string) {
    setInstallingPacks((prev) => new Set(prev).add(slug))
    try {
      const result = await api.installScenarioPack(slug)
      if (result) {
        const parts = []
        if (result.zimDownloadsQueued) parts.push(`${result.zimDownloadsQueued} ZIM downloads`)
        if (result.mapDownloadsQueued) parts.push(`${result.mapDownloadsQueued} map downloads`)
        if (result.modelsQueued) parts.push(`${result.modelsQueued} model downloads`)
        if (result.wikipediaQueued) parts.push('Wikipedia download')
        addNotification({
          message: `Pack installation started: ${parts.join(', ')} queued.`,
          type: result.errors.length > 0 ? 'warning' : 'success',
        })
        refetch()
      }
    } catch {
      addNotification({ message: 'Failed to install scenario pack.', type: 'error' })
    }
    setInstallingPacks((prev) => {
      const next = new Set(prev)
      next.delete(slug)
      return next
    })
  }

  return (
    <SettingsLayout>
      <Head title="Scenario Packs | The Attic AI" />
      <div className="xl:pl-72 w-full">
        <main className="px-12 py-6">
          <h1 className="text-4xl font-semibold mb-4">Scenario Packs</h1>
          <p className="text-gray-500 mb-8">
            One-click content bundles curated for specific use cases. Each pack downloads the right
            combination of knowledge, maps, and AI models for your scenario.
          </p>
          {packs.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No scenario packs available. Try refreshing manifests from the Easy Setup page.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packs.map((pack) => (
                <ScenarioPackCard
                  key={pack.slug}
                  pack={pack}
                  onInstall={() => handleInstall(pack.slug)}
                  installing={installingPacks.has(pack.slug)}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </SettingsLayout>
  )
}
