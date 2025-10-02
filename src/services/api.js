import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Токен авторизації
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// API методи
export const categoryAPI = {
    getAll: () => api.get('/categorys/all'),
    getById: (id) => api.get(`/categorys/${id}`),
    create: (category) => api.post('/categorys/create', category),
    update: (id, category) => api.put(`/categorys/${id}`, category),
    delete: (id) => api.delete(`/categorys/${id}`)
};

export const restaurantAPI = {
    getAll: () => api.get('/restaurants/all'),
    getById: (id) => api.get(`/restaurants/${id}`),
    create: (restaurant) => api.post('/restaurants/create', restaurant),
    update: (id, restaurant) => api.put(`/restaurants/${id}`, restaurant),
    delete: (id) => api.delete(`/restaurants/${id}`)
};

export const menuItemAPI = {
    getAll: () => api.get('/menuItems/all'),
    getById: (id) => api.get(`/menuItems/${id}`),
    getByRestaurant: (restaurantId) => api.get(`/menuItems/restaurant/${restaurantId}`),
    create: (menuItem) => api.post('/menuItems/create', menuItem),
    update: (id, menuItem) => api.put(`/menuItems/${id}`, menuItem),
    delete: (id) => api.delete(`/menuItems/${id}`)
};

export const userAPI = {
    getAll: () => api.get('/users/all'),
    getById: (id) => api.get(`/users/${id}`),
    create: (user) => api.post('/users/create', user),
    update: (id, user) => api.put(`/users/${id}`, user),
    delete: (id) => api.delete(`/users/${id}`)
};

export const orderAPI = {
    getAll: () => api.get('/orders/all'),
    getById: (id) => api.get(`/orders/${id}`),
    getByUser: (userId) => api.get(`/orders/user/${userId}`),
    create: (order) => api.post('/orders/create', order),
    update: (id, order) => api.put(`/orders/${id}`, order),
    delete: (id) => api.delete(`/orders/${id}`),

    updateStatus: (orderId, status) => api.put(`/orders/status/${orderId}`, { status })

};

export const orderItemAPI = {
    getAll: () => api.get('/orderItems/all'),
    getById: (id) => api.get(`/orderItems/${id}`),
    getByOrder: (orderId) => api.get(`/orderItems/order/${orderId}`),
    create: (orderItem) => api.post('/orderItems/create', orderItem),
    update: (id, orderItem) => api.put(`/orderItems/${id}`, orderItem),
    delete: (id) => api.delete(`/orderItems/${id}`)
};

export const reviewAPI = {
    getAll: () => api.get('/reviews/all'),
    getById: (id) => api.get(`/reviews/${id}`),
    getByRestaurant: (restaurantId) => api.get(`/reviews/restaurant/${restaurantId}`),
    create: (review) => api.post('/reviews/create', review),
    update: (id, review) => api.put(`/reviews/${id}`, review),
    delete: (id) => api.delete(`/reviews/${id}`)
};

export const favoriteAPI = {
    getAll: () => api.get('/favorites/all'),
    getById: (id) => api.get(`/favorites/${id}`),
    getByUser: (userId) => api.get(`/favorites/user/${userId}`),
    create: (favorite) => api.post('/favorites/create', favorite),
    delete: (id) => api.delete(`/favorites/${id}`)
};

export const loyaltyCardAPI = {
    getAll: () => api.get('/loyaltyCards/all'),
    getById: (id) => api.get(`/loyaltyCards/${id}`),
    getByUser: (userId) => api.get(`/loyaltyCards/user/${userId}`),
    create: (loyaltyCard) => api.post('/loyaltyCards/create', loyaltyCard),
    addPoints: (userId, points) => api.post(`/loyaltyCards/addPoints/${userId}`, { points }),
    upgrade: (userId) => api.put(`/loyaltyCards/upgrade/${userId}`),
    update: (id, loyaltyCard) => api.put(`/loyaltyCards/${id}`, loyaltyCard),
    delete: (id) => api.delete(`/loyaltyCards/${id}`)
};

export const deliveryTrackingAPI = {
    getAll: () => api.get('/deliveryTrackings/all'),
    getById: (id) => api.get(`/deliveryTrackings/${id}`),
    getByOrder: (orderId) => api.get(`/deliveryTrackings/order/${orderId}`),
    simulate: (orderId) => api.post(`/deliveryTrackings/simulate/${orderId}`),
    create: (tracking) => api.post('/deliveryTrackings/create', tracking),
    update: (id, tracking) => api.put(`/deliveryTrackings/${id}`, tracking),
    delete: (id) => api.delete(`/deliveryTrackings/${id}`)
};

export default api;