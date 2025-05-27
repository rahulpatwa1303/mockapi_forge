"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { FiLogOut } from 'react-icons/fi';

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    router.push('/login'); // Redirect to login page
    router.refresh(); // Ensure server components and layout re-evaluate auth state
    setIsLoading(false);
  };

  return (
    <button onClick={handleLogout} className="btn btn-ghost btn-sm flex items-center" disabled={isLoading}>
      {isLoading ? (
        <span className="loading loading-spinner loading-xs"></span>
      ) : (
        <>
          <FiLogOut className="mr-1 hidden sm:inline" /> {/* Icon for larger screens */}
          <span>Logout</span>
        </>
      )}
    </button>
  );
}