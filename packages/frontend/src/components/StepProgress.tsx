interface StepProgressProps {
  step: number;
  total: number;
}

export default function StepProgress({ step, total }: StepProgressProps) {
  return (
    <div className="steps">
      <span className="visually-hidden">
        Step {step + 1} of {total}
      </span>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className="steps-segment"
          data-state={i <= step ? "done" : i === step + 1 ? "next" : "todo"}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
