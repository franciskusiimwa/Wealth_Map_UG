import clsx from 'clsx'

interface PillProps {
  label: string
  selected?: boolean
  onClick?: () => void
}

/**
 * Selectable chip/pill for compact option picking.
 * @param props Label, selected state, and click callback.
 * @returns Interactive pill UI.
 */
export function Pill({ label, selected = false, onClick }: PillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'min-h-11 cursor-pointer rounded-full border px-4 py-2 text-sm',
        'border-paper-3 text-ink-3',
        selected && 'border-brand-green bg-brand-green-light font-medium text-brand-green-dark'
      )}
    >
      {label}
    </button>
  )
}
