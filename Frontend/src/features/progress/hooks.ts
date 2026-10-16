import { useQuery } from "@tanstack/react-query";
import { progressApi } from "./api";

export function useProgressMetricsQuery() {
  return useQuery({ queryKey: ["progress-metrics"], queryFn: progressApi.getMetrics });
}

export function usePersonalRecordsQuery() {
  return useQuery({ queryKey: ["personal-records"], queryFn: progressApi.getPersonalRecords });
}

export function useAssessmentSnapshotsQuery() {
  return useQuery({ queryKey: ["assessment-snapshots"], queryFn: progressApi.getAssessmentSnapshots });
}
