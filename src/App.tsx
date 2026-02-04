import { useState, useEffect, useCallback } from 'react';
import { useEyeTracking } from './hooks/useEyeTracking';
import { useCalibration } from './hooks/useCalibration';
import { useDwellClick } from './hooks/useDwellClick';
import { VirtualPointer } from './components/VirtualPointer';
import { Calibration } from './components/Calibration';
import { MainDashboard } from './components/MainDashboard';

type AppState = 'permission' | 'calibrating' | 'dashboard';

function App() {
  const [appState, setAppState] = useState<AppState>('permission');
  const [screenPosition, setScreenPosition] = useState({ x: 0, y: 0 });

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

  // Map eye coordinates to screen position
  useEffect(() => {
    if (eyeCoords && isTracking) {
      const mapped = mapToScreen(eyeCoords.average.x, eyeCoords.average.y);
      setScreenPosition(mapped);

      // Update dwell detection
      if (appState === 'dashboard') {
        updateGaze(mapped.x, mapped.y);
      }
    }
  }, [eyeCoords, isTracking, mapToScreen, appState, updateGaze]);

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
    <>
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
            <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300">
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

          <p className="mt-8 text-sm text-white/40 max-w-md">
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
        x={screenPosition.x}
        y={screenPosition.y}
        dwellProgress={dwellProgress}
        isDwelling={isDwelling}
        visible={isTracking && appState === 'dashboard'}
      />

      {/* Video Feed Preview */}
      <div
        className="video-feed"
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
        <div className="absolute bottom-2 left-2 right-2 text-center text-xs text-white/70 bg-black/50 rounded px-2 py-1">
          Camera Feed (Mirrored)
        </div>
      </div>

      {/* Debug info (hidden in production) */}
      {import.meta.env.DEV && isTracking && eyeCoords && (
        <div className="fixed bottom-20 right-4 glass-card text-xs font-mono z-50">
          <div className="text-white/50 mb-1">Debug Info:</div>
          <div>Eye: ({eyeCoords.average.x.toFixed(4)}, {eyeCoords.average.y.toFixed(4)})</div>
          <div>Screen: ({screenPosition.x.toFixed(0)}, {screenPosition.y.toFixed(0)})</div>
          <div>Dwell: {(dwellProgress * 100).toFixed(0)}%</div>
          <div>Calibrated: {calibrationState.isComplete ? 'Yes' : 'No'}</div>
        </div>
      )}
    </>
  );
}

export default App;
