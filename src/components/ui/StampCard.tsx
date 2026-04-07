"use client";

interface StampCardProps {
  /** Total stamps required for the reward */
  total: number;
  /** Current stamps earned (visits or points) */
  current: number;
  /** Business name */
  businessName?: string;
  /** Reward name at completion */
  rewardName?: string;
  /** Color for completed stamps */
  color?: string;
  /** Whether to show animation */
  animated?: boolean;
}

export default function StampCard({
  total,
  current,
  businessName,
  rewardName,
  color = "#6366f1",
  animated = true,
}: StampCardProps) {
  const completed = Math.min(current, total);
  const isComplete = completed >= total;

  // Calculate grid columns based on total
  const cols = total <= 6 ? 3 : total <= 8 ? 4 : 5;

  return (
    <div className="w-full">
      {businessName && (
        <div className="mb-3 text-center">
          <p className="font-bold text-gray-900">{businessName}</p>
          {rewardName && (
            <p className="text-xs text-gray-500 mt-0.5">
              {isComplete ? `¡Puedes canjear: ${rewardName}!` : `Completa ${total} sellos → ${rewardName}`}
            </p>
          )}
        </div>
      )}

      <div
        className="grid gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-200"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {Array.from({ length: total }, (_, i) => {
          const isFilled = i < completed;
          const isLast = i === completed - 1 && animated;

          return (
            <div key={i} className="flex items-center justify-center">
              <div
                className={`
                  w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center
                  transition-all duration-300
                  ${isFilled 
                    ? "shadow-md scale-100" 
                    : "bg-white border-2 border-dashed border-gray-300 scale-95"
                  }
                  ${isLast ? "animate-bounce-once" : ""}
                `}
                style={isFilled ? { backgroundColor: color } : undefined}
              >
                {isFilled ? (
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-xs font-bold text-gray-300">{i + 1}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress text */}
      <div className="mt-3 flex items-center justify-between px-1">
        <span className="text-sm font-medium text-gray-600">
          {completed} de {total} sellos
        </span>
        {isComplete ? (
          <span className="text-sm font-bold text-green-600 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            ¡Completa!
          </span>
        ) : (
          <span className="text-xs text-gray-400">
            Faltan {total - completed}
          </span>
        )}
      </div>

      <style jsx>{`
        @keyframes bounce-once {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        .animate-bounce-once {
          animation: bounce-once 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
}
