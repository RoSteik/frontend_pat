import { useState, useEffect } from 'react';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { orderAPI, orderItemAPI, loyaltyCardAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';

function Checkout() {
    const { cart, dispatch, total } = useCart();
    const { auth } = useAuth();
    const navigate = useNavigate();
    const [loyaltyCard, setLoyaltyCard] = useState(null);
    const [formData, setFormData] = useState({
        deliveryAddress: '',
        deliveryType: 'STANDARD',
        paymentMethod: 'CARD'
    });

    useEffect(() => {
        if (auth.user) {
            fetchLoyaltyCard();
        }
    }, [auth.user]);

    const fetchLoyaltyCard = async () => {
        try {
            const response = await loyaltyCardAPI.getByUser(auth.user.id);
            setLoyaltyCard(response.data);
            // eslint-disable-next-line no-unused-vars
        } catch (error) {
            console.log('No loyalty card');
        }
    };

    const deliveryPrices = {
        STANDARD: loyaltyCard?.cardType === 'PREMIUM' ? 0 : 0,
        EXPRESS: loyaltyCard?.cardType === 'PREMIUM' ? 0 : 50,
        PICKUP: 0
    };

    const discount = loyaltyCard?.cardType === 'PREMIUM' ? 0.1 :
        loyaltyCard?.bonusPoints >= 200 ? 0.05 : 0;

    const discountAmount = total * discount;
    const subtotal = total - discountAmount;
    const finalTotal = subtotal + deliveryPrices[formData.deliveryType];

    const handleSubmit = async (e) => {
        e.preventDefault();

        const orderData = {
            user: { id: auth.user?.id || 1 },
            restaurant: { id: cart.items[0]?.restaurantId || 1 },
            totalAmount: finalTotal,
            deliveryAddress: formData.deliveryAddress || "Test address",
            deliveryType: formData.deliveryType,
            paymentMethod: formData.paymentMethod
        };

        try {
            const orderResponse = await orderAPI.create(orderData);
            const orderId = orderResponse.data.id;

            for (const item of cart.items) {
                await orderItemAPI.create({
                    order: { id: orderId },
                    menuItem: { id: item.id },
                    quantity: item.quantity,
                    price: item.price
                });
            }

            dispatch({ type: 'CLEAR_CART' });
            const pointsEarned = orderResponse.data.pointsEarned || 0;
            alert(`Замовлення створено! Нараховано ${pointsEarned} балів`);
            navigate('/profile');
        } catch (error) {
            console.error('Error creating order:', error);
            alert('Помилка при створенні замовлення');
        }
    };

    if (cart.items.length === 0) {
        return (
            <div className="checkout-container">
                <h2>Кошик порожній</h2>
                <button onClick={() => navigate('/')} className="back-btn">
                    Повернутися до ресторанів
                </button>
            </div>
        );
    }

    return (
        <div className="checkout-container">
            <h2>Оформлення замовлення</h2>

            <div className="order-summary">
                <h3>Ваше замовлення</h3>
                {cart.items.map(item => (
                    <div key={item.id} className="order-item">
                        <span>{item.name} x{item.quantity}</span>
                        <span>{(item.price * item.quantity).toFixed(2)} грн</span>
                    </div>
                ))}
                <div className="order-subtotal">
                    <span>Сума страв: {total.toFixed(2)} грн</span>
                </div>
                {discount > 0 && (
                    <div className="order-discount">
                        <span>Знижка ({(discount * 100).toFixed(0)}%): -{discountAmount.toFixed(2)} грн</span>
                    </div>
                )}
                <div className="order-delivery">
                    <span>Доставка: {deliveryPrices[formData.deliveryType]} грн</span>
                    {loyaltyCard?.cardType === 'PREMIUM' && formData.deliveryType !== 'PICKUP' && (
                        <span className="free-delivery">🎉 Безкоштовна</span>
                    )}
                </div>
                <div className="order-total">
                    <strong>До сплати: {finalTotal.toFixed(2)} грн</strong>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="checkout-form">
                <div className="form-group">
                    <label>Тип доставки:</label>
                    <div className="delivery-options">
                        <label className="radio-option">
                            <input
                                type="radio"
                                value="STANDARD"
                                checked={formData.deliveryType === 'STANDARD'}
                                onChange={(e) => setFormData({...formData, deliveryType: e.target.value})}
                            />
                            <div className="option-info">
                                <strong>Стандартна доставка</strong>
                                <p>30-45 хв • {loyaltyCard?.cardType === 'PREMIUM' ? 'Безкоштовно' : 'Безкоштовно'}</p>
                            </div>
                        </label>
                        <label className="radio-option">
                            <input
                                type="radio"
                                value="EXPRESS"
                                checked={formData.deliveryType === 'EXPRESS'}
                                onChange={(e) => setFormData({...formData, deliveryType: e.target.value})}
                            />
                            <div className="option-info">
                                <strong>Експрес доставка</strong>
                                <p>15-20 хв • {loyaltyCard?.cardType === 'PREMIUM' ? 'Безкоштовно' : '+50 грн'}</p>
                            </div>
                        </label>
                        <label className="radio-option">
                            <input
                                type="radio"
                                value="PICKUP"
                                checked={formData.deliveryType === 'PICKUP'}
                                onChange={(e) => setFormData({...formData, deliveryType: e.target.value})}
                            />
                            <div className="option-info">
                                <strong>Самовивіз</strong>
                                <p>Готово через 15-20 хв • Безкоштовно</p>
                            </div>
                        </label>
                    </div>
                </div>

                {formData.deliveryType !== 'PICKUP' && (
                    <div className="form-group">
                        <label>Адреса доставки:</label>
                        <textarea
                            value={formData.deliveryAddress}
                            onChange={(e) => setFormData({...formData, deliveryAddress: e.target.value})}
                            placeholder="Введіть адресу доставки"
                            required
                        />
                    </div>
                )}

                <div className="form-group">
                    <label>Спосіб оплати:</label>
                    <div className="payment-options">
                        <label className="radio-option">
                            <input
                                type="radio"
                                value="CARD"
                                checked={formData.paymentMethod === 'CARD'}
                                onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                            />
                            <div className="option-info">
                                <strong>Картою онлайн</strong>
                                <p>Visa, Mastercard</p>
                            </div>
                        </label>
                        <label className="radio-option">
                            <input
                                type="radio"
                                value="CASH"
                                checked={formData.paymentMethod === 'CASH'}
                                onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                            />
                            <div className="option-info">
                                <strong>Готівкою при отриманні</strong>
                                <p>Оплата кур'єру</p>
                            </div>
                        </label>
                    </div>
                </div>

                <button type="submit" className="submit-btn">
                    Підтвердити замовлення
                </button>
            </form>
        </div>
    );
}

export default Checkout;