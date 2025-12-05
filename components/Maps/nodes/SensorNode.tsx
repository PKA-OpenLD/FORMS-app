'use client';
import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDroplet, faTemperatureHigh, faWind } from '@fortawesome/free-solid-svg-icons';

interface SensorNodeData {
    label: string;
    type: 'water_level' | 'temperature' | 'humidity';
    threshold: number;
    sensorId: string;
}

function SensorNode({ data }: { data: SensorNodeData }) {
    const icons = {
        water_level: faDroplet,
        temperature: faTemperatureHigh,
        humidity: faWind
    };

    return (
        <div className="bg-white border-2 border-green-400 rounded-xl shadow-lg p-4 min-w-[200px]">
            <div className="flex items-center gap-2 mb-2">
                <FontAwesomeIcon icon={icons[data.type]} className="text-2xl text-green-600" />
                <div className="flex-1">
                    <div className="font-bold text-sm text-gray-800">{data.label}</div>
                    <div className="text-xs text-gray-500">{data.type.replace('_', ' ')}</div>
                </div>
            </div>
            <div className="text-xs bg-green-50 px-2 py-1 rounded text-green-700 font-mono">
                Ngưỡng: {data.threshold}
            </div>
            <Handle 
                type="source" 
                position={Position.Right} 
                className="!bg-green-500 !w-3 !h-3 !border-2 !border-white"
            />
        </div>
    );
}

export default memo(SensorNode);
