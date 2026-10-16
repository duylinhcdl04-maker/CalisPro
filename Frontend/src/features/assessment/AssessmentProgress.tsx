interface AssessmentProgressProps {
  current: number;
  total?: number;
}

export default function AssessmentProgress({ current, total = 5 }: AssessmentProgressProps) {
  return (
    <div className="mb-10 flex gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`h-1.5 flex-1 rounded-full ${i < current ? "bg-[#78945b]" : "bg-black/8"}`} />
      ))}
    </div>
  );
}
