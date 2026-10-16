import { ArrowRight, Flame, Target } from "lucide-react";

interface ResultStepProps {
  goal: string;
  experience: string;
}

const PRIORITIES = ["Xây dựng khả năng kéo", "Cải thiện khả năng kiểm soát vận động", "Học về progressive overload"];

export default function ResultStep({ goal, experience }: ResultStepProps) {
  return (
    <div>
      <div className="mb-10 flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-[.2em] text-[#78945b]">Hoàn tất đánh giá</div>
        <div className="rounded-full bg-[#e9eedf] px-3 py-1 text-xs font-semibold text-[#536b40]">Đã tạo hồ sơ</div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <div className="rounded-[28px] bg-[#17201a] p-7 text-white md:p-9">
          <div className="text-xs uppercase tracking-[.18em] text-white/40">Lộ trình hiện tại của bạn</div>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-[-.04em]">{goal}</h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-white/55">
            Dựa trên câu trả lời của bạn, giai đoạn đầu tiên nên xây dựng các nền tảng cần thiết cho mục tiêu, đồng
            thời thiết lập một nền tảng luyện tập vững chắc.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-2">
            {[
              ["Kinh nghiệm", experience],
              ["Sự sẵn sàng", "Đang phát triển"],
              ["Kiến thức", "Đang xây dựng"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-white/5 p-3">
                <div className="text-[10px] uppercase tracking-wider text-white/35">{label}</div>
                <div className="mt-2 text-xs font-semibold">{value}</div>
              </div>
            ))}
          </div>
          <button className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#17201a]">
            Xem lộ trình luyện tập của tôi <ArrowRight size={16} />
          </button>
        </div>
        <div className="space-y-4">
          <div className="rounded-[28px] border border-black/6 bg-white p-6">
            <div className="flex items-center gap-3">
              <Target className="text-[#78945b]" size={20} />
              <div className="font-semibold">Ưu tiên đầu tiên của bạn</div>
            </div>
            <div className="mt-5 space-y-3">
              {PRIORITIES.map((priority, i) => (
                <div key={priority} className="flex items-center gap-3 rounded-xl bg-[#f6f7f2] p-3 text-sm">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#e9eedf] text-xs font-bold text-[#5d7547]">
                    {i + 1}
                  </span>
                  {priority}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[28px] border border-black/6 bg-white p-6">
            <div className="flex items-center gap-3">
              <Flame className="text-[#78945b]" size={20} />
              <div className="font-semibold">Giai đoạn đầu được đề xuất</div>
            </div>
            <div className="mt-2 text-2xl font-bold">Nền tảng · 4 tuần</div>
            <div className="mt-1 text-xs leading-5 text-black/40">
              Đây là giai đoạn khởi đầu. Lần đánh giá tiếp theo có thể thay đổi lộ trình khi khả năng của bạn cải
              thiện.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
