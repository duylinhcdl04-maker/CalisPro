import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useCoachProfile, useCoachSettings } from "../hooks";
import { ErrorState, PageHeader, PageSkeleton, Segmented, type SegmentOption } from "../components/ui";
import { ProfileOverview } from "../components/profile/ProfileOverview";
import { EditProfileModal } from "../components/profile/EditProfileModal";
import { NotificationPrefsPanel } from "../components/profile/NotificationPrefsPanel";
import { AvailabilityPanel } from "../components/profile/AvailabilityPanel";
import { PasswordPanel } from "../components/profile/PasswordPanel";
import { SecurityPanel } from "../components/profile/SecurityPanel";

type Tab = "profile" | "settings";
const TABS: SegmentOption<Tab>[] = [
  { value: "profile", label: "Hồ sơ" },
  { value: "settings", label: "Cài đặt" },
];

function ProfileTab() {
  const profile = useCoachProfile();
  const [editing, setEditing] = useState(false);
  if (profile.isLoading) return <PageSkeleton kpis={0} />;
  if (profile.isError || !profile.data) return <ErrorState onRetry={() => profile.refetch()} retrying={profile.isRefetching} />;
  return (
    <>
      <ProfileOverview profile={profile.data} onEdit={() => setEditing(true)} />
      <EditProfileModal open={editing} onOpenChange={setEditing} profile={profile.data} />
    </>
  );
}

function SettingsTab() {
  const settings = useCoachSettings();
  if (settings.isLoading) return <PageSkeleton kpis={0} />;
  if (settings.isError || !settings.data) return <ErrorState onRetry={() => settings.refetch()} retrying={settings.isRefetching} />;
  const { notifications, availability, security } = settings.data;
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="space-y-6">
        <div className="animate-rise">
          <NotificationPrefsPanel prefs={notifications} />
        </div>
        <div className="animate-rise [animation-delay:80ms]">
          <SecurityPanel security={security} />
        </div>
      </div>
      <div className="space-y-6">
        <div className="animate-rise [animation-delay:40ms]">
          <AvailabilityPanel slots={availability} />
        </div>
        <div className="animate-rise [animation-delay:120ms]">
          <PasswordPanel />
        </div>
      </div>
    </div>
  );
}

export default function CoachProfilePage() {
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get("tab") === "settings" ? "settings" : "profile";

  function changeTab(next: Tab) {
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        if (next === "settings") p.set("tab", "settings");
        else p.delete("tab");
        return p;
      },
      { replace: true }
    );
  }

  return (
    <div>
      <PageHeader
        title={tab === "settings" ? "Cài đặt tài khoản" : "Hồ sơ huấn luyện viên"}
        description={tab === "settings" ? "Thông báo, lịch rảnh, mật khẩu và bảo mật." : "Thông tin chuyên môn hiển thị với học viên."}
        actions={<Segmented options={TABS} value={tab} onChange={changeTab} ariaLabel="Hồ sơ và cài đặt" />}
      />
      <div role="tabpanel" aria-label={tab === "settings" ? "Cài đặt" : "Hồ sơ"}>
        {tab === "settings" ? <SettingsTab /> : <ProfileTab />}
      </div>
    </div>
  );
}
