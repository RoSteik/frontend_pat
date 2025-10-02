import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reviewAPI, favoriteAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

function RestaurantCard({ restaurant }) {
    const { auth } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [isFavorite, setIsFavorite] = useState(false);

    useEffect(() => {
        fetchReviews();
        if (auth.user) {
            checkFavorite();
        }
    }, [restaurant.id, auth.user]);

    const fetchReviews = async () => {
        try {
            const response = await reviewAPI.getByRestaurant(restaurant.id);
            setReviews(response.data._embedded?.reviews || []);
        } catch (error) {
            console.error('Error fetching reviews:', error);
        }
    };

    const checkFavorite = async () => {
        try {
            const response = await favoriteAPI.getByUser(auth.user.id);
            const favorites = response.data._embedded?.favorites || [];
            setIsFavorite(favorites.some(fav => fav.restaurantId === restaurant.id));
        } catch (error) {
            console.error('Error checking favorite:', error);
        }
    };

    const toggleFavorite = async () => {
        if (!auth.isAuthenticated) {
            alert('Увійдіть в систему для додавання улюблених');
            return;
        }

        try {
            if (isFavorite) {
                const response = await favoriteAPI.getByUser(auth.user.id);
                const favorites = response.data._embedded?.favorites || [];
                const favorite = favorites.find(fav => fav.restaurantId === restaurant.id);
                if (favorite) {
                    await favoriteAPI.delete(favorite.id);
                }
            } else {
                await favoriteAPI.create({
                    user: { id: auth.user.id },
                    restaurant: { id: restaurant.id }
                });
            }
            setIsFavorite(!isFavorite);
        } catch (error) {
            alert('Помилка зміни улюблених');
        }
    };

    const renderStars = (rating) => {
        return '⭐'.repeat(Math.floor(rating));
    };

    return (
        <div className="restaurant-card">
            <div className="restaurant-info">
                <div className="restaurant-header">
                    <h3>{restaurant.name}</h3>
                    <button
                        onClick={toggleFavorite}
                        className={`favorite-btn ${isFavorite ? 'favorite' : ''}`}
                    >
                        {isFavorite ? '❤️' : '🤍'}
                    </button>
                </div>

                <p>{restaurant.description}</p>

                <div className="restaurant-details">
          <span className="rating">
            {renderStars(restaurant.rating)} {restaurant.rating}/5
          </span>
                    <span className="delivery-time">🚚 {restaurant.deliveryTime} хв</span>
                    <span className="min-order">💰 Від {restaurant.minOrderAmount} грн</span>
                </div>

                <div className="reviews-preview">
                    <h4>Відгуки ({reviews.length})</h4>
                    {reviews.slice(0, 2).map(review => (
                        <div key={review.id} className="review-preview">
                            <div className="review-rating">{renderStars(review.rating)}</div>
                            <p className="review-comment">{review.comment}</p>
                        </div>
                    ))}
                    {reviews.length > 2 && (
                        <span className="more-reviews">+{reviews.length - 2} більше відгуків</span>
                    )}
                </div>

                <Link to={`/restaurant/${restaurant.id}`} className="view-menu-btn">
                    Дивитися меню
                </Link>
            </div>
        </div>
    );
}

export default RestaurantCard;