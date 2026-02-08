import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

const Unauthorized = ({ message }) => {
    const navigate = useNavigate();
    const defaultMessage = "You do not have the required administrative permissions to view this page. All access attempts are logged for security purposes.";

    return (
        <div className="auth-wrapper">
            <div className="auth-card text-center">
                <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>
                    <ShieldAlert size={64} strokeWidth={1.5} />
                </div>
                <h2 style={{ color: 'var(--primary)' }}>Access Denied</h2>
                <p style={{ margin: '1rem 0', color: '#666' }}>
                    {message || defaultMessage}
                </p>
                
                <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
                    <button 
                        onClick={() => navigate(-1)} 
                        className="btn-secondary"
                        style={{ flex: 1, padding: '10px', cursor: 'pointer' }}
                    >
                        Go Back
                    </button>
                    <button 
                        onClick={() => navigate('/login')} 
                        className="btn-primary"
                        style={{ flex: 1 }}
                    >
                        Return to Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Unauthorized;
