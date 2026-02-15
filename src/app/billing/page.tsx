'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PaymentModal from '@/components/payment-modal';
import { 
  CreditCard, 
  Smartphone, 
  Crown, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock,
  ArrowLeft,
  ExternalLink,
  Copy
} from 'lucide-react';
import { getPremiumStatus } from '@/lib/utils/premium';

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  paymentMethod: 'STRIPE' | 'TELEBIRR';
  createdAt: string;
  description?: string;
}

interface PremiumStatus {
  isPremium: boolean;
  role: string;
  premiumExpires?: string;
  hasActiveSubscription: boolean;
  daysRemaining: number;
  stripeCustomerId?: string;
}

export default function BillingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [premiumStatus, setPremiumStatus] = useState<PremiumStatus | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Check for success/canceled parameters
  const isSuccess = searchParams.get('success') === 'true';
  const isCanceled = searchParams.get('canceled') === 'true';

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (status === 'authenticated') {
      fetchPremiumStatus();
      fetchPaymentHistory();
    }
  }, [status, router]);

  useEffect(() => {
    if (isSuccess) {
      setSuccess('Payment completed successfully! Your premium access has been activated.');
    } else if (isCanceled) {
      setError('Payment was canceled. You can try again whenever you\'re ready.');
    }
  }, [isSuccess, isCanceled]);

  const fetchPremiumStatus = async () => {
    try {
      const response = await fetch('/api/user/premium-status');
      const data = await response.json();
      setPremiumStatus(data);
    } catch (error) {
      console.error('Error fetching premium status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      const response = await fetch('/api/payments/history');
      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments || []);
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'FAILED':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-32 bg-gray-200 rounded mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold mb-2">Billing & Subscription</h1>
          <p className="text-muted-foreground">
            Manage your premium subscription and payment history
          </p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Current Status */}
        {premiumStatus && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className={`w-5 h-5 ${premiumStatus.isPremium ? 'text-yellow-500' : 'text-gray-400'}`} />
                Current Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Account Type</p>
                  <p className="font-semibold">
                    {premiumStatus.isPremium ? (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <Crown className="w-3 h-3 mr-1" />
                        Premium User
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Free User</Badge>
                    )}
                  </p>
                </div>
                {premiumStatus.isPremium && premiumStatus.premiumExpires && (
                  <div>
                    <p className="text-sm text-muted-foreground">Premium Expires</p>
                    <p className="font-semibold flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {formatDate(premiumStatus.premiumExpires)}
                    </p>
                  </div>
                )}
                {premiumStatus.isPremium && (
                  <div>
                    <p className="text-sm text-muted-foreground">Days Remaining</p>
                    <p className="font-semibold">
                      {premiumStatus.daysRemaining} days
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="upgrade" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upgrade">Upgrade to Premium</TabsTrigger>
            <TabsTrigger value="history">Payment History</TabsTrigger>
          </TabsList>

          {/* Upgrade Tab */}
          <TabsContent value="upgrade" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  Upgrade to Premium
                </CardTitle>
                <CardDescription>
                  Unlock unlimited access to all premium content and features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Premium Benefits */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Unlimited article access</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Ad-free reading experience</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Exclusive premium content</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Priority customer support</span>
                  </div>
                </div>

                {/* Call to Action */}
                <div className="text-center">
                  <Button 
                    size="lg" 
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="w-full md:w-auto"
                  >
                    <Crown className="w-5 h-5 mr-2" />
                    Upgrade Now - Choose Your Plan
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    Choose from Stripe (international) or Telebirr (Ethiopia) payment methods
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>
                  View your transaction history and payment status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No payment history found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {payments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div>
                            {payment.paymentMethod === 'STRIPE' ? (
                              <CreditCard className="w-5 h-5 text-blue-500" />
                            ) : (
                              <Smartphone className="w-5 h-5 text-green-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold">
                              {payment.paymentMethod === 'STRIPE' ? 'Stripe' : 'Telebirr'} Payment
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {payment.description || 'Premium subscription'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(payment.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {payment.amount} {payment.currency}
                          </p>
                          {getStatusBadge(payment.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={() => {
          // Refresh premium status after successful payment
          fetchPremiumStatus();
          fetchPaymentHistory();
          setSuccess('Payment completed successfully! Your premium access has been activated.');
        }}
      />
    </div>
  );
}