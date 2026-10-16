import { useState } from "react";
import { createPortal } from "react-dom";
import {
  Users,
  Search,
  Filter,
  Download,
  Plus,
  MoreVertical,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Eye,
  UserX,
  UserCheck,
  Flame,
  Dumbbell,
} from "lucide-react";
import { toast } from "sonner";
import { ADMIN_USERS_LIST, type AdminUserItem } from "../../services/mock/adminMockData";
import { AdminPageHeader } from "../../components/admin/layout/AdminPageHeader";
import { Button } from "../../components/ui/Button";
import { GlowingAvatar } from "../../components/ui/GlowingAvatar";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserItem[]>(ADMIN_USERS_LIST);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchLevel = filterLevel === "ALL" || u.fitnessLevel === filterLevel;
    const matchStatus = filterStatus === "ALL" || u.status === filterStatus;
    return matchSearch && matchLevel && matchStatus;
  });

  function handleToggleUserStatus(user: AdminUserItem) {
    const newStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
    );
    if (newStatus === "SUSPENDED") {
      toast.warning(`Đã tạm khóa tài khoản của ${user.name}`);
    } else {
      toast.success(`Đã kích hoạt lại tài khoản ${user.name}`);
    }
  }

  function handleExportUsers() {
    toast.success("Đang xuất danh sách người dùng CalisHealth (CSV)");
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <AdminPageHeader
        title="Quản lý Người dùng (User Management)"
        description="Quản lý thông tin học viên, cấp độ thể lực, tình trạng hội viên và tiến độ luyện tập cá nhân."
        badge={`${users.length} tài khoản`}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportUsers}
              className="text-xs font-bold gap-1.5 border-border hover:border-accent"
            >
              <Download size={14} />
              Xuất danh sách
            </Button>
            <Button
              size="sm"
              onClick={() => toast.info("Tính năng tạo tài khoản học viên thủ công")}
              className="bg-accent hover:bg-accent-strong text-white font-bold text-xs gap-1.5"
            >
              <Plus size={15} />
              Thêm Người dùng
            </Button>
          </>
        }
      />

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-border/80 bg-surface p-4 shadow-elevated">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên, email..."
            className="w-full rounded-xl border border-border bg-background/50 pl-9 pr-3 py-2 text-xs text-text-primary placeholder:text-text-secondary/60 focus:border-accent focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Filter Level */}
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="rounded-xl border border-border bg-background/50 px-3 py-2 text-xs font-semibold text-text-primary focus:border-accent focus:outline-none"
          >
            <option value="ALL">Tất cả cấp độ</option>
            <option value="Beginner">Beginner (Cơ bản)</option>
            <option value="Intermediate">Intermediate (Trung cấp)</option>
            <option value="Advanced">Advanced (Nâng cao)</option>
          </select>

          {/* Filter Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-border bg-background/50 px-3 py-2 text-xs font-semibold text-text-primary focus:border-accent focus:outline-none"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="INACTIVE">Không hoạt động</option>
            <option value="SUSPENDED">Đã tạm khóa</option>
          </select>
        </div>
      </div>

      {/* USERS DATA TABLE */}
      <div className="rounded-3xl border border-border/80 bg-surface shadow-elevated overflow-hidden">
        <div className="">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-elevated border-b border-border text-[11px] font-extrabold uppercase tracking-wider text-text-secondary">
              <tr>
                <th className="py-3.5 px-4">Học viên</th>
                <th className="py-3.5 px-4">Cấp độ thể lực</th>
                <th className="py-3.5 px-4">Mục tiêu chính</th>
                <th className="py-3.5 px-4">Gói hội viên</th>
                <th className="py-3.5 px-4">Tiến độ tập</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-text-secondary">
                    Không tìm thấy người dùng phù hợp.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-accent-soft/20 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <GlowingAvatar
                          size="sm"
                          fallback={user.name[0]}
                          src={user.avatarUrl}
                          isEditable={false}
                        />
                        <div>
                          <div className="font-bold text-text-primary">{user.name}</div>
                          <div className="text-[11px] text-text-secondary">{user.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${user.fitnessLevel === "Beginner"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                            : user.fitnessLevel === "Intermediate"
                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                              : "bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30"
                          }`}
                      >
                        {user.fitnessLevel}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-text-primary">
                      {user.primaryGoal}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="rounded-md bg-accent-soft px-2 py-0.5 text-[11px] font-bold text-accent-strong border border-accent/20">
                        {user.subscriptionPlan}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div className="font-bold text-text-primary flex items-center gap-1.5">
                          <Dumbbell size={13} className="text-accent" />
                          {user.completedWorkouts} buổi hoàn thành
                        </div>
                        <div className="text-[10px] text-text-secondary flex items-center gap-1">
                          <Flame size={12} className="text-amber-500" />
                          Streak: {user.streakDays} ngày
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold flex items-center gap-1 w-fit ${user.status === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                            : user.status === "SUSPENDED"
                              ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20"
                              : "bg-surface-elevated text-text-secondary border border-border"
                          }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${user.status === "ACTIVE" ? "bg-emerald-500" : "bg-rose-500"}`} />
                        {user.status === "ACTIVE" ? "Hoạt động" : user.status === "SUSPENDED" ? "Đã khóa" : "Tạm dừng"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedUser(user)}
                          className="rounded-lg p-1.5 text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                          title="Xem hồ sơ chi tiết"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleUserStatus(user)}
                          className={`rounded-lg p-1.5 transition-colors ${user.status === "ACTIVE"
                              ? "text-rose-500 hover:bg-rose-500/10"
                              : "text-emerald-600 hover:bg-emerald-500/10"
                            }`}
                          title={user.status === "ACTIVE" ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                        >
                          {user.status === "ACTIVE" ? <UserX size={15} /> : <UserCheck size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* USER DETAIL MODAL DIALOG */}
      {selectedUser && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-surface p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-border/70 pb-4">
              <div className="flex items-center gap-3">
                <GlowingAvatar
                  size="md"
                  fallback={selectedUser.name[0]}
                  src={selectedUser.avatarUrl}
                  isEditable={false}
                />
                <div>
                  <h3 className="font-display text-lg font-bold text-text-primary">{selectedUser.name}</h3>
                  <p className="text-xs text-text-secondary">{selectedUser.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="rounded-lg p-1.5 text-text-secondary hover:bg-surface-elevated hover:text-text-primary cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-background/50 p-3 border border-border/60">
                <span className="text-[10px] uppercase font-bold text-text-secondary">Trình độ</span>
                <div className="font-bold text-text-primary mt-0.5">{selectedUser.fitnessLevel}</div>
              </div>
              <div className="rounded-xl bg-background/50 p-3 border border-border/60">
                <span className="text-[10px] uppercase font-bold text-text-secondary">Gói Hội Viên</span>
                <div className="font-bold text-accent-strong mt-0.5">{selectedUser.subscriptionPlan}</div>
              </div>
              <div className="rounded-xl bg-background/50 p-3 border border-border/60">
                <span className="text-[10px] uppercase font-bold text-text-secondary">Buổi tập hoàn thành</span>
                <div className="font-bold text-text-primary mt-0.5">{selectedUser.completedWorkouts} buổi</div>
              </div>
              <div className="rounded-xl bg-background/50 p-3 border border-border/60">
                <span className="text-[10px] uppercase font-bold text-text-secondary">Chuỗi ngày tập (Streak)</span>
                <div className="font-bold text-amber-600 mt-0.5">{selectedUser.streakDays} ngày</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/70">
              <Button variant="outline" size="sm" onClick={() => setSelectedUser(null)}>
                Đóng
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  handleToggleUserStatus(selectedUser);
                  setSelectedUser(null);
                }}
                className={`text-xs ${selectedUser.status === "ACTIVE"
                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                    : "bg-accent hover:bg-accent-strong text-white"
                  }`}
              >
                {selectedUser.status === "ACTIVE" ? "Khóa tài khoản" : "Kích hoạt lại"}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
