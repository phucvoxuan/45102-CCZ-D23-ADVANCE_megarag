import { redirect } from 'next/navigation';
import { getUser } from '@/lib/supabase/auth-server';
import Link from 'next/link';
import Image from 'next/image';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Redirect to dashboard if already logged in
  const user = await getUser();
  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Background pattern */}
      <div className="fixed inset-0 -z-10 opacity-40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity">
        <Image
          src="/logo.png"
          alt="AIDORag Logo"
          width={40}
          height={40}
          className="object-contain"
        />
        <span className="text-2xl font-bold">AIDO<span className="gradient-text">Rag</span></span>
      </Link>

      {/* Auth card */}
      <div className="w-full max-w-md animate-fade-in">
        {children}
      </div>

      {/* Footer */}
      <p className="mt-8 text-sm text-muted-foreground text-center">
        By continuing, you agree to our{' '}
        <Link href="/terms" className="underline hover:text-foreground transition-colors">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="underline hover:text-foreground transition-colors">
          Privacy Policy
        </Link>
      </p>
    </div>
  );
}
