// Test script untuk AdGem postback
import crypto from "crypto"

// Test data
const testData = {
  user_id: "test_user_123", // Ganti dengan user ID yang ada di database
  offer_id: "12345",
  amount: "1.50", // $1.50
  status: "completed", // atau "1"
  transaction_id: `test_${Date.now()}`,
  campaign_id: "test_campaign",
}

// Generate signature (sama seperti AdGem)
function generateAdGemSignature(data: any, secretKey: string): string {
  const signatureString = `${data.user_id}${data.offer_id}${data.amount}${data.status}${secretKey}`
  return crypto.createHash("md5").update(signatureString).digest("hex")
}

// Test postback
async function testAdGemPostback() {
  const secretKey = process.env.ADGEM_SECRET_KEY || "your_secret_key"
  const signature = generateAdGemSignature(testData, secretKey)

  const payload = {
    ...testData,
    signature,
  }

  console.log("🧪 Testing AdGem Postback...")
  console.log("Payload:", JSON.stringify(payload, null, 2))

  try {
    const response = await fetch("https://your-domain.vercel.app/api/offerwall/callback/adgem", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "AdGem-Test/1.0",
      },
      body: JSON.stringify(payload),
    })

    const result = await response.json()

    console.log("✅ Response Status:", response.status)
    console.log("✅ Response Body:", JSON.stringify(result, null, 2))

    if (response.ok) {
      console.log("🎉 Postback test SUCCESSFUL!")
    } else {
      console.log("❌ Postback test FAILED!")
    }
  } catch (error) {
    console.error("❌ Test Error:", error)
  }
}

// Run test
testAdGemPostback()
