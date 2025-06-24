// 💰 STEP 3: OFFERWALL CONFIGURATION

export const offerwallConfig = {
  // CPX Research Configuration
  cpxResearch: {
    setup: `
# Environment Variables:
CPX_RESEARCH_API_KEY=your_api_key
CPX_RESEARCH_SECRET_KEY=your_secret_key
CPX_RESEARCH_APP_ID=your_app_id

# Integration Steps:
1. Sign up at https://www.cpxresearch.com/
2. Create a new app/website
3. Get your API credentials
4. Configure postback URL: https://yourdomain.com/api/offerwall/callback/cpx
5. Set up IP whitelist for security
`,
    testMode: true,
    endpoints: {
      offers: "https://live-api.cpxresearch.com/api/get-surveys",
      postback: "/api/offerwall/callback/cpx",
    },
  },

  // AdGem Configuration
  adgem: {
    setup: `
# Environment Variables:
ADGEM_API_KEY=your_api_key
ADGEM_SECRET_KEY=your_secret_key
ADGEM_APP_ID=your_app_id

# Integration Steps:
1. Sign up at https://www.adgem.com/
2. Create a publisher account
3. Add your website/app
4. Configure postback URL: https://yourdomain.com/api/offerwall/callback/adgem
5. Enable server-to-server postbacks
`,
    testMode: true,
    endpoints: {
      offers: "https://api.adgem.com/v1/offers",
      postback: "/api/offerwall/callback/adgem",
    },
  },

  // Lootably Configuration
  lootably: {
    setup: `
# Environment Variables:
LOOTABLY_API_KEY=your_api_key
LOOTABLY_PLACEMENT_ID=your_placement_id

# Integration Steps:
1. Sign up at https://www.lootably.com/
2. Create a new placement
3. Get your API key and placement ID
4. Configure postback URL: https://yourdomain.com/api/offerwall/callback/lootably
5. Set up user identification
`,
    testMode: true,
    endpoints: {
      widget: "https://wall.lootably.com/",
      postback: "/api/offerwall/callback/lootably",
    },
  },
}

// Quick setup instructions
export const getOfferwallSetupInstructions = () => {
  return `
🚀 OFFERWALL SETUP INSTRUCTIONS

1. **Choose Your Providers** (Start with 2-3):
   - CPX Research (Surveys) - High payouts
   - AdGem (Games & Apps) - Good conversion
   - Lootably (Mixed content) - Easy integration

2. **Sign Up Process**:
   - Create publisher accounts
   - Verify your website/domain
   - Get API credentials
   - Set up postback URLs

3. **Add Environment Variables**:
   Add the API keys to your .env.local file

4. **Test Integration**:
   - Enable test mode first
   - Verify postback URLs work
   - Test reward crediting
   - Check fraud detection

5. **Go Live**:
   - Disable test mode
   - Monitor performance
   - Optimize based on data

💡 **Pro Tips**:
- Start with test mode to avoid issues
- Monitor conversion rates closely
- Set up proper fraud detection
- Have backup providers ready
`
}
