// import { createContext, useReducer, useEffect } from 'react';
// import { useAuth } from '../hooks/useAuth';
// import api from '../services/api';
//
// // eslint-disable-next-line react-refresh/only-export-components
// export const NotificationContext = createContext();
//
// const notificationReducer = (state, action) => {
//     switch (action.type) {
//         case 'ADD':
//             return { notifications: [...state.notifications, action.payload] };
//         case 'CLEAR':
//             return { notifications: [] };
//         default:
//             return state;
//     }
// };
//
// export const NotificationProvider = ({ children }) => {
//     const [state, dispatch] = useReducer(notificationReducer, { notifications: [] });
//     const { auth } = useAuth();
//
//     useEffect(() => {
//         if (auth.user) {
//             const interval = setInterval(() => {
//                 fetchNotifications();
//             }, 3000);
//             return () => clearInterval(interval);
//         }
//     }, [auth.user]);
//
//     const fetchNotifications = async () => {
//         try {
//             const response = await api.get(`/notifications/user/${auth.user.id}`);
//             if (response.data.length > state.notifications.length) {
//                 response.data.forEach(notif => {
//                     if (!state.notifications.includes(notif)) {
//                         dispatch({ type: 'ADD', payload: notif });
//                     }
//                 });
//             }
//             // eslint-disable-next-line no-unused-vars
//         } catch (error) {
//             console.log('No notifications');
//         }
//     };
//
//     const clearNotifications = async () => {
//         try {
//             await api.delete(`/notifications/clear/${auth.user.id}`);
//             dispatch({ type: 'CLEAR' });
//             // eslint-disable-next-line no-unused-vars
//         } catch (error) {
//             console.log('Error clearing');
//         }
//     };
//
//     return (
//         <NotificationContext.Provider value={{ notifications: state.notifications, clearNotifications }}>
//             {children}
//         </NotificationContext.Provider>
//     );
// };

import { createContext, useReducer, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

// eslint-disable-next-line react-refresh/only-export-components
export const NotificationContext = createContext();

const notificationReducer = (state, action) => {
    switch (action.type) {
        case 'SET':
            return { notifications: action.payload };
        case 'CLEAR':
            return { notifications: [] };
        default:
            return state;
    }
};

export const NotificationProvider = ({ children }) => {
    const [state, dispatch] = useReducer(notificationReducer, { notifications: [] });
    const { auth } = useAuth();

    useEffect(() => {
        if (auth.user) {
            const interval = setInterval(() => {
                fetchNotifications();
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [auth.user]);

    const fetchNotifications = async () => {
        try {
            const response = await api.get(`/notifications/user/${auth.user.id}`);
            // Просто оновлюємо весь список
            dispatch({ type: 'SET', payload: response.data });
        } catch (error) {
            console.log('No notifications');
        }
    };

    const clearNotifications = async () => {
        try {
            await api.delete(`/notifications/clear/${auth.user.id}`);
            dispatch({ type: 'CLEAR' });
        } catch (error) {
            console.log('Error clearing');
        }
    };

    return (
        <NotificationContext.Provider value={{ notifications: state.notifications, clearNotifications }}>
            {children}
        </NotificationContext.Provider>
    );
};