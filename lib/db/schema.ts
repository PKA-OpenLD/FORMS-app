import path from 'path';
import fs from 'fs';

const dataDir = path.join(process.cwd(), 'data');
const zonesFile = path.join(dataDir, 'zones.json');
const sensorsFile = path.join(dataDir, 'sensors.json');
const predictionsFile = path.join(dataDir, 'predictions.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize JSON files
if (!fs.existsSync(zonesFile)) {
    fs.writeFileSync(zonesFile, JSON.stringify([]));
}
if (!fs.existsSync(sensorsFile)) {
    fs.writeFileSync(sensorsFile, JSON.stringify([]));
}
if (!fs.existsSync(predictionsFile)) {
    fs.writeFileSync(predictionsFile, JSON.stringify([]));
}

export const db = {
    zones: {
        read: () => JSON.parse(fs.readFileSync(zonesFile, 'utf-8')),
        write: (data: any[]) => fs.writeFileSync(zonesFile, JSON.stringify(data, null, 2))
    },
    sensors: {
        read: () => JSON.parse(fs.readFileSync(sensorsFile, 'utf-8')),
        write: (data: any[]) => fs.writeFileSync(sensorsFile, JSON.stringify(data, null, 2))
    },
    predictions: {
        read: () => JSON.parse(fs.readFileSync(predictionsFile, 'utf-8')),
        write: (data: any[]) => fs.writeFileSync(predictionsFile, JSON.stringify(data, null, 2))
    }
};

console.log('Data storage initialized at:', dataDir);

export default db;
