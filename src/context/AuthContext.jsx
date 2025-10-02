import { createContext, useReducer } from 'react';

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

const authReducer = (state, action) => {
    switch (action.type) {
        case 'LOGIN':
            localStorage.setItem('user', JSON.stringify(action.payload));
            return { ...state, user: action.payload, isAuthenticated: true };
        case 'LOGOUT':
            localStorage.removeItem('user');
            return { ...state, user: null, isAuthenticated: false };
        case 'LOAD_USER':
            { const user = JSON.parse(localStorage.getItem('user'));
            return { ...state, user, isAuthenticated: !!user }; }
        default:
            return state;
    }
};

export const AuthProvider = ({ children }) => {
    const [auth, dispatch] = useReducer(authReducer, {
        user: null,
        isAuthenticated: false
    });

    return (
        <AuthContext.Provider value={{ auth, dispatch }}>
            {children}
        </AuthContext.Provider>
    );
};