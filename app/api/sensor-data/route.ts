import { NextRequest, NextResponse } from 'next/server';
import { insertSensorData, getRecentSensorData, SensorData } from '@/lib/db/sensors';
import { getAllSensors } from '@/lib/db/sensor-rules';
import { checkAndExecuteRules } from '@/lib/automation/rule-engine';

// GET /api/sensor-data - Get recent sensor data
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const limit = parseInt(searchParams.get('limit') || '100');
        
        const data = await getRecentSensorData(limit);
        return NextResponse.json({ data });
    } catch (error) {
        console.error('Failed to get sensor data:', error);
        return NextResponse.json({ error: 'Failed to get sensor data' }, { status: 500 });
    }
}

// POST /api/sensor-data - Insert sensor data and trigger automation
export async function POST(request: NextRequest) {
    try {
        const rawData: any = await request.json();
        
        // Validate required fields
        if (!rawData.sensorId) {
            return NextResponse.json(
                { 
                    error: 'Invalid request format',
                    required: { sensorId: 'string', waterLevel?: 'number', temperature?: 'number', humidity?: 'number' },
                    example: { sensorId: 'sensor-123', waterLevel: 5.2, timestamp: 1234567890 }
                },
                { status: 400 }
            );
        }

        // Convert to SensorData format
        const data: SensorData = {
            sensorId: rawData.sensorId,
            timestamp: rawData.timestamp || Date.now(),
            waterLevel: rawData.waterLevel || rawData.value, // Support both formats
            temperature: rawData.temperature,
            humidity: rawData.humidity,
            location: rawData.location,
            data: rawData.data
        };

        // Store sensor data
        const id = await insertSensorData(data);

        // Get sensor configuration
        const sensors = await getAllSensors();
        const sensor = sensors.find(s => s.id === data.sensorId);

        if (!sensor) {
            return NextResponse.json(
                { 
                    warning: `Sensor ${data.sensorId} not found in system. Data saved but automation not triggered.`,
                    id 
                },
                { status: 202 }
            );
        }

        // Trigger automation rules
        // Get the actual sensor value based on sensor type
        const value = sensor.type === 'water_level' ? data.waterLevel :
                     sensor.type === 'temperature' ? data.temperature :
                     sensor.type === 'humidity' ? data.humidity : 0;

        const sensorReading = {
            sensorId: data.sensorId,
            value: value || 0,
            timestamp: data.timestamp || Date.now(),
            sensorName: sensor.name,
            type: sensor.type
        };

        const executionResults = await checkAndExecuteRules(sensorReading, sensor);

        return NextResponse.json({
            success: true,
            dataId: id,
            sensor: {
                id: sensor.id,
                name: sensor.name,
                threshold: sensor.threshold,
                currentValue: data.value
            },
            thresholdExceeded: data.value > sensor.threshold,
            automation: {
                rulesChecked: executionResults.rulesChecked,
                rulesTriggered: executionResults.rulesTriggered,
                zonesCreated: executionResults.zonesCreated,
                message: executionResults.rulesTriggered > 0 
                    ? `Triggered ${executionResults.rulesTriggered} automation rule(s)`
                    : 'No rules triggered'
            }
        }, { status: 201 });

    } catch (error) {
        console.error('Failed to insert sensor data:', error);
        return NextResponse.json({ error: 'Failed to insert sensor data' }, { status: 500 });
    }
}
