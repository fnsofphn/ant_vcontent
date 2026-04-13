import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function LoginPage() {
  const { loading, session, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return <div className="app-loading">Loading session...</div>;
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="section-eye">VContent 3.0</div>
        <h1 className="section-title">Đăng nhập</h1>
        <form
          className="form-grid"
          onSubmit={async (event) => {
            event.preventDefault();
            setSubmitting(true);
            setError(null);
            try {
              await signIn(email, password);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Đăng nhập thất bại.');
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <label className="full">
            <span>Email</span>
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="you@company.com" />
          </label>
          <label className="full">
            <span>Mật khẩu</span>
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="******" />
          </label>
          {error ? <div className="login-error">{error}</div> : null}
          <button className="btn btn-danger full-width" type="submit" disabled={submitting}>
            {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}
