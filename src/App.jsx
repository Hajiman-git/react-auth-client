import { useState } from 'react';
import axios from 'axios';
import { api } from './api';
import './App.css';

function App() {
    const [isLoginView, setIsLoginView] = useState(true); 
    
    // Поля для входа
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    
    // Поля для регистрации
    const [regUsername, setRegUsername] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPhone, setRegPhone] = useState('');
    const [regFullName, setRegFullName] = useState('');

    const [token, setToken] = useState(localStorage.getItem('jwt_token') || '');
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user_info') || 'null'));
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [products, setProducts] = useState([]);

    // --- ВХОД ---
    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            const response = await api.post('/auth/login', { username, password });
            const { token, userId, username: uname, roleName } = response.data;
            
            localStorage.setItem('jwt_token', token);
            localStorage.setItem('user_info', JSON.stringify({ userId, username: uname, roleName }));
            
            setToken(token);
            setUser({ userId, username: uname, roleName });
            setSuccess(`Успешный вход! Вы: ${uname} (${roleName})`);
        } catch (err) {
            if (err.response?.status === 429) {
                setError('429 Too Many Requests: Вы превысили лимит попыток входа. Подождите минуту.');
            } else {
                setError(err.response?.data?.error || err.message || 'Ошибка входа');
            }
        }
    };

    // --- РЕГИСТРАЦИЯ ---
    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            const response = await api.post('/auth/register', {
                username: regUsername,
                password: regPassword,
                email: regEmail,
                phoneNumber: regPhone,
                fullName: regFullName,
                roleId: 2
            });
            const { token, userId, username: uname, roleName } = response.data;
            
            localStorage.setItem('jwt_token', token);
            localStorage.setItem('user_info', JSON.stringify({ userId, username: uname, roleName }));
            
            setToken(token);
            setUser({ userId, username: uname, roleName });
            setSuccess(`Регистрация успешна! Вы вошли как: ${uname} (${roleName})`);
        } catch (err) {
            if (err.response?.status === 400) {
                const errors = err.response.data.errors;
                if (errors) {
                    const errorMessages = Object.values(errors).flat().join(' ');
                    setError(`Ошибка валидации: ${errorMessages}`);
                } else {
                    setError(err.response.data.error || 'Ошибка регистрации');
                }
            } else {
                setError(err.response?.data?.error || err.message || 'Ошибка регистрации');
            }
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_info');
        setToken('');
        setUser(null);
        setProducts([]);
        setSuccess('');
        setError('');
        setIsLoginView(true);
    };

    // --- ЗАЩИЩЁННЫЕ ЗАПРОСЫ ---
    const fetchProtectedProducts = async () => {
        setError('');
        setSuccess('');
        try {
            const response = await api.get('/products?page=1&pageSize=5');
            setProducts(response.data);
            setSuccess(`Успешно загружено ${response.data.length} товаров.`);
        } catch (err) {
            if (err.response?.status === 403) setError('403 Forbidden: У вас нет прав для этого действия.');
            else if (err.response?.status === 401) setError('401 Unauthorized: Вы не авторизованы.');
            else setError(err.response?.data?.error || err.message || 'Ошибка запроса');
        }
    };

    const testEditProfile = async (targetId) => {
        setError('');
        setSuccess('');
        try {
            await api.patch(`/customers/${targetId}`, { fullName: "Тестовое Имя" });
            setSuccess(`Успех! Вы имеете право редактировать профиль №${targetId}`);
        } catch (err) {
            if (err.response?.status === 403) setError(`403 Forbidden: Вы не можете редактировать профиль №${targetId}`);
            else setError(err.response?.data?.error || 'Ошибка');
        }
    };

    const testCorsError = async () => {
        setError('');
        setSuccess('');
        try {
            await axios.get('https://localhost:7149/api/products', {
                headers: { 'Origin': 'http://localhost:9999' }
            });
            setSuccess('Запрос прошел (но браузер мог заблокировать CORS)');
        } catch (err) {
            setError('CORS заблокировал запрос! Смотрите вкладку Network в браузере.');
        }
    };

    return (
        <div className="container">
            <h1>React + JWT Auth Client</h1>
            
            {!token ? (
                <div className="card">
                    {/* Переключатель между входом и регистрацией */}
                    <div className="tabs">
                        <button 
                            className={isLoginView ? 'active' : ''} 
                            onClick={() => { setIsLoginView(true); setError(''); }}
                        >
                            Вход
                        </button>
                        <button 
                            className={!isLoginView ? 'active' : ''} 
                            onClick={() => { setIsLoginView(false); setError(''); }}
                        >
                            Регистрация
                        </button>
                    </div>

                    {isLoginView ? (
                        // ФОРМА ВХОДА
                        <form onSubmit={handleLogin}>
                            <h2>Вход в систему</h2>
                            <div>
                                <label>Логин:</label>
                                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
                            </div>
                            <div>
                                <label>Пароль:</label>
                                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                            </div>
                            <button type="submit">Войти</button>
                            <p className="hint">admin / Admin123! или user / User123!</p>
                        </form>
                    ) : (
                        // ФОРМА РЕГИСТРАЦИИ
                        <form onSubmit={handleRegister}>
                            <h2>Регистрация</h2>
                            <div>
                                <label>Логин:</label>
                                <input type="text" value={regUsername} onChange={(e) => setRegUsername(e.target.value)} required minLength={3} />
                            </div>
                            <div>
                                <label>Пароль (мин. 6 символов):</label>
                                <input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required minLength={6} />
                            </div>
                            <div>
                                <label>Email:</label>
                                <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
                            </div>
                            <div>
                                <label>Телефон (+7(XXX)XXX-XX-XX):</label>
                                <input type="text" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} placeholder="+7(900)123-45-67" required />
                            </div>
                            <div>
                                <label>ФИО:</label>
                                <input type="text" value={regFullName} onChange={(e) => setRegFullName(e.target.value)} required />
                            </div>
                            <button type="submit">Зарегистрироваться</button>
                        </form>
                    )}
                </div>
            ) : (
                <div className="card">
                    <h2>Вы вошли как: <span className="badge">{user?.username}</span> ({user?.roleName})</h2>
                    <button onClick={handleLogout} className="btn-danger">Выйти</button>
                    
                    <hr />
                    
                    <h3>Действия</h3>
                    <div className="actions">
                        <button onClick={fetchProtectedProducts}>1. Получить товары (JWT)</button>
                        <button onClick={() => testEditProfile(user?.userId)}>2. Изменить СВОЙ профиль (ID: {user?.userId})</button>
                        <button onClick={() => testEditProfile(1)} className="btn-warning">3. Изменить ЧУЖОЙ профиль (ID: 1)</button>
                        <button onClick={testCorsError} className="btn-cors">4. Проверить CORS</button>
                    </div>

                    {products.length > 0 && (
                        <div className="products">
                            <h3>Товары с бэкенда:</h3>
                            <ul>
                                {products.map(p => (
                                    <li key={p.idProduct}>{p.productName} — {p.price} ₽</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {error && <div className="alert error">{error}</div>}
            {success && <div className="alert success">{success}</div>}
        </div>
    );
}

export default App;