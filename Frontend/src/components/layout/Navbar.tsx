import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const NAV_LINKS = [
  { label: "Cách hoạt động", href: "#cach-hoat-dong" },
  { label: "Kỹ năng", href: "#ky-nang" },
  { label: "Giới thiệu", href: "#danh-gia-khoa-hoc" },
];

export default function Navbar() {
  const navigate = useNavigate();

  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between px-5 md:px-10">
        <a href="/" className="inline-flex items-center gap-2 font-display text-xl font-bold tracking-[-0.03em] text-white">
          CALIS
          <span className="h-1.5 w-1.5 rounded-full bg-[#c084fc]" />
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-white/60 transition hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/login")}
            className="hidden text-sm font-semibold text-white/60 transition hover:text-white sm:block"
          >
            Đăng nhập
          </button>

          <button
            onClick={() => navigate("/register")}
            className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#c026d3] px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 active:scale-[0.98]"
          >
            Bắt đầu ngay
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
