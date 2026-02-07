import { useEffect, useRef, useState, useCallback } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import type { Results } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

export interface EyeCoordinates {
    leftIris: { x: number; y: number };
    rightIris: { x: number; y: number };
    average: { x: number; y: number };
}

export interface UseEyeTrackingReturn {
    isLoading: boolean;
    isTracking: boolean;
    error: string | null;
    eyeCoords: EyeCoordinates | null;
    videoRef: React.RefObject<HTMLVideoElement | null>;
    startTracking: () => Promise<void>;
    stopTracking: () => void;
}

// MediaPipe FaceMesh iris landmarks
// Left iris: 468 (center), 469-472 (boundary)
// Right iris: 473 (center), 474-477 (boundary)
const LEFT_IRIS_CENTER = 468;
const RIGHT_IRIS_CENTER = 473;

// Smoothing factor (0-1): lower = smoother but slower, higher = more responsive but jittery
// Using 0.3 for balanced movement - 70% previous position, 30% new position
const SMOOTHING_FACTOR = 0.3;

export function useEyeTracking(): UseEyeTrackingReturn {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const faceMeshRef = useRef<FaceMesh | null>(null);
    const cameraRef = useRef<Camera | null>(null);

    // Store previous smoothed coordinates for exponential moving average
    const prevCoordsRef = useRef<EyeCoordinates | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [isTracking, setIsTracking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [eyeCoords, setEyeCoords] = useState<EyeCoordinates | null>(null);

    const onResults = useCallback((results: Results) => {
        if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
            return;
        }

        const landmarks = results.multiFaceLandmarks[0];

        // Check if we have iris landmarks (they require face mesh with iris refinement)
        if (landmarks.length <= RIGHT_IRIS_CENTER) {
            // Fallback: use eye corner landmarks for estimation
            // Left eye: 33 (outer), 133 (inner)
            // Right eye: 362 (inner), 263 (outer)
            const leftEye = {
                x: (landmarks[33].x + landmarks[133].x) / 2,
                y: (landmarks[33].y + landmarks[133].y) / 2,
            };
            const rightEye = {
                x: (landmarks[362].x + landmarks[263].x) / 2,
                y: (landmarks[362].y + landmarks[263].y) / 2,
            };

            const rawCoords: EyeCoordinates = {
                leftIris: leftEye,
                rightIris: rightEye,
                average: {
                    x: (leftEye.x + rightEye.x) / 2,
                    y: (leftEye.y + rightEye.y) / 2,
                },
            };

            // Apply smoothing to fallback coordinates too
            if (prevCoordsRef.current) {
                const prev = prevCoordsRef.current;
                const smoothedCoords: EyeCoordinates = {
                    leftIris: {
                        x: prev.leftIris.x + SMOOTHING_FACTOR * (rawCoords.leftIris.x - prev.leftIris.x),
                        y: prev.leftIris.y + SMOOTHING_FACTOR * (rawCoords.leftIris.y - prev.leftIris.y),
                    },
                    rightIris: {
                        x: prev.rightIris.x + SMOOTHING_FACTOR * (rawCoords.rightIris.x - prev.rightIris.x),
                        y: prev.rightIris.y + SMOOTHING_FACTOR * (rawCoords.rightIris.y - prev.rightIris.y),
                    },
                    average: {
                        x: prev.average.x + SMOOTHING_FACTOR * (rawCoords.average.x - prev.average.x),
                        y: prev.average.y + SMOOTHING_FACTOR * (rawCoords.average.y - prev.average.y),
                    },
                };
                prevCoordsRef.current = smoothedCoords;
                setEyeCoords(smoothedCoords);
            } else {
                prevCoordsRef.current = rawCoords;
                setEyeCoords(rawCoords);
            }
            return;
        }

        // Get iris center landmarks
        const leftIris = landmarks[LEFT_IRIS_CENTER];
        const rightIris = landmarks[RIGHT_IRIS_CENTER];

        // Compute average gaze point (normalized 0-1)
        const avgX = (leftIris.x + rightIris.x) / 2;
        const avgY = (leftIris.y + rightIris.y) / 2;

        const rawCoords: EyeCoordinates = {
            leftIris: { x: leftIris.x, y: leftIris.y },
            rightIris: { x: rightIris.x, y: rightIris.y },
            average: { x: avgX, y: avgY },
        };

        // Apply exponential moving average smoothing to reduce jitter
        if (prevCoordsRef.current) {
            const prev = prevCoordsRef.current;
            const smoothedCoords: EyeCoordinates = {
                leftIris: {
                    x: prev.leftIris.x + SMOOTHING_FACTOR * (rawCoords.leftIris.x - prev.leftIris.x),
                    y: prev.leftIris.y + SMOOTHING_FACTOR * (rawCoords.leftIris.y - prev.leftIris.y),
                },
                rightIris: {
                    x: prev.rightIris.x + SMOOTHING_FACTOR * (rawCoords.rightIris.x - prev.rightIris.x),
                    y: prev.rightIris.y + SMOOTHING_FACTOR * (rawCoords.rightIris.y - prev.rightIris.y),
                },
                average: {
                    x: prev.average.x + SMOOTHING_FACTOR * (rawCoords.average.x - prev.average.x),
                    y: prev.average.y + SMOOTHING_FACTOR * (rawCoords.average.y - prev.average.y),
                },
            };
            prevCoordsRef.current = smoothedCoords;
            setEyeCoords(smoothedCoords);
        } else {
            // First frame - no smoothing needed
            prevCoordsRef.current = rawCoords;
            setEyeCoords(rawCoords);
        }
    }, []);

    const startTracking = useCallback(async () => {
        if (isTracking) return;

        setIsLoading(true);
        setError(null);

        try {
            // Request camera permission
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user',
                },
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            // Initialize FaceMesh
            const faceMesh = new FaceMesh({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
                },
            });

            faceMesh.setOptions({
                maxNumFaces: 1,
                refineLandmarks: true, // Required for iris tracking
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5,
            });

            faceMesh.onResults(onResults);
            faceMeshRef.current = faceMesh;

            // Initialize camera
            if (videoRef.current) {
                const camera = new Camera(videoRef.current, {
                    onFrame: async () => {
                        if (videoRef.current && faceMeshRef.current) {
                            await faceMeshRef.current.send({ image: videoRef.current });
                        }
                    },
                    width: 640,
                    height: 480,
                });

                await camera.start();
                cameraRef.current = camera;
            }

            setIsTracking(true);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to start tracking';
            setError(message);
            console.error('Eye tracking error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [isTracking, onResults]);

    const stopTracking = useCallback(() => {
        if (cameraRef.current) {
            cameraRef.current.stop();
            cameraRef.current = null;
        }

        if (faceMeshRef.current) {
            faceMeshRef.current.close();
            faceMeshRef.current = null;
        }

        if (videoRef.current?.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }

        setIsTracking(false);
        setEyeCoords(null);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopTracking();
        };
    }, [stopTracking]);

    return {
        isLoading,
        isTracking,
        error,
        eyeCoords,
        videoRef,
        startTracking,
        stopTracking,
    };
}
