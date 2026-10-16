import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useAuth } from "../../features/auth/AuthContext";
import { dimensionLabel, onboardingApi, type OnboardingResult } from "../../features/onboarding/api";
import { Card } from "../../components/ui/Card";
import { Progress } from "../../components/ui/Progress";
import { Button } from "../../components/ui/Button";

/** Kết quả bài test đầu vào - điểm & mức trình độ do backend chấm theo cấu hình của admin. */
export default function OnboardingCompletePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshOnboarding } = useAuth();
  const [result, setResult] = useState<OnboardingResult | null>(
    (location.state as { result?: OnboardingResult } | null)?.result ?? null
  );
  const [loadError, setLoadError] = useState(false);

  // Tải lại trang -> lấy kết quả đã lưu ở backend
  useEffect(() => {
    if (result) return;
    onboardingApi.getResult().then(setResult).catch(() => setLoadError(true));
  }, [result]);

  async function handleStart() {
    await refreshOnboarding();
    // Đã có chu kỳ tập đầu tiên do Level Engine sinh -> xem lộ trình ngay
    navigate("/roadmap", { replace: true });
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        {loadError ? (
          <>
            <p className="text-sm font-semibold text-text-primary">Không tìm thấy kết quả bài đánh giá.</p>
            <Button className="mt-4" onClick={() => navigate("/onboarding", { replace: true })}>Quay lại bài đánh giá</Button>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-text-primary">Đang tải kết quả của bạn...</p>
            <Progress value={60} className="mt-6 max-w-xs" />
          </>
        )}
      </div>
    );
  }

  const percent = result.maxScore > 0 ? Math.round((result.overallScore / result.maxScore) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <h1 className="font-display text-2xl font-bold text-text-primary">Hồ sơ luyện tập của bạn đã sẵn sàng.</h1>
      <p className="mt-2 text-sm text-text-secondary">
        Dựa trên câu trả lời của bạn, đây là điểm khởi đầu cho lộ trình luyện tập.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Card>
          <div className="text-xs text-text-secondary">Trình độ hiện tại</div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-lg font-bold text-text-primary">{result.level?.name ?? "Chưa phân loại"}</span>
            {result.level?.badgeLabel && (
              <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold text-text-secondary">
                {result.level.badgeLabel}
              </span>
            )}
          </div>
          {result.level?.description && <p className="mt-2 text-xs text-text-secondary">{result.level.description}</p>}
        </Card>
        <Card>
          <div className="text-xs text-text-secondary">Điểm đánh giá tổng</div>
          <div className="mt-1 text-lg font-bold text-text-primary">
            {result.overallScore} <span className="text-sm font-medium text-text-secondary">/ {result.maxScore}</span>
          </div>
          <Progress value={percent} className="mt-3" />
        </Card>
      </div>

      {result.dimensions.length > 0 && (
        <Card className="mt-3">
          <div className="text-xs text-text-secondary">Điểm theo nhóm năng lực</div>
          <div className="mt-3 space-y-3">
            {result.dimensions.map((d) => (
              <div key={d.category}>
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-text-primary">{dimensionLabel(d.category)}</span>
                  <span className="text-text-secondary">{Math.round(d.score)} / 100</span>
                </div>
                <Progress value={d.score} className="mt-1.5" />
              </div>
            ))}
          </div>
        </Card>
      )}

      {result.level?.recommendation && (
        <Card className="mt-3">
          <div className="text-xs text-text-secondary">Khuyến nghị từ huấn luyện viên</div>
          <p className="mt-1 text-sm text-text-primary whitespace-pre-line">{result.level.recommendation}</p>
        </Card>
      )}

      {result.source === "SELF_REPORTED" && (
        <p className="mt-4 text-[11px] text-text-secondary">
          Kết quả dựa trên thông tin bạn tự khai báo nên là trình độ tạm thời; hệ thống sẽ cập nhật lại sau các bài đánh giá
          thực hành có AI phân tích chuyển động.
        </p>
      )}

      <Button className="mt-8 w-full" size="lg" onClick={handleStart}>
        Bắt đầu luyện tập
      </Button>
    </motion.div>
  );
}
