import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, LogIn, ArrowRight } from 'lucide-react';

/**
 * AuthScreen: Login interface with Google Sign-In
 */
const AuthScreen = ({ signInWithGoogle, signInWithEmail, signUpWithEmail, loading, error }) => {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const handleGoogleClick = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Google sign-in failed:', err);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err) {
      setFormError(err.message || 'Authentication failed');
    } finally {
      setFormLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />

      {/* Main Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 w-full max-w-md px-6 py-12 rounded-2xl border border-blue-400/30 bg-slate-900/80 backdrop-blur-xl shadow-2xl"
      >
        {/* Logo/Title Section */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
            Qdash
          </h1>
          <p className="text-sm text-gray-400">
            Advanced Configuration & Simulation Platform
          </p>
        </motion.div>

        {/* Error Display */}
        {(error || formError) && (
          <motion.div
            variants={itemVariants}
            className="mb-6 p-3 rounded-lg bg-red-500/20 border border-red-400/50 text-red-200 text-sm"
          >
            {error || formError}
          </motion.div>
        )}

        {!showEmailForm ? (
          <>
            {/* Google Sign-In Button */}
            <motion.button
              variants={itemVariants}
              onClick={handleGoogleClick}
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold flex items-center justify-center gap-2 transition-all duration-200 mb-4 disabled:opacity-75"
            >
              {loading ? (
                <div className="animate-spin">⏳</div>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Sign in with Google
                </>
              )}
            </motion.button>

            {/* Divider */}
            <motion.div
              variants={itemVariants}
              className="flex items-center gap-3 my-6"
            >
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />
              <span className="text-xs text-gray-500">OR</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />
            </motion.div>

            {/* Email Form Toggle */}
            <motion.button
              variants={itemVariants}
              onClick={() => setShowEmailForm(true)}
              className="w-full py-3 px-4 rounded-lg border border-blue-400/50 hover:border-blue-400 hover:bg-blue-500/10 text-blue-300 font-semibold flex items-center justify-center gap-2 transition-all duration-200"
            >
              <Mail className="w-5 h-5" />
              Sign in with Email
            </motion.button>

            {/* Sign Up Link */}
            <motion.p
              variants={itemVariants}
              className="text-center text-sm text-gray-400 mt-6"
            >
              Don&apos;t have an account?{' '}
              <button
                onClick={() => {
                  setShowEmailForm(true);
                  setIsSignUp(true);
                }}
                className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
              >
                Sign up
              </button>
            </motion.p>
          </>
        ) : (
          <>
            {/* Email Form */}
            <motion.form
              variants={itemVariants}
              onSubmit={handleEmailSubmit}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-lg bg-slate-800/50 border border-blue-400/30 text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/50 transition-all"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-lg bg-slate-800/50 border border-blue-400/30 text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/50 transition-all"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-75"
              >
                {formLoading ? (
                  <div className="animate-spin">⏳</div>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    {isSignUp ? 'Create Account' : 'Sign In'}
                  </>
                )}
              </button>
            </motion.form>

            {/* Back Button */}
            <motion.button
              variants={itemVariants}
              onClick={() => {
                setShowEmailForm(false);
                setIsSignUp(false);
                setEmail('');
                setPassword('');
                setFormError(null);
              }}
              className="w-full mt-4 py-2 text-sm text-blue-300 hover:text-blue-200 transition-colors flex items-center justify-center gap-1"
            >
              <ArrowRight className="w-3 h-3 rotate-180" />
              Back
            </motion.button>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default AuthScreen;
