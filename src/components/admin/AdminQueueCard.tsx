interface AdminQueueCardProps {
  title: string;
  eyebrow: string;
  emptyMessage: string;
  count: number;
  primaryLabel: string;
  description: string;
  onPrimaryAction: () => void;
}

export function AdminQueueCard({
  title,
  eyebrow,
  emptyMessage,
  count,
  primaryLabel,
  description,
  onPrimaryAction,
}: AdminQueueCardProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-bold text-slate-500">{eyebrow}</p>
      <h3 className="mt-2 text-2xl font-bold text-slate-900">{title}</h3>
      <p className="mt-3 text-sm text-slate-600">{description}</p>
      <div className="mt-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-4xl font-bold tracking-tight text-slate-900">{count}</p>
          <p className="mt-2 text-sm text-slate-500">
            {count === 0 ? emptyMessage : `${count} item${count === 1 ? '' : 's'} ready for review`}
          </p>
        </div>
        <button
          type="button"
          disabled={count === 0}
          onClick={onPrimaryAction}
          className="inline-flex min-h-16 items-center justify-center rounded-2xl bg-[#1A4A8A] px-5 py-4 text-sm font-bold text-white transition hover:bg-[#163d71] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
        >
          {primaryLabel}
        </button>
      </div>
    </section>
  );
}
