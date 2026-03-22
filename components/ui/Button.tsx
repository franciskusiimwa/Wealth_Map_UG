import clsx from 'clsx'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost'
}

/**
 * Reusable button primitive with Wealthmap styling variants.
 * @param props Native button props plus variant.
 * @returns Styled button element.
 */
export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'h-11 w-full rounded-xl px-6 py-4 text-base font-semibold transition active:opacity-80',
        variant === 'primary' && 'bg-brand-green font-syne text-white',
        variant === 'ghost' && 'border border-paper-3 bg-transparent text-ink',
        className
      )}
      {...props}
    />
  )
}
