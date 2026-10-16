import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Bot, CheckCircle2, HeartPulse, ListChecks, Sparkles } from "lucide-react";
import { levelName } from "../../features/level/levelLabels";
import { errorMessage, useChoosePlan, usePlanChoice, useSetFocus, type TrainingFocus } from "../../features/plan-choice/api";

const FOCUS: { key: TrainingFocus; label: string; hint: string; icon: typeof HeartPulse }[] = [
  { key: "HEALTH", label: "Sức khỏe", hint: "Nền tảng đẩy, kéo, chân, core và linh hoạt.", icon: HeartPulse },
  { key: "SKILL", label: "Kỹ năng", hint: "Hướng tới các kỹ năng như handstand, muscle-up.", icon: Sparkles },
];

/**
 * Bước quyết định sau khi có level: tập theo giáo án của hệ thống (engine dựng theo level) hay tự chọn một giáo án có sẵn.
 * Đổi được bất cứ lúc nào. "Hướng tập" chỉ dùng để gợi ý bài tập, không đổi level.
 */
export default function PlanChoicePage() {
  const navigate = useNavigate();
  const choice = usePlanChoice();
  const choose = useChoosePlan();
  const setFocus = useSetFocus();

  if (choice.isLoading) return <div className="mx-auto max-w-4xl p-6 text-sm text-text-secondary">Đang tải...</div>;
  if (!choice.data) return <div className="mx-auto max-w-4xl p-6 text-sm text-text-secondary">Không tải được thông tin. Vui lòng thử lại.</div>;

  const s = choice.data;
  const hasLevel = !!s.levelCode;
  const current = s.effectiveMode;

  function useSystem() {
    choose.mutate({ mode: "SYSTEM", focus: s.trainingFocus }, {
      onSuccess: () => { toast.success("Đã tạo chu kỳ tập theo level của bạn"); navigate("/roadmap"); },
      onError: (e) => toast.error(errorMessage(e, "Không tạo được chu kỳ tập. Thử lại sau.")),
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-5 sm:p-8">
      <header>
        <h1 className="font-display text-2xl font-black tracking-tight text-text-primary sm:text-3xl">Chọn cách tập của bạn</h1>
        <p className="mt-1 text-sm text-text-secondary">
          {hasLevel ? <>Level hiện tại của bạn: <b className="text-text-primary">{s.levelCode}{levelName(s.levelCode!) ? ` · ${levelName(s.levelCode!)}` : ""}</b>. </> : null}
          Bạn có thể đổi cách tập bất cứ lúc nào.
        </p>
      </header>

      <section aria-label="Hướng tập" className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-sm font-black text-text-primary">Bạn muốn cải thiện điều gì?</h2>
        <p className="mt-0.5 text-xs text-text-secondary">Hệ thống dùng lựa chọn này để gợi ý bài tập. Level của bạn không thay đổi theo lựa chọn.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {FOCUS.map(({ key, label, hint, icon: Icon }) => {
            const on = s.trainingFocus === key;
            return (
              <button key={key} type="button" aria-pressed={on} disabled={setFocus.isPending} onClick={() => setFocus.mutate(on ? null : key)}
                className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${on ? "border-accent bg-accent/10" : "border-border hover:border-accent/50"}`}>
                <Icon size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden />
                <span><span className="block text-sm font-bold text-text-primary">{label}</span><span className="block text-xs text-text-secondary">{hint}</span></span>
                {on && <CheckCircle2 size={16} className="ml-auto shrink-0 text-accent" aria-label="Đang chọn" />}
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className={`flex flex-col rounded-2xl border p-5 ${current === "SYSTEM" ? "border-accent bg-accent/5" : "border-border bg-surface"}`}>
          <Bot size={22} className="text-accent" aria-hidden />
          <h2 className="mt-2 text-base font-black text-text-primary">Tập theo giáo án của hệ thống</h2>
          <p className="mt-1 flex-1 text-sm text-text-secondary">
            Hệ thống dựng chu kỳ tập theo level và mục tiêu của bạn, rồi tự cập nhật khi level thay đổi. Chỉ khi tập theo giáo án này bạn mới được xét nâng hoặc hạ level.
          </p>
          {!hasLevel && <p className="mt-2 text-xs font-bold text-amber-500">Cần làm bài đánh giá để có level trước. <Link to="/onboarding" className="underline">Làm bài đánh giá</Link></p>}
          <button type="button" disabled={!hasLevel || choose.isPending} onClick={useSystem}
            className="mt-4 rounded-xl bg-accent px-4 py-2.5 text-sm font-black text-white shadow-md transition hover:opacity-90 disabled:opacity-50">
            {current === "SYSTEM" ? "Tạo lại chu kỳ theo level" : "Chọn cách này"}
          </button>
        </section>

        <section className={`flex flex-col rounded-2xl border p-5 ${current === "SELF" ? "border-accent bg-accent/5" : "border-border bg-surface"}`}>
          <ListChecks size={22} className="text-accent" aria-hidden />
          <h2 className="mt-2 text-base font-black text-text-primary">Tự tạo danh sách bài tập</h2>
          <p className="mt-1 flex-1 text-sm text-text-secondary">
            Tự chọn các bài tập có sẵn trên hệ thống vào danh sách riêng của bạn, giống như danh sách bài yêu thích. Danh sách này không dùng để nâng hoặc hạ level.
          </p>
                    <Link to="/plans/mine" className="mt-4 rounded-xl border border-accent px-4 py-2.5 text-center text-sm font-black text-accent transition hover:bg-accent/10">
            Tạo danh sách của tôi
          </Link>
        </section>
      </div>
    </div>
  );
}
