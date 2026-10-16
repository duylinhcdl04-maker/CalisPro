import { NotebookPen, StickyNote } from "lucide-react";
import { useStudentNotes } from "../../../hooks";
import { Button3D, EmptyState, ErrorState, ListSkeleton, Panel } from "../../ui";
import { NoteItem } from "./NoteItem";
import { stagger } from "./detailConfig";

interface NotesTabProps {
  studentId: string;
  onAddNote: () => void;
}

export function NotesTab({ studentId, onAddNote }: NotesTabProps) {
  const { data, isLoading, isError, refetch, isRefetching } = useStudentNotes(studentId);
  const addButton = (
    <Button3D variant="primary" size="sm" onClick={onAddNote} leftIcon={<NotebookPen size={14} aria-hidden />}>
      Thêm ghi chú
    </Button3D>
  );

  return (
    <Panel
      title="Ghi chú huấn luyện viên"
      description={data ? `${data.length} ghi chú, ghi chú ghim hiển thị trước` : "Ghi chú nội bộ, học viên không nhìn thấy"}
      icon={StickyNote}
      actions={data && data.length > 0 ? addButton : undefined}
    >
      {isLoading ? (
        <ListSkeleton rows={4} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} retrying={isRefetching} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={StickyNote}
          title="Chưa có ghi chú nào"
          description="Ghi lại quan sát kỹ thuật, chấn thương hoặc tiến bộ để theo dõi học viên tốt hơn."
          action={addButton}
        />
      ) : (
        <ul className="space-y-3">
          {data.map((n, i) => (
            <li key={n.id} className="animate-rise" style={stagger(i, 40)}>
              <NoteItem note={n} />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
