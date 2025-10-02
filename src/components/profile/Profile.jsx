import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { Link } from 'react-router-dom';
import { orderAPI, favoriteAPI, orderItemAPI, menuItemAPI } from '../../services/api';

function Profile() {
    const { auth } = useAuth();
    const { dispatch } = useCart();
    const [orders, setOrders] = useState([]);
    const [favorites, setFavorites] = useState([]);

    useEffect(() => {
        if (auth.user) {
            fetchOrders();
            fetchFavorites();
        }
    }, [auth.user]);

    const fetchOrders = async () => {
        try {
            const response = await orderAPI.getByUser(auth.user.id);
            const ordersList = response.data._embedded?.orders || [];
            setOrders(ordersList);
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    };

    const fetchFavorites = async () => {
        try {
            const response = await favoriteAPI.getByUser(auth.user.id);
            setFavorites(response.data._embedded?.favorites || []);
        } catch (error) {
            console.error('Error fetching favorites:', error);
        }
    };

    const reorder = async (order) => {
        try {
            const itemsResponse = await orderItemAPI.getByOrder(order.id);
            const orderItems = itemsResponse.data._embedded?.orderItems || [];

            if (orderItems.length === 0) {
                alert('Замовлення не містить страв');
                return;
            }

            for (const item of orderItems) {
                const menuItemResponse = await menuItemAPI.getById(item.menuItemId);
                const menuItem = menuItemResponse.data;

                for (let i = 0; i < item.quantity; i++) {
                    dispatch({ type: 'ADD_ITEM', payload: menuItem });
                }
            }

            alert('Страви додано в кошик!');
        } catch (error) {
            console.error('Reorder error:', error);
            alert('Помилка повторного замовлення');
        }
    };

    const removeFavorite = async (favoriteId) => {
        try {
            await favoriteAPI.delete(favoriteId);
            fetchFavorites();
            // eslint-disable-next-line no-unused-vars
        } catch (error) {
            alert('Помилка видалення');
        }
    };

    if (!auth.isAuthenticated) {
        return <div className="profile-container">Увійдіть в систему</div>;
    }

    return (
        <div className="profile-container">
            <h2>Персональний кабінет</h2>
            <p>Ласкаво просимо, {auth.user.firstName} {auth.user.lastName}!</p>

            <div className="orders-section">
                <h3>Історія замовлень</h3>
                {orders.length === 0 ? (
                    <p>Замовлень поки немає</p>
                ) : (
                    orders.map(order => (
                        <div key={order.id} className="order-item">
                            <div className="order-info">
                                <h4>Замовлення #{order.id}</h4>
                                <p>Сума: {order.totalAmount} грн</p>
                                <p>Дата: {order.createdAt ? new Date(order.createdAt).toLocaleDateString('uk-UA') : new Date().toLocaleDateString('uk-UA')}</p>
                            </div>
                            <div className="order-actions">
                                <button onClick={() => reorder(order)} className="reorder-btn">
                                    Повторити замовлення
                                </button>
                                <Link to={`/tracking/${order.id}`} className="tracking-btn">
                                    Відстежити
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="favorites-section">
                <h3>Улюблені ресторани</h3>
                {favorites.length === 0 ? (
                    <p>Улюблених ресторанів поки немає</p>
                ) : (
                    favorites.map(fav => (
                        <div key={fav.id} className="favorite-item">
                            <div>
                                <h4>{fav.restaurantName}</h4>
                                <p>Додано: {fav.createdAt ? new Date(fav.createdAt).toLocaleDateString('uk-UA') : 'Щойно'}</p>
                            </div>
                            <button onClick={() => removeFavorite(fav.id)} className="remove-favorite-btn">
                                Видалити
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default Profile;