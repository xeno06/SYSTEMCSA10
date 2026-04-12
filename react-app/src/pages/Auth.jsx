import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../auth.css';

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        if (searchParams.get('register') === 'true') {
            setIsLogin(false);
        }
    }, [searchParams]);

    const handleLogin = (e) => {
        e.preventDefault();
        // Simulate login
        navigate('/dashboard');
    };

    const handleRegister = (e) => {
        e.preventDefault();
        const password = e.target.regPassword.value;
        const confirm = e.target.regConfirm.value;

        if (password !== confirm) {
            alert("Passwords do not match!");
            return;
        }

        alert("Registration successful! Please login.");
        setIsLogin(true); // Switch to login view
    };

    return (
        <div className="auth-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

            {/* LOGIN FORM */}
            {isLogin ? (
                <form className="form-box active" id="loginForm" onSubmit={handleLogin}>
                    <h2>Login</h2>

                    <label>Username</label>
                    <input type="text" id="loginUsername" placeholder="Username" required />

                    <div className="password-row" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
                        <label>Password</label>
                        <a href="#" style={{ color: '#00f2fe', fontSize: '0.85rem', textDecoration: 'none' }}>Forgot Password</a>
                    </div>
                    <input type="password" id="loginPassword" placeholder="Password" required />

                    <button type="submit" className="btn" style={{ width: '100%', marginTop: '20px' }}>Login</button>

                    <p className="switch-text" style={{ textAlign: 'center', marginTop: '20px', color: '#94a3b8' }}>
                        Don't have an account?{' '}
                        <span
                            onClick={() => setIsLogin(false)}
                            style={{ color: '#00f2fe', cursor: 'pointer', fontWeight: 600 }}
                        >
                            Register
                        </span>
                    </p>
                </form>
            ) : (
                /* REGISTER FORM */
                <form className="form-box active" id="registerForm" onSubmit={handleRegister}>
                    <h2>Register</h2>

                    <input type="text" id="regUsername" placeholder="Username" required style={{ marginBottom: '15px' }} />
                    <input type="email" id="regEmail" placeholder="Email" required style={{ marginBottom: '15px' }} />
                    <input type="password" id="regPassword" placeholder="Password" minLength="6" required style={{ marginBottom: '15px' }} />
                    <input type="password" id="regConfirm" placeholder="Confirm Password" required style={{ marginBottom: '15px' }} />

                    <div className="checkbox" style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '15px 0' }}>
                        <input type="checkbox" id="terms" required />
                        <label htmlFor="terms" style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Agree to the Terms and Conditions</label>
                    </div>

                    <button type="submit" className="btn" style={{ width: '100%' }}>Register</button>

                    <p className="switch-text" style={{ textAlign: 'center', marginTop: '20px', color: '#94a3b8' }}>
                        Already have an account?{' '}
                        <span
                            onClick={() => setIsLogin(true)}
                            style={{ color: '#00f2fe', cursor: 'pointer', fontWeight: 600 }}
                        >
                            Login
                        </span>
                    </p>
                </form>
            )}

        </div>
    );
}
