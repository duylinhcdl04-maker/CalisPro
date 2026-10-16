import type { Equipment, ExerciseDifficulty, ExerciseLibraryItem, MovementPattern } from "../types";

type Seed = [
  id: string,
  name: string,
  pattern: MovementPattern,
  equipment: Equipment,
  difficulty: ExerciseDifficulty,
  primary: string[],
  secondary: string[],
  ai: boolean,
  instructions: string[],
];

const SEEDS: Seed[] = [
  ["push-up", "Push Up", "PUSH", "NONE", "BEGINNER", ["Ngực"], ["Tay sau", "Vai trước", "Core"], true, ["Đặt tay rộng hơn vai một chút, thân thẳng từ đầu tới gót.", "Hạ người đến khi ngực cách sàn ~5cm, khuỷu tay ~45° so với thân.", "Đẩy mạnh lên, siết core, không để hông võng."]],
  ["knee-push-up", "Knee Push Up", "PUSH", "NONE", "BEGINNER", ["Ngực"], ["Tay sau", "Vai trước"], true, ["Quỳ gối, hông thẳng hàng với vai.", "Hạ ngực xuống giữa hai tay.", "Đẩy lên, giữ đường thẳng gối - hông - vai."]],
  ["diamond-push-up", "Diamond Push Up", "PUSH", "NONE", "INTERMEDIATE", ["Tay sau"], ["Ngực", "Vai trước"], true, ["Hai tay chụm thành hình thoi dưới ngực.", "Khuỷu tay ép sát thân khi hạ người.", "Đẩy lên đến khi duỗi thẳng tay."]],
  ["archer-push-up", "Archer Push Up", "PUSH", "NONE", "ADVANCED", ["Ngực", "Tay sau"], ["Vai trước", "Core"], false, ["Tay đặt rất rộng.", "Dồn trọng lượng sang một tay, tay kia duỗi thẳng.", "Luân phiên hai bên."]],
  ["pike-push-up", "Pike Push Up", "PUSH", "NONE", "INTERMEDIATE", ["Vai"], ["Tay sau", "Cầu vai"], true, ["Nâng hông cao tạo hình chữ V ngược.", "Hạ đỉnh đầu về phía trước hai tay.", "Đẩy lên theo phương thẳng đứng."]],
  ["dips", "Parallel Bar Dips", "PUSH", "PARALLEL_BARS", "INTERMEDIATE", ["Tay sau", "Ngực dưới"], ["Vai trước"], true, ["Chống thẳng tay trên xà kép, hạ vai xuống.", "Hạ người đến khi vai ngang khuỷu.", "Đẩy lên, không nhún vai."]],
  ["pull-up", "Pull Up", "PULL", "PULL_UP_BAR", "INTERMEDIATE", ["Lưng xô"], ["Tay trước", "Cầu vai giữa"], true, ["Nắm xà sấp, rộng hơn vai.", "Hạ bả vai trước, kéo đến khi cằm qua xà.", "Hạ người có kiểm soát đến duỗi hoàn toàn."]],
  ["chin-up", "Chin Up", "PULL", "PULL_UP_BAR", "INTERMEDIATE", ["Tay trước", "Lưng xô"], ["Cẳng tay"], true, ["Nắm xà ngửa, rộng bằng vai.", "Kéo ngực về phía xà.", "Hạ chậm 2-3 giây."]],
  ["australian-row", "Australian Row", "PULL", "PULL_UP_BAR", "BEGINNER", ["Lưng giữa"], ["Tay trước", "Vai sau"], false, ["Nằm dưới xà thấp, thân thẳng.", "Kéo ngực chạm xà, ép bả vai.", "Hạ có kiểm soát."]],
  ["dead-hang", "Dead Hang", "PULL", "PULL_UP_BAR", "BEGINNER", ["Cẳng tay"], ["Lưng xô", "Vai"], false, ["Treo người trên xà, tay duỗi thẳng.", "Giữ vai chủ động, không treo thụ động.", "Thở đều trong suốt thời gian giữ."]],
  ["muscle-up", "Muscle Up", "SKILL", "PULL_UP_BAR", "ADVANCED", ["Lưng xô", "Tay sau"], ["Ngực", "Core"], true, ["Kéo bùng nổ đến ngang ngực.", "Chuyển cổ tay nhanh qua xà.", "Đẩy thẳng tay trên xà."]],
  ["squat", "Bodyweight Squat", "LEGS", "NONE", "BEGINNER", ["Đùi trước", "Mông"], ["Đùi sau", "Core"], true, ["Chân rộng bằng vai, mũi chân hơi mở.", "Ngồi xuống đến khi đùi song song sàn.", "Đẩy gót đứng lên, gối theo hướng mũi chân."]],
  ["bulgarian-split-squat", "Bulgarian Split Squat", "LEGS", "NONE", "INTERMEDIATE", ["Đùi trước", "Mông"], ["Đùi sau"], false, ["Chân sau gác lên ghế.", "Hạ người thẳng xuống.", "Đẩy bằng gót chân trước."]],
  ["pistol-squat", "Pistol Squat", "LEGS", "NONE", "ADVANCED", ["Đùi trước", "Mông"], ["Core", "Bắp chân"], true, ["Đứng một chân, chân kia duỗi trước.", "Ngồi xuống sâu, giữ thăng bằng.", "Đứng lên không chạm chân kia xuống sàn."]],
  ["plank", "Plank", "CORE", "NONE", "BEGINNER", ["Core"], ["Vai", "Mông"], true, ["Chống cẳng tay dưới vai.", "Siết bụng và mông, thân một đường thẳng.", "Giữ, thở đều."]],
  ["hollow-body-hold", "Hollow Body Hold", "CORE", "NONE", "INTERMEDIATE", ["Core"], ["Gập hông"], true, ["Nằm ngửa, ép lưng dưới xuống sàn.", "Nâng vai và chân khỏi sàn.", "Giữ tư thế lõm, không cong lưng."]],
  ["hanging-leg-raise", "Hanging Leg Raise", "CORE", "PULL_UP_BAR", "INTERMEDIATE", ["Core"], ["Gập hông", "Cẳng tay"], true, ["Treo trên xà, vai chủ động.", "Nâng chân thẳng đến ngang hông.", "Hạ chậm, không đung đưa."]],
  ["l-sit", "L-Sit Hold", "SKILL", "PARALLEL_BARS", "ADVANCED", ["Core", "Gập hông"], ["Tay sau"], false, ["Chống tay trên xà kép.", "Nâng chân thẳng song song sàn.", "Hạ vai, giữ ngực mở."]],
  ["wall-handstand", "Wall Handstand", "SKILL", "WALL", "INTERMEDIATE", ["Vai"], ["Core", "Tay sau"], true, ["Chống tay cách tường 10-15cm.", "Đá chân lên tường, thân thẳng.", "Đẩy vai lên tai, siết mông."]],
  ["shoulder-dislocate", "Band Shoulder Dislocate", "MOBILITY", "RESISTANCE_BAND", "BEGINNER", ["Vai"], ["Ngực"], false, ["Cầm dây rộng, tay thẳng.", "Xoay dây qua đầu ra sau lưng.", "Thu hẹp tay dần khi linh hoạt hơn."]],
  ["deep-squat-hold", "Deep Squat Hold", "MOBILITY", "NONE", "BEGINNER", ["Hông"], ["Cổ chân", "Lưng dưới"], false, ["Ngồi xổm sâu, gót chạm sàn.", "Dùng khuỷu đẩy gối mở rộng.", "Giữ lưng thẳng, thở sâu."]],
];

export const EXERCISE_LIBRARY: ExerciseLibraryItem[] = SEEDS.map(
  ([id, name, movementPattern, equipment, difficulty, primaryMuscles, secondaryMuscles, aiAnalysisAvailable, instructions]) => ({
    id,
    name,
    imageUrl: `https://picsum.photos/seed/calis-${id}/480/360`,
    videoUrl: null,
    primaryMuscles,
    secondaryMuscles,
    equipment,
    difficulty,
    movementPattern,
    instructions,
    aiAnalysisAvailable,
  })
);

export function exerciseById(id: string): ExerciseLibraryItem {
  return EXERCISE_LIBRARY.find((e) => e.id === id) ?? EXERCISE_LIBRARY[0];
}
