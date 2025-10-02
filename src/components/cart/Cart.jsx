import { useCart } from '../../hooks/useCart';
import { Link } from 'react-router-dom';

function Cart() {
    const { cart, dispatch, total } = useCart();

    const updateQuantity = (id, quantity) => {
        dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
    };

    const removeItem = (id) => {
        dispatch({ type: 'REMOVE_ITEM', payload: id });
    };

    if (cart.items.length === 0) {
        return (
            <div className="cart-container">
                <h2>Кошик порожній</h2>
                <Link to="/" className="back-btn">Повернутися до ресторанів</Link>
            </div>
        );
    }

    return (
        <div className="cart-container">
            <h2>Кошик</h2>
            <div className="cart-items">
                {cart.items.map(item => (
                    <div key={item.id} className="cart-item">
                        <h4>{item.name}</h4>
                        <p>{item.price} грн</p>
                        <div className="quantity-controls">
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                            <span>{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                            <button onClick={() => removeItem(item.id)} className="remove-btn">Видалити</button>
                        </div>
                    </div>
                ))}
            </div>
            <div className="cart-total">
                <h3>Загалом: {total.toFixed(2)} грн</h3>
                <Link to="/checkout" className="checkout-btn">Оформити замовлення</Link>
            </div>
        </div>
    );
}

export default Cart;