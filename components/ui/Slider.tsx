interface SliderProps {
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
}

/**
 * Numeric slider input with consistent sizing and style.
 * @param props Slider configuration and value callback.
 * @returns Range input field.
 */
export function Slider({ value, min, max, step = 1, onChange }: SliderProps) {
  return (
    <input
      className="h-11 w-full accent-brand-green"
      type="range"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(event) => onChange(Number(event.target.value))}
    />
  )
}
