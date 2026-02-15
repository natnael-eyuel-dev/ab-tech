"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/shared/icons';
import { signIn } from 'next-auth/react';

export default function AuthErrorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const [provider, setProvider] = useState<string | null>(null);

  useEffect(() => {
    // Extract provider from the error or URL parameters
    const urlProvider = searchParams.get('provider');
    if (urlProvider) {
      setProvider(urlProvider);
    } else if (error === 'OAuthAccountNotLinked') {
      // Try to determine provider from the error context
      // This could be enhanced by passing more context in the error
      setProvider('Google or GitHub');
    }
  }, [error, searchParams]);

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'OAuthAccountNotLinked':
        return `An account already exists for this email using ${provider || 'Google or GitHub'}. Please sign in with ${provider || 'that provider'} and you can set a password in your account settings if you'd like to use email login too.`;
      case 'Configuration':
        return 'There is a problem with the server configuration. Please try again later.';
      case 'AccessDenied':
        return 'Access denied. You do not have permission to sign in.';
      case 'Verification':
        return 'The verification token has expired or has already been used.';
      case 'OAuthSignin':
        return 'Error in the OAuth sign-in process. Please try again.';
      case 'OAuthCallback':
        return 'Error in the OAuth callback. Please try again.';
      case 'OAuthCreateAccount':
        return 'Could not create OAuth provider account. Please try again.';
      case 'EmailCreateAccount':
        return 'Could not create email provider account. Please try again.';
      case 'Callback':
        return 'Error in the OAuth callback. Please try again.';
      case 'OAuthAccountNotLinked':
        return 'This account is already linked to another user. Please try a different account.';
      case 'SessionRequired':
        return 'Please sign in to access this page.';
      case 'Default':
        return 'An unknown error occurred. Please try again.';
      default:
        return 'An error occurred during authentication. Please try again.';
    }
  };

  const handleSignInWithProvider = (providerName: string) => {
    signIn(providerName.toLowerCase(), { callbackUrl: '/profile' });
  };

  const handleGoToSignIn = () => {
    router.push('/auth/signin');
  };

  return (
    <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[50vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Icons.alertTriangle className="h-5 w-5 text-red-600" />
            Authentication Error
          </CardTitle>
          <CardDescription>
            There was a problem with your authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription>
              {getErrorMessage(error)}
            </AlertDescription>
          </Alert>

          {error === 'OAuthAccountNotLinked' && provider && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Quick sign-in options:
              </p>
              <div className="flex flex-col gap-2">
                {provider.toLowerCase().includes('google') && (
                  <Button
                    variant="outline"
                    onClick={() => handleSignInWithProvider('Google')}
                    className="w-full"
                  >
                    <Icons.google className="mr-2 h-4 w-4" />
                    Sign in with Google
                  </Button>
                )}
                {provider.toLowerCase().includes('github') && (
                  <Button
                    variant="outline"
                    onClick={() => handleSignInWithProvider('GitHub')}
                    className="w-full"
                  >
                    <Icons.gitHub className="mr-2 h-4 w-4" />
                    Sign in with GitHub
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button onClick={handleGoToSignIn} className="w-full">
              Back to Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}