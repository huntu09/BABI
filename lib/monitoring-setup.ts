// 🔍 STEP 1: MONITORING SETUP

export class MonitoringSetup {
  // Sentry Configuration
  static setupSentry() {
    return `
# Add to your environment variables:
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Install Sentry:
npm install @sentry/nextjs

# Create sentry.client.config.ts:
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
})

# Create sentry.server.config.ts:
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
})
`
  }

  // Google Analytics Setup
  static setupGoogleAnalytics() {
    return `
# Add to your environment variables:
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Install Google Analytics:
npm install gtag

# Create lib/gtag.ts:
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID

export const pageview = (url: string) => {
  if (typeof window !== 'undefined') {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    })
  }
}

export const event = ({ action, category, label, value }: {
  action: string
  category: string
  label?: string
  value?: number
}) => {
  if (typeof window !== 'undefined') {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

# Add to app/layout.tsx:
import Script from 'next/script'
import { GA_TRACKING_ID } from '@/lib/gtag'

// Add these scripts in the <head>:
<Script
  strategy="afterInteractive"
  src={\`https://www.googletagmanager.com/gtag/js?id=\${GA_TRACKING_ID}\`}
/>
<Script
  id="gtag-init"
  strategy="afterInteractive"
  dangerouslySetInnerHTML={{
    __html: \`
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '\${GA_TRACKING_ID}', {
        page_path: window.location.pathname,
      });
    \`,
  }}
/>
`
  }
}
