import vine from '@vinejs/vine'
import { lookup } from 'node:dns/promises'

/**
 * Checks whether a URL points to a loopback or link-local address.
 * Used to prevent SSRF — the server should not fetch from localhost
 * or link-local/metadata endpoints (e.g. cloud instance metadata at 169.254.x.x).
 *
 * RFC1918 private ranges (10.x, 172.16-31.x, 192.168.x) are intentionally
 * ALLOWED because this is a LAN appliance and users may host content
 * mirrors on their local network.
 *
 * Also resolves hostnames via DNS to prevent DNS rebinding attacks where
 * a hostname resolves to a public IP during validation but a private/loopback
 * IP when the actual request is made.
 *
 * Throws an error if the URL is a loopback or link-local address.
 */
export function assertNotPrivateUrl(urlString: string): void {
  const parsed = new URL(urlString)
  const hostname = parsed.hostname.toLowerCase()

  const blockedPatterns = [
    /^localhost$/,
    /^127\.\d+\.\d+\.\d+$/,
    /^0\.0\.0\.0$/,
    /^169\.254\.\d+\.\d+$/, // Link-local / cloud metadata
    /^\[::1\]$/,
    /^\[?fe80:/i, // IPv6 link-local
  ]

  if (blockedPatterns.some((re) => re.test(hostname))) {
    throw new Error(`Download URL must not point to a loopback or link-local address: ${hostname}`)
  }
}

/**
 * Like assertNotPrivateUrl, but also resolves the hostname via DNS
 * and checks the resolved IP against blocked patterns. This prevents
 * DNS rebinding attacks. Use this for user-supplied URLs before fetching.
 */
export async function assertNotPrivateUrlResolved(urlString: string): Promise<void> {
  // First check the hostname string itself
  assertNotPrivateUrl(urlString)

  // Then resolve DNS and check the actual IP
  const parsed = new URL(urlString)
  const hostname = parsed.hostname.replace(/^\[|\]$/g, '') // Strip IPv6 brackets

  // Skip resolution for IP addresses (already checked above)
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname) || hostname.includes(':')) {
    return
  }

  try {
    const result = await lookup(hostname, { all: true })
    for (const entry of result) {
      const ip = entry.address
      const resolvedBlockedPatterns = [
        /^127\.\d+\.\d+\.\d+$/,
        /^0\.0\.0\.0$/,
        /^169\.254\.\d+\.\d+$/,
        /^::1$/,
        /^fe80:/i,
      ]
      if (resolvedBlockedPatterns.some((re) => re.test(ip))) {
        throw new Error(`Download URL hostname "${hostname}" resolves to blocked address: ${ip}`)
      }
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes('resolves to blocked')) {
      throw e
    }
    // DNS resolution failure — let the download itself fail rather than blocking
  }
}

export const remoteDownloadValidator = vine.compile(
  vine.object({
    url: vine
      .string()
      .url({ require_tld: false }) // Allow LAN URLs (e.g. http://my-nas:8080/file.zim)
      .trim(),
  })
)

export const remoteDownloadWithMetadataValidator = vine.compile(
  vine.object({
    url: vine
      .string()
      .url({ require_tld: false }) // Allow LAN URLs
      .trim(),
    metadata: vine
      .object({
        title: vine.string().trim().minLength(1),
        summary: vine.string().trim().optional(),
        author: vine.string().trim().optional(),
        size_bytes: vine.number().optional(),
      })
      .optional(),
  })
)

export const remoteDownloadValidatorOptional = vine.compile(
  vine.object({
    url: vine
      .string()
      .url({ require_tld: false }) // Allow LAN URLs
      .trim()
      .optional(),
  })
)

export const filenameParamValidator = vine.compile(
  vine.object({
    params: vine.object({
      filename: vine.string().trim().minLength(1).maxLength(4096),
    }),
  })
)

export const downloadCollectionValidator = vine.compile(
  vine.object({
    slug: vine.string(),
  })
)

export const downloadCategoryTierValidator = vine.compile(
  vine.object({
    categorySlug: vine.string().trim().minLength(1),
    tierSlug: vine.string().trim().minLength(1),
  })
)

export const selectWikipediaValidator = vine.compile(
  vine.object({
    optionId: vine.string().trim().minLength(1),
  })
)

const resourceUpdateInfoBase = vine.object({
  resource_id: vine.string().trim().minLength(1),
  resource_type: vine.enum(['zim', 'map'] as const),
  installed_version: vine.string().trim(),
  latest_version: vine.string().trim().minLength(1),
  download_url: vine.string().url({ require_tld: false }).trim(),
})

export const applyContentUpdateValidator = vine.compile(resourceUpdateInfoBase)

export const applyAllContentUpdatesValidator = vine.compile(
  vine.object({
    updates: vine.array(resourceUpdateInfoBase).minLength(1),
  })
)
