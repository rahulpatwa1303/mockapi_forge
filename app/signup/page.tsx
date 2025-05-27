// app/signup/page.tsx
"use client";

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiUserPlus, FiAlertCircle, FiCheckCircle, FiLogIn } from 'react-icons/fi';

export default function SignupPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) { // Example: Enforce minimum password length (should match Supabase settings if any)
        setError("Password must be at least 6 characters long.");
        return;
    }

    setIsLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // emailRedirectTo: `${window.location.origin}/auth/callback` // If email confirmation is ON
        // The trigger will handle profile creation.
      }
    });

    if (signUpError) {
      setError(signUpError.message);
    } else if (data.user && data.user.identities && data.user.identities.length === 0) {
      // This case can happen if "Secure email change" is enabled and user tries to signup with an email that exists as unconfirmed.
      // Or other specific Supabase settings.
      setError("This email address may already be in use or pending confirmation. Try logging in or resetting your password.");
    } else if (data.user?.aud === 'authenticated') {
      // If "Confirm email" is OFF in Supabase Auth settings, user is signed up and logged in.
      setSuccessMessage("Signup successful! Redirecting to dashboard...");
      // The trigger should have created the profile.
      // Redirect to dashboard.
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 2000);
    } else {
      // If "Confirm email" is ON, user needs to confirm their email.
      setSuccessMessage("Signup successful! Please check your email to confirm your account.");
       // Clear form or disable after success
       setEmail('');
       setPassword('');
       setConfirmPassword('');
    }
    setIsLoading(false);
  };

  return (
    <div className="hero min-h-screen bg-base-200">
      <div className="hero-content flex-col lg:flex-row-reverse w-full max-w-md">
        <div className="text-center lg:text-left lg:ml-10 hidden md:block">
          <h1 className="text-5xl font-bold text-primary">Join Us!</h1>
          <p className="py-6 text-base-content opacity-80">
            Create your MockAPI Forge account to start building and testing with mock APIs in minutes.
          </p>
        </div>
        <div className="card shrink-0 w-full shadow-2xl bg-base-100">
          <form onSubmit={handleSignup} className="card-body">
            <h1 className="text-2xl font-bold text-center text-primary mb-4 md:hidden">Create Account</h1>
            
            {successMessage && (
              <div role="alert" className="alert alert-success mb-4">
                <FiCheckCircle className="stroke-current shrink-0 h-6 w-6" />
                <span>{successMessage}</span>
              </div>
            )}
            {error && (
              <div role="alert" className="alert alert-error mb-4">
                <FiAlertCircle className="stroke-current shrink-0 h-6 w-6" />
                <span>{error}</span>
              </div>
            )}

            {!successMessage && ( // Hide form fields after successful message
                <>
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
                        placeholder="Create a password (min. 6 chars)"
                        className="input input-bordered"
                        required
                        disabled={isLoading}
                    />
                    </div>
                    <div className="form-control flex flex-col">
                    <label className="label">
                        <span className="label-text">Confirm Password</span>
                    </label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        className="input input-bordered"
                        required
                        disabled={isLoading}
                    />
                    </div>
                    <div className="form-control mt-6">
                    <button type="submit" className="btn btn-primary" disabled={isLoading}>
                        {isLoading ? <span className="loading loading-spinner"></span> : <FiUserPlus className="mr-2" />}
                        Sign Up
                    </button>
                    </div>
                </>
            )}
            <div className="text-center mt-4 text-sm">
                {successMessage ? (
                    <Link href="/login" className="link link-hover text-secondary font-semibold">
                        <FiLogIn className="inline mr-1 mb-px" /> Proceed to Login
                    </Link>
                ) : (
                    <>
                        <span className="text-base-content opacity-70">Already have an account? </span>
                        <Link href="/login" className="link link-hover text-secondary font-semibold">
                            <FiLogIn className="inline mr-1 mb-px" /> Log in
                        </Link>
                    </>
                )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}