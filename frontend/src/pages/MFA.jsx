import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function MFA() {
    const navigate = useNavigate();
    const { tempToken, login } = useAuth();
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    useEffect(() => {
        if (!tempToken) {
            navigate('/login');
        } else {
            // Auto send MFA code on load
            sendMfaCode();
        }
    }, [tempToken, navigate]);

    const sendMfaCode = async () => {
        try {
            await api.post('/api/auth/mfa/send', { tempToken, method: 'email' });
            setSent(true);
        } catch (err) {
            setError("Failed to send MFA code: " + err.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const data = await api.post('/api/auth/mfa/verify', { tempToken, code });
            login(data.token);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="full-center">
            <div className="card">
                <h2 style={{ textAlign: 'center' }}>Two-Factor Auth</h2>
                <p style={{ textAlign: 'center', color: 'var(--color-text-light)', marginBottom: '1.5rem' }}>
                    We sent a code to your email.
                    <br />
                    (Test code: <strong>123456</strong>)
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Verification Code</label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="123456"
                            required
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
                        {loading ? 'Verifying...' : 'Verify'}
                    </button>
                </form>
                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <button className="secondary" onClick={sendMfaCode} style={{ fontSize: '0.9rem' }}>Resend Code</button>
                </div>
            </div>
        </div>
    );
}
