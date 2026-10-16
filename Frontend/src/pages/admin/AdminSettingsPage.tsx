import { useState } from "react";
import {
  ShieldCheck,
  Users,
  Key,
  Lock,
  FileCode,
  Check,
  X,
  Sparkles,
  Save,
  Server,
  Database,
} from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "../../components/admin/layout/AdminPageHeader";
import { Button } from "../../components/ui/Button";

interface PermissionRow {
  module: string;
  superAdmin: boolean;
  admin: boolean;
  coach: boolean;
  contentManager: boolean;
}

const PERMISSION_MATRIX: PermissionRow[] = [
  { module: "Quản lý Người dùng (Users)", superAdmin: true, admin: true, coach: true, contentManager: false },
  { module: "Quản lý Huấn luyện viên (Coaches)", superAdmin: true, admin: true, coach: false, contentManager: false },
  { module: "Thư viện Động tác (Exercises)", superAdmin: true, admin: true, coach: true, contentManager: true },
  { module: "Giáo án Luyện tập (Workout Plans)", superAdmin: true, admin: true, coach: true, contentManager: true },
  { module: "Đánh giá & Thể chất (Assessments)", superAdmin: true, admin: true, coach: true, contentManager: false },
  { module: "Hệ thống AI Coaching & Pose Rules", superAdmin: true, admin: true, coach: false, contentManager: false },
  { module: "Gói Hội viên & Doanh thu (Subscriptions)", superAdmin: true, admin: true, coach: false, contentManager: false },
  { module: "Cài đặt Hệ thống & Bảo mật (System & Security)", superAdmin: true, admin: false, coach: false, contentManager: false },
];

export default function AdminSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);

  function handleSaveSettings() {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Đã lưu cấu hình phân quyền và bảo mật thành công!");
    }, 800);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <AdminPageHeader
        title="Cài đặt Hệ thống & Phân quyền (Settings & RBAC)"
        description="Quản lý ma trận phân quyền người dùng (Role-Based Access Control), nhật ký kiểm toán hệ thống và cấu hình kết nối API."
        badge="Security Shield Active"
        actions={
          <Button
            size="sm"
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="bg-accent hover:bg-accent-strong text-white font-bold text-xs gap-1.5 shadow-md"
          >
            <Save size={14} />
            {isSaving ? "Đang lưu..." : "Lưu Cấu hình"}
          </Button>
        }
      />

      {/* RBAC PERMISSIONS MATRIX */}
      <div className="rounded-3xl border border-border/80 bg-surface shadow-elevated p-6 space-y-4">
        <div className="border-b border-border/70 pb-3">
          <h3 className="font-display text-base font-bold text-text-primary flex items-center gap-2">
            <Key size={18} className="text-accent" />
            Ma trận Phân quyền Vai trò (RBAC Permission Matrix)
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Quy định quyền Xem, Thêm, Sửa, Xóa trên từng phân hệ của CalisHealth.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-elevated border-b border-border text-[11px] font-extrabold uppercase tracking-wider text-text-secondary">
              <tr>
                <th className="py-3 px-4">Phân hệ Quản trị</th>
                <th className="py-3 px-4 text-center">Super Admin</th>
                <th className="py-3 px-4 text-center">Admin</th>
                <th className="py-3 px-4 text-center">Coach (HLV)</th>
                <th className="py-3 px-4 text-center">Content Manager</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {PERMISSION_MATRIX.map((row, idx) => (
                <tr key={idx} className="hover:bg-accent-soft/20 transition-colors">
                  <td className="py-3 px-4 font-bold text-text-primary">{row.module}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                      <Check size={13} className="stroke-[3]" />
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {row.admin ? (
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                        <Check size={13} className="stroke-[3]" />
                      </span>
                    ) : (
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-border text-text-secondary">
                        <X size={13} />
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {row.coach ? (
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                        <Check size={13} className="stroke-[3]" />
                      </span>
                    ) : (
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-border text-text-secondary">
                        <X size={13} />
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {row.contentManager ? (
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                        <Check size={13} className="stroke-[3]" />
                      </span>
                    ) : (
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-border text-text-secondary">
                        <X size={13} />
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SYSTEM ARCHITECTURE INFO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border/80 bg-surface p-5 shadow-elevated space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
            <Server size={16} className="text-accent" />
            Backend REST API (Spring Boot Ready)
          </div>
          <p className="text-xs text-text-secondary">Endpoint: `/api/v1/admin/*` • Trạng thái: Mock Service Connected</p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-surface p-5 shadow-elevated space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
            <Database size={16} className="text-accent" />
            Cơ sở Dữ liệu (MySQL & Cache)
          </div>
          <p className="text-xs text-text-secondary">Phiên bản schema: v2.4 • Đã đồng bộ 15 modules</p>
        </div>
      </div>
    </div>
  );
}
