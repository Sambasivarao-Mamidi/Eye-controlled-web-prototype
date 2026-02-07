import { useState, useEffect, useRef, useCallback } from 'react';

export interface DwellClickConfig {
    dwellRadius: number;      // Pixels - how far gaze can move and still count as dwelling
    dwellDuration: number;    // Milliseconds - how long to dwell before click
    cooldownDuration: number; // Milliseconds - time between clicks
}

export interface UseDwellClickReturn {
    isDwelling: boolean;
    dwellProgress: number; // 0 to 1
    dwellTarget: { x: number; y: number } | null;
    updateGaze: (x: number, y: number) => void;
}

const DEFAULT_CONFIG: DwellClickConfig = {
    dwellRadius: 50,
    dwellDuration: 800,
    cooldownDuration: 500,
};

export function useDwellClick(
    config: Partial<DwellClickConfig> = {},
    enabled: boolean = true
): UseDwellClickReturn {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };

    const [isDwelling, setIsDwelling] = useState(false);
    const [dwellProgress, setDwellProgress] = useState(0);
    const [dwellTarget, setDwellTarget] = useState<{ x: number; y: number } | null>(null);

    const dwellStartTime = useRef<number | null>(null);
    const dwellCenter = useRef<{ x: number; y: number } | null>(null);
    const lastClickTime = useRef<number>(0);
    const animationFrameRef = useRef<number | null>(null);

    const triggerClick = useCallback((x: number, y: number) => {
        // Find element at position
        const element = document.elementFromPoint(x, y);

        if (element) {
            console.log('Dwell click triggered on:', element);

            // Create and dispatch synthetic click event
            const clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window,
                clientX: x,
                clientY: y,
            });

            element.dispatchEvent(clickEvent);

            // Also try to focus if it's a focusable element
            if (element instanceof HTMLElement) {
                element.focus();
            }
        }

        lastClickTime.current = Date.now();
    }, []);

    const updateGaze = useCallback((x: number, y: number) => {
        if (!enabled) {
            setIsDwelling(false);
            setDwellProgress(0);
            return;
        }

        const now = Date.now();

        // Check cooldown
        if (now - lastClickTime.current < finalConfig.cooldownDuration) {
            return;
        }

        // Check if gaze is within dwell radius
        if (dwellCenter.current) {
            const dx = x - dwellCenter.current.x;
            const dy = y - dwellCenter.current.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > finalConfig.dwellRadius) {
                // Gaze moved too far, reset dwell
                dwellStartTime.current = now;
                dwellCenter.current = { x, y };
                setDwellTarget({ x, y });
                setDwellProgress(0);
                setIsDwelling(false);
            } else {
                // Still dwelling, calculate progress
                const elapsed = now - (dwellStartTime.current || now);
                const progress = Math.min(1, elapsed / finalConfig.dwellDuration);

                setDwellProgress(progress);
                setIsDwelling(progress > 0.1);

                if (progress >= 1) {
                    // Dwell complete - trigger click!
                    triggerClick(dwellCenter.current.x, dwellCenter.current.y);

                    // Reset dwell state
                    dwellStartTime.current = null;
                    dwellCenter.current = null;
                    setDwellProgress(0);
                    setIsDwelling(false);
                    setDwellTarget(null);
                }
            }
        } else {
            // Start new dwell
            dwellStartTime.current = now;
            dwellCenter.current = { x, y };
            setDwellTarget({ x, y });
        }
    }, [enabled, finalConfig, triggerClick]);

    // Cleanup animation frame on unmount
    useEffect(() => {
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    // Reset when disabled
    useEffect(() => {
        if (!enabled) {
            dwellStartTime.current = null;
            dwellCenter.current = null;
            setIsDwelling(false);
            setDwellProgress(0);
            setDwellTarget(null);
        }
    }, [enabled]);

    return {
        isDwelling,
        dwellProgress,
        dwellTarget,
        updateGaze,
    };
}
