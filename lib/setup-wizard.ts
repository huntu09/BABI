// 🧙‍♂️ PRODUCTION SETUP WIZARD

export class ProductionSetupWizard {
  private steps = [
    {
      id: 1,
      title: "🔍 Set Up Monitoring",
      description: "Configure error tracking and analytics",
      priority: "HIGH",
      estimatedTime: "30 minutes",
      status: "pending" as "pending" | "completed" | "skipped",
    },
    {
      id: 2,
      title: "📋 Create Legal Pages",
      description: "Privacy Policy, Terms of Service, Cookie Policy",
      priority: "HIGH",
      estimatedTime: "2 hours",
      status: "pending" as "pending" | "completed" | "skipped",
    },
    {
      id: 3,
      title: "💰 Configure Offerwall APIs",
      description: "Set up real offerwall provider integrations",
      priority: "HIGH",
      estimatedTime: "1 hour",
      status: "pending" as "pending" | "completed" | "skipped",
    },
    {
      id: 4,
      title: "🔐 Enable Advanced Security",
      description: "Configure fraud detection and security services",
      priority: "MEDIUM",
      estimatedTime: "45 minutes",
      status: "pending" as "pending" | "completed" | "skipped",
    },
    {
      id: 5,
      title: "📧 Set Up Communication",
      description: "Email and SMS services for notifications",
      priority: "MEDIUM",
      estimatedTime: "30 minutes",
      status: "pending" as "pending" | "completed" | "skipped",
    },
    {
      id: 6,
      title: "🧪 Add Testing",
      description: "Unit tests and integration tests",
      priority: "LOW",
      estimatedTime: "3 hours",
      status: "pending" as "pending" | "completed" | "skipped",
    },
  ]

  getNextSteps() {
    return this.steps.filter((step) => step.status === "pending").slice(0, 3)
  }

  getHighPrioritySteps() {
    return this.steps.filter((step) => step.priority === "HIGH" && step.status === "pending")
  }
}

export const setupWizard = new ProductionSetupWizard()
