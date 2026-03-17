import { Head } from '@inertiajs/react'
import { useState } from 'react'
import SettingsLayout from '~/layouts/SettingsLayout'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

interface AuditEntry {
  id: number
  username: string | null
  action: string
  resource_type: string | null
  result: 'success' | 'failure' | 'denied'
  ip_address: string | null
  created_at: string
  details: string | null
}

export default function AuditPage() {
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('')

  const { data } = useQuery({
    queryKey: ['audit-logs', page, filter],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit: 50 }
      if (filter) params.action = filter
      const res = await api.get('/audit-logs', { params })
      return res.data
    },
    refetchInterval: 30000,
  })

  const logs: AuditEntry[] = data?.data || []
  const meta = data?.meta || { total: 0, last_page: 1 }

  const resultColors: Record<string, string> = {
    success: 'bg-green-100 text-green-800',
    failure: 'bg-red-100 text-red-800',
    denied: 'bg-yellow-100 text-yellow-800',
  }

  return (
    <SettingsLayout>
      <Head title="Audit Log" />
      <div className="xl:pl-72 w-full">
        <main className="px-6 lg:px-12 py-6 lg:py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-desert-green mb-2">Audit Log</h1>
            <p className="text-desert-stone-dark">
              Track all system actions ({meta.total} total entries)
            </p>
          </div>

          <div className="mb-4">
            <input
              type="text"
              placeholder="Filter by action..."
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value)
                setPage(1)
              }}
              className="px-3 py-2 border border-desert-stone-light rounded-md w-full max-w-sm"
            />
          </div>

          <div className="bg-desert-white rounded-lg border border-desert-stone-light shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-desert-stone-lighter/50">
                  <tr>
                    <th className="text-left p-3 font-medium text-desert-stone-dark">Time</th>
                    <th className="text-left p-3 font-medium text-desert-stone-dark">User</th>
                    <th className="text-left p-3 font-medium text-desert-stone-dark">Action</th>
                    <th className="text-left p-3 font-medium text-desert-stone-dark">Result</th>
                    <th className="text-left p-3 font-medium text-desert-stone-dark">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-desert-stone-lighter">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-desert-stone-lighter/30">
                      <td className="p-3 text-xs font-mono whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="p-3">{log.username || 'system'}</td>
                      <td className="p-3 font-mono text-xs">{log.action}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${resultColors[log.result]}`}
                        >
                          {log.result}
                        </span>
                      </td>
                      <td className="p-3 text-xs font-mono">{log.ip_address || '—'}</td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-desert-stone-dark">
                        No audit log entries found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {meta.last_page > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1">
                Page {page} of {meta.last_page}
              </span>
              <button
                onClick={() => setPage(Math.min(meta.last_page, page + 1))}
                disabled={page === meta.last_page}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </main>
      </div>
    </SettingsLayout>
  )
}
