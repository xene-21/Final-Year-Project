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
          <span className="brand-mark" aria-hidden="true">SP</span>
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
