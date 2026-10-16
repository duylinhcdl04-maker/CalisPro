import {
  AutomationRule,
  BroadcastCampaign,
  NotificationTemplate,
  NotificationLog,
  NotificationKPIs,
} from "../types/notification.types";
import {
  MOCK_AUTOMATION_RULES,
  MOCK_BROADCAST_CAMPAIGNS,
  MOCK_NOTIFICATION_TEMPLATES,
  MOCK_NOTIFICATION_LOGS,
  MOCK_NOTIFICATION_KPIS,
} from "../mock/notification.mock";

let automationRules = [...MOCK_AUTOMATION_RULES];
let campaigns = [...MOCK_BROADCAST_CAMPAIGNS];
let templates = [...MOCK_NOTIFICATION_TEMPLATES];
let logs = [...MOCK_NOTIFICATION_LOGS];

export const notificationService = {
  getKPIs: async (): Promise<NotificationKPIs> => {
    await new Promise((res) => setTimeout(res, 200));
    return {
      ...MOCK_NOTIFICATION_KPIS,
      activeAutomations: automationRules.filter((r) => r.status === "ACTIVE").length,
      totalAutomations: automationRules.length,
    };
  },

  getAutomationRules: async (): Promise<AutomationRule[]> => {
    await new Promise((res) => setTimeout(res, 200));
    return [...automationRules];
  },

  toggleRuleStatus: async (ruleId: string): Promise<AutomationRule> => {
    await new Promise((res) => setTimeout(res, 150));
    const idx = automationRules.findIndex((r) => r.id === ruleId);
    if (idx === -1) throw new Error("Rule not found");

    automationRules[idx] = {
      ...automationRules[idx],
      status: automationRules[idx].status === "ACTIVE" ? "PAUSED" : "ACTIVE",
      updatedAt: new Date().toISOString(),
    };
    return automationRules[idx];
  },

  createRule: async (rule: Omit<AutomationRule, "id" | "stats" | "createdAt" | "updatedAt">): Promise<AutomationRule> => {
    await new Promise((res) => setTimeout(res, 250));
    const newRule: AutomationRule = {
      ...rule,
      id: `auto-${Date.now().toString().slice(-4)}`,
      stats: {
        triggered: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        openRate: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    automationRules = [newRule, ...automationRules];
    return newRule;
  },

  getCampaigns: async (): Promise<BroadcastCampaign[]> => {
    await new Promise((res) => setTimeout(res, 200));
    return [...campaigns];
  },

  createCampaign: async (campaign: Omit<BroadcastCampaign, "id" | "stats" | "createdAt">): Promise<BroadcastCampaign> => {
    await new Promise((res) => setTimeout(res, 250));
    const newCampaign: BroadcastCampaign = {
      ...campaign,
      id: `cmp-${Date.now().toString().slice(-4)}`,
      stats: {
        sent: campaign.status === "COMPLETED" ? campaign.recipientCount : 0,
        delivered: campaign.status === "COMPLETED" ? Math.round(campaign.recipientCount * 0.98) : 0,
        opened: 0,
        clicked: 0,
      },
      createdAt: new Date().toISOString(),
    };
    campaigns = [newCampaign, ...campaigns];
    return newCampaign;
  },

  getTemplates: async (): Promise<NotificationTemplate[]> => {
    await new Promise((res) => setTimeout(res, 200));
    return [...templates];
  },

  saveTemplate: async (template: NotificationTemplate): Promise<NotificationTemplate> => {
    await new Promise((res) => setTimeout(res, 200));
    const idx = templates.findIndex((t) => t.id === template.id);
    if (idx !== -1) {
      templates[idx] = { ...template, updatedAt: new Date().toISOString() };
      return templates[idx];
    } else {
      const newTpl = { ...template, id: `TPL_${Date.now()}`, updatedAt: new Date().toISOString() };
      templates = [newTpl, ...templates];
      return newTpl;
    }
  },

  getLogs: async (filter?: { channel?: string; status?: string; search?: string }): Promise<NotificationLog[]> => {
    await new Promise((res) => setTimeout(res, 200));
    return logs.filter((log) => {
      if (filter?.channel && filter.channel !== "ALL" && log.channel !== filter.channel) return false;
      if (filter?.status && filter.status !== "ALL" && log.status !== filter.status) return false;
      if (filter?.search) {
        const q = filter.search.toLowerCase();
        return (
          log.recipientName.toLowerCase().includes(q) ||
          log.recipientEmail.toLowerCase().includes(q) ||
          log.title.toLowerCase().includes(q)
        );
      }
      return true;
    });
  },
};
