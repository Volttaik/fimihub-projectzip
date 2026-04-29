import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogIn, ArrowRight, ShoppingBag, Home, Wrench, Briefcase } from 'lucide-react';
import { useAuth } from 'zite-auth-sdk';

const GoogleIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const HouseLogo = () => (
  <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto shadow-md">
    <svg viewBox="0 0 24 24" className="w-7 h-7 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
      <path d="M9 21V12h6v9"/>
    </svg>
  </div>
);

const previewListings = [
  { icon: ShoppingBag, label: 'MacBook Pro M3', price: '$1,450', color: 'bg-primary/10 text-primary' },
  { icon: Home,        label: '2BR — Victoria Island', price: '$850/mo', color: 'bg-accent/15 text-foreground' },
  { icon: Wrench,      label: 'Logo Design Service', price: '$120', color: 'bg-primary/10 text-primary' },
  { icon: Briefcase,   label: 'ZapFit Gym Promo', price: '$40/mo', color: 'bg-accent/15 text-foreground' },
];

export default function Login() {
  const { loginWithRedirect, user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) window.location.href = '/dashboard';
  }, [user, isLoading]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

        {/* Left panel — preview */}
        <div className="hidden lg:flex flex-col gap-5">
          <div>
            <h2 className="text-3xl font-bold leading-tight mb-2">
              Discover what's on<br />FimiHub today
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Thousands of products, services, rentals and businesses — all in one place.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {previewListings.map(({ icon: Icon, label, price, color }) => (
              <div key={label} className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-sm font-semibold leading-snug">{label}</p>
                <p className="text-sm font-bold text-primary">{price}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            Join 50,000+ users already buying, selling and connecting on FimiHub.
          </p>
        </div>

        {/* Right panel — login card */}
        <div className="w-full max-w-sm mx-auto lg:mx-0 lg:ml-auto">
          <div className="bg-card/85 backdrop-blur-md border border-border/50 rounded-3xl p-7 shadow-md">
            <div className="text-center mb-7">
              <HouseLogo />
              <h1 className="text-2xl font-bold mt-4 mb-1">Welcome back</h1>
              <p className="text-sm text-muted-foreground">Sign in to your FimiHub account</p>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                size="lg"
                className="w-full gap-2 font-semibold rounded-xl shadow-sm h-11"
                onClick={() => loginWithRedirect({ redirectUrl: `${window.location.origin}/dashboard` })}
              >
                <LogIn className="w-4 h-4" />
                Sign in with Email
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

            <p className="text-center text-xs text-muted-foreground mt-6">
              By signing in you agree to our{' '}
              <a href="#" className="underline underline-offset-2 hover:text-foreground transition-colors">Terms</a> &{' '}
              <a href="#" className="underline underline-offset-2 hover:text-foreground transition-colors">Privacy Policy</a>.
            </p>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-4">
            New to FimiHub?{' '}
            <Link to="/register" className="text-primary font-semibold hover:underline underline-offset-2 inline-flex items-center gap-0.5">
              Create a free account <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
