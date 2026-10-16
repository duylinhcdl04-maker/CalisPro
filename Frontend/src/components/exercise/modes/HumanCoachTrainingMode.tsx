import { useState } from "react";
import {
  Users,
  Video,
  Calendar,
  FileText,
  Star,
  CheckCircle2,
  ShieldCheck,
  Award,
  Clock,
  Send,
  Upload,
  MessageSquare,
  Sparkles,
  ArrowRight,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import type { Exercise } from "../../../types";
import type { ExerciseDetailExtra, CoachProfile } from "../../../services/mock/exerciseDetailTrainingData";
import { Button } from "../../ui/Button";

interface HumanCoachTrainingModeProps {
  exercise: Exercise;
  extra: ExerciseDetailExtra;
}

type SubFeatureTab = "async-review" | "live-booking" | "custom-plan";

export function HumanCoachTrainingMode({ exercise, extra }: HumanCoachTrainingModeProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubFeatureTab>("async-review");
  const [selectedCoach, setSelectedCoach] = useState<CoachProfile>(extra.coaches[0]);

  // Form states
  const [uploadedVideoName, setUploadedVideoName] = useState<string | null>(null);
  const [userQuestions, setUserQuestions] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("Hôm nay, 19:30 - 20:15");
  const [customGoalNote, setCustomGoalNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleVideoFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setUploadedVideoName(e.target.files[0].name);
      toast.success("Đã tải video lên thành công", {
        description: `Tệp: ${e.target.files[0].name}`,
      });
    }
  }

  function handleSubmitAsyncReview() {
    if (!uploadedVideoName) {
      toast.error("Vui lòng chọn video quay động tác của bạn trước");
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success("Gửi yêu cầu chấm form thành công!", {
        description: `Coach ${selectedCoach.name} sẽ gửi video phân tích & nhận xét chi tiết trong vòng 24h.`,
      });
      setUploadedVideoName(null);
      setUserQuestions("");
    }, 1000);
  }

  function handleBookLiveSession() {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success(`Đặt lịch tập 1-1 với Coach ${selectedCoach.name} thành công!`, {
        description: `Khung giờ: ${selectedTimeSlot}. Link phòng tập trực tuyến đã gửi vào email.`,
      });
    }, 1000);
  }

  function handleRequestCustomPlan() {
    if (!customGoalNote.trim()) {
      toast.error("Vui lòng nhập mục tiêu hoặc tiền sử chấn thương của bạn");
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success("Yêu cầu giáo án cá nhân hóa thành công!", {
        description: `Coach ${selectedCoach.name} đang xây dựng lộ trình riêng cho bài ${exercise.name}.`,
      });
      setCustomGoalNote("");
    }, 1000);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 🥋 BANNER GIỚI THIỆU CHẾ ĐỘ COACH HUMAN */}
      <div className="rounded-2xl border border-border/80 bg-gradient-to-r from-surface via-surface to-accent-soft/20 p-5 shadow-elevated">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent text-white font-bold text-xs">
                3
              </span>
              <h3 className="font-display text-base sm:text-lg font-bold text-text-primary flex items-center gap-2">
                Tập luyện Online với Huấn luyện viên thực tế (Coach Human)
                <span className="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold uppercase px-2 py-0.5">
                  1-on-1 Online
                </span>
              </h3>
            </div>
            <p className="text-xs text-text-secondary max-w-xl">
              Được đồng hành và chỉnh sửa form trực tiếp từ các VĐV & Master Coach Calisthenics hàng đầu: Chấm video form, tập Live 1-1 và nhận giáo án riêng.
            </p>
          </div>
        </div>
      </div>

      {/* 🧭 3 SUB-TABS: CHẤM VIDEO FORM | ĐẶT LỊCH LIVE 1-1 | GIÁO ÁN RIÊNG */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 rounded-2xl bg-surface-elevated p-1.5 border border-border">
        <button
          type="button"
          onClick={() => setActiveSubTab("async-review")}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "async-review"
              ? "bg-surface text-accent-strong shadow-xs border border-border"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <Video size={15} />
          1. Gửi Video chấm form (24h)
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("live-booking")}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "live-booking"
              ? "bg-surface text-accent-strong shadow-xs border border-border"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <Calendar size={15} />
          2. Đặt lịch tập Live 1-on-1
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("custom-plan")}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "custom-plan"
              ? "bg-surface text-accent-strong shadow-xs border border-border"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <FileText size={15} />
          3. Giáo án cá nhân hóa riêng
        </button>
      </div>

      {/* 👨‍🏫 DANH SÁCH COACH ĐỒNG HÀNH */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
            Chọn Huấn luyện viên phụ trách bài {exercise.name}:
          </span>
          <span className="text-xs font-semibold text-accent-strong">
            Coach đang chọn: {selectedCoach.name}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {extra.coaches.map((coach) => {
            const isSelected = selectedCoach.id === coach.id;
            return (
              <div
                key={coach.id}
                onClick={() => setSelectedCoach(coach)}
                className={`group rounded-2xl border p-4 transition-all cursor-pointer relative ${
                  isSelected
                    ? "border-accent bg-accent-soft/30 shadow-md ring-2 ring-accent/30"
                    : "border-border/80 bg-surface hover:border-border hover:bg-surface-elevated"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <img
                      src={coach.avatarUrl}
                      alt={coach.name}
                      className="h-12 w-12 rounded-full object-cover border-2 border-border shadow-xs"
                    />
                    {coach.isOnline && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-surface" />
                    )}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-text-primary truncate">{coach.name}</div>
                      <div className="flex items-center gap-1 text-[11px] font-black text-amber-500">
                        <Star size={12} className="fill-amber-500" />
                        {coach.rating}
                      </div>
                    </div>

                    <div className="text-[11px] text-text-secondary truncate">{coach.title}</div>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {coach.specialties.slice(0, 2).map((spec) => (
                        <span
                          key={spec}
                          className="rounded bg-background px-1.5 py-0.5 text-[10px] text-text-secondary border border-border/60"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between text-[11px]">
                  <span className="text-text-secondary">Chấm form: <strong className="text-text-primary">{coach.asyncReviewRate}</strong></span>
                  <span className="text-accent-strong font-bold">Kèm 1-1: {coach.hourlyRate}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 🚀 FORM TƯƠNG TÁC THEO TỪNG SUB-TAB */}
      <div className="rounded-2xl border border-border/80 bg-surface p-5 shadow-elevated space-y-5">
        {/* 1. GỬI VIDEO CHẤM FORM */}
        {activeSubTab === "async-review" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="font-display text-sm font-bold text-text-primary flex items-center gap-2">
                <Video size={16} className="text-accent" />
                Gửi video quay form động tác {exercise.name} cho Coach {selectedCoach.name}
              </h4>
              <p className="text-xs text-text-secondary">
                Coach sẽ vẽ góc độ, chỉ ra điểm sai sót ở khớp vai/lưng/cùi chỏ và gửi video phản hồi + bài tập bổ trợ trong 24h.
              </p>
            </div>

            {/* Video Upload Dropzone */}
            <div className="rounded-2xl border-2 border-dashed border-border hover:border-accent bg-background/50 p-6 text-center transition-colors">
              <input
                type="file"
                id="video-upload"
                accept="video/*"
                onChange={handleVideoFileSelect}
                className="hidden"
              />
              <label htmlFor="video-upload" className="cursor-pointer space-y-2 block">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <Upload size={22} />
                </div>
                <div className="text-xs font-bold text-text-primary">
                  {uploadedVideoName ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-black">
                      ✓ Đã chọn: {uploadedVideoName} (Bấm để đổi video khác)
                    </span>
                  ) : (
                    "Bấm để tải lên video quay góc nghiêng hoặc góc thẳng của bạn"
                  )}
                </div>
                <p className="text-[11px] text-text-secondary">Hỗ trợ MP4, MOV tối đa 100MB (Khuyên dùng video từ 15-45 giây)</p>
              </label>
            </div>

            {/* Questions Note Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                <MessageSquare size={13} className="text-accent" />
                Thắc mắc hoặc cảm giác đau/mỏi khi tập bài này (tùy chọn):
              </label>
              <textarea
                rows={2}
                value={userQuestions}
                onChange={(e) => setUserQuestions(e.target.value)}
                placeholder="Ví dụ: Em hay bị mỏi cổ tay hoặc cảm giác ngực chưa kích hoạt nhiều khi đẩy lên..."
                className="w-full rounded-xl border border-border bg-background/50 p-3 text-xs text-text-primary placeholder:text-text-secondary/60 focus:border-accent focus:outline-none resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/70">
              <div className="text-xs text-text-secondary">
                Phí chấm form & gửi bài tập bổ trợ:{" "}
                <span className="font-extrabold text-accent-strong text-sm">{selectedCoach.asyncReviewRate}</span>
              </div>

              <Button
                onClick={handleSubmitAsyncReview}
                disabled={isSubmitting}
                className="bg-accent hover:bg-accent-strong text-white font-bold text-xs gap-2 px-6 shadow-md"
              >
                <Send size={14} />
                {isSubmitting ? "Đang gửi video..." : "Gửi Coach chấm điểm ngay"}
              </Button>
            </div>
          </div>
        )}

        {/* 2. ĐẶT LỊCH LIVE 1-ON-1 */}
        {activeSubTab === "live-booking" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="font-display text-sm font-bold text-text-primary flex items-center gap-2">
                <Calendar size={16} className="text-accent" />
                Đặt lịch tập trực tuyến 1-on-1 cùng Coach {selectedCoach.name} (45 phút)
              </h4>
              <p className="text-xs text-text-secondary">
                Kết nối phòng tập Live Video Call trực tiếp, Coach theo dõi từng rep và điều chỉnh form tức thì.
              </p>
            </div>

            {/* Time Slot Picker */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Khung giờ còn trống gần nhất:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  "Hôm nay, 19:30 - 20:15",
                  "Hôm nay, 20:30 - 21:15",
                  "Ngày mai, 07:30 - 08:15",
                ].map((slot) => {
                  const isSelected = selectedTimeSlot === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedTimeSlot(slot)}
                      className={`rounded-xl border p-3 text-xs font-semibold text-left transition-all cursor-pointer ${
                        isSelected
                          ? "border-accent bg-accent-soft/40 text-accent-strong shadow-xs ring-1 ring-accent"
                          : "border-border bg-background/50 text-text-primary hover:border-border/80"
                      }`}
                    >
                      <div className="font-bold">{slot}</div>
                      <div className="text-[10px] text-text-secondary mt-0.5">Online Video 1-1</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/70">
              <div className="text-xs text-text-secondary">
                Chi phí buổi tập 1-1 trực tuyến:{" "}
                <span className="font-extrabold text-accent-strong text-sm">{selectedCoach.hourlyRate}</span>
              </div>

              <Button
                onClick={handleBookLiveSession}
                disabled={isSubmitting}
                className="bg-accent hover:bg-accent-strong text-white font-bold text-xs gap-2 px-6 shadow-md"
              >
                <UserCheck size={14} />
                {isSubmitting ? "Đang xác nhận..." : "Xác nhận đặt lịch tập 1-1"}
              </Button>
            </div>
          </div>
        )}

        {/* 3. NHẬN GIÁO ÁN RIÊNG */}
        {activeSubTab === "custom-plan" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="font-display text-sm font-bold text-text-primary flex items-center gap-2">
                <FileText size={16} className="text-accent" />
                Yêu cầu Coach {selectedCoach.name} thiết lập giáo án riêng cho bài {exercise.name}
              </h4>
              <p className="text-xs text-text-secondary">
                Coach sẽ tùy biến số hiệp, số rep, bài bổ trợ và bài tiến hoá (Progression) phù hợp 100% với thể trạng của bạn.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-primary">
                Chia sẻ thể trạng hiện tại và mục tiêu của bạn:
              </label>
              <textarea
                rows={3}
                value={customGoalNote}
                onChange={(e) => setCustomGoalNote(e.target.value)}
                placeholder="Ví dụ: Em hiện tại chống đẩy gối được 10 cái, muốn nâng cấp lên hít đất chuẩn 15 cái trong 1 tháng tới. Cổ tay hơi yếu..."
                className="w-full rounded-xl border border-border bg-background/50 p-3 text-xs text-text-primary placeholder:text-text-secondary/60 focus:border-accent focus:outline-none resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/70">
              <div className="text-xs text-text-secondary">
                Thời gian trả giáo án: <strong className="text-text-primary">Trong vòng 12 giờ</strong>
              </div>

              <Button
                onClick={handleRequestCustomPlan}
                disabled={isSubmitting}
                className="bg-accent hover:bg-accent-strong text-white font-bold text-xs gap-2 px-6 shadow-md"
              >
                <Sparkles size={14} />
                {isSubmitting ? "Đang gửi yêu cầu..." : "Gửi yêu cầu lên giáo án riêng"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
