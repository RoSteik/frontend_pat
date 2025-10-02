import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { useCart } from './hooks/useCart';
import { useAuth } from './hooks/useAuth';
import { useEffect } from 'react';
import RestaurantList from './components/restaurants/RestaurantList';
import RestaurantDetails from './components/restaurants/RestaurantDetails';
import Cart from './components/cart/Cart';
import Checkout from './components/orders/Checkout';
import Login from './components/auth/Login';
import Profile from './components/profile/Profile';
import AdminDashboard from './components/admin/AdminDashboard';
import LoyaltyCard from './components/loyalty/LoyaltyCard';
import OrderTracking from './components/orders/OrderTracking';
import NotificationBell from './components/notifications/NotificationBell';
import './App.css';

function Header() {
    const { cart } = useCart();
    const { auth, dispatch } = useAuth();
    const itemsCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    useEffect(() => {
        dispatch({ type: 'LOAD_USER' });
    }, [dispatch]);

    return (
        <header>
            <Link to="/" className="logo">
                <h1>Food Delivery</h1>
            </Link>
            <div className="header-actions">
                <Link to="/cart" className="cart-link">
                    Кошик ({itemsCount})
                </Link>
                {auth.isAuthenticated ? (
                    <>
                        <NotificationBell />
                        <Link to="/profile" className="profile-link">Профіль</Link>
                        <Link to="/loyalty" className="loyalty-link">Картка</Link>
                        {auth.user?.role === 'ADMIN' && (
                            <Link to="/admin" className="admin-link">Адмін</Link>
                        )}
                        <button onClick={() => dispatch({ type: 'LOGOUT' })} className="logout-btn">
                            Вийти
                        </button>
                    </>
                ) : (
                    <Link to="/login" className="login-link">Вхід</Link>
                )}
            </div>
        </header>
    );
}

function App() {
    return (
        <AuthProvider>
            <NotificationProvider>
                <CartProvider>
                    <Router>
                        <div className="App">
                            <Header />
                            <Routes>
                                <Route path="/" element={<RestaurantList />} />
                                <Route path="/restaurant/:id" element={<RestaurantDetails />} />
                                <Route path="/cart" element={<Cart />} />
                                <Route path="/checkout" element={<Checkout />} />
                                <Route path="/login" element={<Login />} />
                                <Route path="/profile" element={<Profile />} />
                                <Route path="/loyalty" element={<LoyaltyCard />} />
                                <Route path="/tracking/:orderId" element={<OrderTracking />} />
                                <Route path="/admin" element={<AdminDashboard />} />
                            </Routes>
                        </div>
                    </Router>
                </CartProvider>
            </NotificationProvider>
        </AuthProvider>
    );
}

export default App;