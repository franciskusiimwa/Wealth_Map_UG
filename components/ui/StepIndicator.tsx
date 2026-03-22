interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
}

/**
 * Horizontal step indicator for multi-step forms.
 * @param props Current step and total number of steps.
 * @returns Pill-based progress indicator.
 */
export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const isDone = index < currentStep
        const isActive = index === currentStep

        return (
          <span
            key={`step-${index}`}
            className={`h-2 rounded-full ${
              isDone ? 'bg-brand-green' : isActive ? 'bg-brand-green/50' : 'bg-paper-3'
            }`}
          />
        )
      })}
    </div>
  )
}
