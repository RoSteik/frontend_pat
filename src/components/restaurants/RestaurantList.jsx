import { useState, useEffect } from 'react';
import { restaurantAPI, categoryAPI } from '../../services/api';
import RestaurantCard from './RestaurantCard';

function RestaurantList() {
    const [restaurants, setRestaurants] = useState([]);
    const [categories, setCategories] = useState([]);
    const [filters, setFilters] = useState({
        category: '',
        minPrice: '',
        maxPrice: '',
        maxDeliveryTime: '',
        minRating: ''
    });

    useEffect(() => {
        fetchRestaurants();
        fetchCategories();
    }, []);

    const fetchRestaurants = async () => {
        try {
            const response = await restaurantAPI.getAll();
            const restaurantData = response.data._embedded?.restaurants || [];
            setRestaurants(restaurantData);
        } catch (error) {
            console.error('Error fetching restaurants:', error);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await categoryAPI.getAll();
            const categoryData = response.data._embedded?.categorys || [];
            setCategories(categoryData);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const filteredRestaurants = restaurants.filter(restaurant => {
        if (filters.category && restaurant.categoryId !== parseInt(filters.category)) return false;
        if (filters.maxDeliveryTime && restaurant.deliveryTime > parseInt(filters.maxDeliveryTime)) return false;
        if (filters.minPrice && restaurant.minOrderAmount < parseFloat(filters.minPrice)) return false;
        if (filters.maxPrice && restaurant.minOrderAmount > parseFloat(filters.maxPrice)) return false;
        if (filters.minRating && restaurant.rating < parseFloat(filters.minRating)) return false;
        return true;
    });

    return (
        <div className="restaurant-list">
            <div className="filters">
                <select
                    value={filters.category}
                    onChange={(e) => setFilters({...filters, category: e.target.value})}
                >
                    <option value="">Всі кухні</option>
                    {categories.map(category => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                </select>

                <input
                    type="number"
                    placeholder="Мін ціна замовлення"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                />

                <input
                    type="number"
                    placeholder="Макс ціна замовлення"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                />

                <input
                    type="number"
                    placeholder="Макс час доставки (хв)"
                    value={filters.maxDeliveryTime}
                    onChange={(e) => setFilters({...filters, maxDeliveryTime: e.target.value})}
                    step="5"
                    min="0"
                />

                <input
                    type="number"
                    placeholder="Мін рейтинг"
                    value={filters.minRating}
                    onChange={(e) => setFilters({...filters, minRating: e.target.value})}
                    step="0.1"
                    min="0"
                    max="5"
                />
            </div>

            <div className="restaurants-grid">
                {filteredRestaurants.map(restaurant => (
                    <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                ))}
            </div>
        </div>
    );
}

export default RestaurantList;