import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';
import useAuth from '../hooks/useAuth';

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await API.post('/auth/register', form);
      login(data.token, data.user);
      navigate('/chat');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Create Account</h2>
        <p style={styles.subtitle}>Start chatting for free</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <input
            style={styles.input}
            type="text"
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            required
          />
          <input
            style={styles.input}
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            style={styles.input}
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p style={styles.link}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex', justifyContent: 'center',
    alignItems: 'center', height: '100vh'
  },
  card: {
    background: 'white', padding: '2rem',
    borderRadius: '12px', width: '100%',
    maxWidth: '400px', boxShadow: '0 2px 16px rgba(0,0,0,0.1)'
  },
  title: { fontSize: '1.5rem', marginBottom: '0.25rem', color: '#111' },
  subtitle: { color: '#888', marginBottom: '1.5rem', fontSize: '0.9rem' },
  input: {
    width: '100%', padding: '0.75rem 1rem',
    marginBottom: '1rem', border: '1px solid #ddd',
    borderRadius: '8px', fontSize: '1rem', outline: 'none'
  },
  button: {
    width: '100%', padding: '0.75rem',
    background: '#25D366', color: 'white',
    border: 'none', borderRadius: '8px',
    fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold'
  },
  error: {
    background: '#fee', color: '#c00',
    padding: '0.75rem', borderRadius: '8px',
    marginBottom: '1rem', fontSize: '0.9rem'
  },
  link: { textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem' }
};