// app/auth/reset-password/page.tsx
"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { FiSave, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

function ResetPasswordForm() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  // Supabase handles the session/token automatically if the user is on the same browser
  // or if the recovery token is in the URL fragment.
  // This useEffect is mainly to check if Supabase client detects an error from the token in the URL fragment (e.g. expired)
  // which is a common pattern, although Supabase's updateUser might just fail if token is bad.
  useEffect(() => {
    // Supabase client automatically handles `access_token` from URL fragment for password recovery.
    // We don't need to manually extract it here for `updateUser`.
    // If there's an error in the fragment (e.g., #error=...&error_description=...), Supabase client might pick it up.
    // However, usually, you'd just try to update the password and handle the error from `updateUser`.

    // Check for error params from Supabase redirect, if any
    const errorDescription = searchParams.get('error_description');
    if (errorDescription) {
        setTokenError(decodeURIComponent(errorDescription));
    }

  }, [searchParams]);


  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) { // Example: Enforce minimum password length
        setError("Password must be at least 6 characters long.");
        return;
    }

    setIsLoading(true);

    // The Supabase client automatically uses the access_token from the URL fragment
    // if the user landed on this page from the reset email link.
    const { data, error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccessMessage("Your password has been updated successfully! You can now log in with your new password.");
      // Optionally redirect to login after a delay
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    }
    setIsLoading(false);
  };
  
  if (tokenError) {
    return (
      <div className="hero min-h-screen bg-base-200">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <div role="alert" className="alert alert-error">
              <FiAlertCircle className="stroke-current shrink-0 h-6 w-6" />
              <div>
                <h3 className="font-bold">Password Reset Error</h3>
                <p>{tokenError}</p>
              </div>
            </div>
            <Link href="/login" className="btn btn-primary mt-6">Go to Login</Link>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="hero min-h-screen bg-base-200">
      <div className="hero-content flex-col w-full max-w-md">
        <div className="card shrink-0 w-full shadow-2xl bg-base-100">
          <form onSubmit={handlePasswordUpdate} className="card-body">
            <h1 className="text-2xl font-bold text-center text-primary mb-4">Set New Password</h1>
            
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

            {!successMessage && ( // Hide form after success
                <>
                    <div className="form-control">
                    <label className="label">
                        <span className="label-text">New Password</span>
                    </label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="input input-bordered"
                        required
                        disabled={isLoading}
                    />
                    </div>
                    <div className="form-control">
                    <label className="label">
                        <span className="label-text">Confirm New Password</span>
                    </label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="input input-bordered"
                        required
                        disabled={isLoading}
                    />
                    </div>
                    <div className="form-control mt-6">
                    <button type="submit" className="btn btn-primary" disabled={isLoading}>
                        {isLoading ? <span className="loading loading-spinner"></span> : <FiSave className="mr-2" />}
                        Update Password
                    </button>
                    </div>
                </>
            )}
             {successMessage && (
                 <div className="form-control mt-6">
                    <Link href="/login" className="btn btn-secondary">
                        Go to Login
                    </Link>
                 </div>
             )}
          </form>
        </div>
      </div>
    </div>
  );
}

// Wrap with Suspense for useSearchParams
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="hero min-h-screen bg-base-200"><span className="loading loading-lg"></span></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}