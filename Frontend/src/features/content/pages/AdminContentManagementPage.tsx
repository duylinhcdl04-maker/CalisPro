import React, { useState, useEffect } from "react";
import { Plus, Download, RefreshCw, FileText, Sparkles, Send, Layers } from "lucide-react";
import {
  ContentItem,
  ContentKPIs,
  ContentFilterState,
  ContentStatus,
} from "../types/content.types";
import { contentService } from "../services/contentService";
import { ContentKPIHeader } from "../components/ContentKPIHeader";
import { ContentFilterBar } from "../components/ContentFilterBar";
import { ContentTable } from "../components/ContentTable";
import { CreateEditContentModal } from "../components/CreateEditContentModal";
import { ContentAppPreviewModal } from "../components/ContentAppPreviewModal";
import { ContentAnalyticsDrawer } from "../components/ContentAnalyticsDrawer";

export const AdminContentManagementPage: React.FC = () => {
  const [kpis, setKpis] = useState<ContentKPIs>({
    totalPublished: 0,
    totalViewsMonthly: 0,
    activeEventsAndChallenges: 0,
    totalRegistrations: 0,
    viewsGrowth: 0,
    publishedGrowth: 0,
  });
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter State
  const [filter, setFilter] = useState<ContentFilterState>({
    searchQuery: "",
    type: "ALL",
    status: "ALL",
    targetPlan: "ALL",
    category: "ALL",
    sortBy: "latest",
  });

  // Modal / Drawer States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null);
  const [previewContent, setPreviewContent] = useState<ContentItem | null>(null);
  const [analyticsContent, setAnalyticsContent] = useState<ContentItem | null>(null);

  // Load Data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [kpiData, contentList] = await Promise.all([
        contentService.getKPIs(),
        contentService.getContents(filter),
      ]);
      setKpis(kpiData);
      setContents(contentList);
    } catch (error) {
      console.error("Failed to load content data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filter]);

  // Type Counts for Tabs
  const typeCounts = {
    ALL: contents.length,
    CHALLENGE: contents.filter((c) => c.type === "CHALLENGE").length,
    EVENT: contents.filter((c) => c.type === "EVENT").length,
    NEWS: contents.filter((c) => c.type === "NEWS").length,
    REWARD: contents.filter((c) => c.type === "REWARD").length,
    PRODUCT_UPDATE: contents.filter((c) => c.type === "PRODUCT_UPDATE").length,
    COMMUNITY: contents.filter((c) => c.type === "COMMUNITY").length,
  };

  const handleFilterChange = (updates: Partial<ContentFilterState>) => {
    setFilter((prev) => ({ ...prev, ...updates }));
  };

  const handleSaveContent = async (payload: any) => {
    if (editingContent) {
      await contentService.updateContent(editingContent.id, payload);
    } else {
      await contentService.createContent(payload);
    }
    setEditingContent(null);
    await loadData();
  };

  const handleStatusChange = async (id: string, newStatus: ContentStatus) => {
    await contentService.updateStatus(id, newStatus);
    await loadData();
  };

  const handleDeleteContent = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa bài viết / sự kiện này?")) {
      await contentService.deleteContent(id);
      await loadData();
    }
  };

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen">
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#172019] dark:text-white tracking-tight">
              Quản lý Nội dung & Truyền thông (Content Management)
            </h1>
            <span className="rounded-full bg-[#EEF4E8] px-2.5 py-0.5 text-xs font-bold text-[#55733C] dark:bg-emerald-950/60 dark:text-emerald-300">
              {kpis.totalPublished} bài đã xuất bản
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#687268] dark:text-zinc-400 mt-1">
            Đăng tải và phân phối Tin tức, Sự kiện Offline, Thử thách AI Motion, và Giải thưởng tới Học viên
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => loadData()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#E3E7DF] bg-white px-3.5 py-2 text-xs font-bold text-[#687268] hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Làm mới</span>
          </button>

          <button
            onClick={() => {
              setEditingContent(null);
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#7C9B5B] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#55733C] transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Tạo bài viết / Sự kiện mới</span>
          </button>
        </div>
      </div>

      <div className="h-[1px] w-full bg-[#E3E7DF] dark:bg-zinc-800" />

      {/* 2. Executive KPIs */}
      <ContentKPIHeader kpis={kpis} isLoading={isLoading} />

      {/* 3. Filter Bar */}
      <ContentFilterBar
        filter={filter}
        onFilterChange={handleFilterChange}
        typeCounts={typeCounts}
      />

      {/* 4. Main Content Table */}
      <ContentTable
        contents={contents}
        isLoading={isLoading}
        onPreview={(item) => setPreviewContent(item)}
        onViewAnalytics={(item) => setAnalyticsContent(item)}
        onEdit={(item) => {
          setEditingContent(item);
          setIsCreateModalOpen(true);
        }}
        onStatusChange={handleStatusChange}
        onDelete={handleDeleteContent}
      />

      {/* 5. Modals & Drawers */}
      <CreateEditContentModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingContent(null);
        }}
        onSave={handleSaveContent}
        initialData={editingContent}
      />

      <ContentAppPreviewModal
        isOpen={!!previewContent}
        onClose={() => setPreviewContent(null)}
        content={previewContent}
      />

      <ContentAnalyticsDrawer
        isOpen={!!analyticsContent}
        onClose={() => setAnalyticsContent(null)}
        content={analyticsContent}
      />
    </div>
  );
};
