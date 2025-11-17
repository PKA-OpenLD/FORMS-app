'use client';
import { useState } from 'react';

interface AdminPanelProps {
    map: any | null;
    onDrawZone: (type: 'flood' | 'outage', shape: 'circle' | 'line') => void;
    onClearZones: () => void;
}

export default function AdminPanel({ map, onDrawZone, onClearZones }: AdminPanelProps) {
    const [isOpen, setIsOpen] = useState(true);
    const [activeDrawMode, setActiveDrawMode] = useState<'flood' | 'outage' | null>(null);

    const handleDrawClick = (type: 'flood' | 'outage', shape: 'circle' | 'line') => {
        setActiveDrawMode(type);
        onDrawZone(type, shape);
    };

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed top-4 left-4 z-50 bg-white rounded-lg shadow-lg p-3 hover:bg-gray-50 transition-colors"
            >
                <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                    />
                </svg>
            </button>

            {/* Admin Panel */}
            {isOpen && (
                <div className="fixed top-20 left-4 z-40 bg-white rounded-lg shadow-xl w-80 max-h-[80vh] overflow-y-auto">
                    <div className="p-6">
                        <h2 className="text-2xl font-bold mb-4 text-gray-800">Admin Panel</h2>
                        
                        {/* Drawing Tools */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-3 text-gray-700">Flood Risk</h3>
                            <div className="space-y-2">
                                <button
                                    onClick={() => handleDrawClick('flood', 'circle')}
                                    className={`w-full p-3 rounded-lg font-medium transition-all ${
                                        activeDrawMode === 'flood'
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                    }`}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                                        Draw Zone (Circle)
                                    </div>
                                </button>
                                <button
                                    onClick={() => handleDrawClick('flood', 'line')}
                                    className="w-full p-3 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-colors"
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-6 h-1 bg-blue-500"></div>
                                        Draw Route (Line)
                                    </div>
                                </button>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-3 text-gray-700">Power Outage</h3>
                            <div className="space-y-2">
                                <button
                                    onClick={() => handleDrawClick('outage', 'circle')}
                                    className={`w-full p-3 rounded-lg font-medium transition-all ${
                                        activeDrawMode === 'outage'
                                            ? 'bg-red-600 text-white shadow-md'
                                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                                    }`}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                                        Draw Zone (Circle)
                                    </div>
                                </button>
                                <button
                                    onClick={() => handleDrawClick('outage', 'line')}
                                    className="w-full p-3 bg-red-50 text-red-700 rounded-lg font-medium hover:bg-red-100 transition-colors"
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-6 h-1 bg-red-500"></div>
                                        Draw Route (Line)
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Zone Management */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-3 text-gray-700">Zone Management</h3>
                            <button
                                onClick={onClearZones}
                                className="w-full p-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                            >
                                Clear All Zones
                            </button>
                        </div>

                        {/* Instructions */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-sm font-semibold mb-2 text-gray-700">Instructions</h3>
                            <div className="text-sm text-gray-600 space-y-2">
                                <div>
                                    <p className="font-semibold">Zone (Circle):</p>
                                    <ul className="space-y-1 ml-2">
                                        <li>• Click to set center</li>
                                        <li>• Move to adjust radius</li>
                                        <li>• Click to finish area</li>
                                    </ul>
                                </div>
                                <div>
                                    <p className="font-semibold">Route (Line):</p>
                                    <ul className="space-y-1 ml-2">
                                        <li>• Click to add points</li>
                                        <li>• Double-click or Enter to finish</li>
                                        <li>• ESC to cancel</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-sm font-semibold mb-2 text-gray-700">Legend</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-blue-500 rounded-full opacity-50"></div>
                                    <span className="text-gray-600">Flood Risk Zone</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-1 bg-blue-500"></div>
                                    <span className="text-gray-600">Flood Route</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-red-500 rounded-full opacity-50"></div>
                                    <span className="text-gray-600">Outage Zone</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-1 bg-red-500"></div>
                                    <span className="text-gray-600">Outage Route</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
