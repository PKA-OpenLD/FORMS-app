import { NextRequest, NextResponse } from 'next/server';

// Using Open-Meteo API - completely free, no API key needed!
// Documentation: https://open-meteo.com/en/docs

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const lat = searchParams.get('lat') || '21.0285'; // Default: Hanoi
        const lon = searchParams.get('lon') || '105.8542';
        const type = searchParams.get('type') || 'current'; // current or forecast

        if (type === 'forecast') {
            // 7-day forecast with hourly data
            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,precipitation,surface_pressure,wind_speed_10m,weather_code&timezone=Asia/Bangkok&forecast_days=5`
            );
            
            if (!response.ok) {
                throw new Error('Failed to fetch weather forecast');
            }

            const data = await response.json();
            
            // Process forecast data and calculate flood risk
            const processedForecast = [];
            for (let i = 0; i < data.hourly.time.length; i++) {
                const rain = data.hourly.precipitation[i] || 0;
                const humidity = data.hourly.relative_humidity_2m[i] || 0;
                const temp = data.hourly.temperature_2m[i] || 0;
                const floodRisk = calculateFloodRisk(rain, humidity, temp);
                
                processedForecast.push({
                    timestamp: new Date(data.hourly.time[i]).getTime(),
                    temp: temp,
                    humidity: humidity,
                    pressure: data.hourly.surface_pressure[i] || 1013,
                    rain: rain,
                    windSpeed: data.hourly.wind_speed_10m[i] || 0,
                    weather: getWeatherFromCode(data.hourly.weather_code[i]),
                    description: getWeatherDescription(data.hourly.weather_code[i]),
                    floodRisk,
                    floodRiskLevel: getFloodRiskLevel(floodRisk)
                });
            }

            return NextResponse.json({
                location: { lat, lon },
                forecast: processedForecast,
                city: 'Location' // Open-Meteo doesn't provide city names
            });
        } else {
            // Current weather
            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,surface_pressure,wind_speed_10m,weather_code&timezone=Asia/Bangkok`
            );
            
            if (!response.ok) {
                throw new Error('Failed to fetch current weather');
            }

            const data = await response.json();
            const current = data.current;
            const rain = current.precipitation || 0;
            const floodRisk = calculateFloodRisk(rain, current.relative_humidity_2m, current.temperature_2m);

            return NextResponse.json({
                location: { lat, lon },
                current: {
                    timestamp: Date.now(),
                    temp: current.temperature_2m,
                    humidity: current.relative_humidity_2m,
                    pressure: current.surface_pressure,
                    rain: rain,
                    windSpeed: current.wind_speed_10m,
                    weather: getWeatherFromCode(current.weather_code),
                    description: getWeatherDescription(current.weather_code),
                    floodRisk,
                    floodRiskLevel: getFloodRiskLevel(floodRisk)
                },
                city: 'Current Location'
            });
        }
    } catch (error) {
        console.error('Weather API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch weather data', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

// Convert WMO weather code to simple weather type
function getWeatherFromCode(code: number): string {
    if (code === 0) return 'Clear';
    if (code <= 3) return 'Cloudy';
    if (code <= 49) return 'Fog';
    if (code <= 59) return 'Drizzle';
    if (code <= 69) return 'Rain';
    if (code <= 79) return 'Snow';
    if (code <= 84) return 'Showers';
    if (code <= 99) return 'Thunderstorm';
    return 'Unknown';
}

// Get Vietnamese weather description from WMO code
function getWeatherDescription(code: number): string {
    const descriptions: { [key: number]: string } = {
        0: 'trời quang',
        1: 'chủ yếu quang',
        2: 'một phần nhiều mây',
        3: 'u ám',
        45: 'sương mù',
        48: 'sương mù giá',
        51: 'mưa phùn nhẹ',
        53: 'mưa phùn vừa',
        55: 'mưa phùn dày đặc',
        61: 'mưa nhẹ',
        63: 'mưa vừa',
        65: 'mưa to',
        71: 'tuyết nhẹ',
        73: 'tuyết vừa',
        75: 'tuyết dày',
        80: 'mưa rào nhẹ',
        81: 'mưa rào vừa',
        82: 'mưa rào mạnh',
        95: 'giông bão',
        96: 'giông bão có mưa đá',
        99: 'giông bão mạnh có mưa đá'
    };
    return descriptions[code] || 'không xác định';
}

// Calculate flood risk based on weather conditions
function calculateFloodRisk(rain: number, humidity: number, temp: number): number {
    let risk = 0;
    
    // Rain is the primary factor (0-100 scale)
    if (rain > 50) risk += 80;
    else if (rain > 30) risk += 60;
    else if (rain > 15) risk += 40;
    else if (rain > 5) risk += 20;
    else if (rain > 0) risk += 10;
    
    // Humidity contributes to risk
    if (humidity > 85) risk += 15;
    else if (humidity > 70) risk += 10;
    else if (humidity > 60) risk += 5;
    
    // Temperature affects water absorption
    if (temp < 15) risk += 5; // Cold weather, less evaporation
    
    return Math.min(risk, 100);
}

function getFloodRiskLevel(risk: number): 'low' | 'medium' | 'high' | 'critical' {
    if (risk >= 75) return 'critical';
    if (risk >= 50) return 'high';
    if (risk >= 25) return 'medium';
    return 'low';
}
