import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, 
  Download, 
  Wallet,
  AlertTriangle,
  Shield,
  Clock
} from 'lucide-react';

const Withdraw = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [withdrawalAddress, setWithdrawalAddress] = useState('');
  const [withdrawalMethod, setWithdrawalMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [userBalance, setUserBalance] = useState(0);

  const withdrawalMethods = [
    { value: 'bitcoin', label: 'Bitcoin (BTC)', fee: '0.5%', time: '1-2 hours' },
    { value: 'ethereum', label: 'Ethereum (ETH)', fee: '0.3%', time: '30 minutes' },
    { value: 'bank_transfer', label: 'Bank Transfer', fee: '$25', time: '3-5 business days' },
    { value: 'paypal', label: 'PayPal', fee: '2%', time: '24 hours' }
  ];

  const handleSubmitWithdrawal = async () => {
    if (!amount || !withdrawalAddress || !withdrawalMethod) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const withdrawAmount = parseFloat(amount);
    if (withdrawAmount < 50) {
      toast({
        title: "Minimum Withdrawal",
        description: "Minimum withdrawal amount is $50",
        variant: "destructive"
      });
      return;
    }

    if (withdrawAmount > userBalance) {
      toast({
        title: "Insufficient Balance",
        description: "Withdrawal amount exceeds available balance",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('withdrawals')
        .insert({
          user_id: user?.id,
          amount: withdrawAmount,
          withdrawal_method: withdrawalMethod,
          withdrawal_address: withdrawalAddress,
          currency: 'USD',
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Withdrawal Submitted",
        description: "Your withdrawal request has been submitted for review. You'll be notified once processed.",
      });

      // Reset form
      setAmount('');
      setWithdrawalAddress('');
      setWithdrawalMethod('');
      
      // Navigate back to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error: any) {
      console.error('Error submitting withdrawal:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit withdrawal request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <h1 className="text-2xl font-bold">Withdraw Funds</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Balance Overview */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Available Balance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-6 bg-primary/5 rounded-lg">
                <p className="text-3xl font-bold text-primary">${userBalance.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground mt-2">Available for withdrawal</p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Balance:</span>
                  <span className="font-semibold">${userBalance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Locked Balance:</span>
                  <span className="font-semibold">$0.00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Minimum Withdrawal:</span>
                  <span className="font-semibold">$50.00</span>
                </div>
              </div>

              {/* Security Notice */}
              <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <Shield className="h-5 w-5 text-warning mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-warning">Security Notice</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      All withdrawals require manual approval for security. Processing time may vary.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Withdrawal Form */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Withdrawal Request
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Withdrawal Method */}
              <div className="space-y-2">
                <Label htmlFor="method">Withdrawal Method</Label>
                <Select value={withdrawalMethod} onValueChange={setWithdrawalMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select withdrawal method" />
                  </SelectTrigger>
                  <SelectContent>
                    {withdrawalMethods.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        <div className="flex justify-between items-center w-full">
                          <span>{method.label}</span>
                          <div className="flex gap-2 text-xs text-muted-foreground">
                            <span>Fee: {method.fee}</span>
                            <span>•</span>
                            <span>{method.time}</span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Withdrawal Address */}
              <div className="space-y-2">
                <Label htmlFor="address">
                  {withdrawalMethod === 'bank_transfer' ? 'Bank Account Details' : 
                   withdrawalMethod === 'paypal' ? 'PayPal Email' : 'Wallet Address'}
                </Label>
                <Input
                  id="address"
                  placeholder={
                    withdrawalMethod === 'bank_transfer' ? 'Account Number, Routing Number, Bank Name' : 
                    withdrawalMethod === 'paypal' ? 'your@email.com' : 
                    'Enter wallet address'
                  }
                  value={withdrawalAddress}
                  onChange={(e) => setWithdrawalAddress(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  {withdrawalMethod === 'bank_transfer' 
                    ? 'Provide complete bank account information' 
                    : 'Double-check the address to avoid loss of funds'
                  }
                </p>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="amount">Withdrawal Amount (USD)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Minimum: $50"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="50"
                  max={userBalance}
                  step="0.01"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Minimum: $50</span>
                  <span>Available: ${userBalance.toLocaleString()}</span>
                </div>
              </div>

              {/* Fee Information */}
              {withdrawalMethod && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Processing Fee:</span>
                    <span className="text-sm font-semibold">
                      {withdrawalMethods.find(m => m.value === withdrawalMethod)?.fee}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm">Processing Time:</span>
                    <span className="text-sm font-semibold">
                      {withdrawalMethods.find(m => m.value === withdrawalMethod)?.time}
                    </span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button 
                onClick={handleSubmitWithdrawal}
                disabled={loading || !amount || !withdrawalAddress || !withdrawalMethod}
                className="w-full glow-button"
                variant="hero"
              >
                {loading ? (
                  "Submitting..."
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Submit Withdrawal Request
                  </>
                )}
              </Button>

              {/* Important Notes */}
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-destructive">Important Notes</h4>
                    <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                      <li>• All withdrawals are manually reviewed for security</li>
                      <li>• Incorrect addresses may result in permanent loss</li>
                      <li>• Processing times may vary during high volume</li>
                      <li>• Contact support if you need urgent assistance</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Withdraw;