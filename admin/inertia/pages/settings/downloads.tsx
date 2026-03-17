import { Head } from '@inertiajs/react'
import { useState } from 'react'
import SettingsLayout from '~/layouts/SettingsLayout'
import StyledSectionHeader from '~/components/StyledSectionHeader'
import StyledButton from '~/components/StyledButton'
import { useNotifications } from '~/context/NotificationContext'
import api from '~/lib/api'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { DownloadJobWithProgress } from '../../../types/downloads'

const BANDWIDTH_OPTIONS = [
  { label: 'Unlimited', value: '0' },
  { label: '1 Mbps', value: String(1_000_000 / 8) },
  { label: '5 Mbps', value: String(5_000_000 / 8) },
  { label: '10 Mbps', value: String(10_000_000 / 8) },
  { label: '50 Mbps', value: String(50_000_000 / 8) },
]

type TabType = 'active' | 'waiting' | 'failed' | 'completed'

function classifyJob(job: DownloadJobWithProgress): TabType {
  if (job.failedReason || job.state === 'failed') return 'failed'
  if (job.progress >= 100) return 'completed'
  if (job.progress > 0) return 'active'
  return 'waiting'
}

function getFiletypeBadge(filetype: string) {
  const colors: Record<string, string> = {
    zim: 'bg-purple-100 text-purple-800',
    map: 'bg-blue-100 text-blue-800',
    model: 'bg-green-100 text-green-800',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[filetype] || 'bg-gray-100 text-gray-800'}`}>
      {filetype}
    </span>
  )
}

export default function DownloadsPage() {
  const { addNotification } = useNotifications()
  const [activeTab, setActiveTab] = useState<TabType>('active')

  const { data: jobs = [], refetch: refetchJobs } = useQuery({
    queryKey: ['download-jobs'],
    queryFn: async () => (await api.listDownloadJobs()) || [],
    refetchInterval: 5000,
  })

  const { data: queueStatus } = useQuery({
    queryKey: ['download-queue-status'],
    queryFn: async () => await api.getDownloadQueueStatus(),
    refetchInterval: 10000,
  })

  const { data: bandwidthSetting } = useQuery({
    queryKey: ['setting', 'downloads.bandwidthLimit'],
    queryFn: async () => {
      const res = await api.getSetting('downloads.bandwidthLimit')
      return res?.value || '0'
    },
  })

  const updateBandwidthMutation = useMutation({
    mutationFn: async (value: string) => {
      await api.updateSetting('downloads.bandwidthLimit', value)
    },
    onSuccess: () => addNotification({ message: 'Bandwidth limit updated.', type: 'success' }),
  })

  const filteredJobs = jobs.filter((j) => classifyJob(j) === activeTab)

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: 'active', label: 'Active', count: jobs.filter((j) => classifyJob(j) === 'active').length },
    { key: 'waiting', label: 'Waiting', count: jobs.filter((j) => classifyJob(j) === 'waiting').length },
    { key: 'failed', label: 'Failed', count: jobs.filter((j) => classifyJob(j) === 'failed').length },
    { key: 'completed', label: 'Completed', count: jobs.filter((j) => classifyJob(j) === 'completed').length },
  ]

  async function handleRetry(jobId: string) {
    const res = await api.retryDownloadJob(jobId)
    if (res?.success) {
      addNotification({ message: 'Job retried.', type: 'success' })
      refetchJobs()
    }
  }

  async function handleCancel(jobId: string) {
    const res = await api.cancelDownloadJob(jobId)
    if (res?.success) {
      addNotification({ message: 'Job cancelled.', type: 'success' })
      refetchJobs()
    }
  }

  async function handlePauseResume() {
    if (queueStatus?.paused) {
      await api.resumeDownloadQueue()
      addNotification({ message: 'Download queue resumed.', type: 'success' })
    } else {
      await api.pauseDownloadQueue()
      addNotification({ message: 'Download queue paused.', type: 'success' })
    }
  }

  return (
    <SettingsLayout>
      <Head title="Downloads | The Attic AI" />
      <div className="xl:pl-72 w-full">
        <main className="px-12 py-6">
          <h1 className="text-4xl font-semibold mb-4">Downloads</h1>
          <p className="text-gray-500 mb-6">
            Manage your download queue, set bandwidth limits, and retry failed downloads.
          </p>

          <StyledSectionHeader title="Queue Controls" className="mb-4" />
          <div className="bg-white rounded-lg border-2 border-gray-200 p-6 mb-8">
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bandwidth Limit
                </label>
                <select
                  className="rounded-md border-gray-300 shadow-sm text-sm focus:border-blue-500 focus:ring-blue-500"
                  value={bandwidthSetting || '0'}
                  onChange={(e) => updateBandwidthMutation.mutate(e.target.value)}
                >
                  {BANDWIDTH_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-5">
                <StyledButton
                  variant={queueStatus?.paused ? 'primary' : 'secondary'}
                  onClick={handlePauseResume}
                  icon={queueStatus?.paused ? 'IconPlayerPlay' : 'IconPlayerPause'}
                >
                  {queueStatus?.paused ? 'Resume Queue' : 'Pause Queue'}
                </StyledButton>
              </div>
              {queueStatus?.paused && (
                <p className="text-sm text-yellow-600 font-medium mt-5">
                  Queue is paused. No new downloads will start.
                </p>
              )}
            </div>
          </div>

          <StyledSectionHeader title="Download Queue" className="mb-4" />
          <div className="border-b border-gray-200 mb-4">
            <nav className="-mb-px flex space-x-6">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`pb-3 px-1 border-b-2 text-sm font-medium ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="ml-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {filteredJobs.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No {activeTab} downloads.
            </div>
          ) : (
            <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Retries</th>
                    {activeTab === 'failed' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredJobs.map((job) => {
                    const filename = job.filepath.split('/').pop() || job.url
                    return (
                      <tr key={job.jobId} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-gray-900 truncate block max-w-xs" title={filename}>
                            {filename}
                          </span>
                        </td>
                        <td className="px-6 py-4">{getFiletypeBadge(job.filetype)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${Math.min(job.progress, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">{job.progress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">
                            {job.attemptsMade ?? 0}/{job.maxAttempts ?? 10}
                          </span>
                        </td>
                        {activeTab === 'failed' && (
                          <td className="px-6 py-4">
                            <span className="text-xs text-red-600 truncate block max-w-xs" title={job.failedReason}>
                              {job.failedReason || 'Unknown'}
                            </span>
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            {activeTab === 'failed' && (
                              <StyledButton variant="primary" size="sm" onClick={() => handleRetry(job.jobId)}>
                                Retry
                              </StyledButton>
                            )}
                            {(activeTab === 'waiting' || activeTab === 'active') && (
                              <StyledButton variant="danger" size="sm" onClick={() => handleCancel(job.jobId)}>
                                Cancel
                              </StyledButton>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </SettingsLayout>
  )
}
