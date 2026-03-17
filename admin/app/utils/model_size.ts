import { HardwareFitness } from '../../types/hardware.js'

const SIZE_UNITS: Record<string, number> = {
  B: 1,
  KB: 1024,
  MB: 1024 ** 2,
  GB: 1024 ** 3,
  TB: 1024 ** 4,
}

/**
 * Parses a human-readable size string (e.g. "5.1 GB") into bytes.
 * Returns 0 if the string cannot be parsed.
 */
export function parseModelSizeToBytes(sizeStr: string): number {
  const match = sizeStr.trim().match(/^([\d.]+)\s*(TB|GB|MB|KB|B)$/i)
  if (!match) return 0

  const value = Number.parseFloat(match[1])
  const unit = match[2].toUpperCase()
  const multiplier = SIZE_UNITS[unit]

  return multiplier ? Math.round(value * multiplier) : 0
}

/**
 * Determines how well a model fits the available hardware.
 *
 * Rules:
 * - A model needs roughly 1.2x its size in memory to run.
 * - If GPU VRAM is available and the model fits in VRAM -> "recommended"
 * - If the model fits in system RAM (but not VRAM) -> "will_run_slow"
 * - If the model doesn't fit in RAM at all -> "too_large"
 */
export function categorizeModelFitness(
  modelSizeBytes: number,
  totalRamBytes: number,
  gpuVramBytes: number | null
): HardwareFitness {
  if (modelSizeBytes <= 0) return 'recommended' // can't determine size, assume ok

  const overhead = 1.2
  const requiredBytes = modelSizeBytes * overhead

  // Check GPU VRAM first
  if (gpuVramBytes && gpuVramBytes > 0 && requiredBytes <= gpuVramBytes) {
    return 'recommended'
  }

  // Check system RAM
  if (requiredBytes <= totalRamBytes) {
    return gpuVramBytes && gpuVramBytes > 0 ? 'will_run_slow' : 'will_run_slow'
  }

  return 'too_large'
}
