"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/shared/icons';
import { useToast } from '@/hooks/use-toast';

export default function LinkAccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (status === 'authenticated') {
      handleAccountLinking();
    }
  }, [status, router]);

  const handleAccountLinking = async () => {
    try {
      // Check if we have the link account intent
      const linkIntent = sessionStorage.getItem('linkAccountIntent');
      if (!linkIntent) {
        router.push('/profile');
        return;
      }

      // Get the session data - this should contain the OAuth account info
      if (!session) {
        throw new Error('No session found');
      }

      // Get the provider from the session or URL
      const provider = searchParams.get('provider') || 
                      (session as any)?.provider || 
                      'Unknown Provider';

      setLinking(true);
      
      // The account should already be linked by NextAuth adapter
      // We just need to verify and show success
      
      // Clear the intent
      sessionStorage.removeItem('linkAccountIntent');
      
      setSuccess(`${provider} account linked successfully!`);
      
      toast({
        title: 'Account Linked',
        description: `${provider} account has been linked to your profile.`,
      });
      
      // Redirect to profile after a short delay
      setTimeout(() => {
        router.push('/profile?tab=account');
      }, 2000);
      
    } catch (error) {
      console.error('Error linking account:', error);
      setError(error instanceof Error ? error.message : 'Failed to link account');
    } finally {
      setLoading(false);
      setLinking(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setSuccess(null);
    handleAccountLinking();
  };

  const handleGoToProfile = () => {
    router.push('/profile?tab=account');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[50vh]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Icons.spinner className="h-8 w-8 animate-spin" />
              <h3 className="text-lg font-medium">Linking your account...</h3>
              <p className="text-sm text-muted-foreground text-center">
                Please wait while we connect your account
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[50vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Account Linking</CardTitle>
          <CardDescription>
            {success ? 'Account linked successfully!' : 'Connecting your account'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}
          
          {linking && (
            <div className="flex flex-col items-center space-y-4 py-4">
              <Icons.spinner className="h-8 w-8 animate-spin" />
              <p className="text-sm text-muted-foreground text-center">
                Please wait while we link your account...
              </p>
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            {error && (
              <Button onClick={handleRetry} className="w-full">
                Retry
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={handleGoToProfile} 
              className="w-full"
            >
              Go to Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}