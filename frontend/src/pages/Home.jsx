import { Link } from 'react-router-dom';

export default function Home() {
    return (
        <div className="full-center">
            <div style={{ textAlign: 'center', maxWidth: '600px' }}>
                <h1 style={{ fontSize: '3rem', background: 'linear-gradient(to right, #6366f1, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '1.5rem' }}>
                    Welcome to Launchpad
                </h1>
                <p style={{ fontSize: '1.25rem', color: 'var(--color-text-light)', marginBottom: '3rem' }}>
                    Secure, fast, and modern authentication service. Experience seamless login with built-in Multi-Factor Authentication.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <Link to="/signup">
                        <button style={{ padding: '0.8rem 2rem', fontSize: '1.1rem' }}>Get Started</button>
                    </Link>
                    <Link to="/login">
                        <button className="secondary" style={{ padding: '0.8rem 2rem', fontSize: '1.1rem' }}>Login</button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
