'use client';
import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWater, faBolt, faCircle, faGripLines, faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';

interface TriggerNodeData {
    sensorId: string;
    sensorName: string;
    condition: 'active' | 'inactive';
    actionType: 'flood' | 'outage';
    actionShape: 'circle' | 'line';
    label: string;
    points?: [number, number][];
    onEdit?: (id: string, data: TriggerNodeData) => void;
}

function TriggerNode({ id, data }: NodeProps) {
    const nodeData = data as unknown as TriggerNodeData;
    const bgColor = nodeData.actionType === 'flood' ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-red-500 to-red-600';
    const borderColor = nodeData.actionType === 'flood' ? 'border-blue-700' : 'border-red-700';
    const icon = nodeData.actionType === 'flood' ? faWater : faBolt;
    const shapeIcon = nodeData.actionShape === 'circle' ? faCircle : faGripLines;
    const conditionIcon = nodeData.condition === 'active' ? faCheckCircle : faTimesCircle;
    const conditionBg = nodeData.condition === 'active' ? 'bg-green-500' : 'bg-gray-500';

    const handleDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (nodeData.onEdit) {
            nodeData.onEdit(id, nodeData);
        }
    };

    return (
        <div 
            className={`${bgColor} ${borderColor} border-3 rounded-2xl shadow-xl p-4 min-w-[220px] text-white cursor-pointer hover:shadow-2xl hover:scale-105 transition-all`}
            onDoubleClick={handleDoubleClick}
        >
            <Handle 
                type="target" 
                position={Position.Left} 
                className="!bg-white !w-3 !h-3 !border-2 !border-gray-400"
            />
            
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={icon} className="text-2xl" />
                    <div className="flex-1">
                        <div className="font-bold text-sm">{nodeData.label}</div>
                        <div className="text-xs opacity-90">Kích Hoạt Tự Động</div>
                    </div>
                </div>

                <div className="bg-white bg-opacity-20 rounded-lg p-2 space-y-1">
                    <div className="text-xs font-semibold">📡 {nodeData.sensorName}</div>
                    <div className="flex items-center gap-1 text-xs">
                        <span className={`${conditionBg} px-2 py-0.5 rounded font-bold flex items-center gap-1`}>
                            <FontAwesomeIcon icon={conditionIcon} /> {nodeData.condition.toUpperCase()}
                        </span>
                        <span>→</span>
                        <span className="font-semibold flex items-center gap-1">Vẽ <FontAwesomeIcon icon={shapeIcon} /> {nodeData.actionShape === 'circle' ? 'hình tròn' : 'đường thẳng'}</span>
                    </div>
                    {nodeData.points && nodeData.points.length > 0 && (
                        <div className="text-xs mt-1">
                            <div className="font-semibold">Điểm: {nodeData.points.length}/2</div>
                            {nodeData.points.length === 2 && (
                                <div className="text-green-300">✓ Đã cấu hình đường</div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <Handle 
                type="source" 
                position={Position.Right} 
                className="!bg-white !w-3 !h-3 !border-2 !border-gray-400"
            />
        </div>
    );
}

export default memo(TriggerNode);
