import type { Exercise } from "../../types";

export const EXERCISES: Exercise[] = [];

export function findExercise(id: string) {
  return EXERCISES.find((e) => e.id === id);
}

export function findExerciseByName(name: string) {
  return EXERCISES.find((e) => e.name === name);
}
