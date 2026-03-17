import {
  IconArrowBigUpLines,
  IconChartBar,
  IconDownload,
  IconFileText,
  IconFolder,
  IconGavel,
  IconMapRoute,
  IconPackage,
  IconSettings,
  IconTerminal2,
  IconUsers,
  IconWand,
  IconZoom
} from '@tabler/icons-react'
import { usePage } from '@inertiajs/react'
import StyledSidebar from '~/components/StyledSidebar'
import useServiceInstalledStatus from '~/hooks/useServiceInstalledStatus'
import useAuth from '~/hooks/useAuth'
import { SERVICE_NAMES } from '../../constants/service_names'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const { aiAssistantName } = usePage<{ aiAssistantName: string }>().props
  const aiAssistantInstallStatus = useServiceInstalledStatus(SERVICE_NAMES.OLLAMA)
  const { isAdmin } = useAuth()

  const navigation = [
    ...(aiAssistantInstallStatus.isInstalled ? [{ name: aiAssistantName, href: '/settings/models', icon: IconWand, current: false }] : []),
    { name: 'Apps', href: '/settings/apps', icon: IconTerminal2, current: false },
    { name: 'Benchmark', href: '/settings/benchmark', icon: IconChartBar, current: false },
    { name: 'Content Explorer', href: '/settings/zim/remote-explorer', icon: IconZoom, current: false },
    { name: 'Content Manager', href: '/settings/zim', icon: IconFolder, current: false },
    { name: 'Downloads', href: '/settings/downloads', icon: IconDownload, current: false },
    { name: 'Maps Manager', href: '/settings/maps', icon: IconMapRoute, current: false },
    { name: 'Scenario Packs', href: '/settings/scenario-packs', icon: IconPackage, current: false },
    {
      name: 'Check for Updates',
      href: '/settings/update',
      icon: IconArrowBigUpLines,
      current: false,
    },
    { name: 'System', href: '/settings/system', icon: IconSettings, current: false },
    ...(isAdmin ? [
      { name: 'User Management', href: '/settings/users', icon: IconUsers, current: false },
      { name: 'Audit Log', href: '/settings/audit', icon: IconFileText, current: false },
    ] : []),
    { name: 'Legal Notices', href: '/settings/legal', icon: IconGavel, current: false },
  ]

  return (
    <div className="min-h-screen flex flex-row bg-stone-50/90">
      <StyledSidebar title="Settings" items={navigation} />
      {children}
    </div>
  )
}
