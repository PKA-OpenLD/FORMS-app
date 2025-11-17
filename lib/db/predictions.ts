import db from './schema';

export interface Prediction {
    id?: number;
    type: 'flood' | 'outage';
    location: [number, number];
    probability: number;
    severity?: 'low' | 'medium' | 'high';
    timestamp: number;
    expiresAt?: number;
}

// Insert prediction
export function insertPrediction(prediction: Prediction): number {
    const predictions = db.predictions.read();
    const id = predictions.length > 0 ? Math.max(...predictions.map((p: any) => p.id || 0)) + 1 : 1;
    const newPrediction = { ...prediction, id };
    predictions.push(newPrediction);
    db.predictions.write(predictions);
    return id;
}

// Get active predictions
export function getActivePredictions(): Prediction[] {
    const now = Date.now();
    const predictions = db.predictions.read();
    return predictions
        .filter((p: any) => !p.expiresAt || p.expiresAt > now)
        .sort((a: any, b: any) => b.timestamp - a.timestamp);
}

// Get predictions by type
export function getPredictionsByType(type: 'flood' | 'outage'): Prediction[] {
    const now = Date.now();
    const predictions = db.predictions.read();
    return predictions
        .filter((p: any) => p.type === type && (!p.expiresAt || p.expiresAt > now))
        .sort((a: any, b: any) => b.timestamp - a.timestamp);
}

// Delete expired predictions
export function deleteExpiredPredictions(): number {
    const now = Date.now();
    const predictions = db.predictions.read();
    const filtered = predictions.filter((p: any) => !p.expiresAt || p.expiresAt >= now);
    const deleted = predictions.length - filtered.length;
    db.predictions.write(filtered);
    return deleted;
}

// Delete all predictions
export function deleteAllPredictions(): void {
    db.predictions.write([]);
}
