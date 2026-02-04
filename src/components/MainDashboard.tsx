import React, { useState } from 'react';

interface DashboardButton {
    id: string;
    label: string;
    icon: string;
    color: string;
}

interface MainDashboardProps {
    isTracking: boolean;
    isCalibrated: boolean;
    onRecalibrate: () => void;
    onStopTracking: () => void;
}

const DASHBOARD_BUTTONS: DashboardButton[] = [
    { id: 'home', label: 'Home', icon: '🏠', color: 'from-blue-500 to-cyan-500' },
    { id: 'settings', label: 'Settings', icon: '⚙️', color: 'from-purple-500 to-pink-500' },
    { id: 'profile', label: 'Profile', icon: '👤', color: 'from-green-500 to-emerald-500' },
    { id: 'messages', label: 'Messages', icon: '💬', color: 'from-orange-500 to-amber-500' },
    { id: 'search', label: 'Search', icon: '🔍', color: 'from-indigo-500 to-violet-500' },
    { id: 'help', label: 'Help', icon: '❓', color: 'from-rose-500 to-red-500' },
];

export const MainDashboard: React.FC<MainDashboardProps> = ({
    isTracking,
    isCalibrated,
    onRecalibrate,
    onStopTracking,
}) => {
    const [clickCounts, setClickCounts] = useState<Record<string, number>>({});
    const [lastClicked, setLastClicked] = useState<string | null>(null);

    const handleButtonClick = (buttonId: string) => {
        setClickCounts(prev => ({
            ...prev,
            [buttonId]: (prev[buttonId] || 0) + 1,
        }));
        setLastClicked(buttonId);

        // Clear highlight after animation
        setTimeout(() => {
            setLastClicked(null);
        }, 300);
    };

    return (
        <div className="min-h-screen p-8 pt-24">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 px-8 py-4">
                <div className="glass-card flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="text-3xl">👁️</div>
                        <div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                Eye Control Dashboard
                            </h1>
                            <p className="text-sm text-white/50">
                                Gaze at buttons to interact
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Status */}
                        <div className={`status-indicator ${isTracking ? (isCalibrated ? 'active' : 'calibrating') : 'inactive'}`}>
                            <div className="status-dot" />
                            <span>
                                {isTracking
                                    ? (isCalibrated ? 'Tracking Active' : 'Not Calibrated')
                                    : 'Tracking Off'
                                }
                            </span>
                        </div>

                        {/* Control buttons */}
                        <button
                            onClick={onRecalibrate}
                            className="px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 
                         border border-purple-500/30 text-purple-300 font-medium
                         transition-all duration-200 hover:scale-105"
                        >
                            Recalibrate
                        </button>
                        <button
                            onClick={onStopTracking}
                            className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 
                         border border-red-500/30 text-red-300 font-medium
                         transition-all duration-200 hover:scale-105"
                        >
                            Stop
                        </button>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="max-w-5xl mx-auto">
                {/* Instructions */}
                <div className="glass-card mb-8 text-center">
                    <h2 className="text-2xl font-bold mb-2">Test Eye-Click Interaction</h2>
                    <p className="text-white/70">
                        Gaze at any button below for <span className="text-purple-400 font-semibold">1.5 seconds</span> to trigger a click.
                        The progress ring around the cursor shows the dwell timer.
                    </p>
                </div>

                {/* Button Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                    {DASHBOARD_BUTTONS.map((button) => (
                        <button
                            key={button.id}
                            onClick={() => handleButtonClick(button.id)}
                            className={`dashboard-button group relative overflow-hidden
                         ${lastClicked === button.id ? 'clicked' : ''}`}
                        >
                            {/* Gradient background on hover */}
                            <div
                                className={`absolute inset-0 bg-gradient-to-br ${button.color} opacity-0 
                           group-hover:opacity-20 transition-opacity duration-300`}
                            />

                            <span className="icon relative z-10">{button.icon}</span>
                            <span className="relative z-10">{button.label}</span>
                            <span className="count relative z-10">
                                Clicks: {clickCounts[button.id] || 0}
                            </span>

                            {/* Click ripple effect */}
                            {lastClicked === button.id && (
                                <div className="absolute inset-0 animate-ping bg-white/20 rounded-3xl" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Stats */}
                <div className="glass-card">
                    <h3 className="text-lg font-semibold mb-4">Interaction Statistics</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-white/5 rounded-xl">
                            <div className="text-3xl font-bold text-purple-400">
                                {Object.values(clickCounts).reduce((a, b) => a + b, 0)}
                            </div>
                            <div className="text-sm text-white/50">Total Clicks</div>
                        </div>
                        <div className="text-center p-4 bg-white/5 rounded-xl">
                            <div className="text-3xl font-bold text-green-400">
                                {Object.keys(clickCounts).length}
                            </div>
                            <div className="text-sm text-white/50">Buttons Used</div>
                        </div>
                        <div className="text-center p-4 bg-white/5 rounded-xl">
                            <div className="text-3xl font-bold text-blue-400">
                                {isTracking ? '✓' : '✗'}
                            </div>
                            <div className="text-sm text-white/50">Eye Tracking</div>
                        </div>
                        <div className="text-center p-4 bg-white/5 rounded-xl">
                            <div className="text-3xl font-bold text-amber-400">
                                {isCalibrated ? '✓' : '✗'}
                            </div>
                            <div className="text-sm text-white/50">Calibrated</div>
                        </div>
                    </div>
                </div>

                {/* Tips */}
                <div className="mt-8 glass-card bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <span>💡</span> Tips for Best Results
                    </h3>
                    <ul className="space-y-2 text-white/70">
                        <li className="flex items-start gap-2">
                            <span className="text-green-400">•</span>
                            Ensure good lighting on your face
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-400">•</span>
                            Position yourself at arm's length from the screen
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-400">•</span>
                            Keep your head relatively still while gazing
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-400">•</span>
                            Recalibrate if tracking seems off
                        </li>
                    </ul>
                </div>
            </main>
        </div>
    );
};

export default MainDashboard;
