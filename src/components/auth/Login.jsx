import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { userAPI } from '../../services/api';

function Login() {
    const { dispatch } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            // Простий логін - знаходимо користувача по email
            const response = await userAPI.getAll();
            const user = response.data._embedded?.users?.find(u => u.email === email);

            if (user) {
                dispatch({ type: 'LOGIN', payload: user });
            } else {
                alert('Користувача не знайдено');
            }
            // eslint-disable-next-line no-unused-vars
        } catch (error) {
            alert('Помилка входу');
        }
    };

    return (
        <div className="auth-container">
            <form onSubmit={handleLogin} className="auth-form">
                <h2>Вхід</h2>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit">Увійти</button>
            </form>
        </div>
    );
}

export default Login;