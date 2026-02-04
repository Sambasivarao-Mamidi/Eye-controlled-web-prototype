import React from 'react';

interface VirtualPointerProps {
    x: number;
    y: number;
    dwellProgress: number;
    isDwelling: boolean;
    visible: boolean;
}

export const VirtualPointer: React.FC<VirtualPointerProps> = ({
    x,
    y,
    dwellProgress,
    isDwelling,
    visible,
}) => {
    if (!visible) return null;

    // SVG circle calculations
    const radius = 16;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - dwellProgress);

    return (
        <div
            className="virtual-pointer"
            style={{
                left: `${x}px`,
                top: `${y}px`,
                opacity: visible ? 1 : 0,
            }}
        >
            {/* Dwell progress ring */}
            <div className="dwell-ring">
                <svg viewBox="0 0 40 40">
                    {/* Background circle */}
                    <circle
                        className="bg-circle"
                        cx="20"
                        cy="20"
                        r={radius}
                    />
                    {/* Progress circle */}
                    <circle
                        className="progress-circle"
                        cx="20"
                        cy="20"
                        r={radius}
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        style={{
                            opacity: isDwelling ? 1 : 0.3,
                        }}
                    />
                </svg>
            </div>

            {/* Center dot */}
            <div
                className="pointer-dot"
                style={{
                    transform: isDwelling ? 'scale(1.2)' : 'scale(1)',
                    transition: 'transform 0.15s ease',
                }}
            />
        </div>
    );
};

export default VirtualPointer;
