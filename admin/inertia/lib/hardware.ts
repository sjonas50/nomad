import type { HardwareFitness } from '../../types/hardware'

const SIZE_UNITS: Record<string, number> = {
  B: 1,
  KB: 1024,
  MB: 1024 ** 2,
  GB: 1024 ** 3,
  TB: 1024 ** 4,
}

export function parseModelSizeToBytes(sizeStr: string): number {
  const match = sizeStr.trim().match(/^([\d.]+)\s*(TB|GB|MB|KB|B)$/i)
  if (!match) return 0

  const value = Number.parseFloat(match[1])
  const unit = match[2].toUpperCase()
  const multiplier = SIZE_UNITS[unit]

  return multiplier ? Math.round(value * multiplier) : 0
}

export function categorizeModelFitness(
  modelSizeBytes: number,
  totalRamBytes: number,
  gpuVramBytes: number | null
): HardwareFitness {
  if (modelSizeBytes <= 0) return 'recommended'

  const overhead = 1.2
  const requiredBytes = modelSizeBytes * overhead

  if (gpuVramBytes && gpuVramBytes > 0 && requiredBytes <= gpuVramBytes) {
    return 'recommended'
  }

  if (requiredBytes <= totalRamBytes) {
    return 'will_run_slow'
  }

  return 'too_large'
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / 1024 ** i).toFixed(i > 1 ? 1 : 0)} ${units[i]}`
}
