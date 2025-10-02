import { useState } from 'react';
import { useCart } from '../../hooks/useCart';

function MenuItem({ item }) {
    const [quantity, setQuantity] = useState(0);
    const { dispatch } = useCart();

    const addToCart = () => {
        dispatch({ type: 'ADD_ITEM', payload: item });
        setQuantity(quantity + 1);
    };

    const removeFromCart = () => {
        if (quantity > 0) {
            dispatch({ type: 'UPDATE_QUANTITY', payload: { id: item.id, quantity: quantity - 1 } });
            setQuantity(quantity - 1);
        }
    };

    return (
        <div className="menu-item">
            {item.imageUrl && (
                <img src={item.imageUrl} alt={item.name} className="item-image" />
            )}
            <div className="item-info">
                <h4>{item.name}</h4>
                <p>{item.description}</p>
                <div className="item-footer">
                    <span className="price">{item.price} грн</span>
                    <div className="quantity-controls">
                        <button onClick={removeFromCart} disabled={quantity === 0}>-</button>
                        <span>{quantity}</span>
                        <button onClick={addToCart}>+</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MenuItem;