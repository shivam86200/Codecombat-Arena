import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Sword, AlertCircle, User } from 'lucide-react';
import Input from '../components/Input';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';

/* ─── Validation Helpers ─────────────────────────────── */
const validateIdentifier = (identifier) => {
  if (!identifier) return 'Email or username is required.';
  if (identifier.trim().length < 3) return 'Please enter a valid email or username.';
  return '';
};

const validatePassword = (password) => {
  if (!password) return 'Password is required.';
  if (password.length < 6) return 'Password must be at least 6 characters.';
  return '';
};

/* ─── Google Icon ────────────────────────────────────── */
const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

/* ─── Login Page ─────────────────────────────────────── */
const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle } = useAuth();
  const from = location.state?.from?.pathname || '/dashboard';

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  /* ── Handlers ───────────────────────────── */
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setServerError('');
      await loginWithGoogle();
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Google Login failed.';
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };
  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: field === 'email' ? validateIdentifier(value) : validatePassword(value),
      }));
    }
    setServerError('');
  };

  const handleBlur = (field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({
      ...prev,
      [field]: field === 'email' ? validateIdentifier(form[field]) : validatePassword(form[field]),
    }));
  };

  const isFormValid =
    !validateIdentifier(form.email) && !validatePassword(form.password);

  /* ── Submit ─────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Touch all fields to show errors
    setTouched({ email: true, password: true });
    const emailErr = validateIdentifier(form.email);
    const passErr = validatePassword(form.password);
    setErrors({ email: emailErr, password: passErr });
    if (emailErr || passErr) return;

    try {
      setLoading(true);
      setServerError('');
      await login(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      if (!err.response || err.response.status === 504 || err.response.status === 502 || typeof err.response.data === 'string') {
        setServerError('Cannot connect to backend! You must open a NEW terminal, type "cd server" and "npm run dev".');
      } else {
        const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
        setServerError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── Render ─────────────────────────────── */
  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12">
      {/* Ambient background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-purple-700/8 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600/20 border border-primary-500/30 mb-4">
            <Sword className="h-8 w-8 text-primary-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">Welcome Back, Warrior</h1>
          <p className="text-slate-400 mt-2 text-sm">
            Sign in to rejoin the arena and continue your battles.
          </p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8 border border-white/5 shadow-2xl">
          {/* Google SSO Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="
              w-full flex items-center justify-center gap-3
              px-4 py-2.5 rounded-lg text-sm font-medium
              border border-slate-700 text-slate-300
              bg-slate-800/80 hover:bg-slate-700 transition-colors
              mb-6
            "
          >
            <GoogleIcon />
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-grow border-t border-slate-800" />
            <span className="text-xs text-slate-600 font-medium">OR CONTINUE WITH EMAIL</span>
            <div className="flex-grow border-t border-slate-800" />
          </div>

          {/* Server Error */}
          {serverError && (
            <div className="flex items-start gap-3 p-3 mb-5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <Input
              id="login-email"
              label="Email or Username"
              type="text"
              value={form.email}
              onChange={handleChange('email')}
              onBlur={handleBlur('email')}
              placeholder="warrior_123 or name@example.com"
              error={touched.email ? errors.email : ''}
              icon={User}
              required
            />
            <Input
              id="login-password"
              label="Password"
              type="password"
              value={form.password}
              onChange={handleChange('password')}
              onBlur={handleBlur('password')}
              placeholder="Min. 6 characters"
              error={touched.password ? errors.password : ''}
              icon={Lock}
              required
            />

            {/* Forgot Password */}
            <div className="flex justify-end -mt-2">
              <button
                type="button"
                onClick={() => alert('Password reset coming soon!')}
                className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={loading}
              disabled={!isFormValid || loading}
              className="mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In to Arena'}
            </Button>
          </form>

          {/* Register Link */}
          <p className="text-center text-slate-500 text-sm mt-6">
            New to CodeCombat?{' '}
            <Link
              to="/register"
              className="text-primary-400 hover:text-primary-300 font-semibold transition-colors"
            >
              Create an account →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
