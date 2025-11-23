import db from './schema';

export interface Sensor {
    id: string;
    name: string;
    location: [number, number];
    type: 'water_level' | 'temperature' | 'humidity';
    threshold: number;
    actionType: 'flood' | 'outage';
    actionTarget?: string;
    createdAt?: number;
}

export interface SensorRule {
    id: string;
    name: string;
    type: '1-sensor' | '2-sensor';
    sensors: string[];
    operator?: 'AND' | 'OR';
    actionType: 'flood' | 'outage';
    actionShape: 'circle' | 'line';
    actionCoordinates?: number[][] | number[];
    actionRadius?: number;
    enabled: boolean;
    createdAt?: number;
}

// Get all sensors
export function getAllSensors(): Sensor[] {
    try {
        const sensors = db.sensors.read();
        return sensors.filter((s: any) => s.name !== undefined);
    } catch {
        return [];
    }
}

// Create sensor
export function createSensor(sensor: Sensor): Sensor {
    const sensors = db.sensors.read();
    const newSensor = { ...sensor, createdAt: Date.now() };
    sensors.push(newSensor);
    db.sensors.write(sensors);
    return newSensor;
}

// Update sensor
export function updateSensor(id: string, updates: Partial<Sensor>): void {
    const sensors = db.sensors.read();
    const index = sensors.findIndex((s: any) => s.id === id && s.name !== undefined);
    if (index !== -1) {
        sensors[index] = { ...sensors[index], ...updates };
        db.sensors.write(sensors);
    }
}

// Delete sensor
export function deleteSensor(id: string): void {
    const sensors = db.sensors.read();
    const filtered = sensors.filter((s: any) => s.id !== id || s.name === undefined);
    db.sensors.write(filtered);
}

// Get all sensor rules
export function getAllSensorRules(): SensorRule[] {
    try {
        const data = db.predictions.read();
        return data.filter((r: any) => r.type === '1-sensor' || r.type === '2-sensor');
    } catch {
        return [];
    }
}

// Create sensor rule
export function createSensorRule(rule: SensorRule): SensorRule {
    const rules = db.predictions.read();
    const newRule = { ...rule, createdAt: Date.now() };
    rules.push(newRule);
    db.predictions.write(rules);
    return newRule;
}

// Update sensor rule
export function updateSensorRule(id: string, updates: Partial<SensorRule>): void {
    const rules = db.predictions.read();
    const index = rules.findIndex((r: any) => r.id === id);
    if (index !== -1) {
        rules[index] = { ...rules[index], ...updates };
        db.predictions.write(rules);
    }
}

// Delete sensor rule
export function deleteSensorRule(id: string): void {
    const rules = db.predictions.read();
    const filtered = rules.filter((r: any) => r.id !== id);
    db.predictions.write(filtered);
}

// Toggle sensor rule
export function toggleSensorRule(id: string): void {
    const rules = db.predictions.read();
    const index = rules.findIndex((r: any) => r.id === id);
    if (index !== -1) {
        rules[index].enabled = !rules[index].enabled;
        db.predictions.write(rules);
    }
}
