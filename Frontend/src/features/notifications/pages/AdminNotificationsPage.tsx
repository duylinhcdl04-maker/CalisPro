import React, { useState, useEffect } from "react";
import {
  Bell,
  Zap,
  Send,
  FileCode,
  History,
  RefreshCw,
  Plus,
  ArrowRight,
} from "lucide-react";
import {
  AutomationRule,
  BroadcastCampaign,
  NotificationTemplate,
  NotificationLog,
  NotificationKPIs,
} from "../types/notification.types";
import { notificationService } from "../services/notificationService";
import { NotificationKPIHeader } from "../components/NotificationKPIHeader";
import { AutomationRulesTab } from "../components/AutomationRulesTab";
import { CampaignsTab } from "../components/CampaignsTab";
import { TemplateLibraryTab } from "../components/TemplateLibraryTab";
import { NotificationLogsTab } from "../components/NotificationLogsTab";
import { CreateAutomationRuleModal } from "../components/CreateAutomationRuleModal";
import { CreateCampaignModal } from "../components/CreateCampaignModal";

export const AdminNotificationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"automations" | "campaigns" | "templates" | "logs">("automations");

  const [kpis, setKpis] = useState<NotificationKPIs>({
    totalSentMonthly: 0,
    deliveryRate: 0,
    openRate: 0,
    clickThroughRate: 0,
    activeAutomations: 0,
    totalAutomations: 0,
  });

  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [campaigns, setCampaigns] = useState<BroadcastCampaign[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isCreateRuleOpen, setIsCreateRuleOpen] = useState(false);
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [kpiData, rulesData, campaignsData, templatesData, logsData] = await Promise.all([
        notificationService.getKPIs(),
        notificationService.getAutomationRules(),
        notificationService.getCampaigns(),
        notificationService.getTemplates(),
        notificationService.getLogs(),
      ]);
      setKpis(kpiData);
      setRules(rulesData);
      setCampaigns(campaignsData);
      setTemplates(templatesData);
      setLogs(logsData);
    } catch (err) {
      console.error("Failed to load notifications data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleToggleRuleStatus = async (ruleId: string) => {
    await notificationService.toggleRuleStatus(ruleId);
    await loadAllData();
  };

  const handleSaveRule = async (ruleData: any) => {
    await notificationService.createRule(ruleData);
    await loadAllData();
  };

  const handleSaveCampaign = async (campaignData: any) => {
    await notificationService.createCampaign(campaignData);
    await loadAllData();
  };

  const tabs = [
    {
      id: "automations",
      label: "Kịch bản Tự động hóa",
      icon: <Zap className="h-4 w-4" />,
      badge: `${rules.filter((r) => r.status === "ACTIVE").length} Active`,
      badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    },
    {
      id: "campaigns",
      label: "Chiến dịch Phát sóng",
      icon: <Send className="h-4 w-4" />,
      badge: `${campaigns.length}`,
      badgeClass: "bg-[#EEF4E8] text-[#55733C] dark:bg-zinc-800 dark:text-zinc-300",
    },
    {
      id: "templates",
      label: "Kho Mẫu & Biến động",
      icon: <FileCode className="h-4 w-4" />,
      badge: `${templates.length}`,
      badgeClass: "bg-[#EEF4E8] text-[#55733C] dark:bg-zinc-800 dark:text-zinc-300",
    },
    {
      id: "logs",
      label: "Nhật ký Chuyển phát",
      icon: <History className="h-4 w-4" />,
      badge: `${logs.length}`,
      badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
    },
  ];

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen">
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#172019] dark:text-white tracking-tight">
              Thông báo & Tự động hóa (Communication & Automation)
            </h1>
            <span className="rounded-full bg-[#EEF4E8] px-2.5 py-0.5 text-xs font-bold text-[#55733C] dark:bg-emerald-950/60 dark:text-emerald-300">
              {kpis.activeAutomations} Kịch bản Live
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#687268] dark:text-zinc-400 mt-1">
            Trung tâm điều phối Email, In-App Popup, Push Notification và các kịch bản Trigger thông minh theo vòng đời học viên
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => loadAllData()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#E3E7DF] bg-white px-3.5 py-2 text-xs font-bold text-[#687268] hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Làm mới</span>
          </button>

          <button
            onClick={() => setIsCreateCampaignOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#7C9B5B] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#55733C] transition-all"
          >
            <Send className="h-4 w-4" />
            <span>Tạo Chiến dịch mới</span>
          </button>
        </div>
      </div>

      <div className="h-[1px] w-full bg-[#E3E7DF] dark:bg-zinc-800" />

      {/* 2. Executive KPIs */}
      <NotificationKPIHeader kpis={kpis} isLoading={isLoading} />

      {/* 3. Responsive Tab Switcher - No Horizontal Scrollbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E3E7DF] pb-3 dark:border-zinc-800">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                isActive
                  ? "bg-[#7C9B5B] text-white shadow-2xs"
                  : "border border-[#E3E7DF] bg-white text-[#687268] hover:bg-zinc-50 hover:text-[#172019] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              <span className={isActive ? "text-white" : "text-[#7C9B5B]"}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isActive ? "bg-white/20 text-white" : tab.badgeClass
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 4. Tab Contents */}
      {activeTab === "automations" && (
        <div className="animate-in fade-in-50 duration-200">
          <AutomationRulesTab
            rules={rules}
            onToggleStatus={handleToggleRuleStatus}
            onCreateRule={() => setIsCreateRuleOpen(true)}
          />
        </div>
      )}

      {activeTab === "campaigns" && (
        <div className="animate-in fade-in-50 duration-200">
          <CampaignsTab
            campaigns={campaigns}
            onCreateCampaign={() => setIsCreateCampaignOpen(true)}
          />
        </div>
      )}

      {activeTab === "templates" && (
        <div className="animate-in fade-in-50 duration-200">
          <TemplateLibraryTab templates={templates} />
        </div>
      )}

      {activeTab === "logs" && (
        <div className="animate-in fade-in-50 duration-200">
          <NotificationLogsTab logs={logs} isLoading={isLoading} />
        </div>
      )}

      {/* 5. Modals */}
      <CreateAutomationRuleModal
        isOpen={isCreateRuleOpen}
        onClose={() => setIsCreateRuleOpen(false)}
        onSave={handleSaveRule}
      />

      <CreateCampaignModal
        isOpen={isCreateCampaignOpen}
        onClose={() => setIsCreateCampaignOpen(false)}
        onSave={handleSaveCampaign}
      />
    </div>
  );
};
