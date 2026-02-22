interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  color?: 'yellow' | 'lime' | 'coral';
  showPercentage?: boolean;
}

export function ProgressBar({
  value,
  max,
  label,
  color = 'yellow',
  showPercentage = true,
}: ProgressBarProps) {
  const percentage = max > 0 ? (value / max) * 100 : 0;

  const colors = {
    yellow: 'bg-yellow',
    lime: 'bg-lime',
    coral: 'bg-coral',
  };

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between mb-2">
          <span className="font-bold text-sm uppercase">{label}</span>
          {showPercentage && (
            <span className="font-mono font-bold text-sm">
              {percentage.toFixed(1)}%
            </span>
          )}
        </div>
      )}
      <div className="w-full h-8 bg-gray-100 border-3 border-black overflow-hidden">
        <div
          className={`h-full ${colors[color]} transition-all duration-300 border-r-3 border-black`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
