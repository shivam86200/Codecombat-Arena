import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Shield, AlertCircle, Sword } from 'lucide-react';
import Input from '../components/Input';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

/* ─── Validation Helpers ─────────────────────────────── */
const validateName = (name) => {
  if (!name) return 'Name is required.';
  if (name.trim().length < 2) return 'Name must be at least 2 characters.';
  return '';
};

const validateUsername = (username) => {
  if (!username) return 'Username is required.';
  if (username.trim().length < 3) return 'Username must be at least 3 characters.';
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Username can only contain letters, numbers, and underscores.';
  return '';
};

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return 'Email is required.';
  if (!re.test(email)) return 'Enter a valid email address.';
  return '';
};

const validatePassword = (password) => {
  if (!password) return 'Password is required.';
  if (password.length < 6) return 'Password must be at least 6 characters.';
  return '';
};

const validateConfirmPassword = (password, confirm) => {
  if (!confirm) return 'Please confirm your password.';
  if (confirm !== password) return 'Passwords do not match.';
  return '';
};

/* ─── Password Strength Indicator ───────────────────── */
const getPasswordStrength = (password) => {
  if (!password) return null;
  if (password.length < 6) return { label: 'Weak', color: 'bg-red-500', width: 'w-1/4' };
  if (password.length < 8) return { label: 'Fair', color: 'bg-yellow-500', width: 'w-2/4' };
  if (/[A-Z]/.test(password) && /[0-9]/.test(password)) return { label: 'Strong', color: 'bg-green-500', width: 'w-full' };
  return { label: 'Good', color: 'bg-primary-500', width: 'w-3/4' };
};

/* ─── Google Icon ────────────────────────────────────── */
const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

/* ─── Register Page ──────────────────────────────────── */
const Register = () => {
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();

  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({ name: '', username: '', email: '', password: '', confirmPassword: '' });
  const [touched, setTouched] = useState({ name: false, username: false, email: false, password: false, confirmPassword: false });
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  /* ── Field Validator Map ────────────────────────── */
  const runValidation = (field, value, formSnapshot = form) => {
    switch (field) {
      case 'name':     return validateName(value);
      case 'username': return validateUsername(value);
      case 'email':    return validateEmail(value);
      case 'password': return validatePassword(value);
      case 'confirmPassword': return validateConfirmPassword(formSnapshot.password, value);
      default: return '';
    }
  };

  /* ── Handlers ───────────────────────────────────── */
  const handleChange = (field) => (e) => {
    const value = e.target.value;
    const nextForm = { ...form, [field]: value };
    setForm(nextForm);
    setServerError('');
    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: runValidation(field, value, nextForm) }));
    }
    // Re-validate confirmPassword if password changes
    if (field === 'password' && touched.confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: validateConfirmPassword(value, nextForm.confirmPassword),
      }));
    }
  };

  const handleBlur = (field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: runValidation(field, form[field]) }));
  };

  const isFormValid =
    !validateName(form.name) &&
    !validateUsername(form.username) &&
    !validateEmail(form.email) &&
    !validatePassword(form.password) &&
    !validateConfirmPassword(form.password, form.confirmPassword);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setServerError('');
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Google Login failed.';
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ── Submit ─────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Touch all fields
    setTouched({ name: true, username: true, email: true, password: true, confirmPassword: true });
    const newErrors = {
      name:            validateName(form.name),
      username:        validateUsername(form.username),
      email:           validateEmail(form.email),
      password:        validatePassword(form.password),
      confirmPassword: validateConfirmPassword(form.password, form.confirmPassword),
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    try {
      setLoading(true);
      setServerError('');
      await register(form.name.trim(), form.username.trim(), form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      if (!err.response || err.response.status === 504 || err.response.status === 502 || typeof err.response.data === 'string') {
        setServerError('Cannot connect to backend! You must open a NEW terminal, type "cd server" and "npm run dev".');
      } else {
        const msg = err.response?.data?.message || 'Registration failed. Please try again.';
        setServerError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength(form.password);

  /* ── Render ─────────────────────────────────────── */
  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12">
      {/* Ambient background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-purple-700/8 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600/20 border border-primary-500/30 mb-4">
            <Sword className="h-8 w-8 text-primary-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">Join the Arena</h1>
          <p className="text-slate-400 mt-2 text-sm">
            Create your account and start your journey to the top.
          </p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8 border border-white/5 shadow-2xl">

          {/* Server Error */}
          {serverError && (
            <div className="flex items-start gap-3 p-3 mb-5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

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

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Name */}
            <Input
              id="register-name"
              label="Full Name"
              type="text"
              value={form.name}
              onChange={handleChange('name')}
              onBlur={handleBlur('name')}
              placeholder="John Doe"
              error={touched.name ? errors.name : ''}
              icon={User}
              required
            />

            {/* Username */}
            <Input
              id="register-username"
              label="Username"
              type="text"
              value={form.username}
              onChange={handleChange('username')}
              onBlur={handleBlur('username')}
              placeholder="warrior_123"
              error={touched.username ? errors.username : ''}
              icon={User}
              required
            />

            {/* Email */}
            <Input
              id="register-email"
              label="Email"
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              onBlur={handleBlur('email')}
              placeholder="name@example.com"
              error={touched.email ? errors.email : ''}
              icon={Mail}
              required
            />

            {/* Password */}
            <div className="space-y-2">
              <Input
                id="register-password"
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
              {/* Strength Bar */}
              {form.password && strength && (
                <div className="space-y-1">
                  <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${strength.color} ${strength.width}`}
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    Strength: <span className="font-semibold text-slate-300">{strength.label}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <Input
              id="register-confirm-password"
              label="Confirm Password"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange('confirmPassword')}
              onBlur={handleBlur('confirmPassword')}
              placeholder="Re-enter your password"
              error={touched.confirmPassword ? errors.confirmPassword : ''}
              icon={Shield}
              required
            />

            {/* Submit */}
            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={loading}
              disabled={!isFormValid || loading}
              className="mt-2"
            >
              {loading ? 'Creating Account...' : 'Create Arena Account'}
            </Button>
          </form>

          <div className="mt-6 flex flex-col items-center gap-4">
            <p className="text-slate-400 text-sm">
              By registering you agree to our <a href="#" className="text-primary-400 hover:text-primary-300">Terms of Service</a>
            </p>
            <button 
              onClick={async () => {
                try {
                  await api.post('/auth/reset');
                  alert('Database wiped! You can now register fresh.');
                } catch (e) {
                  alert('Reset failed.');
                }
              }}
              type="button" 
              className="text-xs text-slate-600 hover:text-red-400"
            >
              (Dev Tool: Click here to wipe all users from DB)
            </button>
          </div>

          {/* Login Link */}
          <p className="text-center text-slate-500 text-sm mt-5 pt-5 border-t border-slate-800">
            Already a warrior?{' '}
            <Link
              to="/login"
              className="text-primary-400 hover:text-primary-300 font-semibold transition-colors"
            >
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
