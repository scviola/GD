import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.js';
import api from '../services/api';

const Login = () => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [givenPassword, setGivenPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isFirstLogin, setIsFirstLogin] = useState(false);
    
    // Password visibility toggles
    const [showGivenPassword, setShowGivenPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    // Step 1: Validate email and check if first login
    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.post('/auth/verify-email', { email });
            setIsFirstLogin(response.data.isFirstLogin);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || 'Email verification failed');
        } finally {
            setLoading(false);
        }
    };

    // Step 2 (First Login): Validate given password, set new password, and login
    const handleFirstLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.post('/auth/change-password', { 
                email, 
                givenPassword, 
                newPassword 
            });
            
            login(response.data.user, response.data.token);
            
            if (response.data.user.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/employee-summaries');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to set password');
        } finally {
            setLoading(false);
        }
    };

    // Step 2 (Subsequent Login): Direct login with user's password
    const handleSubsequentLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.post('/auth/login', { 
                email, 
                password 
            });
            
            login(response.data.user, response.data.token);
            
            if (response.data.user.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/employee-summaries');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">            
            <div className="auth-card">
                <h2>GDEA Login</h2>
                <p>Enter your official credentials to access the system.</p>
                
                {error && <div className="error-banner">{error}</div>}

                {/* Step 1: Email Input */}
                {step === 1 && (
                    <form onSubmit={handleEmailSubmit}>
                        <div className="form-group">
                            <label>Work Email</label>
                            <input 
                                type="email" 
                                required 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                placeholder="name@company.com"
                            />
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary">
                            {loading ? 'Verifying...' : 'Continue'}
                        </button>
                    </form>
                )}

                {/* Step 2: Password Input - First Time Login */}
                {step === 2 && isFirstLogin && (
                    <form onSubmit={handleFirstLogin}>
                        <div className="form-group">
                            <label>Work Email</label>
                            <input 
                                type="email" 
                                value={email}
                                disabled 
                                readOnly
                            />
                        </div>

                        <div className="form-group">
                            <label>Given Password</label>
                            <div className="password-input-wrapper">
                                <input 
                                    type={showGivenPassword ? 'text' : 'password'} 
                                    required 
                                    placeholder="Enter the password shared by admin"
                                    value={givenPassword}
                                    onChange={(e) => setGivenPassword(e.target.value)} 
                                />
                                <button 
                                    type="button" 
                                    className="password-toggle"
                                    onClick={() => setShowGivenPassword(!showGivenPassword)}
                                    tabIndex={-1}
                                >
                                    {showGivenPassword ? 'Hide' : 'Show'}
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Your Password</label>
                            <div className="password-input-wrapper">
                                <input 
                                    type={showNewPassword ? 'text' : 'password'} 
                                    required 
                                    placeholder="Create your new password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)} 
                                    minLength={6}
                                />
                                <button 
                                    type="button" 
                                    className="password-toggle"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    tabIndex={-1}
                                >
                                    {showNewPassword ? 'Hide' : 'Show'}
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary">
                            {loading ? 'Setting Password...' : 'Set Password & Login'}
                        </button>
                    </form>
                )}

                {/* Step 2: Password Input - Subsequent Login */}
                {step === 2 && !isFirstLogin && (
                    <form onSubmit={handleSubsequentLogin}>
                        <div className="form-group">
                            <label>Work Email</label>
                            <input 
                                type="email" 
                                value={email}
                                disabled 
                                readOnly
                            />
                        </div>

                        <div className="form-group">
                            <label>Your Password</label>
                            <div className="password-input-wrapper">
                                <input 
                                    type={showPassword ? 'text' : 'password'} 
                                    required 
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)} 
                                />
                                <button 
                                    type="button" 
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? 'Hide' : 'Show'}
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary">
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>
                )}

                <div className="auth-footer">
                    Need access? <Link to="/contact-admin">Contact Admin</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
