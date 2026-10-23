export function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-[#393E46] bg-[#FFFFFF] p-2">
      <div className="font-mono text-lg text-[#222831]">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-[#393E46]">{label}</div>
    </div>
  );
}
