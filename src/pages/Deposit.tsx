import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  Upload, 
  ArrowLeft, 
  Copy, 
  Check,
  CreditCard,
  Bitcoin,
  Banknote
} from 'lucide-react';

const Deposit = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('bitcoin');
  const [copied, setCopied] = useState(false);

  const depositMethods = {
    bitcoin: {
      name: 'Bitcoin',
      address: 'bc1qzn2g79aqkdefkfr9cfd4p8l6x2kzszpjkj5w72',
      icon: Bitcoin,
      color: 'text-warning'
    },
    ethereum: {
      name: 'Ethereum',
      address: '0x742d35Cc6448C12345b6789abCdEF0123456789A',
      icon: CreditCard,
      color: 'text-primary'
    },
    bank: {
      name: 'Bank Transfer',
      address: 'Bank: Chase | Account: 1234567890 | Routing: 021000021',
      icon: Banknote,
      color: 'text-success'
    }
  };

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    toast({
      title: "Address Copied",
      description: "Deposit address copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitDeposit = async () => {
    if (!amount || !screenshot) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (parseFloat(amount) < 100) {
      toast({
        title: "Minimum Deposit",
        description: "Minimum deposit amount is $100",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Upload screenshot to storage
      const fileExt = screenshot.name.split('.').pop();
      const fileName = `${user?.id}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('kyc-documents')
        .upload(`deposits/${fileName}`, screenshot);

      if (uploadError) throw uploadError;

      // Create deposit record
      const { error: insertError } = await supabase
        .from('deposits')
        .insert({
          user_id: user?.id,
          amount: parseFloat(amount),
          currency: 'USD',
          screenshot_url: `deposits/${fileName}`,
          deposit_address: depositMethods[selectedMethod as keyof typeof depositMethods].address,
          status: 'pending'
        });

      if (insertError) throw insertError;

      toast({
        title: "Deposit Submitted",
        description: "Your deposit request has been submitted for review. You'll be notified once approved.",
      });

      // Reset form
      setAmount('');
      setScreenshot(null);
      
      // Navigate back to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error: any) {
      console.error('Error submitting deposit:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit deposit request. Please try again.",
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
              <h1 className="text-2xl font-bold">Deposit Funds</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Deposit Methods */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Select Deposit Method
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(depositMethods).map(([key, method]) => {
                const IconComponent = method.icon;
                return (
                  <div
                    key={key}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedMethod === key 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedMethod(key)}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent className={`h-6 w-6 ${method.color}`} />
                      <div className="flex-1">
                        <h3 className="font-semibold">{method.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {key === 'bank' ? 'Traditional banking' : 'Cryptocurrency'}
                        </p>
                      </div>
                      {selectedMethod === key && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Deposit Form */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Deposit Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Deposit Address */}
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">
                    {depositMethods[selectedMethod as keyof typeof depositMethods].name} Address
                  </h3>
                  <Badge variant="secondary">Active</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <code className="bg-secondary/50 p-2 rounded text-sm block flex-1 break-all">
                    {depositMethods[selectedMethod as keyof typeof depositMethods].address}
                  </code>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleCopyAddress(depositMethods[selectedMethod as keyof typeof depositMethods].address)}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Send funds to this address and upload payment proof below
                </p>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="amount">Deposit Amount (USD)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Minimum: $100"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="100"
                  step="0.01"
                />
                <p className="text-sm text-muted-foreground">
                  Minimum deposit: $100 • Maximum: $50,000
                </p>
              </div>

              {/* Screenshot Upload */}
              <div className="space-y-2">
                <Label htmlFor="screenshot">Payment Screenshot/Receipt</Label>
                <Input
                  id="screenshot"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                />
                <p className="text-sm text-muted-foreground">
                  Upload a clear screenshot of your payment confirmation
                </p>
              </div>

              {/* Submit Button */}
              <Button 
                onClick={handleSubmitDeposit}
                disabled={loading || !amount || !screenshot}
                className="w-full glow-button"
                variant="hero"
              >
                {loading ? (
                  "Submitting..."
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Submit Deposit Request
                  </>
                )}
              </Button>

              {/* Important Notes */}
              <div className="space-y-2 text-sm text-muted-foreground">
                <h4 className="font-semibold text-foreground">Important Notes:</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Deposits are manually reviewed within 24 hours</li>
                  <li>Only send funds from your own verified account</li>
                  <li>Include transaction hash if available</li>
                  <li>Contact support if you have any issues</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Deposit;