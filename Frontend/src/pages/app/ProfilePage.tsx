import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import {
  User,
  Mail,
  Shield,
  Target,
  Calendar,
  Sparkles,
  Award,
  KeyRound,
  Laptop,
  CheckCircle2,
  LogOut,
  Edit3,
  Dumbbell,
  Flame,
  Activity,
  Zap,
  Lock,
  ArrowRight,
  Crown,
} from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";
import { useSavedAnswersQuery } from "../../features/onboarding/hooks";
import {
  useChangePasswordMutation,
  usePrivacyConsentQuery,
  useSessionQuery,
  useUpdateNameMutation,
  useUpdatePrivacyConsentMutation,
} from "../../features/profile/hooks";
import { ASSESSMENT_QUESTIONS } from "../../services/mock/assessmentQuestions";
import type { AnswerValue } from "../../types";
import { Button } from "../../components/ui/Button";
import { GlowingAvatar } from "../../components/ui/GlowingAvatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/Card";
import { Checkbox } from "../../components/ui/Checkbox";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "../../components/ui/Dialog";
import { FieldError, Input, Label } from "../../components/ui/Input";
import { ProfileSkeleton, CardSkeleton } from "../../components/ui/Skeleton";
import { Badge } from "../../components/ui/Badge";
import { ClayTileIcon } from "../../components/ui/ClayTileIcon";

function resolveOptionLabel(questionId: string, value: AnswerValue | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const question = ASSESSMENT_QUESTIONS.find((q) => q.id === questionId);
  return question?.options?.find((option) => option.value === value)?.label;
}

function resolveMultiOptionLabels(questionId: string, value: AnswerValue | undefined): string[] {
  if (!Array.isArray(value)) return [];
  const question = ASSESSMENT_QUESTIONS.find((q) => q.id === questionId);
  return value
    .map((v) => question?.options?.find((option) => option.value === v)?.label)
    .filter((label): label is string => Boolean(label));
}

const editProfileSchema = z.object({
  name: z.string().min(2, "Tên cần ít nhất 2 ký tự."),
});
type EditProfileValues = z.infer<typeof editProfileSchema>;

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại."),
    newPassword: z.string().min(8, "Mật khẩu mới cần ít nhất 8 ký tự."),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu mới."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp.",
    path: ["confirmPassword"],
  });
type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

function EditProfileDialog({ currentName }: { currentName: string }) {
  const [open, setOpen] = useState(false);
  const updateName = useUpdateNameMutation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditProfileValues>({ resolver: zodResolver(editProfileSchema), defaultValues: { name: currentName } });

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) reset({ name: currentName });
  }

  function onSubmit(values: EditProfileValues) {
    updateName.mutate(values.name, {
      onSuccess: () => {
        toast.success("Đã cập nhật tên hồ sơ.");
        setOpen(false);
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 shadow-xs border-border/80 hover:border-accent">
          <Edit3 size={15} />
          Chỉnh sửa thông tin
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogTitle className="flex items-center gap-2">
          <User size={18} className="text-accent" />
          Chỉnh sửa hồ sơ
        </DialogTitle>
        <DialogDescription>Cập nhật họ và tên hiển thị trong hệ thống của bạn.</DialogDescription>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
          <div>
            <Label htmlFor="profile-name">Họ và tên</Label>
            <Input id="profile-name" className="mt-1.5" aria-invalid={!!errors.name} {...register("name")} />
            <FieldError>{errors.name?.message}</FieldError>
          </div>
          <Button type="submit" className="w-full bg-accent hover:bg-accent-strong text-white" disabled={updateName.isPending}>
            {updateName.isPending ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ChangePasswordDialog() {
  const [open, setOpen] = useState(false);
  const changePassword = useChangePasswordMutation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordValues>({ resolver: zodResolver(changePasswordSchema) });

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) reset();
  }

  function onSubmit() {
    changePassword.mutate(undefined, {
      onSuccess: () => {
        toast.success("Đã đổi mật khẩu thành công.");
        setOpen(false);
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 border-border/80 hover:border-accent">
          <KeyRound size={15} />
          Đổi mật khẩu
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogTitle className="flex items-center gap-2">
          <Lock size={18} className="text-accent" />
          Đổi mật khẩu
        </DialogTitle>
        <DialogDescription>Bảo vệ tài khoản bằng mật khẩu an toàn với ít nhất 8 ký tự.</DialogDescription>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
          <div>
            <Label htmlFor="current-password">Mật khẩu hiện tại</Label>
            <Input
              id="current-password"
              type="password"
              className="mt-1.5"
              placeholder="••••••••"
              aria-invalid={!!errors.currentPassword}
              {...register("currentPassword")}
            />
            <FieldError>{errors.currentPassword?.message}</FieldError>
          </div>
          <div>
            <Label htmlFor="new-password">Mật khẩu mới</Label>
            <Input
              id="new-password"
              type="password"
              className="mt-1.5"
              placeholder="••••••••"
              aria-invalid={!!errors.newPassword}
              {...register("newPassword")}
            />
            <FieldError>{errors.newPassword?.message}</FieldError>
          </div>
          <div>
            <Label htmlFor="confirm-password">Xác nhận mật khẩu mới</Label>
            <Input
              id="confirm-password"
              type="password"
              className="mt-1.5"
              placeholder="••••••••"
              aria-invalid={!!errors.confirmPassword}
              {...register("confirmPassword")}
            />
            <FieldError>{errors.confirmPassword?.message}</FieldError>
          </div>
          <Button type="submit" className="w-full bg-accent hover:bg-accent-strong text-white" disabled={changePassword.isPending}>
            {changePassword.isPending ? "Đang xử lý..." : "Cập nhật mật khẩu"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ProfilePage() {
  const { user, logout, updateAvatar, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const savedAnswersQuery = useSavedAnswersQuery();
  const privacyQuery = usePrivacyConsentQuery();
  const sessionQuery = useSessionQuery();
  const updateConsent = useUpdatePrivacyConsentMutation();

  const isLoading = authLoading || savedAnswersQuery.isLoading || privacyQuery.isLoading || sessionQuery.isLoading;
  const isError = savedAnswersQuery.isError || privacyQuery.isError || sessionQuery.isError;

  async function handleLogout() {
    await logout();
    toast.success("Đã đăng xuất tài khoản.");
    navigate("/");
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 p-6 md:p-10">
        <ProfileSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="mx-auto max-w-2xl p-6 py-16 text-center md:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-danger/10 text-danger mb-4">
          <Shield size={28} />
        </div>
        <h2 className="text-xl font-bold text-text-primary">Không thể tải thông tin hồ sơ</h2>
        <p className="mt-1 text-sm text-text-secondary">Vui lòng kiểm tra kết nối và thử lại.</p>
        <Button
          variant="outline"
          className="mt-5"
          onClick={() => {
            savedAnswersQuery.refetch();
            privacyQuery.refetch();
            sessionQuery.refetch();
          }}
        >
          Thử lại
        </Button>
      </div>
    );
  }

  const answers = savedAnswersQuery.data ?? {};
  const primaryGoal = resolveOptionLabel("primaryGoal", answers.primaryGoal) ?? "Xây dựng sức mạnh";
  const secondaryGoal = resolveOptionLabel("secondaryGoal", answers.secondaryGoal) ?? "Cải thiện sức bền";
  const trainingPreferences = resolveMultiOptionLabels("trainingPreference", answers.trainingPreference);
  const trainingDays = typeof answers.trainingDaysPerWeek === "number" ? answers.trainingDaysPerWeek : 5;

  const consent = privacyQuery.data;
  const session = sessionQuery.data;

  // Days of week representation for schedule box
  const DAYS = [
    { label: "T2", active: true },
    { label: "T3", active: true },
    { label: "T4", active: trainingDays >= 3 },
    { label: "T5", active: trainingDays >= 4 },
    { label: "T6", active: trainingDays >= 5 },
    { label: "T7", active: trainingDays >= 6 },
    { label: "CN", active: trainingDays >= 7 },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 md:px-8 md:py-8 lg:px-10 lg:py-10">
      {/* 🌟 HERO PROFILE BANNER WITH GLOWING LIGHT BEAM AVATAR */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-surface via-surface-elevated to-accent-soft/20 p-6 md:p-8 shadow-elevated">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 h-48 w-48 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6 md:gap-8">
          {/* Avatar with Circular Wave Ripple & Intersecting Light Beam Aura */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <GlowingAvatar
              fallback={user.name?.[0] ?? "U"}
              src={user.avatarUrl}
              size="xl"
              isEditable={true}
              onAvatarChange={updateAvatar}
            />
            <span className="text-[11px] font-semibold text-text-secondary bg-surface/80 px-2.5 py-0.5 rounded-full border border-border">
              Nhấn vào ảnh để đổi avatar
            </span>
          </div>

          {/* User Info & Badges */}
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <h1 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight text-text-primary">
                {user.name}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-bold text-accent-strong border border-accent/20">
                <Sparkles size={13} />
                Chiến binh Calis • Level 3
              </span>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-text-secondary">
              <Mail size={15} />
              <span>{user.email}</span>
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 size={13} />
                Đã xác thực
              </span>
            </div>

            <p className="text-xs text-text-secondary/90 max-w-lg pt-1">
              Hành trình rèn luyện Calisthenics cá nhân hóa. Bứt phá giới hạn thể chất với các kỹ năng hít xà, chống đẩy và thăng bằng.
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-3">
              <EditProfileDialog currentName={user.name} />
              <ChangePasswordDialog />
            </div>
          </div>
        </div>

        {/* 4 Balanced Mini Stats Cards */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 border-t border-border/80 pt-6">
          <div className="rounded-xl bg-surface/60 p-3.5 border border-border/60 backdrop-blur-xs flex items-center gap-3">
            <ClayTileIcon icon={Flame} color="amber" size="sm" />
            <div>
              <div className="text-[11px] font-medium text-text-secondary">Chuỗi luyện tập</div>
              <div className="text-base font-bold text-text-primary">7 Ngày liên tiếp</div>
            </div>
          </div>

          <div className="rounded-xl bg-surface/60 p-3.5 border border-border/60 backdrop-blur-xs flex items-center gap-3">
            <ClayTileIcon icon={Dumbbell} color="sky" size="sm" />
            <div>
              <div className="text-[11px] font-medium text-text-secondary">Tần suất mục tiêu</div>
              <div className="text-base font-bold text-text-primary">{trainingDays} Buổi / Tuần</div>
            </div>
          </div>

          <div className="rounded-xl bg-surface/60 p-3.5 border border-border/60 backdrop-blur-xs flex items-center gap-3">
            <ClayTileIcon icon={Award} color="indigo" size="sm" />
            <div>
              <div className="text-[11px] font-medium text-text-secondary">Mục tiêu chính</div>
              <div className="truncate text-base font-bold text-text-primary">{primaryGoal}</div>
            </div>
          </div>

          <div className="rounded-xl bg-surface/60 p-3.5 border border-border/60 backdrop-blur-xs flex items-center gap-3">
            <ClayTileIcon icon={Shield} color="emerald" size="sm" />
            <div>
              <div className="text-[11px] font-medium text-text-secondary">Bảo mật tài khoản</div>
              <div className="text-base font-bold text-text-primary">Bảo vệ an toàn</div>
            </div>
          </div>
        </div>
      </div>

      {/* 📦 BALANCED 2-COLUMN BENTO GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* COLUMN 1: Personal Profile, Goals & Workout Habits */}
        <div className="space-y-6">
          {/* Card 1: Thông tin cá nhân */}
          <Card className="shadow-elevated hover:shadow-soft transition-shadow border-border/80">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center gap-3">
                <ClayTileIcon icon={User} color="sky" size="xs" />
                <div>
                  <CardTitle>Thông tin cá nhân</CardTitle>
                  <CardDescription>Chi tiết thông tin đăng ký tài khoản của bạn.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="mt-4 grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-background/50 p-3 border border-border/50">
                <div className="text-xs text-text-secondary font-medium">Họ và tên</div>
                <div className="mt-1 text-sm font-bold text-text-primary">{user.name}</div>
              </div>
              <div className="rounded-lg bg-background/50 p-3 border border-border/50">
                <div className="text-xs text-text-secondary font-medium">Email đăng ký</div>
                <div className="mt-1 text-sm font-bold text-text-primary truncate">{user.email}</div>
              </div>
              <Link
                to="/subscription"
                className="group flex items-center justify-between rounded-lg bg-sky-500/10 p-3 border border-sky-500/20 hover:bg-sky-500/15 transition-all"
              >
                <div>
                  <div className="text-xs text-sky-700 dark:text-sky-300 font-medium flex items-center gap-1.5">
                    <ClayTileIcon icon={Crown} color="amber" size="xs" />
                    <span>Gói Hội Viên</span>
                  </div>
                  <div className="mt-1 text-sm font-black text-text-primary group-hover:text-sky-600 transition-colors">
                    Calis Premium (24 ngày còn lại)
                  </div>
                </div>
                <span className="text-xs font-bold text-sky-600 group-hover:translate-x-0.5 transition-transform">
                  Gia hạn →
                </span>
              </Link>
              <div className="rounded-lg bg-background/50 p-3 border border-border/50">
                <div className="text-xs text-text-secondary font-medium">Trạng thái hồ sơ</div>
                <div className="mt-1 text-sm font-bold text-emerald-600 flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Hoạt động
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Mục tiêu rèn luyện */}
          <Card className="shadow-elevated hover:shadow-soft transition-shadow border-border/80">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center gap-3">
                <ClayTileIcon icon={Target} color="rose" size="xs" />
                <div>
                  <CardTitle>Mục tiêu rèn luyện</CardTitle>
                  <CardDescription>Định hướng bài tập dựa trên kết quả khảo sát.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-background/60 p-3.5 border border-border/50">
                <div>
                  <div className="text-xs font-medium text-text-secondary">Mục tiêu chính</div>
                  <div className="mt-0.5 text-sm font-bold text-text-primary">{primaryGoal}</div>
                </div>
                <Badge variant="accent" className="font-semibold">Trọng tâm</Badge>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-background/60 p-3.5 border border-border/50">
                <div>
                  <div className="text-xs font-medium text-text-secondary">Mục tiêu phụ</div>
                  <div className="mt-0.5 text-sm font-bold text-text-primary">{secondaryGoal}</div>
                </div>
                <Badge variant="outline" className="font-semibold">Hỗ trợ</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Thói quen & Lịch trình tập luyện */}
          <Card className="shadow-elevated hover:shadow-soft transition-shadow border-border/80">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center gap-3">
                <ClayTileIcon icon={Calendar} color="indigo" size="xs" />
                <div>
                  <CardTitle>Lịch trình & Thói quen</CardTitle>
                  <CardDescription>Thời gian và môi trường bạn yêu thích.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="mt-4 space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs text-text-secondary mb-2">
                  <span className="font-medium">Lịch tập hàng tuần:</span>
                  <span className="font-bold text-text-primary">{trainingDays} ngày / tuần</span>
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {DAYS.map((day, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col items-center justify-center rounded-lg py-2 border text-center transition-colors ${
                        day.active
                          ? "bg-accent-soft text-accent-strong border-accent/30 font-bold shadow-2xs"
                          : "bg-background/40 text-text-secondary/50 border-border/40 font-medium"
                      }`}
                    >
                      <span className="text-xs">{day.label}</span>
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-border/50">
                <div className="text-xs text-text-secondary font-medium mb-2">Thời điểm & Địa điểm:</div>
                <div className="flex flex-wrap gap-2">
                  {trainingPreferences.length === 0 ? (
                    <span className="text-xs text-text-secondary">Chưa chọn thời điểm / địa điểm</span>
                  ) : (
                    trainingPreferences.map((label) => (
                      <Badge key={label} variant="outline" className="px-3 py-1 font-medium bg-surface">
                        {label}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* COLUMN 2: Fitness Summary, Account & Privacy */}
        <div className="space-y-6">
          {/* Card 4: Tổng quan đánh giá thể lực */}
          <Card className="shadow-elevated hover:shadow-soft transition-shadow border-border/80">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <ClayTileIcon icon={Activity} color="emerald" size="xs" />
                  <div>
                    <CardTitle>Chỉ số thể lực</CardTitle>
                    <CardDescription>Đánh giá năng lực vận động hiện tại.</CardDescription>
                  </div>
                </div>
                <Link to="/assessment">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs text-accent-strong hover:bg-accent-soft">
                    Đánh giá lại
                    <ArrowRight size={13} />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="mt-4 space-y-3.5">
              <div>
                <div className="flex justify-between text-xs font-medium text-text-secondary mb-1">
                  <span>Sức mạnh thân trên (Push / Pull)</span>
                  <span className="font-bold text-accent-strong">75%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-background overflow-hidden border border-border/40">
                  <div className="h-full rounded-full bg-gradient-to-r from-accent to-lime-500 w-[75%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-text-secondary mb-1">
                  <span>Sức bền cơ bắp (Muscle Endurance)</span>
                  <span className="font-bold text-sky-600">80%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-background overflow-hidden border border-border/40">
                  <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-600 w-[80%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-text-secondary mb-1">
                  <span>Sức mạnh Core & Thắt lưng</span>
                  <span className="font-bold text-amber-600">65%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-background overflow-hidden border border-border/40">
                  <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 w-[65%]" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 5: Tài khoản & Phiên đăng nhập */}
          <Card className="shadow-elevated hover:shadow-soft transition-shadow border-border/80">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center gap-3">
                <ClayTileIcon icon={Shield} color="purple" size="xs" />
                <div>
                  <CardTitle>Tài khoản & Thiết bị</CardTitle>
                  <CardDescription>Bảo mật đăng nhập và phiên làm việc.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-background/60 p-3.5 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-text-primary shadow-2xs border border-border/60">
                    <Laptop size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-text-primary">{session?.device ?? "Chrome trên Windows"}</div>
                    <div className="text-xs text-text-secondary">Phiên đăng nhập hiện tại</div>
                  </div>
                </div>
                <Badge variant="accent" className="flex items-center gap-1 font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {session?.lastActiveLabel ?? "Đang hoạt động"}
                </Badge>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-background/60 p-3.5 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-text-primary shadow-2xs border border-border/60">
                    <KeyRound size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-text-primary">Mật khẩu tài khoản</div>
                    <div className="text-xs text-text-secondary">Đã thay đổi gần đây</div>
                  </div>
                </div>
                <ChangePasswordDialog />
              </div>
            </CardContent>
          </Card>

          {/* Card 6: Quyền riêng tư & Đồng ý */}
          <Card className="shadow-elevated hover:shadow-soft transition-shadow border-border/80">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600">
                  <Zap size={18} />
                </div>
                <div>
                  <CardTitle>Quyền riêng tư & Đồng ý</CardTitle>
                  <CardDescription>Kiểm soát cách nền tảng hỗ trợ dữ liệu của bạn.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="mt-4 space-y-3.5">
              <label className="flex items-start gap-3.5 rounded-xl p-3 bg-background/50 border border-border/40 hover:bg-background/80 transition cursor-pointer">
                <Checkbox
                  checked={consent?.dataProcessing ?? true}
                  onCheckedChange={(checked) => updateConsent.mutate({ dataProcessing: checked === true })}
                  className="mt-0.5"
                />
                <span className="select-none">
                  <span className="block text-sm font-bold text-text-primary">Xử lý dữ liệu luyện tập</span>
                  <span className="block text-xs text-text-secondary mt-0.5">
                    Cho phép Calis sử dụng tiến độ tập luyện để tối ưu hóa lộ trình cá nhân hóa.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3.5 rounded-xl p-3 bg-background/50 border border-border/40 hover:bg-background/80 transition cursor-pointer">
                <Checkbox
                  checked={consent?.marketingUpdates ?? false}
                  onCheckedChange={(checked) => updateConsent.mutate({ marketingUpdates: checked === true })}
                  className="mt-0.5"
                />
                <span className="select-none">
                  <span className="block text-sm font-bold text-text-primary">Nhận thông báo & cập nhật kỹ năng</span>
                  <span className="block text-xs text-text-secondary mt-0.5">
                    Nhận email về mẹo tập Calisthenics mới và bài hướng dẫn hàng tuần.
                  </span>
                </span>
              </label>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 🔴 DANGER ZONE / LOGOUT */}
      <div className="pt-2 flex justify-end">
        <Button
          variant="outline"
          onClick={handleLogout}
          className="gap-2 text-danger hover:bg-danger/10 hover:text-danger hover:border-danger/40 border-border/80 px-6"
        >
          <LogOut size={16} />
          Đăng xuất tài khoản
        </Button>
      </div>
    </div>
  );
}
