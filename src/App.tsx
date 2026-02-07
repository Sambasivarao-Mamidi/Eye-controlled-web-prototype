import { useState, useEffect, useCallback, useRef } from 'react';
import { useEyeTracking } from './hooks/useEyeTracking';
import { useCalibration } from './hooks/useCalibration';
import { useDwellClick } from './hooks/useDwellClick';
import { VirtualPointer } from './components/VirtualPointer';
import { Calibration } from './components/Calibration';
import { MainDashboard } from './components/MainDashboard';

type AppState = 'permission' | 'calibrating' | 'dashboard';

// Faster smoothing for more responsive pointer (0.35 = 35% new, 65% old)
const SCREEN_SMOOTHING_FACTOR = 0.35;

function App() {
  const [appState, setAppState] = useState<AppState>('permission');

  // Use ref-based position for high-frequency updates (avoids React re-renders)
  const screenPosRef = useRef({ x: 0, y: 0 });
  const [pointerPos, setPointerPos] = useState({ x: 0, y: 0 });
  const rafIdRef = useRef<number | null>(null);

  // Initialize hooks
  const {
    isLoading,
    isTracking,
    error,
    eyeCoords,
    videoRef,
    startTracking,
    stopTracking,
  } = useEyeTracking();

  const {
    state: calibrationState,
    calibrationTargets,
    startCalibration,
    recordPoint,
    resetCalibration,
    mapToScreen,
  } = useCalibration();

  const {
    isDwelling,
    dwellProgress,
    updateGaze,
  } = useDwellClick({}, appState === 'dashboard' && calibrationState.isComplete);

  // Smooth pointer update loop using RAF - bypasses React for smooth 60fps
  useEffect(() => {
    if (!isTracking) return;

    let lastTime = performance.now();
    const THROTTLE_MS = 16; // ~60fps

    const updatePointer = () => {
      const now = performance.now();

      // Throttle updates to ~60fps to prevent excessive state updates
      if (now - lastTime >= THROTTLE_MS) {
        lastTime = now;
        setPointerPos({ ...screenPosRef.current });

        // Update dwell detection
        if (appState === 'dashboard') {
          updateGaze(screenPosRef.current.x, screenPosRef.current.y);
        }
      }

      rafIdRef.current = requestAnimationFrame(updatePointer);
    };

    rafIdRef.current = requestAnimationFrame(updatePointer);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [isTracking, appState, updateGaze]);

  // Map eye coordinates to screen position (updates ref, not state)
  useEffect(() => {
    if (eyeCoords && isTracking) {
      const mapped = mapToScreen(eyeCoords.average.x, eyeCoords.average.y);
      const prev = screenPosRef.current;

      // Apply smoothing directly to ref
      screenPosRef.current = {
        x: prev.x + SCREEN_SMOOTHING_FACTOR * (mapped.x - prev.x),
        y: prev.y + SCREEN_SMOOTHING_FACTOR * (mapped.y - prev.y),
      };
    }
  }, [eyeCoords, isTracking, mapToScreen]);

  // Handle start button click
  const handleStart = useCallback(async () => {
    await startTracking();
  }, [startTracking]);

  // Start calibration when tracking begins
  useEffect(() => {
    if (isTracking && appState === 'permission') {
      setAppState('calibrating');
      startCalibration();
    }
  }, [isTracking, appState, startCalibration]);

  // Move to dashboard when calibration completes
  useEffect(() => {
    if (calibrationState.isComplete && appState === 'calibrating') {
      setAppState('dashboard');
    }
  }, [calibrationState.isComplete, appState]);

  // Handle skip calibration
  const handleSkipCalibration = useCallback(() => {
    resetCalibration();
    setAppState('dashboard');
  }, [resetCalibration]);

  // Handle recalibration
  const handleRecalibrate = useCallback(() => {
    resetCalibration();
    startCalibration();
    setAppState('calibrating');
  }, [resetCalibration, startCalibration]);

  // Handle stop tracking
  const handleStopTracking = useCallback(() => {
    stopTracking();
    resetCalibration();
    setAppState('permission');
  }, [stopTracking, resetCalibration]);

  return (
    <div className={`app-container ${appState}`}>
      {/* Permission Screen */}
      {appState === 'permission' && (
        <div className="permission-screen">
          <div className="float-animation mb-8">
            <span className="text-8xl">👁️</span>
          </div>
          <h1>Eye Control System</h1>
          <p>
            Control this interface using only your eyes!
            We'll access your camera to track your gaze and enable hands-free interaction.
          </p>

          {error && (
            <div className="mb-4 p-4 bg-red-950/50 border border-red-600 rounded text-red-300">
              <strong>Error:</strong> {error}
            </div>
          )}

          <button
            onClick={handleStart}
            disabled={isLoading}
            className="start-button"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12" cy="12" r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Initializing...
              </span>
            ) : (
              'Enable Eye Tracking'
            )}
          </button>

          <p className="mt-8 text-sm text-gray-500 max-w-md">
            Your camera feed is processed locally and never sent to any server.
            We use MediaPipe Face Mesh for real-time iris detection.
          </p>
        </div>
      )}

      {/* Calibration Screen */}
      {appState === 'calibrating' && (
        <Calibration
          state={calibrationState}
          calibrationTargets={calibrationTargets}
          eyeCoords={eyeCoords}
          onRecordPoint={recordPoint}
          onSkip={handleSkipCalibration}
        />
      )}

      {/* Main Dashboard */}
      {appState === 'dashboard' && (
        <MainDashboard
          isTracking={isTracking}
          isCalibrated={calibrationState.isComplete}
          onRecalibrate={handleRecalibrate}
          onStopTracking={handleStopTracking}
        />
      )}

      {/* Virtual Pointer - always visible when tracking */}
      <VirtualPointer
        x={pointerPos.x}
        y={pointerPos.y}
        dwellProgress={dwellProgress}
        isDwelling={isDwelling}
        visible={isTracking && appState === 'dashboard'}
      />

      {/* Video Feed Preview */}
      <div
        className={`video-feed ${appState === 'dashboard' ? 'video-feed-dashboard' : 'video-feed-calibration'} ${appState === 'permission' ? 'video-feed-permission' : ''}`}
        style={{
          display: isTracking ? 'block' : 'none',
          opacity: appState === 'calibrating' ? 1 : 0.7,
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
        />
        <div className="absolute transparent bottom-0 left-2 right-2 text-center text-xs text-white/70 bg-black/50 rounded px-2 py-1">
          Camera Feed (Mirrored)
        </div>
      </div>

      {/* Debug info (hidden in production) */}
      {/* {import.meta.env.DEV && isTracking && eyeCoords && (
        <div className="fixed bottom-20  right-4 glass-card text-xs font-mono z-50 text-gray-300">
          <div className="text-gray-400 mb-1">Debug Info:</div>
          <div>Eye: ({eyeCoords.average.x.toFixed(4)}, {eyeCoords.average.y.toFixed(4)})</div>
          <div>Screen: ({pointerPos.x.toFixed(0)}, {pointerPos.y.toFixed(0)})</div>
          <div>Dwell: {(dwellProgress * 100).toFixed(0)}%</div>
          <div>Calibrated: {calibrationState.isComplete ? 'Yes' : 'No'}</div>
        </div>
      )} */}
    </div>
  );
}

export default App;
