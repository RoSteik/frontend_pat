import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { orderAPI, deliveryTrackingAPI } from '../../services/api';

// Leaflet default icon setup (CDN images)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const courierIcon = new L.DivIcon({
    html: '<div class="courier-emoji">🚴‍♂️</div>',
    className: 'courier-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
});

function MapUpdater({ position, zoom }) {
    const map = useMap();
    useEffect(() => {
        if (position && position[0] && position[1]) {
            try {
                map.setView(position, zoom || 15, { animate: true, duration: 0.8 });
            } catch (e) {
                try { map.panTo(position); } catch (err) { /* ignore */ }
            }
        }
    }, [position, map, zoom]);
    return null;
}

export default function OrderTracking() {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [tracking, setTracking] = useState(null);

    // "істинна" позиція кур'єра
    const [courierPosition, setCourierPosition] = useState([49.8397, 24.0297]);
    // позиція яка відображається під час анімації
    const [displayPosition, setDisplayPosition] = useState([49.8397, 24.0297]);

    const [routeCoordinates, setRouteCoordinates] = useState([]);
    const destination = [49.8450, 24.0350];

    // toast state for in-app notification
    const [toast, setToast] = useState(null);

    const intervalRef = useRef(null);
    const markerRef = useRef(null);
    const mapRef = useRef(null);
    const animRef = useRef({ id: null, startTs: null });
    const lastPosRef = useRef(courierPosition);

    // Безпечна функція для установки позиції маркера (покриває декілька варіантів API)
    const safeSetMarkerLatLng = (marker, latlng) => {
        try {
            if (!marker) return;
            if (typeof marker.setLatLng === 'function') {
                marker.setLatLng(latlng);
                return;
            }
            if (marker.leafletElement && typeof marker.leafletElement.setLatLng === 'function') {
                marker.leafletElement.setLatLng(latlng);
                return;
            }
            if (marker.current && typeof marker.current.setLatLng === 'function') {
                marker.current.setLatLng(latlng);
                return;
            }
        } catch (e) {
            console.warn('safeSetMarkerLatLng error', e);
        }
    };

    useEffect(() => {
        fetchOrder();
        initTracking();

        // optionally request browser notification permission on mount
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'default') {
                // don't force prompt — comment this out if you prefer requesting later
                Notification.requestPermission().catch(() => {});
            }
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (animRef.current.id) cancelAnimationFrame(animRef.current.id);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderId]);

    useEffect(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);

        if (order?.status === 'DELIVERING') {
            fetchTrackingData();
            intervalRef.current = setInterval(() => {
                fetchTrackingData();
            }, 3000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            // if status becomes COMPLETED while not in delivering view, still show notification
            if (order?.status === 'COMPLETED') {
                triggerDeliveryArrivedNotification();
            }
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [order?.status, orderId]);

    useEffect(() => {
        if (order?.status === 'DELIVERING' && courierPosition) {
            fetchRoute(courierPosition, destination);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courierPosition[0], courierPosition[1], order?.status]);

    const fetchRoute = async (start, end) => {
        try {
            const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.routes && data.routes[0]) {
                const coords = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
                setRouteCoordinates(coords);
                console.log('🗺️ Route updated:', coords.length, 'points');
            }
        } catch (error) {
            console.error('Route error:', error);
        }
    };

    const fetchOrder = async () => {
        try {
            const response = await orderAPI.getById(orderId);
            setOrder(response.data);
        } catch (error) {
            console.error('Error fetching order:', error);
        }
    };

    const initTracking = async () => {
        try {
            const response = await deliveryTrackingAPI.simulate(orderId);
            if (response?.data?.currentLatitude && response?.data?.currentLongitude) {
                const p = [response.data.currentLatitude, response.data.currentLongitude];
                setCourierPosition(p);
                setDisplayPosition(p);
                lastPosRef.current = p;
            }
            setTracking(response.data);
        } catch (error) {
            console.log('Init tracking error');
        }
    };

    // Плавна інтерполяція між двома точками за допомогою requestAnimationFrame
    const animateMarker = (from, to, duration = 1000) => {
        if (animRef.current.id) {
            cancelAnimationFrame(animRef.current.id);
            animRef.current.id = null;
        }

        const start = performance.now();
        animRef.current.startTs = start;

        const marker = markerRef.current;
        const map = mapRef.current;

        const step = (now) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // easeInOutQuad

            const lat = from[0] + (to[0] - from[0]) * eased;
            const lng = from[1] + (to[1] - from[1]) * eased;

            safeSetMarkerLatLng(marker, [lat, lng]);
            setDisplayPosition([lat, lng]);

            try {
                if (map && typeof map.flyTo === 'function') {
                    map.flyTo([lat, lng], map.getZoom(), { animate: false });
                }
            } catch (e) {
                console.warn('map fly error', e);
            }

            if (t < 1) {
                animRef.current.id = requestAnimationFrame(step);
            } else {
                setCourierPosition(to);
                lastPosRef.current = to;
                animRef.current.id = null;
                safeSetMarkerLatLng(marker, to);
                setDisplayPosition(to);
            }
        };

        animRef.current.id = requestAnimationFrame(step);
    };

    // Function that shows browser notification (if allowed) and in-app toast
    const triggerDeliveryArrivedNotification = (opts = {}) => {
        const title = opts.title || 'Кур’єр приїхав';
        const body = opts.body || 'Ваш кур’єр прибув за адресою. Приємного дня!';

        // In-app toast
        setToast({ title, body });
        // auto hide after 6s
        setTimeout(() => setToast(null), 6000);

        // Browser notification
        try {
            if (typeof window !== 'undefined' && 'Notification' in window) {
                if (Notification.permission === 'granted') {
                    new Notification(title, { body });
                } else if (Notification.permission !== 'denied') {
                    Notification.requestPermission().then(permission => {
                        if (permission === 'granted') {
                            new Notification(title, { body });
                        }
                    }).catch(() => {});
                }
            }
        } catch (e) {
            console.warn('Notification error', e);
        }
    };

    // Головна функція, що опитує API трекінгу
    const fetchTrackingData = async () => {
        try {
            const response = await deliveryTrackingAPI.simulate(orderId);
            const data = response.data;
            setTracking(data);

            if (data.currentLatitude && data.currentLongitude) {
                const newPos = [data.currentLatitude, data.currentLongitude];
                const oldPos = lastPosRef.current || courierPosition;

                const hasChanged = Math.abs(newPos[0] - oldPos[0]) > 0.00001 ||
                    Math.abs(newPos[1] - oldPos[1]) > 0.00001;

                // ОНОВЛЕННЯ СТАНУ ЗАМОВЛЕННЯ ПЕРШИМ
                try {
                    const orderResponse = await orderAPI.getById(orderId);
                    setOrder(orderResponse.data);

                    if (orderResponse.data.status === 'COMPLETED') {
                        if (intervalRef.current) {
                            clearInterval(intervalRef.current);
                            intervalRef.current = null;
                        }
                        // show notification once when completed
                        triggerDeliveryArrivedNotification();
                        return;
                    }
                } catch (err) {
                    console.warn('Failed to fetch order status (non-fatal):', err);
                }

                if (hasChanged) {
                    try {
                        animateMarker(oldPos, newPos, 900);
                    } catch (e) {
                        console.warn('animateMarker failed but continuing', e);
                        setCourierPosition(newPos);
                        setDisplayPosition(newPos);
                        lastPosRef.current = newPos;
                    }
                }
            } else {
                // Якщо координат немає — все одно перевіримо статус замовлення
                try {
                    const orderResponse = await orderAPI.getById(orderId);
                    setOrder(orderResponse.data);
                    if (orderResponse.data.status === 'COMPLETED') {
                        if (intervalRef.current) {
                            clearInterval(intervalRef.current);
                            intervalRef.current = null;
                        }
                        triggerDeliveryArrivedNotification();
                    }
                } catch (err) {
                    console.warn('Failed to fetch order status fallback:', err);
                }
            }
        } catch (error) {
            console.error('❌ Tracking error:', error);
        }
    };

    const updateStatus = async (newStatus) => {
        try {
            await orderAPI.updateStatus(orderId, newStatus);
            await fetchOrder();

            // якщо статус змінено вручну на COMPLETED — також показуємо сповіщення
            if (newStatus === 'COMPLETED') {
                triggerDeliveryArrivedNotification();
            }

            if (newStatus === 'DELIVERING') {
                await initTracking();
            }
        } catch (error) {
            alert('Помилка');
        }
    };

    if (!order) return <div>Завантаження...</div>;

    const statusSteps = [
        { key: 'PENDING', label: 'Прийняте', icon: '📝' },
        { key: 'CONFIRMED', label: 'Підтверджено', icon: '✅' },
        { key: 'PREPARING', label: 'Готується', icon: '👨‍🍳' },
        { key: 'DELIVERING', label: 'Доставляється', icon: '🚚' },
        { key: 'COMPLETED', label: 'Доставлено', icon: '🎉' }
    ];

    const currentStepIndex = statusSteps.findIndex(s => s.key === order.status);

    return (
        <div className="tracking-container">
            {/* simple in-app toast (top-right) */}
            {toast && (
                <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 2000 }}>
                    <div style={{ background: '#111', color: '#fff', padding: '12px 16px', borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.2)' }}>
                        <strong>{toast.title}</strong>
                        <div style={{ fontSize: 13, opacity: 0.9 }}>{toast.body}</div>
                    </div>
                </div>
            )}

            <h2>Відстеження замовлення #{order.id}</h2>

            <div className="status-timeline">
                {statusSteps.map((step, index) => (
                    <div key={step.key} className={`status-step ${index <= currentStepIndex ? 'active' : ''}`}>
                        <div className="step-icon">{step.icon}</div>
                        <div className="step-label">{step.label}</div>
                        {index < statusSteps.length - 1 && (
                            <div className={`step-line ${index < currentStepIndex ? 'active' : ''}`}></div>
                        )}
                    </div>
                ))}
            </div>

            {order.status === 'DELIVERING' && (
                <div className="delivery-map-section">
                    <h3>Кур'єр їде до вас</h3>
                    <p style={{ color: '#666', marginBottom: '10px' }}>
                        📍 Поточна позиція: [{displayPosition[0].toFixed(4)}, {displayPosition[1].toFixed(4)}]
                    </p>

                    <MapContainer
                        center={courierPosition}
                        zoom={15}
                        style={{ height: '500px', width: '100%', borderRadius: '12px' }}
                        whenCreated={(mapInstance) => { mapRef.current = mapInstance; }}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; OpenStreetMap'
                        />

                        <MapUpdater position={displayPosition} zoom={15} />

                        {routeCoordinates.length > 0 && (
                            <Polyline
                                positions={routeCoordinates}
                                color="#667eea"
                                weight={4}
                                opacity={0.7}
                            />
                        )}

                        {lastPosRef.current && (lastPosRef.current[0] !== courierPosition[0] || lastPosRef.current[1] !== courierPosition[1]) && (
                            <Polyline
                                positions={[lastPosRef.current, courierPosition]}
                                color="#ff6b6b"
                                weight={3}
                                dashArray="5, 10"
                            />
                        )}

                        <Marker
                            position={courierPosition}
                            icon={courierIcon}
                            ref={markerRef}
                        >
                            <Popup>
                                <strong>{tracking?.courierName}</strong><br />
                                {tracking?.courierPhone}
                            </Popup>
                        </Marker>

                        <Marker position={destination}>
                            <Popup>
                                <strong>Адреса доставки</strong><br />
                                {order.deliveryAddress}
                            </Popup>
                        </Marker>
                    </MapContainer>

                    {tracking && (
                        <div className="courier-info">
                            <div className="info-row">
                                <span>👤 Кур'єр:</span>
                                <strong>{tracking.courierName}</strong>
                            </div>
                            <div className="info-row">
                                <span>📞 Телефон:</span>
                                <strong>{tracking.courierPhone}</strong>
                            </div>
                            <div className="info-row">
                                <span>⏱ Залишилось:</span>
                                <strong>{tracking.estimatedTime} хв</strong>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="admin-controls">
                <h4>Симуляція статусів</h4>
                <div className="status-buttons">
                    {statusSteps.map(step => (
                        <button
                            key={step.key}
                            onClick={() => updateStatus(step.key)}
                            className={`status-btn ${order.status === step.key ? 'active' : ''}`}
                        >
                            {step.icon} {step.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}



// import React, { useState, useEffect, useRef } from 'react';
// import { useParams } from 'react-router-dom';
// import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
// import L from 'leaflet';
// import 'leaflet/dist/leaflet.css';
// import { orderAPI, deliveryTrackingAPI } from '../../services/api';
//
// // Leaflet default icon setup (CDN images)
// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//     iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
//     iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
//     shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
// });
//
// const courierIcon = new L.DivIcon({
//     html: '<div class="courier-emoji">🚴‍♂️</div>',
//     className: 'courier-marker',
//     iconSize: [40, 40],
//     iconAnchor: [20, 20]
// });
//
// function MapUpdater({ position, zoom }) {
//     const map = useMap();
//     useEffect(() => {
//         if (position && position[0] && position[1]) {
//             try {
//                 map.setView(position, zoom || 15, { animate: true, duration: 0.8 });
//             } catch (e) {
//                 // fallback — деякі версії leaflet/react-leaflet можуть інакше працювати
//                 try { map.panTo(position); } catch (err) { /* ignore */ }
//             }
//         }
//     }, [position, map, zoom]);
//     return null;
// }
//
// export default function OrderTracking() {
//     const { orderId } = useParams();
//     const [order, setOrder] = useState(null);
//     const [tracking, setTracking] = useState(null);
//
//     // "істинна" позиція кур'єра
//     const [courierPosition, setCourierPosition] = useState([49.8397, 24.0297]);
//     // позиція яка відображається під час анімації
//     const [displayPosition, setDisplayPosition] = useState([49.8397, 24.0297]);
//
//     const [routeCoordinates, setRouteCoordinates] = useState([]);
//     const destination = [49.8450, 24.0350];
//
//     const intervalRef = useRef(null);
//     const markerRef = useRef(null);
//     const mapRef = useRef(null);
//     const animRef = useRef({ id: null, startTs: null });
//     const lastPosRef = useRef(courierPosition);
//
//     // Безпечна функція для установки позиції маркера (покриває декілька варіантів API)
//     const safeSetMarkerLatLng = (marker, latlng) => {
//         try {
//             if (!marker) return;
//             // React-Leaflet v3/v4 маркер може бути нативним Leaflet instance
//             if (typeof marker.setLatLng === 'function') {
//                 marker.setLatLng(latlng);
//                 return;
//             }
//             // Доступ через .leafletElement (старіші варіанти)
//             if (marker.leafletElement && typeof marker.leafletElement.setLatLng === 'function') {
//                 marker.leafletElement.setLatLng(latlng);
//                 return;
//             }
//             // Якщо ref містить current.property (наприклад .current)
//             if (marker.current && typeof marker.current.setLatLng === 'function') {
//                 marker.current.setLatLng(latlng);
//                 return;
//             }
//         } catch (e) {
//             console.warn('safeSetMarkerLatLng error', e);
//         }
//     };
//
//     useEffect(() => {
//         fetchOrder();
//         initTracking();
//
//         return () => {
//             if (intervalRef.current) clearInterval(intervalRef.current);
//             if (animRef.current.id) cancelAnimationFrame(animRef.current.id);
//         };
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [orderId]);
//
//     useEffect(() => {
//         // Очистка старого інтервалу
//         if (intervalRef.current) clearInterval(intervalRef.current);
//
//         if (order?.status === 'DELIVERING') {
//             // Перший виклик негайно
//             fetchTrackingData();
//
//             // Встановлюємо частіший інтервал (регулюйте під ваш сервіс)
//             intervalRef.current = setInterval(() => {
//                 fetchTrackingData();
//             }, 3000);
//         } else {
//             if (intervalRef.current) {
//                 clearInterval(intervalRef.current);
//                 intervalRef.current = null;
//             }
//         }
//
//         return () => {
//             if (intervalRef.current) clearInterval(intervalRef.current);
//         };
//     }, [order?.status, orderId]);
//
//     useEffect(() => {
//         if (order?.status === 'DELIVERING' && courierPosition) {
//             fetchRoute(courierPosition, destination);
//         }
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [courierPosition[0], courierPosition[1], order?.status]);
//
//     const fetchRoute = async (start, end) => {
//         try {
//             const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
//             const response = await fetch(url);
//             const data = await response.json();
//
//             if (data.routes && data.routes[0]) {
//                 const coords = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
//                 setRouteCoordinates(coords);
//                 console.log('🗺️ Route updated:', coords.length, 'points');
//             }
//         } catch (error) {
//             console.error('Route error:', error);
//         }
//     };
//
//     const fetchOrder = async () => {
//         try {
//             const response = await orderAPI.getById(orderId);
//             setOrder(response.data);
//         } catch (error) {
//             console.error('Error fetching order:', error);
//         }
//     };
//
//     const initTracking = async () => {
//         try {
//             const response = await deliveryTrackingAPI.simulate(orderId);
//             if (response?.data?.currentLatitude && response?.data?.currentLongitude) {
//                 const p = [response.data.currentLatitude, response.data.currentLongitude];
//                 setCourierPosition(p);
//                 setDisplayPosition(p);
//                 lastPosRef.current = p;
//             }
//             setTracking(response.data);
//         } catch (error) {
//             console.log('Init tracking error');
//         }
//     };
//
//     // Плавна інтерполяція між двома точками за допомогою requestAnimationFrame
//     const animateMarker = (from, to, duration = 1000) => {
//         // відміняємо попередню анімацію
//         if (animRef.current.id) {
//             cancelAnimationFrame(animRef.current.id);
//             animRef.current.id = null;
//         }
//
//         const start = performance.now();
//         animRef.current.startTs = start;
//
//         const marker = markerRef.current;
//         const map = mapRef.current;
//
//         const step = (now) => {
//             const t = Math.min(1, (now - start) / duration);
//             const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // easeInOutQuad
//
//             const lat = from[0] + (to[0] - from[0]) * eased;
//             const lng = from[1] + (to[1] - from[1]) * eased;
//
//             // рух маркера без ререндеру React — через безпечну функцію
//             safeSetMarkerLatLng(marker, [lat, lng]);
//
//             // оновлюємо координати в UI (щоб показувати "поточну позицію")
//             setDisplayPosition([lat, lng]);
//
//             // плавно центруємо карту (без animate щоб уникнути перформанс-стрибу)
//             try {
//                 if (map && typeof map.flyTo === 'function') {
//                     map.flyTo([lat, lng], map.getZoom(), { animate: false });
//                 }
//             } catch (e) {
//                 console.warn('map fly error', e);
//             }
//
//             if (t < 1) {
//                 animRef.current.id = requestAnimationFrame(step);
//             } else {
//                 // кінець анімації — синхронізуємо "істинну" позицію
//                 setCourierPosition(to);
//                 lastPosRef.current = to;
//                 animRef.current.id = null;
//                 safeSetMarkerLatLng(marker, to);
//                 setDisplayPosition(to);
//             }
//         };
//
//         animRef.current.id = requestAnimationFrame(step);
//     };
//
//     // Головна функція, що опитує API трекінгу
//     const fetchTrackingData = async () => {
//         try {
//             const response = await deliveryTrackingAPI.simulate(orderId);
//             const data = response.data;
//             setTracking(data);
//
//             if (data.currentLatitude && data.currentLongitude) {
//                 const newPos = [data.currentLatitude, data.currentLongitude];
//                 const oldPos = lastPosRef.current || courierPosition;
//
//                 const hasChanged = Math.abs(newPos[0] - oldPos[0]) > 0.00001 ||
//                     Math.abs(newPos[1] - oldPos[1]) > 0.00001;
//
//                 // ОНОВЛЕННЯ СТАНУ ЗАМОВЛЕННЯ ПЕРШИМ
//                 try {
//                     const orderResponse = await orderAPI.getById(orderId);
//                     setOrder(orderResponse.data);
//
//                     if (orderResponse.data.status === 'COMPLETED') {
//                         if (intervalRef.current) {
//                             clearInterval(intervalRef.current);
//                             intervalRef.current = null;
//                         }
//                         // більше нічого не анімуємо
//                         return;
//                     }
//                 } catch (err) {
//                     console.warn('Failed to fetch order status (non-fatal):', err);
//                 }
//
//                 // Анімуємо маркер лише якщо позиція змінилась
//                 if (hasChanged) {
//                     try {
//                         animateMarker(oldPos, newPos, 900);
//                     } catch (e) {
//                         console.warn('animateMarker failed but continuing', e);
//                         // fallback: синхронно оновимо позицію
//                         setCourierPosition(newPos);
//                         setDisplayPosition(newPos);
//                         lastPosRef.current = newPos;
//                     }
//                 }
//             } else {
//                 // Якщо координат немає — все одно перевіримо статус замовлення
//                 try {
//                     const orderResponse = await orderAPI.getById(orderId);
//                     setOrder(orderResponse.data);
//                     if (orderResponse.data.status === 'COMPLETED') {
//                         if (intervalRef.current) {
//                             clearInterval(intervalRef.current);
//                             intervalRef.current = null;
//                         }
//                     }
//                 } catch (err) {
//                     console.warn('Failed to fetch order status fallback:', err);
//                 }
//             }
//         } catch (error) {
//             console.error('❌ Tracking error:', error);
//         }
//     };
//
//     const updateStatus = async (newStatus) => {
//         try {
//             await orderAPI.updateStatus(orderId, newStatus);
//             await fetchOrder();
//
//             if (newStatus === 'DELIVERING') {
//                 await initTracking();
//             }
//         } catch (error) {
//             alert('Помилка');
//         }
//     };
//
//     if (!order) return <div>Завантаження...</div>;
//
//     const statusSteps = [
//         { key: 'PENDING', label: 'Прийняте', icon: '📝' },
//         { key: 'CONFIRMED', label: 'Підтверджено', icon: '✅' },
//         { key: 'PREPARING', label: 'Готується', icon: '👨‍🍳' },
//         { key: 'DELIVERING', label: 'Доставляється', icon: '🚚' },
//         { key: 'COMPLETED', label: 'Доставлено', icon: '🎉' }
//     ];
//
//     const currentStepIndex = statusSteps.findIndex(s => s.key === order.status);
//
//     return (
//         <div className="tracking-container">
//             <h2>Відстеження замовлення #{order.id}</h2>
//
//             <div className="status-timeline">
//                 {statusSteps.map((step, index) => (
//                     <div key={step.key} className={`status-step ${index <= currentStepIndex ? 'active' : ''}`}>
//                         <div className="step-icon">{step.icon}</div>
//                         <div className="step-label">{step.label}</div>
//                         {index < statusSteps.length - 1 && (
//                             <div className={`step-line ${index < currentStepIndex ? 'active' : ''}`}></div>
//                         )}
//                     </div>
//                 ))}
//             </div>
//
//             {order.status === 'DELIVERING' && (
//                 <div className="delivery-map-section">
//                     <h3>Кур'єр їде до вас</h3>
//                     <p style={{ color: '#666', marginBottom: '10px' }}>
//                         📍 Поточна позиція: [{displayPosition[0].toFixed(4)}, {displayPosition[1].toFixed(4)}]
//                     </p>
//
//                     <MapContainer
//                         center={courierPosition}
//                         zoom={15}
//                         style={{ height: '500px', width: '100%', borderRadius: '12px' }}
//                         whenCreated={(mapInstance) => { mapRef.current = mapInstance; }}
//                     >
//                         <TileLayer
//                             url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//                             attribution='&copy; OpenStreetMap'
//                         />
//
//                         <MapUpdater position={displayPosition} zoom={15} />
//
//                         {routeCoordinates.length > 0 && (
//                             <Polyline
//                                 positions={routeCoordinates}
//                                 color="#667eea"
//                                 weight={4}
//                                 opacity={0.7}
//                             />
//                         )}
//
//                         {lastPosRef.current && (lastPosRef.current[0] !== courierPosition[0] || lastPosRef.current[1] !== courierPosition[1]) && (
//                             <Polyline
//                                 positions={[lastPosRef.current, courierPosition]}
//                                 color="#ff6b6b"
//                                 weight={3}
//                                 dashArray="5, 10"
//                             />
//                         )}
//
//                         <Marker
//                             position={courierPosition}
//                             icon={courierIcon}
//                             ref={markerRef}
//                         >
//                             <Popup>
//                                 <strong>{tracking?.courierName}</strong><br />
//                                 {tracking?.courierPhone}
//                             </Popup>
//                         </Marker>
//
//                         <Marker position={destination}>
//                             <Popup>
//                                 <strong>Адреса доставки</strong><br />
//                                 {order.deliveryAddress}
//                             </Popup>
//                         </Marker>
//                     </MapContainer>
//
//                     {tracking && (
//                         <div className="courier-info">
//                             <div className="info-row">
//                                 <span>👤 Кур'єр:</span>
//                                 <strong>{tracking.courierName}</strong>
//                             </div>
//                             <div className="info-row">
//                                 <span>📞 Телефон:</span>
//                                 <strong>{tracking.courierPhone}</strong>
//                             </div>
//                             <div className="info-row">
//                                 <span>⏱ Залишилось:</span>
//                                 <strong>{tracking.estimatedTime} хв</strong>
//                             </div>
//                         </div>
//                     )}
//                 </div>
//             )}
//
//             <div className="admin-controls">
//                 <h4>Симуляція статусів</h4>
//                 <div className="status-buttons">
//                     {statusSteps.map(step => (
//                         <button
//                             key={step.key}
//                             onClick={() => updateStatus(step.key)}
//                             className={`status-btn ${order.status === step.key ? 'active' : ''}`}
//                         >
//                             {step.icon} {step.label}
//                         </button>
//                     ))}
//                 </div>
//             </div>
//         </div>
//     );
// }
//
//
