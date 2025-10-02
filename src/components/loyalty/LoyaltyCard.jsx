import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { loyaltyCardAPI } from '../../services/api';

function LoyaltyCard() {
    const { auth } = useAuth();
    const [card, setCard] = useState(null);

    useEffect(() => {
        if (auth.user) {
            fetchCard();
        }
    }, [auth.user]);

    const fetchCard = async () => {
        try {
            const response = await loyaltyCardAPI.getByUser(auth.user.id);
            setCard(response.data);
        } catch (error) {
            console.error('Error fetching card:', error);
        }
    };

    const upgradeToPremium = async () => {
        if (card.bonusPoints < 500) {
            alert('Потрібно 500 балів для преміум картки');
            return;
        }

        try {
            await loyaltyCardAPI.upgrade(auth.user.id);
            fetchCard();
            alert('Картку оновлено до Premium!');
            // eslint-disable-next-line no-unused-vars
        } catch (error) {
            alert('Помилка оновлення');
        }
    };

    if (!auth.isAuthenticated) {
        return <div>Увійдіть в систему</div>;
    }

    if (!card) {
        return <div>Завантаження...</div>;
    }

    const discount = card.cardType === 'PREMIUM' ? 10 : card.bonusPoints >= 200 ? 5 : 0;

    return (
        <div className="loyalty-card-container">
            <div className={`loyalty-card ${card.cardType.toLowerCase()}`}>
                <h2>{card.cardType === 'PREMIUM' ? '⭐ Premium' : '🎁 Basic'} Картка</h2>
                <div className="card-info">
                    <div className="points">
                        <span className="label">Бонусні бали:</span>
                        <span className="value">{card.bonusPoints}</span>
                    </div>
                    <div className="discount">
                        <span className="label">Ваша знижка:</span>
                        <span className="value">{discount}%</span>
                    </div>
                    {card.cardType === 'PREMIUM' && (
                        <div className="benefit">
                            ✅ Безкоштовна доставка
                        </div>
                    )}
                </div>
            </div>

            <div className="loyalty-info">
                <h3>Як це працює?</h3>
                <ul>
                    <li>За кожні 100 грн замовлення - 1 бонусний бал</li>
                    <li>200+ балів → знижка 5%</li>
                    <li>500+ балів → можна оновити до Premium</li>
                    <li>Premium → знижка 10% + безкоштовна доставка</li>
                </ul>

                {card.cardType === 'BASIC' && card.bonusPoints >= 500 && (
                    <button onClick={upgradeToPremium} className="upgrade-btn">
                        Оновити до Premium
                    </button>
                )}
            </div>
        </div>
    );
}

export default LoyaltyCard;