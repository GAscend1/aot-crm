export const demoCompanies = [
  { id: "c1", name: "Acme Corp", owner: "Sarah Chen", industry: "Manufacturing", stage: "customer", value: 245000 },
  { id: "c2", name: "Northwind Inc.", owner: "James Miller", industry: "Retail", stage: "customer", value: 189000 },
  { id: "c3", name: "Contoso Ltd.", owner: "Emily Davis", industry: "Technology", stage: "qualifying", value: 95000 },
  { id: "c4", name: "Tailspin Toys", owner: "Michael Brown", industry: "E-commerce", stage: "lead", value: 32000 },
  { id: "c5", name: "Adventure Works", owner: "Lisa Wang", industry: "Hospitality", stage: "customer", value: 412000 },
  { id: "c6", name: "Fabrikam", owner: "David Garcia", industry: "Finance", stage: "proposal", value: 178000 },
  { id: "c7", name: "South Ridge Analytics", owner: "Sarah Chen", industry: "Data Science", stage: "qualifying", value: 135000 },
  { id: "c8", name: "Blue Yonder Airlines", owner: "James Miller", industry: "Aviation", stage: "customer", value: 567000 },
]

export const demoContacts = [
  { id: "p1", name: "John Smith", company: "Acme Corp", role: "VP of Sales", email: "john@acme.com", phone: "+1 555-0101" },
  { id: "p2", name: "Maria Rodriguez", company: "Acme Corp", role: "Operations Director", email: "maria@acme.com", phone: "+1 555-0102" },
  { id: "p3", name: "Alex Kim", company: "Northwind Inc.", role: "CTO", email: "alex@northwind.com", phone: "+1 555-0201" },
  { id: "p4", name: "Sarah Johnson", company: "Contoso Ltd.", role: "Procurement Manager", email: "sarah@contoso.com", phone: "+1 555-0301" },
  { id: "p5", name: "Tom Baker", company: "Tailspin Toys", role: "Founder", email: "tom@tailspin.com", phone: "+1 555-0401" },
  { id: "p6", name: "Rachel Green", company: "Adventure Works", role: "CEO", email: "rachel@adventure.com", phone: "+1 555-0501" },
  { id: "p7", name: "Kevin Park", company: "Fabrikam", role: "Finance Director", email: "kevin@fabrikam.com", phone: "+1 555-0601" },
  { id: "p8", name: "Nina Patel", company: "South Ridge Analytics", role: "Data Lead", email: "nina@southridge.com", phone: "+1 555-0701" },
]

export const demoOpportunities = [
  { id: "o1", name: "Acme Corp - Q3 Platform", company: "Acme Corp", value: 245000, stage: "closed-won", probability: 100, owner: "Sarah Chen" },
  { id: "o2", name: "Northwind ERP Migration", company: "Northwind Inc.", value: 189000, stage: "closed-won", probability: 100, owner: "James Miller" },
  { id: "o3", name: "Contoso Data Pipeline", company: "Contoso Ltd.", value: 95000, stage: "negotiation", probability: 75, owner: "Emily Davis" },
  { id: "o4", name: "Tailspin E-commerce Suite", company: "Tailspin Toys", value: 32000, stage: "qualifying", probability: 30, owner: "Michael Brown" },
  { id: "o5", name: "Adventure Works Expansion", company: "Adventure Works", value: 175000, stage: "proposal", probability: 55, owner: "Lisa Wang" },
  { id: "o6", name: "Fabrikam Compliance Tool", company: "Fabrikam", value: 178000, stage: "discovery", probability: 20, owner: "David Garcia" },
  { id: "o7", name: "South Ridge Analytics", company: "South Ridge Analytics", value: 135000, stage: "qualifying", probability: 35, owner: "Sarah Chen" },
  { id: "o8", name: "Blue Yonder Fleet System", company: "Blue Yonder Airlines", value: 322000, stage: "negotiation", probability: 70, owner: "James Miller" },
]

export const demoPipelineStages = [
  { id: "discovery", name: "Discovery", color: "bg-slate-400" },
  { id: "qualifying", name: "Qualifying", color: "bg-blue-500" },
  { id: "proposal", name: "Proposal", color: "bg-indigo-500" },
  { id: "negotiation", name: "Negotiation", color: "bg-cyan-500" },
  { id: "closed-won", name: "Closed Won", color: "bg-emerald-500" },
  { id: "closed-lost", name: "Closed Lost", color: "bg-rose-500" },
]

export const demoActivities = [
  { id: "a1", type: "email", subject: "Q3 proposal review", contact: "John Smith", company: "Acme Corp", time: "2m ago" },
  { id: "a2", type: "meeting", subject: "Pipeline review call", contact: "Maria Rodriguez", company: "Acme Corp", time: "15m ago" },
  { id: "a3", type: "note", subject: "Follow-up items noted", contact: "Alex Kim", company: "Northwind Inc.", time: "1h ago" },
  { id: "a4", type: "task", subject: "Send contract draft", contact: "Sarah Johnson", company: "Contoso Ltd.", time: "2h ago" },
  { id: "a5", type: "email", subject: "Product demo recording", contact: "Tom Baker", company: "Tailspin Toys", time: "4h ago" },
  { id: "a6", type: "call", subject: "Discovery call follow-up", contact: "Kevin Park", company: "Fabrikam", time: "1d ago" },
  { id: "a7", type: "meeting", subject: "Quarterly business review", contact: "Rachel Green", company: "Adventure Works", time: "1d ago" },
  { id: "a8", type: "task", subject: "Update forecast spreadsheet", contact: "Nina Patel", company: "South Ridge Analytics", time: "2d ago" },
]

export const demoMeetings = [
  { id: "m1", title: "Q3 Pipeline Review", with: "John Smith", company: "Acme Corp", date: "Today", time: "2:00 PM", duration: "30 min" },
  { id: "m2", title: "Product Demo", with: "Sarah Johnson", company: "Contoso Ltd.", date: "Today", time: "3:30 PM", duration: "45 min" },
  { id: "m3", title: "Contract Negotiation", with: "Kevin Park", company: "Fabrikam", date: "Tomorrow", time: "10:00 AM", duration: "1 hr" },
  { id: "m4", title: "Onboarding Session", with: "Tom Baker", company: "Tailspin Toys", date: "Tomorrow", time: "1:00 PM", duration: "30 min" },
]

export const demoEmails = [
  { id: "e1", from: "John Smith", subject: "RE: Q3 Proposal", preview: "Thanks for the updated proposal. We reviewed it with the team and have a few questions about the timeline...", time: "10:32 AM", unread: true },
  { id: "e2", from: "Maria Rodriguez", subject: "Meeting Notes - Pipeline Review", preview: "Here are the action items from today's pipeline review. Please review and update by EOD...", time: "9:15 AM", unread: false },
  { id: "e3", from: "Alex Kim", subject: "Northwind Data Migration Timeline", preview: "Attached is the proposed timeline for the ERP data migration. Let me know if the Q4 target works...", time: "Yesterday", unread: true },
]

export const demoMetrics = {
  pipelineValue: 1370000,
  pipelineTrend: 12.5,
  wonThisQuarter: 434000,
  wonTrend: 8.3,
  avgDealSize: 84500,
  avgTrend: -2.1,
  winRate: 38,
  winRateTrend: 4.7,
  salesVelocity: 47,
  velocityTrend: 5.2,
  activeDeals: 24,
  activeTrend: 3,
  meetingsThisWeek: 14,
  emailsSent: 89,
  tasksCompleted: 42,
  responseTime: 3.2,
}

export const demoNotifications = [
  { id: "n1", text: "Acme Corp moved to Closed Won", type: "success", time: "5m ago" },
  { id: "n2", text: "Task assigned: Send contract to Fabrikam", type: "info", time: "1h ago" },
  { id: "n3", text: "Meeting reminder: Pipeline review in 15 min", type: "warning", time: "Now" },
]

export const demoUser = {
  name: "Sarah Chen",
  role: "Sales Director",
  email: "sarah@aotcrm.com",
  avatar: "SC",
  teamSize: 12,
  quota: 2000000,
  quotaProgress: 68,
}
