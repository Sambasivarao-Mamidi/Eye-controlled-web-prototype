/**
 * Least Squares Regression for mapping eye coordinates to screen coordinates
 * 
 * Uses the normal equation: β = (X^T X)^(-1) X^T y
 * Where X contains [1, eyeX, eyeY] for each calibration point
 * And y contains the corresponding screen coordinates
 */

export interface CalibrationPoint {
    eyeX: number;
    eyeY: number;
    screenX: number;
    screenY: number;
}

export interface RegressionCoefficients {
    // screenX = a0 + a1*eyeX + a2*eyeY
    xCoeffs: [number, number, number];
    // screenY = b0 + b1*eyeX + b2*eyeY
    yCoeffs: [number, number, number];
}

/**
 * Compute 3x3 matrix inverse
 */
function invertMatrix3x3(m: number[][]): number[][] | null {
    const [[a, b, c], [d, e, f], [g, h, i]] = m;

    const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);

    if (Math.abs(det) < 1e-10) {
        return null; // Matrix is singular
    }

    const invDet = 1 / det;

    return [
        [
            (e * i - f * h) * invDet,
            (c * h - b * i) * invDet,
            (b * f - c * e) * invDet,
        ],
        [
            (f * g - d * i) * invDet,
            (a * i - c * g) * invDet,
            (c * d - a * f) * invDet,
        ],
        [
            (d * h - e * g) * invDet,
            (b * g - a * h) * invDet,
            (a * e - b * d) * invDet,
        ],
    ];
}

/**
 * Multiply 3x3 matrix with 3x1 vector
 */
function multiplyMatrixVector(m: number[][], v: number[]): number[] {
    return [
        m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
        m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
        m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
    ];
}

/**
 * Perform least squares regression to compute mapping coefficients
 */
export function computeRegressionCoefficients(
    points: CalibrationPoint[]
): RegressionCoefficients | null {
    if (points.length < 3) {
        console.error('Need at least 3 calibration points');
        return null;
    }

    const n = points.length;

    // Build X^T X matrix (3x3)
    let sumOne = n;
    let sumX = 0, sumY = 0;
    let sumXX = 0, sumXY = 0, sumYY = 0;
    let sumScreenX = 0, sumScreenY = 0;
    let sumXScreenX = 0, sumYScreenX = 0;
    let sumXScreenY = 0, sumYScreenY = 0;

    for (const p of points) {
        sumX += p.eyeX;
        sumY += p.eyeY;
        sumXX += p.eyeX * p.eyeX;
        sumXY += p.eyeX * p.eyeY;
        sumYY += p.eyeY * p.eyeY;
        sumScreenX += p.screenX;
        sumScreenY += p.screenY;
        sumXScreenX += p.eyeX * p.screenX;
        sumYScreenX += p.eyeY * p.screenX;
        sumXScreenY += p.eyeX * p.screenY;
        sumYScreenY += p.eyeY * p.screenY;
    }

    // X^T X matrix
    const XtX = [
        [sumOne, sumX, sumY],
        [sumX, sumXX, sumXY],
        [sumY, sumXY, sumYY],
    ];

    // X^T y vectors
    const XtYx = [sumScreenX, sumXScreenX, sumYScreenX];
    const XtYy = [sumScreenY, sumXScreenY, sumYScreenY];

    // Invert X^T X
    const XtXInv = invertMatrix3x3(XtX);
    if (!XtXInv) {
        console.error('Matrix is singular, cannot compute regression');
        return null;
    }

    // Compute coefficients: (X^T X)^(-1) X^T y
    const xCoeffs = multiplyMatrixVector(XtXInv, XtYx) as [number, number, number];
    const yCoeffs = multiplyMatrixVector(XtXInv, XtYy) as [number, number, number];

    return { xCoeffs, yCoeffs };
}

/**
 * Map eye coordinates to screen coordinates using regression coefficients
 */
export function mapEyeToScreen(
    eyeX: number,
    eyeY: number,
    coeffs: RegressionCoefficients
): { x: number; y: number } {
    const x = coeffs.xCoeffs[0] + coeffs.xCoeffs[1] * eyeX + coeffs.xCoeffs[2] * eyeY;
    const y = coeffs.yCoeffs[0] + coeffs.yCoeffs[1] * eyeX + coeffs.yCoeffs[2] * eyeY;

    return { x, y };
}

/**
 * Simple linear interpolation fallback (for when regression fails)
 */
export function simpleLinearMap(
    eyeX: number,
    eyeY: number,
    windowWidth: number,
    windowHeight: number
): { x: number; y: number } {
    // Map normalized eye coords (0-1) to screen coords
    // Note: we invert X because the camera is mirrored
    return {
        x: (1 - eyeX) * windowWidth,
        y: eyeY * windowHeight,
    };
}
