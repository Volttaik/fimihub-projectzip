import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UserPlus, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from 'zite-auth-sdk';

const GoogleIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const perks = [
  { text: 'Post unlimited free ads instantly' },
  { text: 'Manage listings from your dashboard' },
  { text: 'Get contacted directly by buyers & clients' },
  { text: 'Boost ads to reach a wider audience' },
];

export default function Register() {
  const { loginWithRedirect, user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) window.location.href = '/dashboard';
  }, [user, isLoading]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

        {/* Left — perks */}
        <div className="hidden lg:flex flex-col gap-6">
          {/* Logo mark */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-sm">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
                <path d="M9 21V12h6v9"/>
              </svg>
            </div>
            <span className="font-bold text-lg">FimiHub</span>
          </div>

          <div>
            <h1 className="text-3xl font-bold leading-tight mb-3">
              Join the marketplace<br />built for Africa
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              Connect with buyers, sellers, renters, and professionals across multiple cities. Free to join, free to post.
            </p>
          </div>

          <ul className="space-y-3.5">
            {perks.map(({ text }) => (
              <li key={text} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-sm leading-snug">{text}</span>
              </li>
            ))}
          </ul>

          {/* Social proof */}
          <div className="bg-card/70 backdrop-blur-sm border border-border/50 rounded-2xl p-4 shadow-sm">
            <div className="flex -space-x-2 mb-2">
              {['A','K','T','J','S'].map((l, i) => (
                <div key={i} className="w-7 h-7 rounded-full bg-primary border-2 border-card flex items-center justify-center text-primary-foreground text-xs font-bold">
                  {l}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">50,000+</span> users already on FimiHub across Lagos, Accra, Nairobi & more.
            </p>
          </div>
        </div>

        {/* Right — card */}
        <div className="w-full max-w-sm mx-auto lg:mx-0 lg:ml-auto">
          <div className="bg-card/85 backdrop-blur-md border border-border/50 rounded-3xl p-7 shadow-md">

            {/* Mobile logo */}
            <div className="flex flex-col items-center mb-6 lg:hidden">
              <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-md mb-3">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
                  <path d="M9 21V12h6v9"/>
                </svg>
              </div>
              <h1 className="text-xl font-bold">Create your free account</h1>
              <p className="text-sm text-muted-foreground mt-1">Join thousands of users on FimiHub</p>
            </div>

            <div className="hidden lg:block mb-6">
              <h2 className="text-xl font-bold mb-1">Create your account</h2>
              <p className="text-sm text-muted-foreground">Free forever. No credit card needed.</p>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                size="lg"
                className="w-full gap-2 font-semibold rounded-xl shadow-sm h-11"
                onClick={() => loginWithRedirect({ redirectUrl: `${window.location.origin}/dashboard` })}
              >
                <UserPlus className="w-4 h-4" />
                Register with Email
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/70" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-card px-3 text-xs text-muted-foreground">or continue with</span>
                </div>
              </div>

              <Button
                variant="outline"
                size="lg"
                className="w-full gap-2 rounded-xl h-11 border-border/70"
                onClick={() => loginWithRedirect({ redirectUrl: `${window.location.origin}/dashboard` })}
              >
                <GoogleIcon />
                Google
              </Button>
            </div>

            <p className="text-center text-xs text-muted-foreground mt-6 leading-relaxed">
              By registering you agree to our{' '}
              <a href="#" className="underline underline-offset-2 hover:text-foreground transition-colors">Terms of Service</a>{' '}
              and{' '}
              <a href="#" className="underline underline-offset-2 hover:text-foreground transition-colors">Privacy Policy</a>.
            </p>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline underline-offset-2 inline-flex items-center gap-0.5">
              Sign in <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
