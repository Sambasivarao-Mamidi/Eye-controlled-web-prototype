import React, { useRef, useEffect, memo } from 'react';

interface VirtualPointerProps {
    x: number;
    y: number;
    dwellProgress: number;
    isDwelling: boolean;
    visible: boolean;
}

// Memoized to prevent unnecessary re-renders
export const VirtualPointer: React.FC<VirtualPointerProps> = memo(({
    x,
    y,
    dwellProgress,
    isDwelling,
    visible,
}) => {
    const pointerRef = useRef<HTMLDivElement>(null);
    const progressRef = useRef<SVGCircleElement>(null);
    const dotRef = useRef<HTMLDivElement>(null);

    // Use RAF and direct DOM manipulation for smooth updates
    useEffect(() => {
        if (!pointerRef.current || !visible) return;

        // Use transform for GPU-accelerated positioning
        pointerRef.current.style.transform = `translate(${x - 20}px, ${y - 20}px)`;
    }, [x, y, visible]);

    // Update progress circle directly
    useEffect(() => {
        if (!progressRef.current) return;

        const radius = 16;
        const circumference = 2 * Math.PI * radius;
        const strokeDashoffset = circumference * (1 - dwellProgress);

        progressRef.current.style.strokeDashoffset = String(strokeDashoffset);
        progressRef.current.style.opacity = isDwelling ? '1' : '0.3';
    }, [dwellProgress, isDwelling]);

    // Update dot scale
    useEffect(() => {
        if (!dotRef.current) return;
        dotRef.current.style.transform = isDwelling ? 'scale(1.2)' : 'scale(1)';
    }, [isDwelling]);

    if (!visible) return null;

    // SVG circle calculations
    const radius = 16;
    const circumference = 2 * Math.PI * radius;

    return (
        <div
            ref={pointerRef}
            className="virtual-pointer"
            style={{ opacity: 1 }}
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
                        ref={progressRef}
                        className="progress-circle"
                        cx="20"
                        cy="20"
                        r={radius}
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference}
                    />
                </svg>
            </div>

            {/* Center dot */}
            <div
                ref={dotRef}
                className="pointer-dot"
                style={{ transition: 'transform 0.1s ease-out' }}
            />
        </div>
    );
});

VirtualPointer.displayName = 'VirtualPointer';

export default VirtualPointer;
