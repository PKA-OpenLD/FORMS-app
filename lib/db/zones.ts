import db from './schema';

export interface Zone {
    id: string;
    type: 'flood' | 'outage';
    shape: 'circle' | 'line';
    center?: [number, number];
    radius?: number;
    coordinates?: number[][];
    riskLevel?: number;
    createdAt?: number;
    updatedAt?: number;
}

// Get all zones
export function getAllZones(): Zone[] {
    const zones = db.zones.read();
    return zones.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
}

// Get zones by type
export function getZonesByType(type: 'flood' | 'outage'): Zone[] {
    const zones = db.zones.read();
    return zones
        .filter((z: any) => z.type === type)
        .sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
}

// Create a new zone
export function createZone(zone: Zone): Zone {
    const now = Date.now();
    const zones = db.zones.read();
    const newZone = { ...zone, createdAt: now, updatedAt: now, riskLevel: zone.riskLevel || 50 };
    zones.push(newZone);
    db.zones.write(zones);
    return newZone;
}

// Update a zone
export function updateZone(id: string, updates: Partial<Zone>): void {
    const zones = db.zones.read();
    const index = zones.findIndex((z: any) => z.id === id);
    if (index !== -1) {
        zones[index] = { ...zones[index], ...updates, updatedAt: Date.now() };
        db.zones.write(zones);
    }
}

// Delete a zone
export function deleteZone(id: string): void {
    const zones = db.zones.read();
    const filtered = zones.filter((z: any) => z.id !== id);
    db.zones.write(filtered);
}

// Delete all zones
export function deleteAllZones(): void {
    db.zones.write([]);
}

// Delete zones by type
export function deleteZonesByType(type: 'flood' | 'outage'): void {
    const zones = db.zones.read();
    const filtered = zones.filter((z: any) => z.type !== type);
    db.zones.write(filtered);
}
