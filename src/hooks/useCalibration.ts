import { useState, useCallback, useMemo } from 'react';
import type { CalibrationPoint, RegressionCoefficients } from '../utils/leastSquares';
import {
    computeRegressionCoefficients,
    mapEyeToScreen,
    simpleLinearMap,
} from '../utils/leastSquares';

export interface CalibrationState {
    isCalibrating: boolean;
    currentPointIndex: number;
    completedPoints: number[];
    calibrationPoints: CalibrationPoint[];
    isComplete: boolean;
}

export interface UseCalibrationReturn {
    state: CalibrationState;
    mappingCoeffs: RegressionCoefficients | null;
    calibrationTargets: Array<{ x: number; y: number }>;
    startCalibration: () => void;
    recordPoint: (eyeX: number, eyeY: number) => void;
    resetCalibration: () => void;
    mapToScreen: (eyeX: number, eyeY: number) => { x: number; y: number };
}

// 9-point calibration grid positions (as percentages)
const CALIBRATION_POSITIONS = [
    { x: 0.1, y: 0.1 },   // Top-left
    { x: 0.5, y: 0.1 },   // Top-center
    { x: 0.9, y: 0.1 },   // Top-right
    { x: 0.1, y: 0.5 },   // Middle-left
    { x: 0.5, y: 0.5 },   // Center
    { x: 0.9, y: 0.5 },   // Middle-right
    { x: 0.1, y: 0.9 },   // Bottom-left
    { x: 0.5, y: 0.9 },   // Bottom-center
    { x: 0.9, y: 0.9 },   // Bottom-right
];

export function useCalibration(): UseCalibrationReturn {
    const [state, setState] = useState<CalibrationState>({
        isCalibrating: false,
        currentPointIndex: 0,
        completedPoints: [],
        calibrationPoints: [],
        isComplete: false,
    });

    const [mappingCoeffs, setMappingCoeffs] = useState<RegressionCoefficients | null>(null);

    // Calculate screen positions for calibration targets
    const calibrationTargets = useMemo(() => {
        return CALIBRATION_POSITIONS.map(pos => ({
            x: pos.x * window.innerWidth,
            y: pos.y * window.innerHeight,
        }));
    }, []);

    const startCalibration = useCallback(() => {
        setState({
            isCalibrating: true,
            currentPointIndex: 0,
            completedPoints: [],
            calibrationPoints: [],
            isComplete: false,
        });
        setMappingCoeffs(null);
    }, []);

    const recordPoint = useCallback((eyeX: number, eyeY: number) => {
        setState(prev => {
            if (!prev.isCalibrating || prev.currentPointIndex >= CALIBRATION_POSITIONS.length) {
                return prev;
            }

            const target = calibrationTargets[prev.currentPointIndex];
            const newPoint: CalibrationPoint = {
                eyeX,
                eyeY,
                screenX: target.x,
                screenY: target.y,
            };

            const newCalibrationPoints = [...prev.calibrationPoints, newPoint];
            const newCompletedPoints = [...prev.completedPoints, prev.currentPointIndex];
            const nextIndex = prev.currentPointIndex + 1;
            const isComplete = nextIndex >= CALIBRATION_POSITIONS.length;

            // Compute regression coefficients when calibration is complete
            if (isComplete) {
                const coeffs = computeRegressionCoefficients(newCalibrationPoints);
                if (coeffs) {
                    setMappingCoeffs(coeffs);
                }
            }

            return {
                ...prev,
                calibrationPoints: newCalibrationPoints,
                completedPoints: newCompletedPoints,
                currentPointIndex: nextIndex,
                isCalibrating: !isComplete,
                isComplete,
            };
        });
    }, [calibrationTargets]);

    const resetCalibration = useCallback(() => {
        setState({
            isCalibrating: false,
            currentPointIndex: 0,
            completedPoints: [],
            calibrationPoints: [],
            isComplete: false,
        });
        setMappingCoeffs(null);
    }, []);

    const mapToScreen = useCallback((eyeX: number, eyeY: number): { x: number; y: number } => {
        if (mappingCoeffs) {
            // Use calibrated regression mapping
            const mapped = mapEyeToScreen(eyeX, eyeY, mappingCoeffs);

            // Clamp to screen bounds
            return {
                x: Math.max(0, Math.min(window.innerWidth, mapped.x)),
                y: Math.max(0, Math.min(window.innerHeight, mapped.y)),
            };
        }

        // Fallback to simple linear mapping
        return simpleLinearMap(eyeX, eyeY, window.innerWidth, window.innerHeight);
    }, [mappingCoeffs]);

    return {
        state,
        mappingCoeffs,
        calibrationTargets,
        startCalibration,
        recordPoint,
        resetCalibration,
        mapToScreen,
    };
}
