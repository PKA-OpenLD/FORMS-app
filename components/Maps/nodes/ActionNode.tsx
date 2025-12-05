'use client';
import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWater, faBolt, faCircle, faGripLines } from '@fortawesome/free-solid-svg-icons';

interface ActionNodeData {
    actionType: 'flood' | 'outage';
    actionShape: 'circle' | 'line';
    label: string;
    points?: [number, number][];
    onEdit?: (id: string, data: ActionNodeData) => void;
}

function ActionNode({ id, data }: NodeProps) {
    const nodeData = data as unknown as ActionNodeData;
    const bgColor = nodeData.actionType === 'flood' ? 'bg-blue-500' : 'bg-red-500';
    const borderColor = nodeData.actionType === 'flood' ? 'border-blue-600' : 'border-red-600';
    const icon = nodeData.actionType === 'flood' ? faWater : faBolt;
    const shapeIcon = nodeData.actionShape === 'circle' ? faCircle : faGripLines;

    const handleDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (nodeData.onEdit) {
            nodeData.onEdit(id, nodeData);
        }
    };

    return (
        <div 
            className={`${bgColor} ${borderColor} border-2 rounded-xl shadow-lg p-4 min-w-[180px] text-white cursor-pointer hover:shadow-2xl transition-shadow`}
            onDoubleClick={handleDoubleClick}
        >
            <Handle 
                type="target" 
                position={Position.Left} 
                className="!bg-white !w-3 !h-3 !border-2 !border-gray-400"
            />
            <div className="flex items-center gap-2 mb-2">
                <FontAwesomeIcon icon={icon} className="text-2xl" />
                <div className="flex-1">
                    <div className="font-bold text-sm">Hành Động</div>
                    <div className="text-xs opacity-90">{nodeData.label}</div>
                </div>
            </div>
            <div className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded flex items-center gap-1">
                Vẽ <FontAwesomeIcon icon={shapeIcon} /> {nodeData.actionShape === 'circle' ? 'hình tròn' : 'đường thẳng'}
            </div>
        </div>
    );
}

export default memo(ActionNode);
