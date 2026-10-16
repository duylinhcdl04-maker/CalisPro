import React from 'react';
import { Link } from 'react-router-dom';
import { Info, Layers } from 'lucide-react';
import { useAssessmentScope } from '../../useAssessmentScope';

/**
 * Bước 4 của bài đánh giá BAN ĐẦU: không cấu hình cấp độ ở đây. Level của học viên do Level Engine quyết định
 * (điểm tổng đạt mốc "Lên khi Overall" của level và qua các cổng năng lực), không theo khoảng điểm riêng của bài.
 * Bài chỉ cung cấp điểm cho từng năng lực qua câu hỏi (trọng số ở bước 2 và cách chấm ở bước 3).
 */
export const LevelByEnginePanel: React.FC = () => {
  const { isCoach } = useAssessmentScope();
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-accent/30 bg-accent/5 p-5">
        <h2 className="flex items-center gap-2 text-lg font-bold text-text-primary">
          <Layers className="h-5 w-5 text-accent" /> Level do Level Engine quyết định
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Bạn không gán cấp độ cho từng khoảng điểm trong bài này. Hệ thống tính điểm từng năng lực từ câu trả lời, rồi Level Engine xếp level theo mốc điểm
          ("Lên khi Overall") và các cổng năng lực của từng level. Muốn đổi cách xếp level, chỉnh ở Level Engine.
        </p>
        <Link to={isCoach ? '/coach/level-engine' : '/admin/level-engine'} className="mt-3 inline-block text-sm font-bold text-accent underline">
          Mở Level Engine
        </Link>
      </div>

      <p className="flex items-start gap-2 rounded-xl border border-border bg-background p-3 text-xs text-text-secondary">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Bài đánh giá ban đầu chỉ để phân loại và chỉ làm một lần. Level được giới hạn tối đa L2 vì là dữ liệu tự khai, và được xác nhận cao hơn bằng bài đo thực hành.
          "Đối tượng phù hợp" ở bước 1 chỉ là mô tả để người soạn tham khảo, không tự động chọn người làm bài.
        </span>
      </p>
    </div>
  );
};
