import { useState } from 'react';
import { useNotifications } from '../../hooks/useNotifications';

function NotificationBell() {
    const { notifications, clearNotifications } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="notification-bell">
            <button className="bell-icon" onClick={() => setIsOpen(!isOpen)}>
                🔔
                {notifications.length > 0 && (
                    <span className="notification-badge">{notifications.length}</span>
                )}
            </button>

            {isOpen && (
                <div className="notification-dropdown">
                    <div className="notification-header">
                        <h4>Сповіщення</h4>
                        <button onClick={clearNotifications}>Очистити</button>
                    </div>
                    {notifications.length === 0 ? (
                        <p>Немає нових сповіщень</p>
                    ) : (
                        notifications.map((notif, index) => (
                            <div key={index} className="notification-item">
                                {notif}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

export default NotificationBell;