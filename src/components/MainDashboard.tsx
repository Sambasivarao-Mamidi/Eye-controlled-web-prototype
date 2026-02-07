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
    { id: 'home', label: 'Home', icon: '🏠', color: 'from-blue-600 to-blue-400' },
    { id: 'settings', label: 'Settings', icon: '⚙️', color: 'from-cyan-600 to-blue-400' },
    { id: 'profile', label: 'Profile', icon: '👤', color: 'from-green-600 to-cyan-400' },
    { id: 'messages', label: 'Messages', icon: '💬', color: 'from-orange-600 to-yellow-400' },
    { id: 'search', label: 'Search', icon: '🔍', color: 'from-indigo-600 to-blue-400' },
    { id: 'help', label: 'Help', icon: '❓', color: 'from-red-600 to-orange-400' },
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
        <div className="min-h-screen bg-gray-950 flex flex-col" data-testid="dashboard-container">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between" data-testid="dashboard-header">
                    <div className="flex items-center gap-4">
                        <div className="text-3xl">👁️</div>
                        <div>
                            <h1 className="text-xl font-bold text-white">
                                Eye Control Dashboard
                            </h1>
                            <p className="text-sm text-gray-400 hidden sm:block">
                                Gaze at buttons to interact
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-30 h-15 ">
                        {/* Status */}
                        <div className={`w-30 h-15 status-indicator ${isTracking ? (isCalibrated ? 'active' : 'calibrating') : 'inactive'}`} data-testid="dashboard-status-indicator">
                            <div className="status-dot" />
                            <span data-testid="dashboard-status-text" className="hidden sm:inline ">
                                {isTracking
                                    ? (isCalibrated ? 'Active' : 'Uncalibrated')
                                    : 'Off'
                                }
                            </span>
                        </div>

                        {/* Control buttons */}
                        <div className="flex items-center gap-2 w-100 p-10 ">
                            <button
                                onClick={onRecalibrate}
                                className="px-3 py-1.5 rounded-md border border-gray-700 bg-gray-800 hover:bg-gray-700 
                                text-gray-200 text-sm font-medium transition-colors w-30 h-15"
                            >
                                Recalibrate
                            </button>
                            <button
                                onClick={onStopTracking}
                                className="px-3 py-1.5 rounded-md border border-red-900/50 bg-red-950/30 hover:bg-red-900/50 
                                text-red-400 text-sm font-medium transition-colors w-30 h-15"
                            >
                                Stop
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main content - 2 Column Layout */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8" data-testid="dashboard-main">

                {/* Left Column: Primary Interface (8 cols) */}
                <div className="lg:col-span-8 flex flex-col gap-8">
                    {/* Instructions */}
                    <div className="w-full glass-card !mt-0 !bg-gray-900/50 py-6 px-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4" data-testid="dashboard-instructions">
                        <div>
                            <h2 className="text-xl font-bold text-white mb-1">Interaction Zone</h2>
                            <p className="text-gray-400 text-sm">
                                Gaze at any button for <span className="text-blue-400 font-semibold">0.8s</span> to click.
                            </p>
                        </div>
                        <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-300 text-xs font-mono">
                            Dwell Time: 800ms
                        </div>
                    </div>

                    {/* Button Grid - Card Layout */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6" data-testid="dashboard-buttons-grid">
                        {DASHBOARD_BUTTONS.map((button) => (
                            <button
                                key={button.id}
                                onClick={() => handleButtonClick(button.id)}
                                className={`dashboard-button group relative overflow-hidden w-full aspect-[4/3]
                            ${lastClicked === button.id ? 'clicked' : ''}`}
                                data-testid={`dashboard-button-${button.id}`}
                            >
                                <div
                                    className={`absolute inset-0 bg-gradient-to-br ${button.color} opacity-0 
                            group-hover:opacity-10 transition-opacity duration-300`}
                                />

                                <span className="icon relative z-10 text-4xl mb-2 group-hover:scale-110 transition-transform duration-300">{button.icon}</span>
                                <span className="relative z-10 font-medium text-gray-200">{button.label}</span>
                                <span className="count relative z-10 text-xs text-gray-500 mt-1">
                                    {clickCounts[button.id] || 0}
                                </span>

                                {lastClicked === button.id && (
                                    <div className="absolute inset-0 animate-ping bg-white/10 rounded-lg" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Stats Bar */}
                    <div className="glass-card !mt-0 !p-6" data-testid="dashboard-stats">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="flex flex-col items-center sm:items-start">
                                <span className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Clicks</span>
                                <span className="text-2xl font-bold text-blue-400">{Object.values(clickCounts).reduce((a, b) => a + b, 0)}</span>
                            </div>
                            <div className="flex flex-col items-center sm:items-start">
                                <span className="text-xs text-gray-500 uppercase tracking-wider mb-1">Unique Buttons</span>
                                <span className="text-2xl font-bold text-green-400">{Object.keys(clickCounts).length}</span>
                            </div>
                            <div className="flex flex-col items-center sm:items-start border-t sm:border-t-0 sm:border-l border-gray-800 pt-4 sm:pt-0 sm:pl-8">
                                <span className="text-xs text-gray-500 uppercase tracking-wider mb-1">System Status</span>
                                <span className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${isTracking ? 'bg-green-500' : 'bg-red-500'}`} />
                                    <span className="text-white font-medium">{isTracking ? 'Online' : 'Paused'}</span>
                                </span>
                            </div>
                            <div className="flex flex-col items-center sm:items-start pt-4 sm:pt-0">
                                <span className="text-xs text-gray-500 uppercase tracking-wider mb-1">Calibration</span>
                                <span className="text-white font-medium">{isCalibrated ? 'Precise' : 'Default'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Sidebar (4 cols) */}
                <div className="lg:col-span-4 flex flex-col gap-6 ">
                    {/* Placeholder for Video Feed (Fixed via CSS, reserves space here) */}
                    <div className="w-full aspect-video rounded-xl opacity-0 pointer-events-none" />

                    {/* Tips Panel */}
                    <div className="absolute  w-100    top-75 left-253  glass-card mt-2 mr-2 ml-5 !p-6 bg-gradient-to-b from-blue-950/20 to-transparent border-blue-900/30 ml-20">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <span>💡</span> Pro Tips
                        </h3>
                        <ul className="space-y-4">
                            <li className="flex gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">1</span>
                                <p className="text-sm text-gray-400">Ensure your face is evenly lit. Avoid backlighting for best accuracy.</p>
                            </li>
                            <li className="flex gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">2</span>
                                <p className="text-sm text-gray-400">Sit at arm's length (approx 50-70cm) from the screen.</p>
                            </li>
                            <li className="flex gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">3</span>
                                <p className="text-sm text-gray-400">If the pointer feels drift-y, try recalibrating in the same lighting conditions.</p>
                            </li>
                        </ul>
                    </div>

                    {/* Quick Profile */}
                  
                </div>

            </main>
        </div>
    );
};

export default MainDashboard;
