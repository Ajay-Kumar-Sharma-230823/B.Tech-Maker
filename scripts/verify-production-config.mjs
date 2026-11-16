const required = [
  'VITE_GOOGLE_APPS_SCRIPT_URL',
  'VITE_TURNSTILE_SITE_KEY',
  'VITE_PRIVACY_CONTACT_EMAIL',
  'VITE_REGISTRATION_RETENTION_DAYS',
  'VITE_SITE_ORIGIN',
]

const missing = required.filter(name => !process.env[name]?.trim())
const errors = []

if (missing.length) errors.push(`Missing required production environment variables: ${missing.join(', ')}`)

const endpoint = process.env.VITE_GOOGLE_APPS_SCRIPT_URL
if (endpoint) {
  try {
    const url = new URL(endpoint)
    if (url.protocol !== 'https:' || url.hostname !== 'script.google.com' || !/^\/macros\/s\/[^/]+\/exec$/.test(url.pathname)) {
      errors.push('VITE_GOOGLE_APPS_SCRIPT_URL must be an HTTPS Apps Script /macros/s/.../exec URL.')
    }
  } catch {
    errors.push('VITE_GOOGLE_APPS_SCRIPT_URL is not a valid URL.')
  }
}

const siteOrigin = process.env.VITE_SITE_ORIGIN
if (siteOrigin) {
  try {
    const url = new URL(siteOrigin)
    if (url.protocol !== 'https:' || url.pathname !== '/' || url.search || url.hash) {
      errors.push('VITE_SITE_ORIGIN must be an HTTPS origin with no path, query, or fragment.')
    }
  } catch {
    errors.push('VITE_SITE_ORIGIN is not a valid URL.')
  }
}

if (process.env.VITE_PRIVACY_CONTACT_EMAIL && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(process.env.VITE_PRIVACY_CONTACT_EMAIL)) {
  errors.push('VITE_PRIVACY_CONTACT_EMAIL must be a valid monitored email address.')
}

if (process.env.VITE_REGISTRATION_RETENTION_DAYS && !/^(?:[1-9]\d{0,3})$/.test(process.env.VITE_REGISTRATION_RETENTION_DAYS)) {
  errors.push('VITE_REGISTRATION_RETENTION_DAYS must be a whole number from 1 to 9999.')
}

if (errors.length) {
  console.error('Production configuration check failed:')
  errors.forEach(error => console.error(`- ${error}`))
  process.exitCode = 1
} else {
  console.log('Production configuration check passed.')
}
