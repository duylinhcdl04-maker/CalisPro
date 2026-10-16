import { Suspense, useCallback, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { CoachSidebar } from "./CoachSidebar";
import { CoachTopbar } from "./CoachTopbar";
import { NotificationLive } from "../../../notifications/NotificationLive";
import { PageSkeleton } from "../ui";

const COLLAPSE_KEY = "coach_sidebar_collapsed";

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "true";
  } catch {
    return false;
  }
}

export default function CoachLayout() {
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, String(!prev));
      } catch {
        /* ignore */
      }
      return !prev;
    });
  }, []);

  // Tablet widths start collapsed so content keeps its room.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px) and (max-width: 1279px)");
    if (mq.matches) setCollapsed(true);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleCollapsed();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleCollapsed]);

  useEffect(() => {
    setMobileOpen(false);
    document.getElementById("coach-main")?.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="flex min-h-[100dvh] bg-background text-text-primary">
      <a href="#coach-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-xl focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white">
        Bỏ qua tới nội dung
      </a>
      <CoachSidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
      <div className="flex min-w-0 flex-1 flex-col">
        <NotificationLive area="coach" />
        <CoachTopbar onOpenMobile={() => setMobileOpen(true)} />
        <main id="coach-main" className="flex-1">
          <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <Suspense fallback={<PageSkeleton />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
