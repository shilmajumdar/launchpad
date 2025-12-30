import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
    const { user, logout } = useAuth();

    return (
        <div style={{ padding: '2rem' }}>
            <div className="card" style={{ maxWidth: '600px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2>Dashboard</h2>
                    <button className="secondary" onClick={logout}>Logout</button>
                </div>

                <div style={{ background: 'var(--color-bg)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                    <h3 style={{ marginTop: 0 }}>Profile</h3>
                    {user ? (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label className="form-label">Name</label>
                                <div style={{ fontSize: '1.1rem' }}>{user.name}</div>
                            </div>
                            <div>
                                <label className="form-label">Email</label>
                                <div style={{ fontSize: '1.1rem' }}>{user.email}</div>
                            </div>
                            <div>
                                <label className="form-label">Member Since</label>
                                <div style={{ fontSize: '1.1rem' }}>{new Date().toLocaleDateString()}</div>
                            </div>
                        </div>
                    ) : (
                        <p>Loading profile...</p>
                    )}
                </div>
            </div>
        </div>
    );
}
