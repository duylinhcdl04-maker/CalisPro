import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { studentService } from "../services";
import type { CoachNoteInput, StudentListParams } from "../types";
import { coachKeys } from "./queryKeys";

export function useStudents(params: StudentListParams) {
  return useQuery({
    queryKey: coachKeys.studentList(params),
    queryFn: () => studentService.getStudents(params),
    placeholderData: keepPreviousData,
  });
}

export function useStudentOptions() {
  return useQuery({ queryKey: coachKeys.studentOptions(), queryFn: studentService.getStudentOptions, staleTime: 5 * 60_000 });
}

export function useStudent(id: string | undefined) {
  return useQuery({ queryKey: coachKeys.student(id ?? ""), queryFn: () => studentService.getStudent(id!), enabled: !!id });
}

export function useStudentNotes(studentId: string | undefined) {
  return useQuery({ queryKey: coachKeys.studentNotes(studentId ?? ""), queryFn: () => studentService.getNotes(studentId!), enabled: !!studentId });
}

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CoachNoteInput) => studentService.createNote(input),
    onSuccess: (note) => qc.invalidateQueries({ queryKey: coachKeys.studentNotes(note.studentId) }),
  });
}

export function useAttentionAlerts() {
  return useQuery({ queryKey: coachKeys.attention(), queryFn: studentService.getAttentionAlerts });
}
