export type NomadBackupManifest = {
  version: '1.0'
  exported_at: string
  source_system: {
    app_version: string
    hostname: string
    os: string
  }
  installed_resources: Array<{
    resource_id: string
    resource_type: 'zim' | 'map'
    version: string
    url: string
    file_size_bytes: number | null
    collection_ref: string | null
  }>
  settings: Array<{
    key: string
    value: any
  }>
  wikipedia_selection: {
    option_id: string
    status: string
    filename: string | null
    url: string | null
  } | null
  installed_models: string[]
  users: Array<{
    username: string
    email: string
    full_name: string | null
    role: 'admin' | 'operator' | 'viewer'
  }>
}

export type BackupImportPreview = {
  resources: number
  settings: number
  models: number
  users: number
  wikipedia: boolean
}

export type BackupImportResult = {
  success: boolean
  resourcesQueued: number
  settingsRestored: number
  modelsQueued: number
  usersCreated: number
  wikipediaRestored: boolean
  errors: string[]
}
