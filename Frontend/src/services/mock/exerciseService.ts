import { EXERCISES, findExercise } from "./exerciseLibrary";
import { withLatency, MockApiError } from "./latency";

export const exerciseService = {
  async list() {
    await withLatency(null, 450);
    return EXERCISES;
  },
  async getById(id: string) {
    await withLatency(null, 350);
    const exercise = findExercise(id);
    if (!exercise) throw new MockApiError("Không tìm thấy bài tập.", 404);
    return exercise;
  },
};
