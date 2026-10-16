import { Facebook, Instagram, Youtube } from "lucide-react";

const LINK_GROUPS = [
  {
    heading: "Sản phẩm",
    links: [
      { label: "Đánh giá thể lực", href: "#danh-gia-khoa-hoc" },
      { label: "Lộ trình kỹ năng", href: "#ky-nang" },
      { label: "Thư viện bài tập", href: "#" },
    ],
  },
  {
    heading: "Công ty",
    links: [
      { label: "Cơ sở khoa học", href: "#danh-gia-khoa-hoc" },
      { label: "Về Calis", href: "#" },
    ],
  },
  {
    heading: "Hỗ trợ",
    links: [
      { label: "Câu hỏi thường gặp", href: "#" },
      { label: "Liên hệ", href: "#" },
    ],
  },
];

const SOCIALS = [
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Youtube, href: "#", label: "YouTube" },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0a0712] text-white/60">
      <div className="mx-auto max-w-[1400px] px-5 py-16 md:px-10">
        <div className="grid gap-12 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <div className="inline-flex items-center gap-2 font-display text-lg font-bold tracking-[-.02em] text-white">
              CALIS
              <span className="h-1.5 w-1.5 rounded-full bg-[#c084fc]" />
            </div>
            <p className="mt-4 max-w-xs text-sm leading-6 text-white/40">
              Lộ trình calisthenics cá nhân hóa theo kinh nghiệm, mục tiêu và thể lực của bạn.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {SOCIALS.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/50 transition hover:border-white/30 hover:text-white"
                  >
                    <Icon size={16} />
                  </a>
                );
              })}
            </div>
          </div>

          {LINK_GROUPS.map((group) => (
            <div key={group.heading}>
              <div className="text-xs font-semibold uppercase tracking-[.16em] text-white/35">{group.heading}</div>
              <ul className="mt-5 space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-white/60 transition hover:text-white">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-8 text-xs text-white/35 md:flex-row md:items-center md:justify-between">
          <div>© {new Date().getFullYear()} Calis. Toàn bộ nội dung chỉ mang tính hướng dẫn tập luyện.</div>
          <div className="flex gap-6">
            <a href="#" className="transition hover:text-white/60">
              Điều khoản
            </a>
            <a href="#" className="transition hover:text-white/60">
              Bảo mật
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
