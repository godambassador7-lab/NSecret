import React, { useState } from 'react';
import { useAuth } from './AuthContext';

const AuthScreen = () => {
  const [mode, setMode] = useState('login'); // 'login', 'signup', 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, signup, loginWithGoogle, forgotPassword, authError, clearError } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setSuccessMessage('');
    clearError();

    if (mode === 'signup' && password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    if (password && password.length < 6 && mode !== 'forgot') {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);

    if (mode === 'login') {
      await login(email, password);
    } else if (mode === 'signup') {
      await signup(email, password);
    } else if (mode === 'forgot') {
      const result = await forgotPassword(email);
      if (result.success) {
        setSuccessMessage('Password reset email sent. Check your inbox.');
        setMode('login');
      }
    }

    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLocalError('');
    clearError();
    setIsLoading(true);
    await loginWithGoogle();
    setIsLoading(false);
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setLocalError('');
    setSuccessMessage('');
    clearError();
    setPassword('');
    setConfirmPassword('');
  };

  const displayError = localError || authError;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-amber-50/30 to-stone-100 p-6 font-serif flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-10 fade-in">
          <h1 className="text-5xl font-light tracking-wider text-amber-900 mb-2 gold-glow">
            NSecret
          </h1>
          <p className="text-sm tracking-widest text-amber-800/60 uppercase accent-text">
            Unseen good. Real impact.
          </p>
        </div>

        {/* Auth Card */}
        <div className="glass rounded-xl p-8 fade-in" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-2xl text-amber-900 font-light text-center mb-6">
            {mode === 'login' && 'Welcome Back'}
            {mode === 'signup' && 'Begin Your Journey'}
            {mode === 'forgot' && 'Reset Password'}
          </h2>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm text-center">
              {successMessage}
            </div>
          )}

          {/* Error Message */}
          {displayError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm text-center">
              {displayError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm text-amber-800/70 mb-2 accent-text">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-amber-900/20 bg-white/70 text-amber-900 focus:outline-none focus:border-amber-900/50 focus:ring-1 focus:ring-amber-900/30 transition-all"
                placeholder="your@email.com"
              />
            </div>

            {/* Password */}
            {mode !== 'forgot' && (
              <div>
                <label className="block text-sm text-amber-800/70 mb-2 accent-text">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-amber-900/20 bg-white/70 text-amber-900 focus:outline-none focus:border-amber-900/50 focus:ring-1 focus:ring-amber-900/30 transition-all"
                  placeholder="••••••••"
                />
              </div>
            )}

            {/* Confirm Password */}
            {mode === 'signup' && (
              <div>
                <label className="block text-sm text-amber-800/70 mb-2 accent-text">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-amber-900/20 bg-white/70 text-amber-900 focus:outline-none focus:border-amber-900/50 focus:ring-1 focus:ring-amber-900/30 transition-all"
                  placeholder="••••••••"
                />
              </div>
            )}

            {/* Forgot Password Link */}
            {mode === 'login' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="text-sm text-amber-800/60 hover:text-amber-900 accent-text transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-amber-800 to-amber-900 text-white rounded-lg hover:from-amber-900 hover:to-amber-950 transition-all duration-300 accent-text tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                <>
                  {mode === 'login' && 'Sign In'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'forgot' && 'Send Reset Email'}
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          {mode !== 'forgot' && (
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-amber-900/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white/70 text-amber-800/50 accent-text">or</span>
              </div>
            </div>
          )}

          {/* Google Sign In */}
          {mode !== 'forgot' && (
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-3 bg-white border border-amber-900/20 text-amber-900 rounded-lg hover:bg-amber-50 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>
          )}

          {/* Switch Mode */}
          <div className="mt-6 text-center">
            {mode === 'login' && (
              <p className="text-sm text-amber-800/60 accent-text">
                New to NSecret?{' '}
                <button
                  onClick={() => switchMode('signup')}
                  className="text-amber-900 hover:underline font-medium"
                >
                  Create an account
                </button>
              </p>
            )}
            {mode === 'signup' && (
              <p className="text-sm text-amber-800/60 accent-text">
                Already have an account?{' '}
                <button
                  onClick={() => switchMode('login')}
                  className="text-amber-900 hover:underline font-medium"
                >
                  Sign in
                </button>
              </p>
            )}
            {mode === 'forgot' && (
              <p className="text-sm text-amber-800/60 accent-text">
                Remember your password?{' '}
                <button
                  onClick={() => switchMode('login')}
                  className="text-amber-900 hover:underline font-medium"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 fade-in" style={{ animationDelay: '0.4s' }}>
          <p className="text-xs text-amber-800/40 tracking-widest italic">
            Your journey remains yours alone.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
