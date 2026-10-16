import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MessageCircleDashed, MessagesSquare } from "lucide-react";
import { cn } from "../../../lib/utils";
import { useConversations, useMarkConversationRead, useMessages, useStudentOptions } from "../hooks";
import { Button3D, EmptyState } from "../components/ui";
import { ConversationList } from "../components/messages/ConversationList";
import { ChatWindow } from "../components/messages/ChatWindow";

/**
 * /coach/messages: two-pane chat. The selected conversation lives in ?c= so it survives reloads and deep links.
 * Other pages may link with ?studentId=; it is resolved to that student's conversation (?c=) once loaded.
 */
export default function CoachMessagesPage() {
  const [params, setParams] = useSearchParams();
  const activeId = params.get("c");
  const studentId = params.get("studentId");
  const conversations = useConversations();
  const students = useStudentOptions();
  const active = conversations.data?.find((c) => c.id === activeId) ?? null;
  const messages = useMessages(active?.id);
  const { mutate: markConversationRead } = useMarkConversationRead();
  const hasUnread = (active?.unreadCount ?? 0) > 0;

  const byStudent = studentId ? conversations.data?.find((c) => c.studentId === studentId) : undefined;
  const pendingStudent = studentId && conversations.data && !byStudent ? students.data?.find((s) => s.id === studentId) : undefined;
  const showPanel = !!activeId || !!studentId;

  useEffect(() => {
    if (!byStudent) return;
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("studentId");
        next.set("c", byStudent.id);
        return next;
      },
      { replace: true }
    );
  }, [byStudent, setParams]);

  useEffect(() => {
    if (active?.id && hasUnread) markConversationRead(active.id);
  }, [active?.id, hasUnread, markConversationRead]);

  function select(id: string | null) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("studentId");
        if (id) next.set("c", id);
        else next.delete("c");
        return next;
      },
      { replace: !id }
    );
  }

  const backButton = (
    <Button3D size="sm" onClick={() => select(null)} className="lg:hidden">
      Về danh sách
    </Button3D>
  );

  return (
    <div className="animate-rise">
      <h1 className="sr-only">Tin nhắn</h1>
      <div className="grid h-[calc(100dvh-10rem)] min-h-[480px] gap-4 lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[380px_minmax(0,1fr)]">
        <ConversationList
          conversations={conversations.data}
          isLoading={conversations.isLoading}
          isError={conversations.isError}
          onRetry={() => conversations.refetch()}
          retrying={conversations.isRefetching}
          activeId={activeId}
          onSelect={select}
          className={cn(showPanel && "hidden lg:flex")}
        />
        <div className={cn("min-h-0 min-w-0", showPanel ? "flex flex-col" : "hidden lg:flex lg:flex-col")}>
          {active ? (
            <ChatWindow
              conversation={active}
              messages={messages.data}
              isLoading={messages.isLoading}
              isError={messages.isError}
              onRetry={() => messages.refetch()}
              onBack={() => select(null)}
            />
          ) : studentId && conversations.data && !byStudent ? (
            <div className="panel-3d grid flex-1 place-items-center">
              <EmptyState
                icon={MessageCircleDashed}
                title={`Chưa có cuộc trò chuyện với ${pendingStudent?.name ?? "học viên này"}`}
                description="Cuộc trò chuyện sẽ xuất hiện khi học viên gửi tin nhắn đầu tiên cho bạn."
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button3D asChild size="sm" variant="secondary">
                      <Link to={`/coach/students/${studentId}`}>Xem hồ sơ</Link>
                    </Button3D>
                    {backButton}
                  </div>
                }
              />
            </div>
          ) : (
            <div className="panel-3d grid flex-1 place-items-center">
              <EmptyState
                icon={MessagesSquare}
                title={activeId && conversations.data ? "Không tìm thấy cuộc trò chuyện" : "Chọn một cuộc trò chuyện"}
                description="Chọn học viên ở danh sách bên trái để xem và trả lời tin nhắn."
                action={activeId ? backButton : undefined}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
