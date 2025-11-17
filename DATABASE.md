# SVATTT - Flood and Outage Risk Management System

## Database Setup

This application uses SQLite for local data persistence with the following tables:

### Tables

1. **zones** - Stores flood and outage zones (circles and lines)
   - `id` - Unique identifier
   - `type` - 'flood' or 'outage'
   - `shape` - 'circle' or 'line'
   - `center_lng`, `center_lat` - For circle zones
   - `radius` - For circle zones (in meters)
   - `coordinates` - For line zones (JSON array)
   - `risk_level` - Risk level (0-100)
   - `created_at`, `updated_at` - Timestamps

2. **sensor_data** - Real-time sensor readings
   - `sensor_id` - Sensor identifier
   - `timestamp` - Reading timestamp
   - `water_level`, `temperature`, `humidity` - Sensor values
   - `location_lng`, `location_lat` - Sensor location
   - `data` - Additional JSON data

3. **predictions** - ML predictions for floods/outages
   - `type` - 'flood' or 'outage'
   - `location_lng`, `location_lat` - Prediction location
   - `probability` - Prediction probability (0-1)
   - `severity` - 'low', 'medium', 'high'
   - `timestamp` - Prediction timestamp
   - `expires_at` - When prediction expires

## API Endpoints

### Zones
- `GET /api/zones` - Get all zones
- `POST /api/zones` - Create a new zone
- `DELETE /api/zones` - Delete all zones
- `PATCH /api/zones/[id]` - Update a zone
- `DELETE /api/zones/[id]` - Delete a zone

### Sensor Data
- `GET /api/sensor-data?limit=100` - Get recent sensor data
- `POST /api/sensor-data` - Insert sensor data

### Predictions
- `GET /api/predictions` - Get active predictions
- `POST /api/predictions` - Insert prediction

## WebSocket Connection

Real-time updates are broadcast via WebSocket at `ws://localhost:3000/ws`

### Message Types

**Client → Server / Server → Clients:**
```json
{
  "type": "zone_created",
  "zone": { "id": "...", "type": "flood", "shape": "circle", ... }
}

{
  "type": "zone_updated",
  "zone": { "id": "...", ... }
}

{
  "type": "zone_deleted",
  "zoneId": "zone-123456"
}

{
  "type": "zones_cleared"
}

{
  "type": "sensor_data",
  "data": { "sensorId": "...", "waterLevel": 1.5, ... }
}

{
  "type": "prediction",
  "prediction": { "type": "flood", "probability": 0.8, ... }
}
```

## Running the Application

```bash
# Install dependencies
bun install

# Run development server with WebSocket
bun dev

# Build for production
bun run build

# Run production server
bun start
```

The database file will be created at `data/svattt.db` on first run.

## Integration with Your Backend

To connect your backend:

1. **Send sensor data to API:**
```javascript
fetch('http://localhost:3000/api/sensor-data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sensorId: 'sensor-001',
    timestamp: Date.now(),
    waterLevel: 1.5,
    temperature: 25.3,
    location: [105.748684, 20.962594]
  })
});
```

2. **Send predictions to API:**
```javascript
fetch('http://localhost:3000/api/predictions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'flood',
    location: [105.748684, 20.962594],
    probability: 0.85,
    severity: 'high',
    timestamp: Date.now(),
    expiresAt: Date.now() + 3600000 // 1 hour
  })
});
```

3. **Broadcast via WebSocket:**
```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'sensor_data',
    data: { /* sensor data */ }
  }));
};
```

## Admin Panel

Access the admin panel at `http://localhost:3000/admin`

Features:
- Draw flood/outage zones (circles)
- Draw flood/outage routes (lines)
- Clear all zones
- Real-time sync across all clients

## Public View

Access the public map at `http://localhost:3000`

Shows all zones and routes without editing capabilities.
