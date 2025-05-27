// app/login/page.tsx
"use client";

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Import Link for navigation
import { FiLogIn, FiAlertCircle, FiUserPlus, FiLock } from 'react-icons/fi'; // Icons

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState<string | null>(null);
  const [forgotPasswordError, setForgotPasswordError] = useState<string | null>(null);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
    } else {
      router.push('/dashboard');
      router.refresh(); // Refresh to update server components potentially displaying user info
    }
    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordMessage(null);
    setForgotPasswordError(null);
    setIsLoading(true);

    // Get redirect URL from environment variable or default
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/reset-password`;


    const { error: resetError } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
      redirectTo: redirectUrl, // URL user will be redirected to after clicking the link in email
    });

    if (resetError) {
      setForgotPasswordError(resetError.message);
    } else {
      setForgotPasswordMessage('If an account exists for this email, a password reset link has been sent. Please check your inbox (and spam folder).');
      setShowForgotPassword(false); // Optionally close the modal/form
      setForgotPasswordEmail(''); // Clear the email field
    }
    setIsLoading(false);
  };


  if (showForgotPassword) {
    return (
      <div className="hero min-h-screen bg-base-200">
        <div className="hero-content flex-col lg:flex-row-reverse w-full max-w-md">
          <div className="card shrink-0 w-full shadow-2xl bg-base-100">
            <form onSubmit={handleForgotPassword} className="card-body">
              <h1 className="text-2xl font-bold text-center text-primary mb-4">Reset Password</h1>
              
              {forgotPasswordMessage && (
                <div role="alert" className="alert alert-success">
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span>{forgotPasswordMessage}</span>
                </div>
              )}
              {forgotPasswordError && (
                 <div role="alert" className="alert alert-error">
                    <FiAlertCircle className="stroke-current shrink-0 h-6 w-6" />
                    <span>{forgotPasswordError}</span>
                </div>
              )}

              {!forgotPasswordMessage && (
                <>
                  <p className="text-sm text-center mb-4 text-base-content opacity-70">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                  <div className="form-control flex flex-col">
                    <label className="label sr-only  hidden">
                      <span className="label-text">Email</span>
                    </label>
                    <input
                      type="email"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="input input-bordered w-full"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="form-control mt-6">
                    <button type="submit" className="btn btn-primary" disabled={isLoading}>
                      {isLoading ? <span className="loading loading-spinner"></span> : 'Send Reset Link'}
                    </button>
                  </div>
                </>
              )}
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotPasswordMessage(null);
                    setForgotPasswordError(null);
                  }}
                  className="link link-hover text-sm"
                  disabled={isLoading && forgotPasswordMessage !== null} // Disable if loading and success message shown
                >
                  Back to Login
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="hero min-h-screen bg-base-200">
      <div className="hero-content flex-col lg:flex-row-reverse w-full max-w-md"> {/* Adjusted width for login form */}
        <div className="text-center lg:text-left lg:ml-10 hidden md:block"> {/* Only show title on larger screens or adjust */}
          <h1 className="text-5xl font-bold text-primary">Login now!</h1>
          <p className="py-6 text-base-content opacity-80">
            Access your MockAPI Forge dashboard to create and manage your mock APIs.
          </p>
        </div>
        <div className="card shrink-0 w-full shadow-2xl bg-base-100">
          <form onSubmit={handleLogin} className="card-body">
            <h1 className="text-2xl font-bold text-center text-primary mb-4 md:hidden">Login</h1> {/* Show title on mobile */}
            {error && (
              <div role="alert" className="alert alert-error mb-4">
                <FiAlertCircle className="stroke-current shrink-0 h-6 w-6" />
                <span>{error}</span>
              </div>
            )}
            <div className="form-control flex flex-col">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input input-bordered"
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-control flex flex-col">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input input-bordered"
                required
                disabled={isLoading}
              />
              <label className="label">
                <button
                  type="button" // Important: type="button" to prevent form submission
                  onClick={() => {
                    setShowForgotPassword(true);
                    setForgotPasswordEmail(email); // Pre-fill if user typed in login form
                  }}
                  className="label-text-alt link link-hover text-accent"
                >
                  Forgot password?
                </button>
              </label>
            </div>
            <div className="form-control mt-6">
              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? <span className="loading loading-spinner"></span> : <FiLogIn className="mr-2" />}
                Login
              </button>
            </div>
            <div className="text-center mt-4 text-sm">
              <span className="text-base-content opacity-70">No account? </span>
              <Link href="/signup" className="link link-hover text-secondary font-semibold">
                <FiUserPlus className="inline mr-1 mb-px" /> Sign up
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}