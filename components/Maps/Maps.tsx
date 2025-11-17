'use client';
import vietmapgl from '@vietmap/vietmap-gl-js/dist/vietmap-gl.js';
import '@vietmap/vietmap-gl-js/dist/vietmap-gl.css';
import { useState, useEffect, useRef } from 'react';
import AdminPanel from './AdminPanel';

interface Zone {
    id: string;
    type: 'flood' | 'outage';
    shape: 'circle' | 'line';
    center?: number[]; // [lng, lat] for circles (zones)
    radius?: number; // in meters for circles (zones)
    coordinates?: number[][]; // for lines (routes/paths)
    riskLevel?: number;
}

interface MapsProps {
    isAdmin?: boolean;
}

export default function Maps({ isAdmin = false }: MapsProps) {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const [map, setMap] = useState<vietmapgl.Map | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [zones, setZones] = useState<Zone[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawingType, setDrawingType] = useState<'flood' | 'outage' | null>(null);
    const [drawingShape, setDrawingShape] = useState<'circle' | 'line'>('circle');
    const [drawingCenter, setDrawingCenter] = useState<number[] | null>(null);
    const [drawingRadius, setDrawingRadius] = useState<number>(0);
    const [drawingPoints, setDrawingPoints] = useState<number[][]>([]);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isMounted || !mapContainerRef.current || map) return;

        const apiKey = process.env.NEXT_PUBLIC_VIETMAP_API_KEY || '';

        const mapInstance = new vietmapgl.Map({
            container: mapContainerRef.current,
            style: `https://maps.vietmap.vn/maps/styles/tm/style.json?apikey=${apiKey}`,
            center: [105.748684, 20.962594], // Hanoi coordinates
            
            zoom: 12,
            transformRequest: (url: string) => {
                if (url.includes('vietmap.vn')) {
                    return {
                        url: url.includes('?') ? `${url}&apikey=${apiKey}` : `${url}?apikey=${apiKey}`
                    };
                }
                return { url };
            }
        });

        mapInstance.addControl(new vietmapgl.NavigationControl(), 'top-right');
        mapInstance.addControl(new vietmapgl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: true
            },
            trackUserLocation: true
        }));

        mapInstance.on('load', () => {
            // Add sources for zones
            mapInstance.addSource('zones', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                }
            });

            // Add layer for flood circle zones
            mapInstance.addLayer({
                id: 'flood-zones',
                type: 'fill',
                source: 'zones',
                filter: ['all', ['==', ['get', 'type'], 'flood'], ['==', ['get', 'shape'], 'circle']],
                paint: {
                    'fill-color': '#3b82f6',
                    'fill-opacity': 0.4
                }
            });

            // Add layer for outage circle zones
            mapInstance.addLayer({
                id: 'outage-zones',
                type: 'fill',
                source: 'zones',
                filter: ['all', ['==', ['get', 'type'], 'outage'], ['==', ['get', 'shape'], 'circle']],
                paint: {
                    'fill-color': '#ef4444',
                    'fill-opacity': 0.4
                }
            });

            // Add line layers for routes/paths
            mapInstance.addLayer({
                id: 'zones-lines',
                type: 'line',
                source: 'zones',
                filter: ['==', ['get', 'shape'], 'line'],
                paint: {
                    'line-color': ['case',
                        ['==', ['get', 'type'], 'flood'], '#2563eb',
                        ['==', ['get', 'type'], 'outage'], '#dc2626',
                        '#000000'
                    ],
                    'line-width': 6,
                    'line-opacity': 0.8
                }
            });

            // Add outline layers
            mapInstance.addLayer({
                id: 'zones-outline',
                type: 'line',
                source: 'zones',
                filter: ['==', ['get', 'shape'], 'circle'],
                paint: {
                    'line-color': ['case',
                        ['==', ['get', 'type'], 'flood'], '#2563eb',
                        ['==', ['get', 'type'], 'outage'], '#dc2626',
                        '#000000'
                    ],
                    'line-width': 2
                }
            });

            setMap(mapInstance);
        });

        return () => {
            mapInstance.remove();
        };
    }, [isMounted]);

    // Handle zone drawing
    useEffect(() => {
        if (!map || !isDrawing) return;

        let centerPoint: number[] | null = drawingCenter;
        let currentRadius = drawingRadius;
        let linePoints: number[][] = [...drawingPoints];

        const handleMapClick = (e: any) => {
            const { lng, lat } = e.lngLat;
            
            if (drawingShape === 'circle') {
                if (!centerPoint) {
                    // First click: set center
                    centerPoint = [lng, lat];
                    setDrawingCenter([lng, lat]);
                } else {
                    // Second click: finish circle
                    const finalRadius = currentRadius > 0 ? currentRadius : 100;
                    const newZone: Zone = {
                        id: `zone-${Date.now()}`,
                        type: drawingType!,
                        shape: 'circle',
                        center: centerPoint,
                        radius: finalRadius
                    };

                    setZones(prev => [...prev, newZone]);
                    updateZonesOnMap([...zones, newZone]);
                    cancelDrawing();
                }
            } else {
                // Line mode: add point
                linePoints.push([lng, lat]);
                setDrawingPoints(linePoints);
                updateLineDrawingLayer(linePoints);
            }
        };

        const handleMouseMove = (e: any) => {
            const { lng, lat } = e.lngLat;
            
            if (drawingShape === 'circle' && centerPoint) {
                const radius = calculateDistance(centerPoint, [lng, lat]);
                currentRadius = radius;
                setDrawingRadius(radius);
                updateDrawingLayer(centerPoint, radius);
            } else if (drawingShape === 'line' && linePoints.length > 0) {
                updateLineDrawingLayer([...linePoints, [lng, lat]]);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                cancelDrawing();
            } else if (e.key === 'Enter' && drawingShape === 'line' && linePoints.length >= 2) {
                // Finish line drawing
                const newZone: Zone = {
                    id: `zone-${Date.now()}`,
                    type: drawingType!,
                    shape: 'line',
                    coordinates: linePoints
                };

                setZones(prev => [...prev, newZone]);
                updateZonesOnMap([...zones, newZone]);
                cancelDrawing();
            }
        };

        const handleDblClick = () => {
            if (drawingShape === 'line' && linePoints.length >= 2) {
                const newZone: Zone = {
                    id: `zone-${Date.now()}`,
                    type: drawingType!,
                    shape: 'line',
                    coordinates: linePoints
                };

                setZones(prev => [...prev, newZone]);
                updateZonesOnMap([...zones, newZone]);
                cancelDrawing();
            }
        };

        map.on('click', handleMapClick);
        map.on('mousemove', handleMouseMove);
        map.on('dblclick', handleDblClick);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            map.off('click', handleMapClick);
            map.off('mousemove', handleMouseMove);
            map.off('dblclick', handleDblClick);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [map, isDrawing, zones, drawingType, drawingShape]);

    const calculateDistance = (coord1: number[], coord2: number[]): number => {
        const R = 6371e3; // Earth radius in meters
        const φ1 = coord1[1] * Math.PI / 180;
        const φ2 = coord2[1] * Math.PI / 180;
        const Δφ = (coord2[1] - coord1[1]) * Math.PI / 180;
        const Δλ = (coord2[0] - coord1[0]) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    };

    const createCircleCoordinates = (center: number[], radius: number): number[][] => {
        const points = 64;
        const coords: number[][] = [];
        const distanceX = radius / (111320 * Math.cos(center[1] * Math.PI / 180));
        const distanceY = radius / 110540;

        for (let i = 0; i < points; i++) {
            const angle = (i / points) * 2 * Math.PI;
            const dx = distanceX * Math.cos(angle);
            const dy = distanceY * Math.sin(angle);
            coords.push([center[0] + dx, center[1] + dy]);
        }
        coords.push(coords[0]); // Close the circle
        return coords;
    };

    const updateDrawingLayer = (center: number[], radius: number) => {
        if (!map || !center) return;

        const circleCoords = createCircleCoordinates(center, radius);

        const source = map.getSource('drawing-temp') as any;
        if (source) {
            source.setData({
                type: 'FeatureCollection',
                features: [{
                    type: 'Feature',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [circleCoords]
                    },
                    properties: {}
                }]
            });
        } else {
            initDrawingLayers();
            updateDrawingLayer(center, radius);
        }
    };

    const updateLineDrawingLayer = (points: number[][]) => {
        if (!map || points.length === 0) return;

        const source = map.getSource('drawing-temp') as any;
        if (source) {
            source.setData({
                type: 'FeatureCollection',
                features: [{
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: points
                    },
                    properties: {}
                }]
            });
        } else {
            initDrawingLayers();
            updateLineDrawingLayer(points);
        }
    };

    const initDrawingLayers = () => {
        if (!map || map.getSource('drawing-temp')) return;

        map.addSource('drawing-temp', {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: []
            }
        });

        map.addLayer({
            id: 'drawing-temp-fill',
            type: 'fill',
            source: 'drawing-temp',
            paint: {
                'fill-color': drawingType === 'flood' ? '#3b82f6' : '#ef4444',
                'fill-opacity': 0.3
            }
        });

        map.addLayer({
            id: 'drawing-temp-line',
            type: 'line',
            source: 'drawing-temp',
            paint: {
                'line-color': drawingType === 'flood' ? '#2563eb' : '#dc2626',
                'line-width': 6,
                'line-opacity': 0.6,
                'line-dasharray': [2, 2]
            }
        });
    };

    const finishDrawing = () => {
        if (!drawingCenter) {
            alert('Please set a center point first');
            return;
        }
        
        const finalRadius = drawingRadius > 0 ? drawingRadius : 100; // Default 100m if no radius

        const newZone: Zone = {
            id: `zone-${Date.now()}`,
            type: drawingType!,
            shape: 'circle',
            center: drawingCenter,
            radius: finalRadius
        };

        setZones(prev => [...prev, newZone]);
        updateZonesOnMap([...zones, newZone]);
        cancelDrawing();
    };

    const cancelDrawing = () => {
        setIsDrawing(false);
        setDrawingType(null);
        setDrawingCenter(null);
        setDrawingRadius(0);
        setDrawingPoints([]);
        
        if (map && map.getSource('drawing-temp')) {
            map.removeLayer('drawing-temp-fill');
            map.removeLayer('drawing-temp-line');
            map.removeSource('drawing-temp');
        }
    };

    const updateZonesOnMap = (zonesData: Zone[]) => {
        if (!map) return;

        const features = zonesData.map(zone => {
            if (zone.shape === 'circle' && zone.center && zone.radius) {
                const circleCoords = createCircleCoordinates(zone.center, zone.radius);
                return {
                    type: 'Feature' as const,
                    geometry: {
                        type: 'Polygon' as const,
                        coordinates: [circleCoords]
                    },
                    properties: {
                        id: zone.id,
                        type: zone.type,
                        shape: zone.shape,
                        riskLevel: zone.riskLevel || 50
                    }
                };
            } else if (zone.shape === 'line' && zone.coordinates) {
                return {
                    type: 'Feature' as const,
                    geometry: {
                        type: 'LineString' as const,
                        coordinates: zone.coordinates
                    },
                    properties: {
                        id: zone.id,
                        type: zone.type,
                        shape: zone.shape,
                        riskLevel: zone.riskLevel || 50
                    }
                };
            }
            return null;
        }).filter(f => f !== null);

        const source = map.getSource('zones') as any;
        if (source) {
            source.setData({
                type: 'FeatureCollection',
                features
            });
        }
    };

    const handleDrawZone = (type: 'flood' | 'outage', shape: 'circle' | 'line') => {
        if (isDrawing) {
            cancelDrawing();
        }
        setIsDrawing(true);
        setDrawingType(type);
        setDrawingShape(shape);
        setDrawingCenter(null);
        setDrawingRadius(0);
        setDrawingPoints([]);
    };

    const handleClearZones = () => {
        if (confirm('Are you sure you want to clear all zones?')) {
            setZones([]);
            updateZonesOnMap([]);
        }
    };

    // Update zones when they change
    useEffect(() => {
        if (map && zones.length > 0) {
            updateZonesOnMap(zones);
        }
    }, [zones, map]);

    if (!isMounted) {
        return <div style={{ width: '100vw', height: '100vh', backgroundColor: '#f0f0f0' }} />;
    }

    return (
        <>
            <div id="map" ref={mapContainerRef} style={{ width: '100vw', height: '100vh' }} />
            {isAdmin && (
                <>
                    <AdminPanel 
                        map={map}
                        onDrawZone={handleDrawZone}
                        onClearZones={handleClearZones}
                    />
                    {isDrawing && (
                        <div className="fixed top-4 right-4 z-50 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg">
                            {drawingShape === 'circle' ? (
                                !drawingCenter 
                                    ? `Click to set center of ${drawingType} zone`
                                    : `Click again to finish zone (Radius: ${Math.round(drawingRadius)}m) - Press ESC to cancel`
                            ) : (
                                `Drawing ${drawingType} route (${drawingPoints.length} points) - Double-click or Enter to finish, ESC to cancel`
                            )}
                        </div>
                    )}
                </>
            )}
        </>
    );
}