/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/
const AuthController = () => import('#controllers/auth_controller')
const BenchmarkController = () => import('#controllers/benchmark_controller')
const ChatsController = () => import('#controllers/chats_controller')
const DocsController = () => import('#controllers/docs_controller')
const DownloadsController = () => import('#controllers/downloads_controller')
const EasySetupController = () => import('#controllers/easy_setup_controller')
const HomeController = () => import('#controllers/home_controller')
const MapsController = () => import('#controllers/maps_controller')
const OllamaController = () => import('#controllers/ollama_controller')
const RagController = () => import('#controllers/rag_controller')
const SettingsController = () => import('#controllers/settings_controller')
const SystemController = () => import('#controllers/system_controller')
const CollectionUpdatesController = () => import('#controllers/collection_updates_controller')
const AuditController = () => import('#controllers/audit_controller')
const BackupController = () => import('#controllers/backup_controller')
const UsersController = () => import('#controllers/users_controller')
const ScenarioPacksController = () => import('#controllers/scenario_packs_controller')
const ZimController = () => import('#controllers/zim_controller')
import router from '@adonisjs/core/services/router'
import transmit from '@adonisjs/transmit/services/main'
import { middleware } from '#start/kernel'

transmit.registerRoutes((route) => {
  route.use(middleware.auth())
})

// ========================
// PUBLIC ROUTES (no auth)
// ========================
router.get('/login', [AuthController, 'loginPage']).use(middleware.guest())
router
  .post('/login', [AuthController, 'login'])
  .use([middleware.loginRateLimit(), middleware.guest()])
router.get('/setup', [AuthController, 'setupPage'])
router.post('/setup', [AuthController, 'setup'])
router.get('/api/health', () => ({ status: 'ok' }))

// ========================
// AUTHENTICATED ROUTES
// ========================
router
  .group(() => {
    router.post('/logout', [AuthController, 'logout'])

    // Pages
    router.get('/', [HomeController, 'index'])
    router.get('/home', [HomeController, 'home'])
    router.on('/about').renderInertia('about')
    router.get('/chat', [ChatsController, 'inertia'])
    router.get('/maps', [MapsController, 'index'])
    router.on('/knowledge-base').redirectToPath('/chat?knowledge_base=true')

    router.get('/easy-setup', [EasySetupController, 'index'])
    router.get('/easy-setup/complete', [EasySetupController, 'complete'])
    router.get('/api/easy-setup/curated-categories', [EasySetupController, 'listCuratedCategories'])
    router.post('/api/manifests/refresh', [EasySetupController, 'refreshManifests'])

    router
      .group(() => {
        router.post('/check', [CollectionUpdatesController, 'checkForUpdates'])
        router.post('/apply', [CollectionUpdatesController, 'applyUpdate'])
        router.post('/apply-all', [CollectionUpdatesController, 'applyAllUpdates'])
      })
      .prefix('/api/content-updates')

    // Settings pages
    router
      .group(() => {
        router.get('/system', [SettingsController, 'system'])
        router.get('/apps', [SettingsController, 'apps'])
        router.get('/legal', [SettingsController, 'legal'])
        router.get('/maps', [SettingsController, 'maps'])
        router.get('/models', [SettingsController, 'models'])
        router.get('/update', [SettingsController, 'update'])
        router.get('/zim', [SettingsController, 'zim'])
        router.get('/zim/remote-explorer', [SettingsController, 'zimRemote'])
        router.get('/benchmark', [SettingsController, 'benchmark'])
        router.get('/downloads', [SettingsController, 'downloads'])
        router.on('/scenario-packs').renderInertia('settings/scenario-packs')
        router.on('/users').renderInertia('settings/users')
        router.on('/audit').renderInertia('settings/audit')
      })
      .prefix('/settings')

    // Docs
    router
      .group(() => {
        router.get('/:slug', [DocsController, 'show'])
        router.get('/', ({ response }) => {
          response.redirect('/docs/home')
        })
      })
      .prefix('/docs')

    // Maps API (read-only)
    router
      .group(() => {
        router.get('/regions', [MapsController, 'listRegions'])
        router.get('/styles', [MapsController, 'styles'])
        router.get('/curated-collections', [MapsController, 'listCuratedCollections'])
      })
      .prefix('/api/maps')

    // Maps API (mutations require operator role)
    router
      .group(() => {
        router.post('/fetch-latest-collections', [MapsController, 'fetchLatestCollections'])
        router.post('/download-base-assets', [MapsController, 'downloadBaseAssets'])
        router.post('/download-remote', [MapsController, 'downloadRemote'])
        router.post('/download-remote-preflight', [MapsController, 'downloadRemotePreflight'])
        router.post('/download-collection', [MapsController, 'downloadCollection'])
        router.delete('/:filename', [MapsController, 'delete'])
      })
      .prefix('/api/maps')
      .use(middleware.role({ roles: ['operator'] }))

    // Docs API
    router
      .group(() => {
        router.get('/list', [DocsController, 'list'])
      })
      .prefix('/api/docs')

    // Downloads API (read-only)
    router
      .group(() => {
        router.get('/jobs', [DownloadsController, 'index'])
        router.get('/jobs/:filetype', [DownloadsController, 'filetype'])
        router.get('/queue-status', [DownloadsController, 'queueStatus'])
      })
      .prefix('/api/downloads')

    // Downloads API (mutations require operator role)
    router
      .group(() => {
        router.post('/jobs/:jobId/retry', [DownloadsController, 'retry'])
        router.post('/jobs/:jobId/cancel', [DownloadsController, 'cancel'])
        router.post('/jobs/:jobId/priority', [DownloadsController, 'updatePriority'])
        router.post('/pause', [DownloadsController, 'pauseQueue'])
        router.post('/resume', [DownloadsController, 'resumeQueue'])
      })
      .prefix('/api/downloads')
      .use(middleware.role({ roles: ['operator'] }))

    // Ollama API (read-only)
    router
      .group(() => {
        router.post('/chat', [OllamaController, 'chat'])
        router.get('/models', [OllamaController, 'availableModels'])
        router.get('/installed-models', [OllamaController, 'installedModels'])
        router.get('/hardware-summary', [OllamaController, 'hardwareSummary'])
      })
      .prefix('/api/ollama')

    // Ollama API (mutations require operator role)
    router
      .group(() => {
        router.post('/models', [OllamaController, 'dispatchModelDownload'])
        router.delete('/models', [OllamaController, 'deleteModel'])
      })
      .prefix('/api/ollama')
      .use(middleware.role({ roles: ['operator'] }))

    // Chat sessions API
    router
      .group(() => {
        router.get('/', [ChatsController, 'index'])
        router.post('/', [ChatsController, 'store'])
        router.delete('/all', [ChatsController, 'destroyAll'])
        router.get('/:id', [ChatsController, 'show'])
        router.put('/:id', [ChatsController, 'update'])
        router.delete('/:id', [ChatsController, 'destroy'])
        router.post('/:id/messages', [ChatsController, 'addMessage'])
      })
      .prefix('/api/chat/sessions')

    router.get('/api/chat/suggestions', [ChatsController, 'suggestions'])

    // RAG API
    router
      .group(() => {
        router.post('/upload', [RagController, 'upload'])
        router.get('/files', [RagController, 'getStoredFiles'])
        router.delete('/files', [RagController, 'deleteFile'])
        router.get('/active-jobs', [RagController, 'getActiveJobs'])
        router.get('/job-status', [RagController, 'getJobStatus'])
        router.post('/sync', [RagController, 'scanAndSync'])
        router.get('/zim-sources', [RagController, 'getZimRagSources'])
      })
      .prefix('/api/rag')

    // RAG API (mutations require operator role)
    router
      .group(() => {
        router.patch('/zim-sources/toggle', [RagController, 'toggleZimRagSource'])
      })
      .prefix('/api/rag')
      .use(middleware.role({ roles: ['operator'] }))

    // System API (read-only endpoints available to all authenticated users)
    router
      .group(() => {
        router.get('/info', [SystemController, 'getSystemInfo'])
        router.get('/internet-status', [SystemController, 'getInternetStatus'])
        router.get('/services', [SystemController, 'getServices'])
        router.get('/latest-version', [SystemController, 'checkLatestVersion'])
        router.get('/update/status', [SystemController, 'getSystemUpdateStatus'])
        router.get('/settings', [SettingsController, 'getSetting'])
      })
      .prefix('/api/system')

    // System API (mutation endpoints require operator role)
    router
      .group(() => {
        router.post('/services/affect', [SystemController, 'affectService'])
        router.post('/services/install', [SystemController, 'installService'])
        router.post('/services/force-reinstall', [SystemController, 'forceReinstallService'])
        router.post('/services/check-updates', [SystemController, 'checkServiceUpdates'])
        router.get('/services/:name/available-versions', [SystemController, 'getAvailableVersions'])
        router.post('/services/update', [SystemController, 'updateService'])
        router.post('/subscribe-release-notes', [SystemController, 'subscribeToReleaseNotes'])
        router.post('/update', [SystemController, 'requestSystemUpdate'])
        router.get('/update/logs', [SystemController, 'getSystemUpdateLogs'])
        router.patch('/settings', [SettingsController, 'updateSetting'])
      })
      .prefix('/api/system')
      .use(middleware.role({ roles: ['operator'] }))

    // ZIM API (read-only)
    router
      .group(() => {
        router.get('/list', [ZimController, 'list'])
        router.get('/list-remote', [ZimController, 'listRemote'])
        router.get('/curated-categories', [ZimController, 'listCuratedCategories'])
        router.get('/wikipedia', [ZimController, 'getWikipediaState'])
      })
      .prefix('/api/zim')

    // ZIM API (mutations require operator role)
    router
      .group(() => {
        router.post('/download-remote', [ZimController, 'downloadRemote'])
        router.post('/download-category-tier', [ZimController, 'downloadCategoryTier'])
        router.post('/wikipedia/select', [ZimController, 'selectWikipedia'])
        router.delete('/:filename', [ZimController, 'delete'])
      })
      .prefix('/api/zim')
      .use(middleware.role({ roles: ['operator'] }))

    // Scenario Packs API (read-only)
    router
      .group(() => {
        router.get('/', [ScenarioPacksController, 'index'])
      })
      .prefix('/api/scenario-packs')

    // Scenario Packs API (mutations require operator role)
    router
      .group(() => {
        router.post('/:slug/install', [ScenarioPacksController, 'install'])
      })
      .prefix('/api/scenario-packs')
      .use(middleware.role({ roles: ['operator'] }))

    // Benchmark API (read-only)
    router
      .group(() => {
        router.get('/results', [BenchmarkController, 'results'])
        router.get('/results/latest', [BenchmarkController, 'latest'])
        router.get('/results/:id', [BenchmarkController, 'show'])
        router.get('/status', [BenchmarkController, 'status'])
        router.get('/settings', [BenchmarkController, 'settings'])
      })
      .prefix('/api/benchmark')

    // Benchmark API (mutations require operator role)
    router
      .group(() => {
        router.post('/run', [BenchmarkController, 'run'])
        router.post('/run/system', [BenchmarkController, 'runSystem'])
        router.post('/run/ai', [BenchmarkController, 'runAI'])
        router.post('/builder-tag', [BenchmarkController, 'updateBuilderTag'])
        router.post('/settings', [BenchmarkController, 'updateSettings'])
      })
      .prefix('/api/benchmark')
      .use(middleware.role({ roles: ['operator'] }))

    // ========================
    // ADMIN-ONLY ROUTES
    // ========================
    router
      .group(() => {
        router.get('/users', [UsersController, 'index'])
        router.post('/users', [UsersController, 'store'])
        router.patch('/users/:id', [UsersController, 'update'])
        router.post('/users/:id/reset-password', [UsersController, 'resetPassword'])
        router.get('/audit-logs', [AuditController, 'index'])
        router.get('/system/backup/export', [BackupController, 'exportBackup'])
        router.post('/system/backup/preview', [BackupController, 'previewImport'])
        router.post('/system/backup/import', [BackupController, 'importBackup'])
      })
      .prefix('/api')
      .use(middleware.role({ roles: ['admin'] }))
  })
  .use(middleware.auth())
