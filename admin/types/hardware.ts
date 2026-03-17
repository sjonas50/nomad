export type HardwareSummary = {
  totalRamBytes: number
  availableRamBytes: number
  gpuVramBytes: number | null
  gpuModel: string | null
}

export type HardwareFitness = 'recommended' | 'will_run_slow' | 'too_large'
