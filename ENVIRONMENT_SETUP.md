# 🚀 Dropiyo Environment Setup Guide

## Quick Start (Minimum Required)

1. **Copy environment file:**
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`

2. **Set up Supabase (REQUIRED):**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Get URL and anon key from Settings > API
   - Update `.env.local` with your values

3. **Run the application:**
   \`\`\`bash
   npm run dev
   \`\`\`

## Full Production Setup

### 🔐 1. Database & Auth (REQUIRED)
- **Supabase**: Database, authentication, real-time features
- Run all SQL scripts in `/scripts` folder

### 💰 2. Offerwall Providers (REVENUE)
Choose 2-3 providers to start:

**Recommended for Indonesia:**
- **CPX Research** - High-paying surveys
- **Lootably** - Easy integration, mixed content
- **AdGem** - Good for gaming offers

**Setup Process:**
1. Sign up for each provider
2. Get API credentials
3. Configure postback URLs
4. Test in sandbox mode first

### 💳 3. Payment Methods (REQUIRED)
For Indonesian market:
- **DANA** - Most popular
- **GoPay** - Gojek ecosystem
- **ShopeePay** - Shopee users
- **OVO** - Grab ecosystem

### 📊 4. Monitoring (RECOMMENDED)
- **Sentry** - Error tracking
- **Google Analytics** - User analytics
- **Vercel Analytics** - Performance

### 🛡️ 5. Security (PRODUCTION)
- **IP Geolocation** - Fraud detection
- **VPN Detection** - Prevent abuse
- **Email Service** - User verification

## Environment Variables Priority

### 🚨 Critical (App won't work without these):
\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=
ENCRYPTION_KEY=
\`\`\`

### 💰 Revenue (Needed for earnings):
\`\`\`env
CPX_RESEARCH_API_KEY=
LOOTABLY_API_KEY=
DANA_API_KEY=
GOPAY_API_KEY=
\`\`\`

### 📊 Analytics (Recommended):
\`\`\`env
SENTRY_DSN=
NEXT_PUBLIC_GA_ID=
\`\`\`

### 🔒 Security (Production):
\`\`\`env
IPAPI_KEY=
PROXYCHECK_API_KEY=
RESEND_API_KEY=
\`\`\`

## Testing Your Setup

1. **Database Connection:**
   \`\`\`bash
   # Check if you can access Supabase
   curl -H "apikey: YOUR_ANON_KEY" https://YOUR_PROJECT.supabase.co/rest/v1/profiles
   \`\`\`

2. **Offerwall Integration:**
   - Test postback URLs
   - Verify reward crediting
   - Check fraud detection

3. **Payment Methods:**
   - Test withdrawal flow
   - Verify API connections
   - Check minimum amounts

## Common Issues

### ❌ "Database not ready"
- Run all SQL scripts in order
- Check Supabase project status
- Verify RLS policies

### ❌ "Offerwall not loading"
- Check API keys are correct
- Verify postback URLs
- Enable test mode first

### ❌ "Withdrawal failed"
- Check payment provider credentials
- Verify minimum amounts
- Test API endpoints

## Production Checklist

- [ ] All environment variables set
- [ ] Database scripts executed
- [ ] Offerwall providers configured
- [ ] Payment methods tested
- [ ] Monitoring services active
- [ ] Security measures enabled
- [ ] Legal pages updated
- [ ] Terms & Privacy Policy ready
- [ ] Support channels configured
- [ ] Backup systems in place

## Support

If you need help:
1. Check this guide first
2. Review error logs in Sentry
3. Test individual components
4. Contact provider support if needed

**Good luck with your Dropiyo launch! 🚀**
