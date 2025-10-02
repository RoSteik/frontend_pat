import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { restaurantAPI, menuItemAPI, reviewAPI } from '../../services/api';
import MenuList from '../menu/MenuList';

function RestaurantDetails() {
    const { id } = useParams();
    const [restaurant, setRestaurant] = useState(null);
    const [menuItems, setMenuItems] = useState([]);
    const [reviews, setReviews] = useState([]);

    useEffect(() => {
        fetchRestaurant();
        fetchMenuItems();
        fetchReviews();
    }, [id]);

    const fetchRestaurant = async () => {
        try {
            const response = await restaurantAPI.getById(id);
            setRestaurant(response.data);
        } catch (error) {
            console.error('Error fetching restaurant:', error);
        }
    };

    const fetchMenuItems = async () => {
        try {
            const response = await menuItemAPI.getByRestaurant(id);
            setMenuItems(response.data._embedded?.menuItems || []);
        } catch (error) {
            console.error('Error fetching menu items:', error);
        }
    };

    const fetchReviews = async () => {
        try {
            const response = await reviewAPI.getByRestaurant(id);
            setReviews(response.data._embedded?.reviews || []);
        } catch (error) {
            console.error('Error fetching reviews:', error);
        }
    };

    if (!restaurant) return <div>Loading...</div>;

    return (
        <div className="restaurant-details">
            <div className="restaurant-header">
                <h1>{restaurant.name}</h1>
                <p>{restaurant.description}</p>
                <div className="restaurant-info">
                    <span>⭐ {restaurant.rating}</span>
                    <span>🚚 {restaurant.deliveryTime} хв</span>
                    <span>💰 від {restaurant.minOrderAmount} грн</span>
                </div>
            </div>

            <MenuList menuItems={menuItems} />

            <div className="reviews-section">
                <h2>Відгуки</h2>
                {reviews.map(review => (
                    <div key={review.id} className="review">
                        <div className="review-rating">{'⭐'.repeat(review.rating)}</div>
                        <p>{review.comment}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default RestaurantDetails;