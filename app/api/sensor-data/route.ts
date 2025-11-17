import { NextRequest, NextResponse } from 'next/server';
import { insertSensorData, getRecentSensorData, SensorData } from '@/lib/db/sensors';

// GET /api/sensor-data - Get recent sensor data
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const limit = parseInt(searchParams.get('limit') || '100');
        
        const data = getRecentSensorData(limit);
        return NextResponse.json({ data });
    } catch (error) {
        console.error('Failed to get sensor data:', error);
        return NextResponse.json({ error: 'Failed to get sensor data' }, { status: 500 });
    }
}

// POST /api/sensor-data - Insert sensor data
export async function POST(request: NextRequest) {
    try {
        const data: SensorData = await request.json();
        const id = insertSensorData(data);
        return NextResponse.json({ id }, { status: 201 });
    } catch (error) {
        console.error('Failed to insert sensor data:', error);
        return NextResponse.json({ error: 'Failed to insert sensor data' }, { status: 500 });
    }
}
