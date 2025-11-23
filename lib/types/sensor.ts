export interface Sensor {
    id: string;
    name: string;
    location: [number, number]; // [lng, lat]
    type: 'water_level' | 'temperature' | 'humidity';
    threshold: number;
    actionType: 'flood' | 'outage';
    actionTarget?: string; // zone/route ID to activate
    createdAt?: number;
}

export interface SensorRule {
    id: string;
    name: string;
    type: '1-sensor' | '2-sensor';
    sensors: string[]; // sensor IDs
    operator?: 'AND' | 'OR'; // for 2-sensor rules
    actionType: 'flood' | 'outage';
    actionShape: 'circle' | 'line';
    actionCoordinates?: number[][] | number[]; // for line or circle center
    actionRadius?: number; // for circle
    enabled: boolean;
    createdAt?: number;
}
