import { Outlet } from "react-router-dom";

export default function OnboardingLayout() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-5 py-10 md:py-16">
        <div className="font-display text-xl font-bold tracking-[-.02em] text-text-primary">
          CALIS<span className="text-accent">.</span>
        </div>
        <div className="mt-10">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
