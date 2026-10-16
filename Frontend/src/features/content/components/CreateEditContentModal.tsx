import React, { useState, useEffect } from "react";
import {
  X,
  FileText,
  Calendar,
  Trophy,
  Gift,
  Sparkles,
  Users2,
  Image,
  Tag,
  Clock,
  Send,
  Save,
  CheckCircle2,
  AlertCircle,
  Link,
  MapPin,
  Flame,
  Layers,
} from "lucide-react";
import {
  ContentItem,
  ContentType,
  ContentStatus,
  AudiencePlan,
  AudienceFitnessLevel,
} from "../types/content.types";

interface CreateEditContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contentData: any) => Promise<void>;
  initialData?: ContentItem | null;
}

export const CreateEditContentModal: React.FC<CreateEditContentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [activeTab, setActiveTab] = useState<"basic" | "type_details" | "content" | "audience" | "publishing">("basic");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States
  const [type, setType] = useState<ContentType>("NEWS");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [category, setCategory] = useState("Kỹ thuật & Thể lực");
  const [tagsInput, setTagsInput] = useState("");
  const [featured, setFeatured] = useState(false);
  const [pinnedToHome, setPinnedToHome] = useState(false);

  // Audience Targeting
  const [targetPlan, setTargetPlan] = useState<AudiencePlan>("ALL");
  const [targetLevel, setTargetLevel] = useState<AudienceFitnessLevel>("ALL");
  const [minStreakDays, setMinStreakDays] = useState(0);

  // Status & Scheduling
  const [status, setStatus] = useState<ContentStatus>("DRAFT");
  const [scheduledAt, setScheduledAt] = useState("");

  // Type Specific States
  // Event
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventIsOnline, setEventIsOnline] = useState(false);
  const [eventMeetingUrl, setEventMeetingUrl] = useState("");
  const [eventRegUrl, setEventRegUrl] = useState("");
  const [eventMaxParticipants, setEventMaxParticipants] = useState(100);
  const [eventOrganizer, setEventOrganizer] = useState("CalisHealth Academy");

  // Challenge
  const [challengeStart, setChallengeStart] = useState("");
  const [challengeEnd, setChallengeEnd] = useState("");
  const [challengeGoal, setChallengeGoal] = useState("");
  const [challengeRules, setChallengeRules] = useState("");
  const [challengeReward, setChallengeReward] = useState("");
  const [challengeLeaderboard, setChallengeLeaderboard] = useState(true);

  // Reward
  const [rewardType, setRewardType] = useState<any>("VOUCHER");
  const [rewardValue, setRewardValue] = useState("");
  const [rewardEligibility, setRewardEligibility] = useState("");
  const [rewardQuantity, setRewardQuantity] = useState(100);
  const [rewardDeadline, setRewardDeadline] = useState("");
  const [voucherCode, setVoucherCode] = useState("");

  // Product Update
  const [version, setVersion] = useState("v2.4.0");
  const [releaseDate, setReleaseDate] = useState("");
  const [changelog, setChangelog] = useState("");

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setTitle(initialData.title);
      setSlug(initialData.slug);
      setShortDescription(initialData.shortDescription);
      setContent(initialData.content);
      setCoverImage(initialData.coverImage);
      setCategory(initialData.category);
      setTagsInput(initialData.tags.join(", "));
      setFeatured(initialData.featured);
      setPinnedToHome(initialData.pinnedToHome);
      setTargetPlan(initialData.audience.targetPlan);
      setTargetLevel(initialData.audience.targetLevel);
      setMinStreakDays(initialData.audience.minStreakDays || 0);
      setStatus(initialData.status);
      setScheduledAt(initialData.scheduledAt || "");

      if (initialData.eventDetails) {
        setEventStartDate(initialData.eventDetails.startDate);
        setEventEndDate(initialData.eventDetails.endDate);
        setEventLocation(initialData.eventDetails.location);
        setEventIsOnline(initialData.eventDetails.isOnline);
        setEventMeetingUrl(initialData.eventDetails.meetingUrl || "");
        setEventRegUrl(initialData.eventDetails.registrationUrl || "");
        setEventMaxParticipants(initialData.eventDetails.maxParticipants);
        setEventOrganizer(initialData.eventDetails.organizer);
      }

      if (initialData.challengeDetails) {
        setChallengeStart(initialData.challengeDetails.startDate);
        setChallengeEnd(initialData.challengeDetails.endDate);
        setChallengeGoal(initialData.challengeDetails.targetGoal);
        setChallengeRules(initialData.challengeDetails.rulesSummary);
        setChallengeReward(initialData.challengeDetails.rewardDescription);
        setChallengeLeaderboard(initialData.challengeDetails.leaderboardEnabled);
      }

      if (initialData.rewardDetails) {
        setRewardType(initialData.rewardDetails.rewardType);
        setRewardValue(initialData.rewardDetails.rewardValue);
        setRewardEligibility(initialData.rewardDetails.eligibilityRequirement);
        setRewardQuantity(initialData.rewardDetails.totalQuantity);
        setRewardDeadline(initialData.rewardDetails.claimDeadline);
        setVoucherCode(initialData.rewardDetails.voucherCode || "");
      }

      if (initialData.productUpdateDetails) {
        setVersion(initialData.productUpdateDetails.version);
        setReleaseDate(initialData.productUpdateDetails.releaseDate);
        setChangelog(initialData.productUpdateDetails.changelog);
      }
    } else {
      // Defaults for new item
      setType("NEWS");
      setTitle("");
      setSlug("");
      setShortDescription("");
      setContent(`## Nội dung chi tiết\n\nNhập nội dung bài viết, thể lệ sự kiện hoặc cẩm nang tập luyện tại đây...`);
      setCoverImage("https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1200&auto=format&fit=crop");
      setCategory("Cẩm nang & Dinh dưỡng");
      setTagsInput("Calisthenics, Fitness, Workout");
      setFeatured(false);
      setPinnedToHome(false);
      setTargetPlan("ALL");
      setTargetLevel("ALL");
      setMinStreakDays(0);
      setStatus("DRAFT");
      setScheduledAt("");
    }
  }, [initialData, isOpen]);

  // Auto-generate slug from title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!initialData) {
      const generatedSlug = val
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[đĐ]/g, "d")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
      setSlug(generatedSlug);
    }
  };

  const handleSubmit = async (submitStatus?: ContentStatus) => {
    if (!title.trim()) {
      alert("Vui lòng nhập tiêu đề bài viết.");
      return;
    }

    setIsSubmitting(true);
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const payload: any = {
        type,
        title,
        slug: slug || `post-${Date.now()}`,
        shortDescription,
        content,
        coverImage: coverImage || "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1200&auto=format&fit=crop",
        author: initialData?.author || {
          name: "Ban Biên Tập CalisHealth",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
          role: "Content Creator",
        },
        category,
        tags,
        status: submitStatus || status,
        scheduledAt: scheduledAt || undefined,
        audience: {
          targetPlan,
          targetLevel,
          minStreakDays: Number(minStreakDays) || undefined,
        },
        featured,
        pinnedToHome,
      };

      if (type === "EVENT") {
        payload.eventDetails = {
          startDate: eventStartDate || new Date().toISOString(),
          endDate: eventEndDate || new Date().toISOString(),
          location: eventLocation || "CalisHealth Training Center",
          isOnline: eventIsOnline,
          meetingUrl: eventMeetingUrl || undefined,
          registrationUrl: eventRegUrl || undefined,
          maxParticipants: Number(eventMaxParticipants) || 100,
          currentParticipants: initialData?.eventDetails?.currentParticipants || 0,
          organizer: eventOrganizer || "CalisHealth Academy",
        };
      } else if (type === "CHALLENGE") {
        payload.challengeDetails = {
          startDate: challengeStart || new Date().toISOString(),
          endDate: challengeEnd || new Date().toISOString(),
          rulesSummary: challengeRules || "Tuân thủ tiêu chuẩn form AI Motion Analysis.",
          targetGoal: challengeGoal || "Hoàn thành thử thách",
          rewardDescription: challengeReward || "Huy hiệu độc quyền",
          leaderboardEnabled: challengeLeaderboard,
          currentParticipants: initialData?.challengeDetails?.currentParticipants || 0,
        };
      } else if (type === "REWARD") {
        payload.rewardDetails = {
          rewardType,
          rewardValue,
          eligibilityRequirement: rewardEligibility,
          totalQuantity: Number(rewardQuantity) || 100,
          claimedQuantity: initialData?.rewardDetails?.claimedQuantity || 0,
          claimDeadline: rewardDeadline || "2026-12-31",
          voucherCode: voucherCode || undefined,
        };
      } else if (type === "PRODUCT_UPDATE") {
        payload.productUpdateDetails = {
          version: version || "v2.4.0",
          releaseDate: releaseDate || new Date().toISOString().split("T")[0],
          highlightFeatures: ["Nâng cấp hiệu năng", "Sửa lỗi giao diện"],
          changelog: changelog || "Chi tiết cập nhật tính năng mới.",
        };
      }

      await onSave(payload);
      onClose();
    } catch (err) {
      console.error("Save content failed", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in-50 duration-200">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-3xl border border-[#E3E7DF] bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#E3E7DF] px-6 py-4 dark:border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-[#172019] dark:text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#7C9B5B]" />
              <span>{initialData ? "Chỉnh sửa Nội dung" : "Tạo Nội dung & Sự kiện Mới"}</span>
            </h3>
            <p className="text-xs text-[#687268] dark:text-zinc-400">
              Xuất bản lên Trang chủ, Tin tức, Thử thách và Sự kiện trên CalisHealth User App
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-[#E3E7DF] px-6 pt-2 bg-[#F7F8F4] dark:border-zinc-800 dark:bg-zinc-900/50">
          <button
            onClick={() => setActiveTab("basic")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === "basic"
                ? "border-[#7C9B5B] text-[#55733C] dark:text-emerald-400"
                : "border-transparent text-[#687268] hover:text-[#172019] dark:text-zinc-400"
            }`}
          >
            1. Thông tin chung
          </button>

          {type !== "NEWS" && (
            <button
              onClick={() => setActiveTab("type_details")}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === "type_details"
                  ? "border-[#7C9B5B] text-[#55733C] dark:text-emerald-400"
                  : "border-transparent text-[#687268] hover:text-[#172019] dark:text-zinc-400"
              }`}
            >
              <span>2. Chi tiết {type}</span>
              <span className="rounded-full bg-[#EEF4E8] px-1.5 py-0.2 text-[9px] font-bold text-[#55733C] dark:bg-emerald-950 dark:text-emerald-300">
                Bắt buộc
              </span>
            </button>
          )}

          <button
            onClick={() => setActiveTab("content")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === "content"
                ? "border-[#7C9B5B] text-[#55733C] dark:text-emerald-400"
                : "border-transparent text-[#687268] hover:text-[#172019] dark:text-zinc-400"
            }`}
          >
            3. Soạn thảo bài viết
          </button>

          <button
            onClick={() => setActiveTab("audience")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === "audience"
                ? "border-[#7C9B5B] text-[#55733C] dark:text-emerald-400"
                : "border-transparent text-[#687268] hover:text-[#172019] dark:text-zinc-400"
            }`}
          >
            4. Đối tượng (Audience)
          </button>

          <button
            onClick={() => setActiveTab("publishing")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === "publishing"
                ? "border-[#7C9B5B] text-[#55733C] dark:text-emerald-400"
                : "border-transparent text-[#687268] hover:text-[#172019] dark:text-zinc-400"
            }`}
          >
            5. Lên lịch & Xuất bản
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: BASIC INFO */}
          {activeTab === "basic" && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              {/* Content Type Selector */}
              <div>
                <label className="block text-xs font-bold text-[#172019] mb-2 dark:text-white">
                  Loại nội dung (Content Type) *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: "NEWS", label: "Tin tức & Cẩm nang", icon: FileText, desc: "Bài viết dinh dưỡng, phục hồi, kỹ thuật" },
                    { id: "CHALLENGE", label: "Thử thách (Challenge)", icon: Trophy, desc: "Thi đấu online có bảng xếp hạng AI" },
                    { id: "EVENT", label: "Sự kiện & Workshop", icon: Calendar, desc: "Hội thảo offline hoặc livestream trực tuyến" },
                    { id: "REWARD", label: "Giải thưởng & Voucher", icon: Gift, desc: "Đổi quà tặng, mã giảm giá dụng cụ" },
                    { id: "PRODUCT_UPDATE", label: "Cập nhật ứng dụng", icon: Sparkles, desc: "Thông báo tính năng mới, changelog" },
                    { id: "COMMUNITY", label: "Hoạt động Cộng đồng", icon: Users2, desc: "Giao lưu offline hội viên Tao Đàn, Hà Nội" },
                  ].map((t) => {
                    const Icon = t.icon;
                    const isSelected = type === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setType(t.id as ContentType)}
                        className={`flex flex-col text-left p-3 rounded-2xl border transition-all ${
                          isSelected
                            ? "border-[#7C9B5B] bg-[#EEF4E8]/60 shadow-xs dark:border-emerald-600 dark:bg-emerald-950/30"
                            : "border-[#E3E7DF] bg-white hover:border-[#7C9B5B]/50 dark:border-zinc-800 dark:bg-zinc-900"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${isSelected ? "text-[#55733C] dark:text-emerald-400" : "text-[#687268]"}`} />
                          <span className="text-xs font-bold text-[#172019] dark:text-white">{t.label}</span>
                        </div>
                        <span className="text-[10px] text-[#687268] mt-1 line-clamp-1 dark:text-zinc-400">{t.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title & Slug */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#172019] mb-1.5 dark:text-white">
                    Tiêu đề bài viết / Sự kiện *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={handleTitleChange}
                    placeholder="VD: CalisHealth Summer Challenge 2026..."
                    className="w-full rounded-xl border border-[#E3E7DF] bg-white px-3.5 py-2 text-xs font-medium text-[#172019] focus:border-[#7C9B5B] focus:outline-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172019] mb-1.5 dark:text-white">
                    URL Slug (Đường dẫn tĩnh)
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="VD: calishealth-summer-challenge-2026"
                    className="w-full rounded-xl border border-[#E3E7DF] bg-zinc-50 px-3.5 py-2 text-xs font-mono text-[#172019] focus:border-[#7C9B5B] focus:outline-none dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-200"
                  />
                </div>
              </div>

              {/* Short description */}
              <div>
                <label className="block text-xs font-bold text-[#172019] mb-1.5 dark:text-white">
                  Mô tả ngắn (Hiển thị ngoài thẻ Preview App) *
                </label>
                <textarea
                  rows={2}
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="Tóm tắt ngắn gọn 1-2 câu để thu hút học viên nhấp vào xem..."
                  className="w-full rounded-xl border border-[#E3E7DF] bg-white p-3 text-xs font-medium text-[#172019] focus:border-[#7C9B5B] focus:outline-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-white"
                />
              </div>

              {/* Cover Image URL & Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#172019] mb-1.5 dark:text-white">
                    Link Ảnh Bìa (Cover Banner URL) *
                  </label>
                  <div className="relative">
                    <Image className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#687268]" />
                    <input
                      type="text"
                      value={coverImage}
                      onChange={(e) => setCoverImage(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full rounded-xl border border-[#E3E7DF] bg-white py-2 pl-9 pr-3 text-xs font-medium text-[#172019] focus:border-[#7C9B5B] focus:outline-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172019] mb-1.5 dark:text-white">
                    Danh mục & Phân loại
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-[#E3E7DF] bg-white px-3.5 py-2 text-xs font-semibold text-[#172019] focus:border-[#7C9B5B] focus:outline-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    <option value="Thử thách & Giải đấu">Thử thách & Giải đấu</option>
                    <option value="Sự kiện & Workshop">Sự kiện & Workshop</option>
                    <option value="Cẩm nang & Dinh dưỡng">Cẩm nang & Dinh dưỡng</option>
                    <option value="Kỹ thuật & Phục hồi">Kỹ thuật & Phục hồi</option>
                    <option value="Giải thưởng & Ưu đãi">Giải thưởng & Ưu đãi</option>
                    <option value="Cập nhật Sản phẩm">Cập nhật Sản phẩm</option>
                    <option value="Cộng đồng & Hoạt động">Cộng đồng & Hoạt động</option>
                  </select>
                </div>
              </div>

              {/* Tags & Feature Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-[#172019] mb-1.5 dark:text-white">
                    Tags từ khóa (cách nhau bởi dấu phẩy)
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="Calisthenics, PushUp, Workshop, MuscleUp"
                    className="w-full rounded-xl border border-[#E3E7DF] bg-white px-3.5 py-2 text-xs font-medium text-[#172019] focus:border-[#7C9B5B] focus:outline-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-white"
                  />
                </div>

                <div className="flex items-center gap-6 pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                      className="h-4 w-4 rounded text-[#7C9B5B] focus:ring-[#7C9B5B]"
                    />
                    <span className="text-xs font-bold text-[#172019] dark:text-white flex items-center gap-1">
                      <Flame className="h-3.5 w-3.5 text-amber-500" /> Nổi bật (Featured)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pinnedToHome}
                      onChange={(e) => setPinnedToHome(e.target.checked)}
                      className="h-4 w-4 rounded text-[#7C9B5B] focus:ring-[#7C9B5B]"
                    />
                    <span className="text-xs font-bold text-[#172019] dark:text-white">
                      Ghim lên Banner Trang chủ
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TYPE SPECIFIC DETAILS */}
          {activeTab === "type_details" && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              {/* Event Specific */}
              {type === "EVENT" && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/60 dark:bg-blue-950/20">
                    <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" /> Cấu hình Sự kiện & Workshop
                    </h4>
                    <p className="text-[11px] text-blue-700 dark:text-blue-400 mt-0.5">
                      Thiết lập thời gian, địa điểm tổ chức, link họp hoặc link đăng ký giới hạn.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#172019] mb-1 dark:text-white">
                        Thời gian Bắt đầu *
                      </label>
                      <input
                        type="datetime-local"
                        value={eventStartDate}
                        onChange={(e) => setEventStartDate(e.target.value)}
                        className="w-full rounded-xl border border-[#E3E7DF] bg-white px-3.5 py-2 text-xs font-medium dark:border-zinc-800 dark:bg-zinc-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#172019] mb-1 dark:text-white">
                        Thời gian Kết thúc *
                      </label>
                      <input
                        type="datetime-local"
                        value={eventEndDate}
                        onChange={(e) => setEventEndDate(e.target.value)}
                        className="w-full rounded-xl border border-[#E3E7DF] bg-white px-3.5 py-2 text-xs font-medium dark:border-zinc-800 dark:bg-zinc-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#172019] mb-1 dark:text-white">
                      Địa điểm tổ chức *
                    </label>
                    <input
                      type="text"
                      value={eventLocation}
                      onChange={(e) => setEventLocation(e.target.value)}
                      placeholder="VD: CalisHealth Training Center, 18 Hoàng Quốc Việt, Cầu Giấy, Hà Nội"
                      className="w-full rounded-xl border border-[#E3E7DF] bg-white px-3.5 py-2 text-xs font-medium dark:border-zinc-800 dark:bg-zinc-800 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#172019] mb-1 dark:text-white">
                        Số lượng học viên tối đa (Max participants)
                      </label>
                      <input
                        type="number"
                        value={eventMaxParticipants}
                        onChange={(e) => setEventMaxParticipants(Number(e.target.value))}
                        className="w-full rounded-xl border border-[#E3E7DF] bg-white px-3.5 py-2 text-xs font-medium dark:border-zinc-800 dark:bg-zinc-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#172019] mb-1 dark:text-white">
                        Đơn vị tổ chức
                      </label>
                      <input
                        type="text"
                        value={eventOrganizer}
                        onChange={(e) => setEventOrganizer(e.target.value)}
                        placeholder="Ban Chuyên môn CalisHealth"
                        className="w-full rounded-xl border border-[#E3E7DF] bg-white px-3.5 py-2 text-xs font-medium dark:border-zinc-800 dark:bg-zinc-800 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Challenge Specific */}
              {type === "CHALLENGE" && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
                    <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                      <Trophy className="h-4 w-4" /> Cấu hình Thử thách & Thi đấu Calisthenics
                    </h4>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                      Thiết lập thể lệ AI Motion Analysis, chỉ tiêu reps và phần thưởng vinh danh.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#172019] mb-1 dark:text-white">
                        Mục tiêu Thử thách (Target Goal) *
                      </label>
                      <input
                        type="text"
                        value={challengeGoal}
                        onChange={(e) => setChallengeGoal(e.target.value)}
                        placeholder="VD: Đạt 500 reps Push-up trong 14 ngày"
                        className="w-full rounded-xl border border-[#E3E7DF] bg-white px-3.5 py-2 text-xs font-medium dark:border-zinc-800 dark:bg-zinc-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#172019] mb-1 dark:text-white">
                        Phần thưởng vinh danh (Reward) *
                      </label>
                      <input
                        type="text"
                        value={challengeReward}
                        onChange={(e) => setChallengeReward(e.target.value)}
                        placeholder="VD: Gói Premium 1 năm + Huy hiệu độc quyền"
                        className="w-full rounded-xl border border-[#E3E7DF] bg-white px-3.5 py-2 text-xs font-medium dark:border-zinc-800 dark:bg-zinc-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#172019] mb-1 dark:text-white">
                      Tóm tắt Thể lệ & Chấm điểm AI
                    </label>
                    <textarea
                      rows={2}
                      value={challengeRules}
                      onChange={(e) => setChallengeRules(e.target.value)}
                      placeholder="Mỗi rep phải khóa khớp khuỷu tay và đạt góc 90 độ theo nhận diện AI Motion..."
                      className="w-full rounded-xl border border-[#E3E7DF] bg-white p-3 text-xs font-medium dark:border-zinc-800 dark:bg-zinc-800 dark:text-white"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={challengeLeaderboard}
                      onChange={(e) => setChallengeLeaderboard(e.target.checked)}
                      className="h-4 w-4 rounded text-[#7C9B5B] focus:ring-[#7C9B5B]"
                    />
                    <span className="text-xs font-bold text-[#172019] dark:text-white">
                      Bật Bảng xếp hạng Real-time (Leaderboard) trên ứng dụng
                    </span>
                  </label>
                </div>
              )}

              {/* Reward Specific */}
              {type === "REWARD" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#172019] mb-1 dark:text-white">
                        Loại Phần thưởng
                      </label>
                      <select
                        value={rewardType}
                        onChange={(e) => setRewardType(e.target.value)}
                        className="w-full rounded-xl border border-[#E3E7DF] bg-white px-3.5 py-2 text-xs font-medium dark:border-zinc-800 dark:bg-zinc-800 dark:text-white"
                      >
                        <option value="VOUCHER">Voucher Giảm giá Dụng cụ</option>
                        <option value="SUBSCRIPTION_DISCOUNT">Ưu đãi Gia hạn Gói</option>
                        <option value="MERCHANDISE">Quà tặng hiện vật (Áo, Bình nước)</option>
                        <option value="BADGE">Huy hiệu Profile vĩnh viễn</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#172019] mb-1 dark:text-white">
                        Giá trị Phần thưởng
                      </label>
                      <input
                        type="text"
                        value={rewardValue}
                        onChange={(e) => setRewardValue(e.target.value)}
                        placeholder="VD: 500,000 ₫ hoặc Giảm 30%"
                        className="w-full rounded-xl border border-[#E3E7DF] bg-white px-3.5 py-2 text-xs font-medium dark:border-zinc-800 dark:bg-zinc-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#172019] mb-1 dark:text-white">
                        Mã Voucher (Nếu có)
                      </label>
                      <input
                        type="text"
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value)}
                        placeholder="CALISSTREAK30"
                        className="w-full rounded-xl border border-[#E3E7DF] bg-white px-3.5 py-2 text-xs font-mono dark:border-zinc-800 dark:bg-zinc-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#172019] mb-1 dark:text-white">
                        Số lượng phát hành
                      </label>
                      <input
                        type="number"
                        value={rewardQuantity}
                        onChange={(e) => setRewardQuantity(Number(e.target.value))}
                        className="w-full rounded-xl border border-[#E3E7DF] bg-white px-3.5 py-2 text-xs font-medium dark:border-zinc-800 dark:bg-zinc-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#172019] mb-1 dark:text-white">
                        Hạn chót đổi thưởng
                      </label>
                      <input
                        type="date"
                        value={rewardDeadline}
                        onChange={(e) => setRewardDeadline(e.target.value)}
                        className="w-full rounded-xl border border-[#E3E7DF] bg-white px-3.5 py-2 text-xs font-medium dark:border-zinc-800 dark:bg-zinc-800 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Product Update */}
              {type === "PRODUCT_UPDATE" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#172019] mb-1 dark:text-white">
                        Số hiệu phiên bản *
                      </label>
                      <input
                        type="text"
                        value={version}
                        onChange={(e) => setVersion(e.target.value)}
                        placeholder="VD: v2.4.0"
                        className="w-full rounded-xl border border-[#E3E7DF] bg-white px-3.5 py-2 text-xs font-mono font-bold dark:border-zinc-800 dark:bg-zinc-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#172019] mb-1 dark:text-white">
                        Ngày phát hành chính thức
                      </label>
                      <input
                        type="date"
                        value={releaseDate}
                        onChange={(e) => setReleaseDate(e.target.value)}
                        className="w-full rounded-xl border border-[#E3E7DF] bg-white px-3.5 py-2 text-xs font-medium dark:border-zinc-800 dark:bg-zinc-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#172019] mb-1 dark:text-white">
                      Changelog chi tiết (Các lỗi đã sửa & cải tiến)
                    </label>
                    <textarea
                      rows={4}
                      value={changelog}
                      onChange={(e) => setChangelog(e.target.value)}
                      placeholder="- Tối ưu 40% pin AI Vision&#10;- Bổ sung bài tập Handstand Push-up..."
                      className="w-full rounded-xl border border-[#E3E7DF] bg-white p-3 text-xs font-medium dark:border-zinc-800 dark:bg-zinc-800 dark:text-white"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RICH CONTENT EDITOR */}
          {activeTab === "content" && (
            <div className="space-y-3 animate-in fade-in-50 duration-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#172019] dark:text-white">
                  Nội dung chi tiết (Hỗ trợ định dạng Markdown / HTML) *
                </label>
                <span className="text-[11px] text-[#687268] dark:text-zinc-400">
                  {content.length} ký tự
                </span>
              </div>
              <textarea
                rows={12}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Nhập nội dung chi tiết bài viết, các bước hướng dẫn kỹ thuật, lịch trình sự kiện..."
                className="w-full rounded-2xl border border-[#E3E7DF] bg-white p-4 text-xs font-mono text-[#172019] leading-relaxed focus:border-[#7C9B5B] focus:outline-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-white"
              />
            </div>
          )}

          {/* TAB 4: AUDIENCE & TARGETING */}
          {activeTab === "audience" && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              <div className="rounded-2xl border border-[#E3E7DF] bg-[#F7F8F4] p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
                <h4 className="text-xs font-bold text-[#172019] dark:text-white">
                  Phân khúc Học viên nhìn thấy nội dung này
                </h4>
                <p className="text-[11px] text-[#687268] dark:text-zinc-400 mt-0.5">
                  Nội dung sẽ được API tự động lọc theo gói đăng ký hoặc level thể chất của học viên trên App.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#172019] mb-1.5 dark:text-white">
                    Gói tài khoản áp dụng
                  </label>
                  <select
                    value={targetPlan}
                    onChange={(e) => setTargetPlan(e.target.value as AudiencePlan)}
                    className="w-full rounded-xl border border-[#E3E7DF] bg-white px-3.5 py-2 text-xs font-semibold text-[#172019] focus:border-[#7C9B5B] focus:outline-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    <option value="ALL">Tất cả gói (All Plans)</option>
                    <option value="FREE">Chỉ tài khoản Miễn phí</option>
                    <option value="PRO">Hội viên Gói Pro trở lên</option>
                    <option value="PREMIUM">Đặc quyền Gói Premium</option>
                    <option value="TRIAL">Học viên đang Dùng thử (Trial)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172019] mb-1.5 dark:text-white">
                    Trình độ Thể chất (Level)
                  </label>
                  <select
                    value={targetLevel}
                    onChange={(e) => setTargetLevel(e.target.value as AudienceFitnessLevel)}
                    className="w-full rounded-xl border border-[#E3E7DF] bg-white px-3.5 py-2 text-xs font-semibold text-[#172019] focus:border-[#7C9B5B] focus:outline-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    <option value="ALL">Mọi cấp độ (All Levels)</option>
                    <option value="BEGINNER">Người mới bắt đầu (Beginner)</option>
                    <option value="INTERMEDIATE">Trung cấp (Intermediate)</option>
                    <option value="ADVANCED">Nâng cao (Advanced)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172019] mb-1.5 dark:text-white">
                    Yêu cầu Chuỗi ngày tập (Min Streak)
                  </label>
                  <input
                    type="number"
                    value={minStreakDays}
                    onChange={(e) => setMinStreakDays(Number(e.target.value))}
                    placeholder="0 = Không yêu cầu"
                    className="w-full rounded-xl border border-[#E3E7DF] bg-white px-3.5 py-2 text-xs font-medium text-[#172019] focus:border-[#7C9B5B] focus:outline-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PUBLISHING & SCHEDULE */}
          {activeTab === "publishing" && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              <div>
                <label className="block text-xs font-bold text-[#172019] mb-2 dark:text-white">
                  Chế độ Xuất bản & Trạng thái Workflow *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: "PUBLISHED", label: "Xuất bản Ngay", icon: Send, desc: "Hiển thị công khai ngay lập tức" },
                    { id: "SCHEDULED", label: "Hẹn giờ Xuất bản", icon: Clock, desc: "Tự động kích hoạt theo ngày giờ" },
                    { id: "REVIEW", label: "Gửi Duyệt (Review)", icon: CheckCircle2, desc: "Chờ Super Admin phê duyệt" },
                    { id: "DRAFT", label: "Lưu Bản nháp (Draft)", icon: Save, desc: "Chỉ Admin/Biên tập viên nhìn thấy" },
                  ].map((s) => {
                    const Icon = s.icon;
                    const isSelected = status === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setStatus(s.id as ContentStatus)}
                        className={`flex flex-col text-left p-3.5 rounded-2xl border transition-all ${
                          isSelected
                            ? "border-[#7C9B5B] bg-[#EEF4E8]/60 shadow-xs dark:border-emerald-600 dark:bg-emerald-950/30"
                            : "border-[#E3E7DF] bg-white hover:border-[#7C9B5B]/50 dark:border-zinc-800 dark:bg-zinc-900"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${isSelected ? "text-[#55733C] dark:text-emerald-400" : "text-[#687268]"}`} />
                          <span className="text-xs font-bold text-[#172019] dark:text-white">{s.label}</span>
                        </div>
                        <span className="text-[10px] text-[#687268] mt-1 dark:text-zinc-400">{s.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {status === "SCHEDULED" && (
                <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900/60 dark:bg-blue-950/20">
                  <label className="block text-xs font-bold text-blue-950 mb-1.5 dark:text-blue-200">
                    Thời điểm tự động xuất bản (Scheduled Date & Time) *
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full rounded-xl border border-blue-200 bg-white px-3.5 py-2 text-xs font-medium dark:border-blue-900 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between border-t border-[#E3E7DF] px-6 py-4 bg-[#F7F8F4] dark:border-zinc-800 dark:bg-zinc-900">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#E3E7DF] bg-white px-4 py-2 text-xs font-bold text-[#687268] hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
          >
            Hủy bỏ
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit("DRAFT")}
              className="rounded-xl border border-[#E3E7DF] bg-white px-4 py-2 text-xs font-bold text-[#172019] hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800 dark:text-white"
            >
              Lưu bản nháp
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#7C9B5B] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#55733C] transition-all disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              <span>{isSubmitting ? "Đang xử lý..." : initialData ? "Lưu thay đổi" : "Xuất bản / Lưu"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
