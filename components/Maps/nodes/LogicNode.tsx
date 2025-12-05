'use client';
import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

interface LogicNodeData {
    operator: 'AND' | 'OR';
    onEdit?: (id: string, data: LogicNodeData) => void;
}

function LogicNode({ id, data }: NodeProps) {
    const nodeData = data as unknown as LogicNodeData;
    const handleDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (nodeData.onEdit) {
            nodeData.onEdit(id, nodeData);
        }
    };

    return (
        <div 
            className={`border-2 rounded-full shadow-lg p-6 cursor-pointer hover:shadow-2xl transition-shadow ${
                nodeData.operator === 'AND' 
                    ? 'bg-indigo-500 border-indigo-600' 
                    : 'bg-purple-500 border-purple-600'
            }`}
            onDoubleClick={handleDoubleClick}
        >
            <Handle 
                type="target" 
                position={Position.Left} 
                id="input-1"
                style={{ top: '35%' }}
                className="!bg-white !w-3 !h-3 !border-2 !border-gray-400"
            />
            <Handle 
                type="target" 
                position={Position.Left} 
                id="input-2"
                style={{ top: '65%' }}
                className="!bg-white !w-3 !h-3 !border-2 !border-gray-400"
            />
            <div className="text-white font-bold text-xl">
                {nodeData.operator}
            </div>
            <Handle 
                type="source" 
                position={Position.Right} 
                className="!bg-white !w-3 !h-3 !border-2 !border-gray-400"
            />
        </div>
    );
}

export default memo(LogicNode);
