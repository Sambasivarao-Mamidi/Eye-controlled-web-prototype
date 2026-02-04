import React, { useEffect, useCallback } from 'react';
import type { CalibrationState } from '../hooks/useCalibration';
import type { EyeCoordinates } from '../hooks/useEyeTracking';

interface CalibrationProps {
    state: CalibrationState;
    calibrationTargets: Array<{ x: number; y: number }>;
    eyeCoords: EyeCoordinates | null;
    onRecordPoint: (eyeX: number, eyeY: number) => void;
    onSkip?: () => void;
}

export const Calibration: React.FC<CalibrationProps> = ({
    state,
    calibrationTargets,
    eyeCoords,
    onRecordPoint,
    onSkip,
}) => {
    const { isCalibrating, currentPointIndex, completedPoints } = state;

    const handleKeyPress = useCallback((e: KeyboardEvent) => {
        if (e.code === 'Space' && isCalibrating && eyeCoords) {
            e.preventDefault();
            onRecordPoint(eyeCoords.average.x, eyeCoords.average.y);
        }
        if (e.code === 'Escape' && onSkip) {
            onSkip();
        }
    }, [isCalibrating, eyeCoords, onRecordPoint, onSkip]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [handleKeyPress]);

    if (!isCalibrating) return null;

    return (
        <div className="calibration-overlay">
            {/* Instructions */}
            <div className="fixed top-8 left-1/2 -translate-x-1/2 text-center z-10">
                <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Calibration
                </h2>
                <p className="text-xl text-white/80 mb-2">
                    Look at the <span className="text-purple-400 font-semibold">glowing dot</span> and press{' '}
                    <kbd className="px-3 py-1 bg-white/10 rounded-lg border border-white/20 font-mono">
                        SPACE
                    </kbd>
                </p>
                <p className="text-sm text-white/50">
                    Press ESC to skip calibration (uses simple mapping)
                </p>
            </div>

            {/* Progress indicator */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
                <div className="glass-card px-6 py-3 flex items-center gap-4">
                    <span className="text-white/70">Progress:</span>
                    <div className="flex gap-2">
                        {calibrationTargets.map((_, index) => (
                            <div
                                key={index}
                                className={`w-3 h-3 rounded-full transition-all duration-300 ${completedPoints.includes(index)
                                    ? 'bg-green-400 shadow-lg shadow-green-400/50'
                                    : index === currentPointIndex
                                        ? 'bg-purple-400 shadow-lg shadow-purple-400/50 animate-pulse'
                                        : 'bg-white/20'
                                    }`}
                            />
                        ))}
                    </div>
                    <span className="text-white font-semibold">
                        {completedPoints.length} / {calibrationTargets.length}
                    </span>
                </div>
            </div>

            {/* Calibration points */}
            {calibrationTargets.map((target, index) => {
                const isActive = index === currentPointIndex;
                const isCompleted = completedPoints.includes(index);

                return (
                    <div
                        key={index}
                        className={`calibration-point ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                        style={{
                            left: `${target.x}px`,
                            top: `${target.y}px`,
                            transform: 'translate(-50%, -50%)',
                        }}
                    >
                        {/* Outer ring for active point */}
                        {isActive && (
                            <div className="absolute inset-0 rounded-full border-2 border-purple-400/50 animate-ping" />
                        )}

                        {/* Inner dot */}
                        <div
                            className={`calibration-point-inner ${isCompleted ? 'bg-green-400' : ''}`}
                            style={{
                                background: isCompleted
                                    ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                                    : undefined
                            }}
                        />

                        {/* Checkmark for completed */}
                        {isCompleted && (
                            <svg
                                className="absolute inset-0 w-full h-full p-4 text-white"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                            >
                                <polyline points="20,6 9,17 4,12" />
                            </svg>
                        )}
                    </div>
                );
            })}

            {/* Eye position indicator */}
            {eyeCoords && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 text-center">
                    <div className="glass-card px-4 py-2 text-sm">
                        <span className="text-white/50">Eye Position: </span>
                        <span className="text-purple-400 font-mono">
                            ({eyeCoords.average.x.toFixed(3)}, {eyeCoords.average.y.toFixed(3)})
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Calibration;
