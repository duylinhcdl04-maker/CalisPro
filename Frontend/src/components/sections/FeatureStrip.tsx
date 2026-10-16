import { Dumbbell, Compass, HeartPulse, Infinity as InfinityIcon } from "lucide-react";

const FEATURES = [
  { icon: Dumbbell, label: "Sức mạnh toàn thân" },
  { icon: Compass, label: "Thăng bằng và kiểm soát" },
  { icon: HeartPulse, label: "Sức khoẻ bền vững" },
  { icon: InfinityIcon, label: "Không cần gym" },
];

function TickerRow() {
  return (
    <>
      {FEATURES.map((feature) => {
        const Icon = feature.icon;
        return (
          <div key={feature.label} className="flex items-center gap-3 whitespace-nowrap px-8">
            <Icon size={16} className="text-[#c084fc]" />
            <span className="text-sm font-semibold uppercase tracking-[.1em] text-white/50">{feature.label}</span>
            <span className="text-white/20">+</span>
          </div>
        );
      })}
    </>
  );
}

export default function FeatureStrip() {
  return (
    <section className="border-y border-white/10 bg-[#0a0712] py-5">
      <div className="flex overflow-hidden">
        <div className="flex shrink-0 animate-marquee">
          <TickerRow />
          <TickerRow />
        </div>
      </div>
    </section>
  );
}
