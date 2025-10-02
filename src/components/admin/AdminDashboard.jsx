import { useState, useEffect } from 'react';
import { restaurantAPI, categoryAPI } from '../../services/api';

function AdminDashboard() {
    const [restaurants, setRestaurants] = useState([]);
    const [categories, setCategories] = useState([]);
    const [newRestaurant, setNewRestaurant] = useState({
        name: '', description: '', address: '', phone: '',
        deliveryTime: '', minOrderAmount: '', categoryId: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const [restRes, catRes] = await Promise.all([
            restaurantAPI.getAll(),
            categoryAPI.getAll()
        ]);
        setRestaurants(restRes.data._embedded?.restaurants || []);
        setCategories(catRes.data._embedded?.categorys || []);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await restaurantAPI.create({
                ...newRestaurant,
                category: { id: parseInt(newRestaurant.categoryId) }
            });
            fetchData();
            setNewRestaurant({
                name: '', description: '', address: '', phone: '',
                deliveryTime: '', minOrderAmount: '', categoryId: ''
            });
            // eslint-disable-next-line no-unused-vars
        } catch (error) {
            alert('Помилка створення');
        }
    };

    return (
        <div className="admin-container">
            <h2>Адмін панель</h2>

            <div className="admin-form">
                <h3>Додати ресторан</h3>
                <form onSubmit={handleSubmit}>
                    <input
                        placeholder="Назва"
                        value={newRestaurant.name}
                        onChange={(e) => setNewRestaurant({...newRestaurant, name: e.target.value})}
                        required
                    />
                    <textarea
                        placeholder="Опис"
                        value={newRestaurant.description}
                        onChange={(e) => setNewRestaurant({...newRestaurant, description: e.target.value})}
                    />
                    <select
                        value={newRestaurant.categoryId}
                        onChange={(e) => setNewRestaurant({...newRestaurant, categoryId: e.target.value})}
                        required
                    >
                        <option value="">Виберіть категорію</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                    <button type="submit">Створити</button>
                </form>
            </div>

            <div className="restaurants-list">
                {restaurants.map(rest => (
                    <div key={rest.id} className="admin-item">
                        <span>{rest.name}</span>
                        <button onClick={() => restaurantAPI.delete(rest.id)}>Видалити</button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default AdminDashboard;