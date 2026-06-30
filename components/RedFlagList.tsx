export function RedFlagList({ flags }: { flags: string[] }) {
  if (flags.length === 0) {
    return <p className="text-sm text-slate-400">Keine Red Flags markiert.</p>;
  }
  return (
    <ul className="space-y-1.5">
      {flags.map((flag, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-rose-700">
          <span aria-hidden className="mt-0.5 text-rose-500">
            ⚑
          </span>
          <span>{flag}</span>
        </li>
      ))}
    </ul>
  );
}
