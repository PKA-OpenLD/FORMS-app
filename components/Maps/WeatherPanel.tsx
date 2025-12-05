'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faCloudRain, 
    faTemperatureHigh, 
    faTint, 
    faWind,
    faExclamationTriangle,
    faCheckCircle,
    faInfoCircle,
    faSkullCrossbones
} from '@fortawesome/free-solid-svg-icons';
import vietmapgl from '@vietmap/vietmap-gl-js/dist/vietmap-gl.js';

interface WeatherData {
    timestamp: number;
    temp: number;
    humidity: number;
    pressure: number;
    rain: number;
    windSpeed: number;
    weather: string;
    description: string;
    floodRisk: number;
    floodRiskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface WeatherPanelProps {
    location?: [number, number];
    map?: vietmapgl.Map;
}

export default function WeatherPanel({ location, map }: WeatherPanelProps) {
    const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
    const [forecast, setForecast] = useState<WeatherData[]>([]);
    const [loading, setLoading] = useState(true);
    const [city, setCity] = useState('');
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [clickedLocation, setClickedLocation] = useState<[number, number] | null>(null);
    const [showDetailPanel, setShowDetailPanel] = useState(false);
    const [marker, setMarker] = useState<any>(null);

    useEffect(() => {
        fetchWeatherData();
        const interval = setInterval(fetchWeatherData, 10 * 60 * 1000); // Update every 10 minutes
        return () => clearInterval(interval);
    }, [location]);

    // Handle map clicks to show detailed weather
    useEffect(() => {
        if (!map) return;
        
        const handleMapClick = (e: any) => {
            const { lng, lat } = e.lngLat;
            setClickedLocation([lng, lat]);
            setShowDetailPanel(true);
            setLoading(true);
            
            // Remove previous marker if exists
            if (marker) {
                marker.remove();
            }
            
            // Add new marker at clicked location
            const newMarker = new vietmapgl.Marker({ color: '#3b82f6' })
                .setLngLat([lng, lat])
                .addTo(map);
            
            setMarker(newMarker);
            
            // Fetch weather for clicked location
            fetch(`/api/weather?lat=${lat}&lon=${lng}&type=current`)
                .then(res => res.json())
                .then(data => {
                    if (data.current) {
                        setCurrentWeather(data.current);
                        setCity(data.city);
                    }
                })
                .catch(err => console.error('Failed to fetch weather:', err));
            
            fetch(`/api/weather?lat=${lat}&lon=${lng}&type=forecast`)
                .then(res => res.json())
                .then(data => {
                    if (data.forecast) {
                        setForecast(data.forecast);
                        setSelectedDay(0);
                    }
                    setLoading(false);
                })
                .catch(err => {
                    console.error('Failed to fetch forecast:', err);
                    setLoading(false);
                });
        };
        
        map.on('click', handleMapClick);
        
        return () => {
            map.off('click', handleMapClick);
            if (marker) {
                marker.remove();
            }
        };
    }, [map, marker]);

    const fetchWeatherData = async () => {
        try {
            const lat = location?.[1] || 21.0285;
            const lon = location?.[0] || 105.8542;

            // Fetch current weather
            const currentRes = await fetch(`/api/weather?lat=${lat}&lon=${lon}&type=current`);
            const currentData = await currentRes.json();
            
            if (currentData.current) {
                setCurrentWeather(currentData.current);
                setCity(currentData.city);
            }

            // Fetch forecast
            const forecastRes = await fetch(`/api/weather?lat=${lat}&lon=${lon}&type=forecast`);
            const forecastData = await forecastRes.json();
            
            if (forecastData.forecast) {
                setForecast(forecastData.forecast);
            }

            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch weather:', error);
            setLoading(false);
        }
    };

    const getRiskColor = (level: string) => {
        switch (level) {
            case 'critical': return 'bg-red-600 text-white';
            case 'high': return 'bg-orange-500 text-white';
            case 'medium': return 'bg-yellow-500 text-white';
            default: return 'bg-green-500 text-white';
        }
    };

    const getRiskIcon = (level: string) => {
        switch (level) {
            case 'critical': return faSkullCrossbones;
            case 'high': return faExclamationTriangle;
            case 'medium': return faInfoCircle;
            default: return faCheckCircle;
        }
    };

    const getRiskText = (level: string) => {
        switch (level) {
            case 'critical': return 'NGUY HIỂM CỰC KỲ CAO';
            case 'high': return 'NGUY CƠ CAO';
            case 'medium': return 'NGUY CƠ TRUNG BÌNH';
            default: return 'NGUY CƠ THẤP';
        }
    };

    const groupForecastByDay = () => {
        const grouped: { [key: string]: WeatherData[] } = {};
        
        forecast.forEach(item => {
            const date = new Date(item.timestamp).toLocaleDateString('vi-VN');
            if (!grouped[date]) grouped[date] = [];
            grouped[date].push(item);
        });
        
        return grouped;
    };

    // If map is provided, show detail panel only when location is clicked
    if (map && !showDetailPanel) {
        return null;
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    const forecastByDay = groupForecastByDay();
    const days = Object.keys(forecastByDay);

    return (
        <div className={`${map ? 'fixed bottom-4 right-4 z-50 w-96 max-h-[80vh] overflow-y-auto' : ''} space-y-6`}>
            {/* Close button for map mode */}
            {map && (
                <div className="flex justify-end mb-2">
                    <button
                        onClick={() => {
                            setShowDetailPanel(false);
                            setClickedLocation(null);
                            if (marker) {
                                marker.remove();
                                setMarker(null);
                            }
                        }}
                        className="bg-white text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
                    >
                        ✕ Đóng
                    </button>
                </div>
            )}
            
            {/* Current Weather Card */}
            {currentWeather && (
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl p-6 shadow-2xl">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-3xl font-bold">{city}</h2>
                            <p className="text-blue-100 capitalize">{currentWeather.description}</p>
                        </div>
                        <div className="text-right">
                            <div className="text-5xl font-bold">{Math.round(currentWeather.temp)}°C</div>
                            <div className="text-blue-100">Cảm giác như {Math.round(currentWeather.temp - 2)}°C</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-white/20 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <FontAwesomeIcon icon={faCloudRain} />
                                <span className="text-sm">Lượng mưa</span>
                            </div>
                            <div className="text-2xl font-bold">{currentWeather.rain.toFixed(1)} mm</div>
                        </div>
                        <div className="bg-white/20 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <FontAwesomeIcon icon={faTint} />
                                <span className="text-sm">Độ ẩm</span>
                            </div>
                            <div className="text-2xl font-bold">{currentWeather.humidity}%</div>
                        </div>
                        <div className="bg-white/20 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <FontAwesomeIcon icon={faWind} />
                                <span className="text-sm">Gió</span>
                            </div>
                            <div className="text-2xl font-bold">{currentWeather.windSpeed.toFixed(1)} m/s</div>
                        </div>
                        <div className="bg-white/20 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <FontAwesomeIcon icon={faTemperatureHigh} />
                                <span className="text-sm">Áp suất</span>
                            </div>
                            <div className="text-2xl font-bold">{currentWeather.pressure} hPa</div>
                        </div>
                    </div>

                    {/* Flood Risk Alert */}
                    <div className={`${getRiskColor(currentWeather.floodRiskLevel)} rounded-xl p-4 flex items-center gap-3`}>
                        <FontAwesomeIcon icon={getRiskIcon(currentWeather.floodRiskLevel)} className="text-3xl" />
                        <div className="flex-1">
                            <div className="font-bold text-lg">{getRiskText(currentWeather.floodRiskLevel)}</div>
                            <div className="text-sm opacity-90">Nguy cơ ngập lụt: {currentWeather.floodRisk}%</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Forecast Section */}
            <div className="bg-white rounded-2xl p-6 shadow-xl">
                <h3 className="text-xl font-bold text-gray-800 mb-4">📅 Dự Báo 5 Ngày</h3>
                
                {/* Day Tabs */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                    {days.map((day, index) => (
                        <button
                            key={day}
                            onClick={() => setSelectedDay(index)}
                            className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
                                selectedDay === index
                                    ? 'bg-blue-500 text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {index === 0 ? 'Hôm nay' : index === 1 ? 'Ngày mai' : day}
                        </button>
                    ))}
                </div>

                {/* Selected Day Forecast */}
                {selectedDay !== null && forecastByDay[days[selectedDay]] && (
                    <div className="space-y-3">
                        {forecastByDay[days[selectedDay]].slice(0, 8).map((item, idx) => {
                            const time = new Date(item.timestamp).toLocaleTimeString('vi-VN', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                            });
                            
                            return (
                                <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                    <div className="w-16 font-bold text-gray-700">{time}</div>
                                    <div className="flex-1 grid grid-cols-3 gap-4">
                                        <div>
                                            <div className="text-2xl font-bold text-gray-800">{Math.round(item.temp)}°C</div>
                                            <div className="text-xs text-gray-600 capitalize">{item.description}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-600">💧 {item.rain.toFixed(1)} mm</div>
                                            <div className="text-sm text-gray-600">💨 {item.humidity}%</div>
                                        </div>
                                        <div className="flex items-center justify-end">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getRiskColor(item.floodRiskLevel)}`}>
                                                {item.floodRisk}% Nguy cơ
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Warning Banner */}
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-500 text-xl mt-1" />
                    <div>
                        <h4 className="font-bold text-yellow-800 mb-1">Lưu Ý An Toàn</h4>
                        <p className="text-sm text-yellow-700">
                            Dự báo thời tiết được cập nhật mỗi 10 phút. Hãy kiểm tra thường xuyên và tuân thủ 
                            cảnh báo của chính quyền địa phương khi có nguy cơ ngập lụt cao.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
