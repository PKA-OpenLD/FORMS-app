import db from './schema';

export interface SensorData {
    id?: number;
    sensorId: string;
    timestamp: number;
    waterLevel?: number;
    temperature?: number;
    humidity?: number;
    location?: [number, number];
    data?: any;
}

// Insert sensor data
export function insertSensorData(data: SensorData): number {
    const sensors = db.sensors.read();
    const id = sensors.length > 0 ? Math.max(...sensors.map((s: any) => s.id || 0)) + 1 : 1;
    const newData = { ...data, id };
    sensors.push(newData);
    db.sensors.write(sensors);
    return id;
}

// Get recent sensor data
export function getRecentSensorData(limit: number = 100): SensorData[] {
    const sensors = db.sensors.read();
    return sensors
        .sort((a: any, b: any) => b.timestamp - a.timestamp)
        .slice(0, limit);
}

// Get sensor data by sensor ID
export function getSensorDataBySensorId(sensorId: string, limit: number = 100): SensorData[] {
    const sensors = db.sensors.read();
    return sensors
        .filter((s: any) => s.sensorId === sensorId)
        .sort((a: any, b: any) => b.timestamp - a.timestamp)
        .slice(0, limit);
}

// Delete old sensor data
export function deleteOldSensorData(olderThan: number): number {
    const sensors = db.sensors.read();
    const filtered = sensors.filter((s: any) => s.timestamp >= olderThan);
    const deleted = sensors.length - filtered.length;
    db.sensors.write(filtered);
    return deleted;
}
