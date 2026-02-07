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
            // Using the averaged gaze coordinates for better accuracy
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
        <div className="fixed inset-0 z-[100] bg-gray-950 flex flex-col overflow-hidden" data-testid="calibration-overlay">
            
            {/* Header: Progress & Status */}
            {/* <header className="h-20 bg-gray-900/90 backdrop-blur border-b border-gray-800 flex items-center justify-between px-8 shrink-0 z-50">
                <div className="flex items-center gap-4">
                    <span className="text-2xl animate-pulse">🎯</span>
                    <h2 className="text-xl font-bold text-white" data-testid="calibration-title-heading">Calibration</h2>
                </div>

                <div className="flex items-center gap-6">
                    <div className="bg-gray-800/50 border border-gray-700 px-4 py-2 rounded-lg flex items-center gap-3" data-testid="calibration-progress-card-wrapper">
                        <span className="text-gray-400 text-sm" data-testid="calibration-progress-label">Progress:</span>
                        <div className="flex gap-1.5" data-testid="calibration-progress-dots-container">
                            {calibrationTargets.map((_, index) => (
                                <div
                                    key={index}
                                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                                        completedPoints.includes(index)
                                            ? 'bg-green-400'
                                            : index === currentPointIndex
                                                ? 'bg-blue-400 animate-pulse scale-110'
                                                : 'bg-gray-700'
                                    }`}
                                />
                            ))}
                        </div>
                        <span className="text-white font-mono text-sm ml-2">
                            {completedPoints.length}/{calibrationTargets.length}
                        </span>
                    </div>
                </div>
            </header> */}

            {/* Main Viewport: Where the dots are rendered */}
            <main className="flex-1 relative w-full overflow-hidden cursor-none">
                {calibrationTargets.map((target, index) => {
                    const isActive = index === currentPointIndex;
                    const isCompleted = completedPoints.includes(index);

                    // Calculation logic: Handles both pixel values (e.g. 500) and percentages (e.g. 0.5)
                    const styleTop = target.y <= 1 ? `${target.y * 100}%` : `${target.y}px`;
                    const styleLeft = target.x <= 1 ? `${target.x * 100}%` : `${target.x}px`;

                    return (
                        <div
                            key={index}
                            className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500
                                ${isActive ? 'z-30' : 'z-10'}
                            `}
                            style={{
                                left: styleLeft,
                                top: styleTop,
                            }}
                            data-testid={`calibration-point-${index}`}
                        >
                            <div className="relative flex items-center justify-center w-16 h-16">
                                {/* Glow effect for active point */}
                                {isActive && (
                                    <div className="absolute inset-0 rounded-full border-2 border-blue-400/50 animate-ping" />
                                )}

                                <div
                                    className={`
                                        w-8 h-8 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center
                                        ${isActive ? 'bg-blue-500 scale-125 shadow-[0_0_25px_rgba(59,130,246,0.7)]' : ''}
                                        ${isCompleted ? 'bg-green-500 opacity-40' : ''}
                                        ${!isActive && !isCompleted ? 'bg-gray-700 opacity-20' : ''}
                                    `}
                                >
                                    {isCompleted ? (
                                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                                            <polyline points="20,6 9,17 4,12" />
                                        </svg>
                                    ) : (
                                        isActive && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </main>

        
        </div>
    );
};

export default Calibration; 