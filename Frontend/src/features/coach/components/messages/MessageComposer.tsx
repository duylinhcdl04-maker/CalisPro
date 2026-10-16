import { useId, useState, type FormEvent, type KeyboardEvent } from "react";
import { SendHorizontal } from "lucide-react";
import { toast } from "sonner";
import type { MessageKind } from "../../types";
import { usePlans, useSendMessage } from "../../hooks";
import { Button3D, Segmented, SelectField, TextArea, type SegmentOption } from "../ui";

type CoachKind = Extract<MessageKind, "TEXT" | "FEEDBACK" | "RECOMMENDATION" | "WORKOUT_PLAN">;

const KIND_OPTIONS: SegmentOption<CoachKind>[] = [
  { value: "TEXT", label: "Tin nhắn" },
  { value: "FEEDBACK", label: "Phản hồi" },
  { value: "RECOMMENDATION", label: "Khuyến nghị" },
  { value: "WORKOUT_PLAN", label: "Giáo án" },
];

const MAX = 2000;

export function MessageComposer({ conversationId }: { conversationId: string }) {
  const [kind, setKind] = useState<CoachKind>("TEXT");
  const [content, setContent] = useState("");
  const [planId, setPlanId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const send = useSendMessage();
  const plans = usePlans({});
  const errorId = useId();
  const textareaId = useId();
  const planSelectId = useId();

  function validate(): string | null {
    const text = content.trim();
    if (!text) return "Vui lòng nhập nội dung tin nhắn.";
    if (text.length > MAX) return `Tin nhắn tối đa ${MAX} ký tự.`;
    if (kind === "WORKOUT_PLAN" && !planId) return "Vui lòng chọn giáo án để đính kèm.";
    return null;
  }

  function submit(e?: FormEvent) {
    e?.preventDefault();
    if (send.isPending) return;
    const err = validate();
    setError(err);
    if (err) return;
    const plan = plans.data?.find((p) => p.id === planId);
    send.mutate(
      {
        conversationId,
        kind,
        content: content.trim(),
        attachment: kind === "WORKOUT_PLAN" && plan ? { type: "PLAN", refId: plan.id, title: plan.name } : null,
      },
      {
        onSuccess: () => {
          setContent("");
          setPlanId("");
          setKind("TEXT");
        },
        onError: (er) => toast.error(er instanceof Error ? er.message : "Không gửi được tin nhắn."),
      }
    );
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 border-t border-border/70 bg-surface/90 dark:bg-surface/60 backdrop-blur-md p-3.5 sm:p-4" noValidate>
      <div className="flex flex-wrap items-center gap-2">
        <Segmented options={KIND_OPTIONS} value={kind} onChange={setKind} ariaLabel="Loại tin nhắn" size="sm" />
        {kind === "WORKOUT_PLAN" && (
          <>
            <label htmlFor={planSelectId} className="sr-only">
              Chọn giáo án đính kèm
            </label>
            <SelectField
              id={planSelectId}
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              disabled={plans.isLoading}
              className="min-w-0 flex-1 sm:max-w-xs"
            >
              <option value="">{plans.isLoading ? "Đang tải giáo án..." : "Chọn giáo án"}</option>
              {plans.data?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </SelectField>
          </>
        )}
      </div>
      <div className="flex items-end gap-2.5">
        <div className="min-w-0 flex-1">
          <label htmlFor={textareaId} className="sr-only">
            Nội dung tin nhắn
          </label>
          <TextArea
            id={textareaId}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={onKeyDown}
            placeholder="Nhập tin nhắn... (Enter để gửi, Shift+Enter xuống dòng)"
            rows={2}
            maxLength={MAX + 100}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className="max-h-40 min-h-[50px] resize-none rounded-[18px] bg-white dark:bg-[#132037] border-border/80 text-text-primary placeholder:text-text-secondary/60 focus:border-palette-sky focus:ring-4 focus:ring-palette-sky/20"
          />
        </div>
        <Button3D
          type="submit"
          variant="primary"
          size="icon"
          loading={send.isPending}
          aria-label="Gửi tin nhắn"
          className="h-11 w-11 rounded-[16px] shrink-0"
        >
          {!send.isPending && <SendHorizontal size={18} aria-hidden className="transition-transform group-hover:translate-x-0.5" />}
        </Button3D>
      </div>
      <div className="flex items-center justify-between gap-3 text-[11px]">
        {error ? (
          <p id={errorId} className="font-semibold text-rose-600 dark:text-rose-400">
            {error}
          </p>
        ) : (
          <span />
        )}
        <span className={content.trim().length > MAX ? "font-bold text-rose-600 dark:text-rose-400" : "text-text-secondary font-medium"}>
          {content.trim().length}/{MAX}
        </span>
      </div>
    </form>
  );
}
