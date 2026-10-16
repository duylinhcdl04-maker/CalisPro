import {
  ContentItem,
  ContentKPIs,
  ContentFilterState,
  ContentStatus,
} from "../types/content.types";
import { MOCK_CONTENT_ITEMS, MOCK_CONTENT_KPIS } from "../mock/content.mock";

let contentsData: ContentItem[] = [...MOCK_CONTENT_ITEMS];

export const contentService = {
  getKPIs: async (): Promise<ContentKPIs> => {
    await new Promise((res) => setTimeout(res, 200));
    return {
      ...MOCK_CONTENT_KPIS,
      totalPublished: contentsData.filter((c) => c.status === "PUBLISHED").length,
    };
  },

  getContents: async (filter: ContentFilterState): Promise<ContentItem[]> => {
    await new Promise((res) => setTimeout(res, 200));

    return contentsData.filter((item) => {
      // Type filter
      if (filter.type !== "ALL" && item.type !== filter.type) return false;

      // Status filter
      if (filter.status !== "ALL" && item.status !== filter.status) return false;

      // Target Plan filter
      if (filter.targetPlan !== "ALL" && item.audience.targetPlan !== filter.targetPlan && item.audience.targetPlan !== "ALL") {
        return false;
      }

      // Search
      if (filter.searchQuery.trim()) {
        const q = filter.searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = item.shortDescription.toLowerCase().includes(q);
        const matchesTag = item.tags.some((t) => t.toLowerCase().includes(q));
        const matchesAuthor = item.author.name.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesTag && !matchesAuthor) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (filter.sortBy === "most_viewed") return b.analytics.views - a.analytics.views;
      if (filter.sortBy === "engagement") return b.analytics.engagementRate - a.analytics.engagementRate;
      if (filter.sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  },

  getContentById: async (id: string): Promise<ContentItem | null> => {
    await new Promise((res) => setTimeout(res, 150));
    return contentsData.find((c) => c.id === id) || null;
  },

  createContent: async (content: Omit<ContentItem, "id" | "analytics" | "createdAt" | "updatedAt">): Promise<ContentItem> => {
    await new Promise((res) => setTimeout(res, 300));
    const newItem: ContentItem = {
      ...content,
      id: `cnt-${Date.now().toString().slice(-4)}`,
      analytics: {
        views: 0,
        uniqueViews: 0,
        clicks: 0,
        shares: 0,
        likes: 0,
        engagementRate: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    contentsData = [newItem, ...contentsData];
    return newItem;
  },

  updateContent: async (id: string, updates: Partial<ContentItem>): Promise<ContentItem> => {
    await new Promise((res) => setTimeout(res, 250));
    const index = contentsData.findIndex((c) => c.id === id);
    if (index === -1) throw new Error("Content not found");

    const updated = {
      ...contentsData[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    contentsData[index] = updated;
    return updated;
  },

  updateStatus: async (id: string, newStatus: ContentStatus): Promise<ContentItem> => {
    await new Promise((res) => setTimeout(res, 200));
    const index = contentsData.findIndex((c) => c.id === id);
    if (index === -1) throw new Error("Content not found");

    const patch: Partial<ContentItem> = {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    if (newStatus === "PUBLISHED" && !contentsData[index].publishedAt) {
      patch.publishedAt = new Date().toISOString();
    }
    if (newStatus === "ARCHIVED") {
      patch.archivedAt = new Date().toISOString();
    }

    const updated = { ...contentsData[index], ...patch };
    contentsData[index] = updated;
    return updated;
  },

  deleteContent: async (id: string): Promise<boolean> => {
    await new Promise((res) => setTimeout(res, 200));
    contentsData = contentsData.filter((c) => c.id !== id);
    return true;
  },
};
