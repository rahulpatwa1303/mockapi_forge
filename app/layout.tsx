// app/layout.tsx
import LogoutButton from '@/components/LogoutButton'; // Use the new client component
import ThemeToggleButton from '@/components/ThemeToggleButton';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { FiGrid, FiTerminal, FiUser } from 'react-icons/fi'; // Example icons
import './globals.css'; // Tailwind global styles

export const metadata = { // Add metadata for better SEO and browser tab
  title: 'MockAPI Forge',
  description: 'Create and serve mock APIs effortlessly for testing and development.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    // data-theme will be dynamically set by ThemeToggleButton client-side
    // For SSR, DaisyUI defaults to the first theme in your config or 'light',
    // or respects prefers-color-scheme if darkTheme is set in daisyui config.
    <html lang="en" className="h-full scroll-smooth">
      <body className="h-full bg-base-100 text-base-content antialiased">
        <div className="flex flex-col min-h-screen">
          {user && (
            <header className="sticky top-0 z-30 w-full">
              {/* Using navbar with explicit text colors for better contrast control */}
              <div className="navbar bg-base-300 text-base-content shadow-md">
                <div className="navbar-start">
                  {/* Mobile Drawer Toggle (Hamburger Menu) */}
                  <div className="dropdown">
                    <label tabIndex={0} className="btn btn-ghost lg:hidden">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" /></svg>
                    </label>
                    <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-200 rounded-box w-52">
                      <li><Link href="/dashboard" className="flex items-center"><FiGrid className="mr-2"/>Dashboard</Link></li>
                      {/* <li><Link href="/account-settings" className="flex items-center"><FiSettings className="mr-2"/>Settings</Link></li> */}
                      <li className="mt-2 pt-2 border-t border-base-300">
                        <div className="text-xs px-3 py-1 text-base-content/70">Hi, {user.email?.split('@')[0]}</div>
                        <LogoutButton /> {/* Use client component here for better UX */}
                      </li>
                    </ul>
                  </div>
                  {/* Brand Logo/Name */}
                  <Link href="/dashboard" className="btn btn-ghost normal-case text-xl flex items-center font-semibold hover:bg-opacity-50">
                    <FiTerminal className="mr-2 text-primary" /> {/* Using primary color for icon */}
                    <span className="text-primary-content_ opa city-90 hover:opacity-100">MockAPI</span>
                    <span className="font-light text-base-content opacity-70 hover:opacity-100">Forge</span>
                  </Link>
                </div>

                {/* Desktop Navbar Center Links */}
                <div className="navbar-center hidden lg:flex">
                  <ul className="menu menu-horizontal px-1 text-sm font-medium">
                    <li><Link href="/dashboard" className="rounded-lg hover:bg-base-content hover:text-base-100"><FiGrid className="mr-1"/>Dashboard</Link></li>
                    {/* Example: <li><Link href="/docs" className="rounded-lg">Docs</Link></li> */}
                  </ul>
                </div>

                {/* Desktop Navbar End Actions */}
                <div className="navbar-end space-x-1 md:space-x-2 items-center">
                  <ThemeToggleButton />
                  <div className="hidden sm:flex items-center text-sm text-base-content/80 mr-2">
                    <FiUser className="mr-1.5 opacity-70" />
                    {user.email?.split('@')[0]}
                  </div>
                  <div className="hidden sm:block">
                    <LogoutButton />
                  </div>
                </div>
              </div>
            </header>
          )}

          {/* Main Content Area */}
          <main className={`flex-grow ${user ? 'pt-4 pb-8' : 'pt-0 pb-0'}`}> {/* Add padding if nav is present */}
            <div className="container mx-auto max-w-7xl"> {/* Consistent max-width */}
              {children}
            </div>
          </main>

          {/* Optional Footer */}
          {!user && ( // Show a simple footer on auth pages
            <footer className="footer footer-center p-4 bg-base-300 text-base-content mt-auto">
                <aside>
                    <p>© {new Date().getFullYear()} MockAPI Forge - Create something awesome!</p>
                </aside>
            </footer>
          )}
           {user && ( // Slightly different footer for logged-in users
            <footer className="footer footer-center p-4 bg-base-200 text-base-content/70 text-xs mt-auto">
                <aside>
                    <p>MockAPI Forge © {new Date().getFullYear()} - Happy Mocking!</p>
                    {/* Maybe a link to terms or a GitHub repo if it's open source */}
                </aside>
            </footer>
          )}
        </div>
      </body>
    </html>
  );
}