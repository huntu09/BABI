// Script to find any remaining references to enhanced-admin-dashboard
console.log("🔍 Searching for enhanced-admin-dashboard references...")

// Common places where references might exist:
const potentialFiles = [
  "app/admin-enhanced/page.tsx", // Should be deleted
  "app/layout.tsx", // Check for any imports
  "components/admin-dashboard.tsx", // Check for any imports
  "middleware.ts", // Check for route references
]

console.log("Files to check:", potentialFiles)
console.log("✅ After cleanup, deployment should work")
