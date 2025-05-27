// In a client component (e.g., UserMenu.tsx)
"use client";
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const supabase = createClient();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh(); // Ensure server components re-render
  };

  return <button onClick={handleLogout}>Logout</button>;
}