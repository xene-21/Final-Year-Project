import { useState } from 'react';
import { api, BACKEND_NAME } from '../api';
import { Notice } from '../components';

const EMPTY = { email: '', password: '', fullName: '', role: 'student', matricNumber: '', adminKey: '' };

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      let data;
      if (mode === 'login') {
        data = await api('POST', '/api/auth/login', { body: { email: form.email, password: form.password } });
      } else {
        const body = { fullName: form.fullName, email: form.email, password: form.password, role: form.role };
        if (form.role === 'student') body.matricNumber = form.matricNumber;
        else body.adminKey = form.adminKey;
        data = await api('POST', '/api/auth/register', { body });
      }
      onLogin(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <aside className="login-side">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon points="16,7 4,13 16,19 28,13" fill="white" opacity="0.95"/>
              <polygon points="16,19 4,13 4,13 16,22" fill="white" opacity="0.4"/>
              <path d="M9 15.5 V22 Q16 25.5 23 22 V15.5" fill="white" opacity="0.85"/>
              <line x1="28" y1="13" x2="28" y2="20" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
              <circle cx="28" cy="21" r="1.3" fill="white" opacity="0.7"/>
            </svg>
          </span>
          <div>
            <strong>Student Portal</strong>
          </div>
        </div>        <div className="login-side-content">
          <h2>Everything your semester needs, in one place.</h2>
          <p>Course registration, results, fees — sign in with the email and password you registered with.</p>
        </div>
        <p className="side-note">{BACKEND_NAME} backend · {BACKEND_NAME === 'Monolith' ? 'port 3000' : 'port 8080'}</p>
      </aside>

      <section className="login-form">
        <h1>{mode === 'login' ? 'Sign in' : 'Create an account'}</h1>

        <div className="segmented" role="tablist">
          <button role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
            Sign in
          </button>
          <button role="tab" aria-selected={mode === 'register'} className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>
            Register
          </button>
        </div>

        <form onSubmit={submit} className="stack">
          {mode === 'register' && (
            <>
              <label>
                Full name
                <input required autoComplete="name" value={form.fullName} onChange={set('fullName')} />
              </label>
              <label>
                Account type
                <select value={form.role} onChange={set('role')}>
                  <option value="student">Student</option>
                  <option value="lecturer">Lecturer</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              {form.role === 'student' ? (
                <label>
                  Matric number
                  <input required value={form.matricNumber} onChange={set('matricNumber')} />
                </label>
              ) : (
                <label>
                  Staff signup key
                  <input required type="password" value={form.adminKey} onChange={set('adminKey')} />
                </label>
              )}
            </>
          )}
          <label>
            Email
            <input required type="email" autoComplete="username" value={form.email} onChange={set('email')} />
          </label>
          <label>
            Password
            <input
              required
              type="password"
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={form.password}
              onChange={set('password')}
            />
          </label>
          <Notice tone="error">{error}</Notice>
          <button type="submit" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="test-accounts">
          <p>
            Use <code>student0001@portal.test</code> through <code>student0500@portal.test</code>{' '}
            to log in as a student, or <code>admin@portal.test</code> / <code>lecturer@portal.test</code> for staff.
            All accounts use <code>Password123</code>.
          </p>
        </div>
      </section>
    </div>
  );
}
