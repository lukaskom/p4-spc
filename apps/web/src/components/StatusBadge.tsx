interface StatusBadgeProps {
  readonly status: 'ok' | 'warning' | 'reject';
}

const STYLES: Record<StatusBadgeProps['status'], { label: string; className: string }> = {
  ok: {
    label: 'V toleranci',
    className: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  },
  warning: {
    label: 'Varování',
    className: 'bg-amber-100 text-amber-800 ring-amber-200',
  },
  reject: {
    label: 'Mimo toleranci',
    className: 'bg-rose-100 text-rose-800 ring-rose-200',
  },
};

export function StatusBadge({ status }: StatusBadgeProps): React.ReactElement {
  const style = STYLES[status];
  return (
    <span
      className={
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ' +
        style.className
      }
    >
      {style.label}
    </span>
  );
}
