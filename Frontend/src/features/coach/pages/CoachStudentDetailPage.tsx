import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useStudent } from "../hooks";
import { Segmented } from "../components/ui";
import type { StudentDetail } from "../types";
import { AddNoteModal } from "../components/students/detail/AddNoteModal";
import { AIAnalysisTab } from "../components/students/detail/AIAnalysisTab";
import { AssessmentsTab } from "../components/students/detail/AssessmentsTab";
import { NotesTab } from "../components/students/detail/NotesTab";
import { OverviewTab } from "../components/students/detail/OverviewTab";
import { ProgressTab } from "../components/students/detail/ProgressTab";
import { SessionsTab } from "../components/students/detail/SessionsTab";
import { StudentDetailSkeleton, StudentLoadError, StudentNotFound } from "../components/students/detail/StudentDetailStates";
import { StudentHeroHeader } from "../components/students/detail/StudentHeroHeader";
import { DETAIL_TABS, errorStatus, parseTab, type StudentDetailTab } from "../components/students/detail/detailConfig";

/** Only the active tab is mounted, so hidden tabs never fetch data or render charts. */
function ActiveTab({ tab, student, onAddNote }: { tab: StudentDetailTab; student: StudentDetail; onAddNote: () => void }) {
  switch (tab) {
    case "assessments":
      return <AssessmentsTab studentId={student.id} />;
    case "sessions":
      return <SessionsTab studentId={student.id} />;
    case "progress":
      return <ProgressTab studentId={student.id} />;
    case "ai":
      return <AIAnalysisTab studentId={student.id} />;
    case "notes":
      return <NotesTab studentId={student.id} onAddNote={onAddNote} />;
    default:
      return <OverviewTab student={student} />;
  }
}

export default function CoachStudentDetailPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [noteOpen, setNoteOpen] = useState(false);
  const { data: student, isLoading, isError, error, refetch, isRefetching } = useStudent(studentId);

  const tab = parseTab(searchParams.get("tab"));
  const activeLabel = DETAIL_TABS.find((t) => t.value === tab)?.label ?? "";

  function selectTab(next: StudentDetailTab) {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        if (next === "overview") params.delete("tab");
        else params.set("tab", next);
        return params;
      },
      { replace: true }
    );
  }

  if (!studentId || errorStatus(error) === 404) return <StudentNotFound />;
  if (isLoading) return <StudentDetailSkeleton />;
  if (isError || !student) return <StudentLoadError onRetry={() => refetch()} retrying={isRefetching} />;

  const openNote = () => setNoteOpen(true);

  return (
    <div className="space-y-6">
      <StudentHeroHeader student={student} onAddNote={openNote} />

      <div className="animate-rise" style={{ animationDelay: "80ms" }}>
        <Segmented options={DETAIL_TABS} value={tab} onChange={selectTab} ariaLabel={`Hồ sơ ${student.name}`} />
      </div>

      <div role="tabpanel" aria-label={activeLabel} tabIndex={-1} key={tab} className="focus:outline-none">
        <ActiveTab tab={tab} student={student} onAddNote={openNote} />
      </div>

      <AddNoteModal open={noteOpen} onOpenChange={setNoteOpen} studentId={student.id} studentName={student.name} />
    </div>
  );
}
