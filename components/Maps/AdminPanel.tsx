'use client';
import { useState, useEffect } from 'react';

interface Sensor {
    id: string;
    name: string;
    location: [number, number];
    type: 'water_level' | 'temperature' | 'humidity';
    threshold: number;
    actionType: 'flood' | 'outage';
}

interface SensorRule {
    id: string;
    name: string;
    type: '1-sensor' | '2-sensor';
    sensors: string[];
    operator?: 'AND' | 'OR';
    actionType: 'flood' | 'outage';
    actionShape: 'circle' | 'line';
    enabled: boolean;
}

interface AdminPanelProps {
    map: any | null;
    onDrawZone: (type: 'flood' | 'outage', shape: 'circle' | 'line') => void;
    onClearZones: () => void;
    onAddSensor?: (sensor: Omit<Sensor, 'id'>) => void;
    onAddSensorRule?: (rule: Omit<SensorRule, 'id'>) => void;
}

export default function AdminPanel({ map, onDrawZone, onClearZones, onAddSensor, onAddSensorRule }: AdminPanelProps) {
    const [isOpen, setIsOpen] = useState(true);
    const [activeDrawMode, setActiveDrawMode] = useState<'flood' | 'outage' | null>(null);
    const [activeTab, setActiveTab] = useState<'zones' | 'sensors'>('zones');
    const [sensors, setSensors] = useState<Sensor[]>([]);
    const [sensorRules, setSensorRules] = useState<SensorRule[]>([]);
    const [isAddingSensor, setIsAddingSensor] = useState(false);
    const [isAddingRule, setIsAddingRule] = useState(false);
    const [newSensor, setNewSensor] = useState({
        name: '',
        type: 'water_level' as 'water_level' | 'temperature' | 'humidity',
        threshold: 0,
        actionType: 'flood' as 'flood' | 'outage'
    });
    const [newRule, setNewRule] = useState({
        name: '',
        type: '1-sensor' as '1-sensor' | '2-sensor',
        sensors: [] as string[],
        operator: 'AND' as 'AND' | 'OR',
        actionType: 'flood' as 'flood' | 'outage',
        actionShape: 'line' as 'circle' | 'line'
    });

    const handleDrawClick = (type: 'flood' | 'outage', shape: 'circle' | 'line') => {
        setActiveDrawMode(type);
        onDrawZone(type, shape);
    };

    // Load sensors and rules
    useEffect(() => {
        fetch('/api/sensors')
            .then(res => res.json())
            .then(data => setSensors(data.sensors || []))
            .catch(err => console.error('Failed to load sensors:', err));

        fetch('/api/sensor-rules')
            .then(res => res.json())
            .then(data => setSensorRules(data.rules || []))
            .catch(err => console.error('Failed to load sensor rules:', err));
    }, []);

    const handleAddSensorClick = () => {
        if (!map) return;
        setIsAddingSensor(true);
        
        const handleMapClick = (e: any) => {
            const { lng, lat } = e.lngLat;
            const sensor = {
                ...newSensor,
                id: `sensor-${Date.now()}`,
                location: [lng, lat] as [number, number],
                createdAt: Date.now()
            };

            fetch('/api/sensors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sensor)
            }).then(res => res.json())
              .then(data => {
                  setSensors(prev => [...prev, data.sensor]);
                  setIsAddingSensor(false);
                  setNewSensor({
                      name: '',
                      type: 'water_level',
                      threshold: 0,
                      actionType: 'flood'
                  });
                  map.off('click', handleMapClick);
                  if (onAddSensor) onAddSensor(sensor);
              });
        };

        map.once('click', handleMapClick);
    };

    const handleCreateRule = () => {
        const rule = {
            ...newRule,
            id: `rule-${Date.now()}`,
            enabled: true,
            createdAt: Date.now()
        };

        fetch('/api/sensor-rules', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rule)
        }).then(res => res.json())
          .then(data => {
              setSensorRules(prev => [...prev, data.rule]);
              setIsAddingRule(false);
              setNewRule({
                  name: '',
                  type: '1-sensor',
                  sensors: [],
                  operator: 'AND',
                  actionType: 'flood',
                  actionShape: 'line'
              });
              if (onAddSensorRule) onAddSensorRule(rule);
          });
    };

    const toggleRule = (id: string) => {
        fetch(`/api/sensor-rules?id=${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled: !sensorRules.find(r => r.id === id)?.enabled })
        }).then(() => {
            setSensorRules(prev => prev.map(r => 
                r.id === id ? { ...r, enabled: !r.enabled } : r
            ));
        });
    };

    const deleteSensor = (id: string) => {
        fetch(`/api/sensors?id=${id}`, { method: 'DELETE' })
            .then(() => setSensors(prev => prev.filter(s => s.id !== id)));
    };

    const deleteRule = (id: string) => {
        fetch(`/api/sensor-rules?id=${id}`, { method: 'DELETE' })
            .then(() => setSensorRules(prev => prev.filter(r => r.id !== id)));
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
                <div className="fixed top-20 left-4 z-40 bg-white rounded-lg shadow-xl w-96 max-h-[85vh] overflow-y-auto">
                    <div className="p-6">
                        <h2 className="text-2xl font-bold mb-4 text-gray-800">Admin Panel</h2>
                        
                        {/* Tabs */}
                        <div className="flex gap-2 mb-6 border-b">
                            <button
                                onClick={() => setActiveTab('zones')}
                                className={`pb-2 px-4 font-medium transition-colors ${
                                    activeTab === 'zones'
                                        ? 'border-b-2 border-blue-500 text-blue-600'
                                        : 'text-gray-600 hover:text-gray-800'
                                }`}
                            >
                                Zones
                            </button>
                            <button
                                onClick={() => setActiveTab('sensors')}
                                className={`pb-2 px-4 font-medium transition-colors ${
                                    activeTab === 'sensors'
                                        ? 'border-b-2 border-green-500 text-green-600'
                                        : 'text-gray-600 hover:text-gray-800'
                                }`}
                            >
                                Sensors
                            </button>
                        </div>

                        {activeTab === 'zones' && (
                            <>
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
                            </>
                        )}

                        {activeTab === 'sensors' && (
                            <>
                                {/* Add Sensor Card */}
                                <div className="mb-6 border-2 border-green-200 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 p-5 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-lg">
                                            📡
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-800">Add New Sensor</h3>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                Sensor Name *
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g., River Bank Station A"
                                                value={newSensor.name}
                                                onChange={(e) => setNewSensor({ ...newSensor, name: e.target.value })}
                                                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-green-400 focus:outline-none transition-colors"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                    Sensor Type
                                                </label>
                                                <select
                                                    value={newSensor.type}
                                                    onChange={(e) => setNewSensor({ ...newSensor, type: e.target.value as any })}
                                                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-green-400 focus:outline-none transition-colors bg-white"
                                                >
                                                    <option value="water_level">💧 Water Level</option>
                                                    <option value="temperature">🌡️ Temperature</option>
                                                    <option value="humidity">💨 Humidity</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                    Threshold
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    placeholder="e.g., 5.5"
                                                    value={newSensor.threshold || ''}
                                                    onChange={(e) => setNewSensor({ ...newSensor, threshold: parseFloat(e.target.value) || 0 })}
                                                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-green-400 focus:outline-none transition-colors"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                Alert Type
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setNewSensor({ ...newSensor, actionType: 'flood' })}
                                                    className={`p-3 rounded-lg font-medium transition-all ${
                                                        newSensor.actionType === 'flood'
                                                            ? 'bg-blue-500 text-white shadow-md scale-105'
                                                            : 'bg-white border-2 border-blue-200 text-blue-700 hover:border-blue-400'
                                                    }`}
                                                >
                                                    🌊 Flood
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setNewSensor({ ...newSensor, actionType: 'outage' })}
                                                    className={`p-3 rounded-lg font-medium transition-all ${
                                                        newSensor.actionType === 'outage'
                                                            ? 'bg-red-500 text-white shadow-md scale-105'
                                                            : 'bg-white border-2 border-red-200 text-red-700 hover:border-red-400'
                                                    }`}
                                                >
                                                    ⚡ Outage
                                                </button>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleAddSensorClick}
                                            disabled={!newSensor.name || !newSensor.threshold || isAddingSensor}
                                            className={`w-full p-4 rounded-xl font-bold text-lg transition-all ${
                                                isAddingSensor
                                                    ? 'bg-yellow-400 text-yellow-900 animate-pulse shadow-lg'
                                                    : !newSensor.name || !newSensor.threshold
                                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                    : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-xl hover:scale-105'
                                            }`}
                                        >
                                            {isAddingSensor ? '📍 Click on Map to Place Sensor...' : '🗺️ Place Sensor on Map'}
                                        </button>

                                        {isAddingSensor && (
                                            <p className="text-sm text-yellow-700 bg-yellow-100 p-2 rounded text-center animate-pulse">
                                                ⬆️ Click anywhere on the map to place your sensor
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Sensors List */}
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-lg font-bold text-gray-800">
                                            📍 Deployed Sensors
                                            <span className="ml-2 text-sm font-normal bg-gray-200 px-2 py-1 rounded-full">
                                                {sensors.length}
                                            </span>
                                        </h3>
                                    </div>
                                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                        {sensors.map(sensor => (
                                            <div key={sensor.id} className="bg-white border-2 border-gray-200 p-4 rounded-lg hover:border-green-300 transition-all hover:shadow-md group">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-lg">
                                                                {sensor.type === 'water_level' ? '💧' : 
                                                                 sensor.type === 'temperature' ? '🌡️' : '💨'}
                                                            </span>
                                                            <p className="font-bold text-gray-800">{sensor.name}</p>
                                                        </div>
                                                        <div className="ml-7 space-y-1">
                                                            <p className="text-sm text-gray-600">
                                                                <span className="font-semibold">Type:</span> {sensor.type.replace('_', ' ')}
                                                            </p>
                                                            <p className="text-sm text-gray-600">
                                                                <span className="font-semibold">Threshold:</span> {sensor.threshold}
                                                            </p>
                                                            <p className="text-xs text-gray-500 font-mono">
                                                                {sensor.location[1].toFixed(5)}, {sensor.location[0].toFixed(5)}
                                                            </p>
                                                            <span className={`inline-block text-xs px-2 py-1 rounded-full ${
                                                                sensor.actionType === 'flood' 
                                                                    ? 'bg-blue-100 text-blue-700' 
                                                                    : 'bg-red-100 text-red-700'
                                                            }`}>
                                                                {sensor.actionType === 'flood' ? '🌊 Flood Alert' : '⚡ Outage Alert'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => deleteSensor(sensor.id)}
                                                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                        title="Delete sensor"
                                                    >
                                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {sensors.length === 0 && (
                                            <div className="text-center py-8 text-gray-400">
                                                <div className="text-4xl mb-2">📡</div>
                                                <p className="text-sm">No sensors deployed yet</p>
                                                <p className="text-xs mt-1">Add your first sensor above</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="border-t-2 border-gray-200 my-6"></div>

                                {/* Add Sensor Rule */}
                                <div className="mb-6">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-lg">
                                            ⚙️
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-800">Automation Rules</h3>
                                    </div>
                                    
                                    {!isAddingRule ? (
                                        <button
                                            onClick={() => setIsAddingRule(true)}
                                            disabled={sensors.length === 0}
                                            className={`w-full p-4 rounded-xl font-bold transition-all ${
                                                sensors.length === 0
                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    : 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 hover:from-purple-200 hover:to-indigo-200 border-2 border-purple-300 hover:shadow-lg'
                                            }`}
                                        >
                                            + Create New Rule
                                        </button>
                                    ) : (
                                        <div className="space-y-4 bg-gradient-to-br from-purple-50 to-indigo-50 p-5 rounded-xl border-2 border-purple-200">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                    Rule Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g., High Water Alert"
                                                    value={newRule.name}
                                                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                                                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-400 focus:outline-none transition-colors"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Rule Type
                                                </label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setNewRule({ ...newRule, type: '1-sensor', sensors: [] })}
                                                        className={`p-3 rounded-lg font-medium transition-all ${
                                                            newRule.type === '1-sensor'
                                                                ? 'bg-purple-500 text-white shadow-md'
                                                                : 'bg-white border-2 border-purple-200 text-purple-700 hover:border-purple-400'
                                                        }`}
                                                    >
                                                        Single Sensor
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setNewRule({ ...newRule, type: '2-sensor', sensors: [] })}
                                                        className={`p-3 rounded-lg font-medium transition-all ${
                                                            newRule.type === '2-sensor'
                                                                ? 'bg-purple-500 text-white shadow-md'
                                                                : 'bg-white border-2 border-purple-200 text-purple-700 hover:border-purple-400'
                                                        }`}
                                                    >
                                                        Two Sensors
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                    {newRule.type === '1-sensor' ? 'Select Sensor' : 'First Sensor'}
                                                </label>
                                                <select
                                                    value={newRule.sensors[0] || ''}
                                                    onChange={(e) => setNewRule({ ...newRule, sensors: [e.target.value, newRule.sensors[1] || ''].filter(Boolean) })}
                                                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-400 focus:outline-none transition-colors bg-white"
                                                >
                                                    <option value="">-- Choose a sensor --</option>
                                                    {sensors.map(s => (
                                                        <option key={s.id} value={s.id}>
                                                            {s.type === 'water_level' ? '💧' : s.type === 'temperature' ? '🌡️' : '💨'} {s.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {newRule.type === '2-sensor' && (
                                                <>
                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                            Logic Operator
                                                        </label>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => setNewRule({ ...newRule, operator: 'AND' })}
                                                                className={`p-3 rounded-lg font-medium transition-all ${
                                                                    newRule.operator === 'AND'
                                                                        ? 'bg-indigo-500 text-white shadow-md'
                                                                        : 'bg-white border-2 border-indigo-200 text-indigo-700 hover:border-indigo-400'
                                                                }`}
                                                            >
                                                                AND (Both)
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setNewRule({ ...newRule, operator: 'OR' })}
                                                                className={`p-3 rounded-lg font-medium transition-all ${
                                                                    newRule.operator === 'OR'
                                                                        ? 'bg-indigo-500 text-white shadow-md'
                                                                        : 'bg-white border-2 border-indigo-200 text-indigo-700 hover:border-indigo-400'
                                                                }`}
                                                            >
                                                                OR (Either)
                                                            </button>
                                                        </div>
                                                    </div>
                                                    
                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                            Second Sensor
                                                        </label>
                                                        <select
                                                            value={newRule.sensors[1] || ''}
                                                            onChange={(e) => setNewRule({ ...newRule, sensors: [newRule.sensors[0] || '', e.target.value].filter(Boolean) })}
                                                            className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-400 focus:outline-none transition-colors bg-white"
                                                        >
                                                            <option value="">-- Choose a sensor --</option>
                                                            {sensors.filter(s => s.id !== newRule.sensors[0]).map(s => (
                                                                <option key={s.id} value={s.id}>
                                                                    {s.type === 'water_level' ? '💧' : s.type === 'temperature' ? '🌡️' : '💨'} {s.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </>
                                            )}

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Action to Take
                                                </label>
                                                <div className="grid grid-cols-2 gap-2 mb-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setNewRule({ ...newRule, actionType: 'flood' })}
                                                        className={`p-3 rounded-lg font-medium transition-all ${
                                                            newRule.actionType === 'flood'
                                                                ? 'bg-blue-500 text-white shadow-md'
                                                                : 'bg-white border-2 border-blue-200 text-blue-700 hover:border-blue-400'
                                                        }`}
                                                    >
                                                        🌊 Flood
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setNewRule({ ...newRule, actionType: 'outage' })}
                                                        className={`p-3 rounded-lg font-medium transition-all ${
                                                            newRule.actionType === 'outage'
                                                                ? 'bg-red-500 text-white shadow-md'
                                                                : 'bg-white border-2 border-red-200 text-red-700 hover:border-red-400'
                                                        }`}
                                                    >
                                                        ⚡ Outage
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setNewRule({ ...newRule, actionShape: 'circle' })}
                                                        className={`p-3 rounded-lg font-medium transition-all ${
                                                            newRule.actionShape === 'circle'
                                                                ? 'bg-gray-700 text-white shadow-md'
                                                                : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-500'
                                                        }`}
                                                    >
                                                        ⭕ Circle
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setNewRule({ ...newRule, actionShape: 'line' })}
                                                        className={`p-3 rounded-lg font-medium transition-all ${
                                                            newRule.actionShape === 'line'
                                                                ? 'bg-gray-700 text-white shadow-md'
                                                                : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-500'
                                                        }`}
                                                    >
                                                        ━ Line
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 pt-2">
                                                <button
                                                    onClick={handleCreateRule}
                                                    disabled={!newRule.name || newRule.sensors.length === 0 || (newRule.type === '2-sensor' && newRule.sensors.length < 2)}
                                                    className={`flex-1 p-3 rounded-lg font-bold transition-all ${
                                                        !newRule.name || newRule.sensors.length === 0 || (newRule.type === '2-sensor' && newRule.sensors.length < 2)
                                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                            : 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:shadow-lg hover:scale-105'
                                                    }`}
                                                >
                                                    ✓ Create Rule
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setIsAddingRule(false);
                                                        setNewRule({
                                                            name: '',
                                                            type: '1-sensor',
                                                            sensors: [],
                                                            operator: 'AND',
                                                            actionType: 'flood',
                                                            actionShape: 'line'
                                                        });
                                                    }}
                                                    className="px-6 p-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Sensor Rules List */}
                                {sensorRules.length > 0 && (
                                    <div className="mb-6">
                                        <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                                            Active Rules ({sensorRules.length})
                                        </h4>
                                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                            {sensorRules.map(rule => {
                                                const sensorNames = rule.sensors.map(sid => sensors.find(s => s.id === sid)?.name || 'Unknown').join(` ${rule.operator || ''} `);
                                                return (
                                                    <div key={rule.id} className={`bg-white border-2 p-4 rounded-lg transition-all hover:shadow-md group ${
                                                        rule.enabled ? 'border-green-300' : 'border-gray-200'
                                                    }`}>
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <p className="font-bold text-gray-800">{rule.name}</p>
                                                                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                                                                        rule.enabled 
                                                                            ? 'bg-green-100 text-green-700' 
                                                                            : 'bg-gray-200 text-gray-600'
                                                                    }`}>
                                                                        {rule.enabled ? '● ACTIVE' : '○ PAUSED'}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-gray-600 mb-1">
                                                                    <span className="font-semibold">Trigger:</span> {sensorNames}
                                                                </p>
                                                                <p className="text-sm text-gray-600">
                                                                    <span className="font-semibold">Action:</span> Draw {rule.actionShape} for{' '}
                                                                    <span className={rule.actionType === 'flood' ? 'text-blue-600' : 'text-red-600'}>
                                                                        {rule.actionType === 'flood' ? '🌊 flood' : '⚡ outage'}
                                                                    </span>
                                                                </p>
                                                            </div>
                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={() => toggleRule(rule.id)}
                                                                    className={`p-2 rounded-lg transition-all hover:shadow-md ${
                                                                        rule.enabled
                                                                            ? 'text-yellow-600 hover:bg-yellow-50'
                                                                            : 'text-green-600 hover:bg-green-50'
                                                                    }`}
                                                                    title={rule.enabled ? 'Pause rule' : 'Activate rule'}
                                                                >
                                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                                        {rule.enabled ? (
                                                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                                        ) : (
                                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                                                        )}
                                                                    </svg>
                                                                </button>
                                                                <button
                                                                    onClick={() => deleteRule(rule.id)}
                                                                    className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                                    title="Delete rule"
                                                                >
                                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
