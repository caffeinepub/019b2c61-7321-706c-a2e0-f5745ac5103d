import { Heart } from 'lucide-react';
import { useGetIntegrationsCanisterId } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

export default function Footer() {
  const { identity } = useInternetIdentity();
  const { data: canisterId, isLoading } = useGetIntegrationsCanisterId();
  const isAuthenticated = !!identity;

  return (
    <footer className="border-t border-border/40 bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center gap-3">
          {isAuthenticated && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium">Integration Canister ID:</span>
              {isLoading ? (
                <span className="animate-pulse">Loading...</span>
              ) : canisterId ? (
                <code className="rounded bg-muted px-2 py-1 font-mono text-xs">
                  {canisterId}
                </code>
              ) : (
                <span className="text-muted-foreground/60">Not available</span>
              )}
            </div>
          )}
          <p className="text-center text-sm text-muted-foreground">
            © 2025. Built with{' '}
            <Heart className="inline h-4 w-4 fill-red-500 text-red-500" /> using{' '}
            <a
              href="https://caffeine.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
