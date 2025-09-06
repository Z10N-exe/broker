import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Copy, 
  QrCode, 
  CheckCircle,
  AlertCircle,
  Wallet
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const MobileDepositPage = () => {
  const [selectedMethod, setSelectedMethod] = useState('bitcoin');
  const [amount, setAmount] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);

  const depositMethods = [
    {
      id: 'bitcoin',
      name: 'Bitcoin',
      symbol: 'BTC',
      address: 'bc1qzn2g79aqkdefkfr9cfd4p8l6x2kzszpjkj5w72',
      minDeposit: 50,
      icon: '₿'
    },
    {
      id: 'ethereum',
      name: 'Ethereum',
      symbol: 'ETH',
      address: '0x742d35Cc6634C0532925a3b8D46fdAbD5e3A6f2d',
      minDeposit: 30,
      icon: 'Ξ'
    },
    {
      id: 'usdt',
      name: 'Tether USDT',
      symbol: 'USDT',
      address: 'TKzxdSv2FZKQrEqkKVgp5DcwEXBEKMg2Ax',
      minDeposit: 20,
      icon: '₮'
    }
  ];

  const selectedCrypto = depositMethods.find(m => m.id === selectedMethod);

  const copyAddress = () => {
    if (selectedCrypto) {
      navigator.clipboard.writeText(selectedCrypto.address);
      toast({
        title: "Address Copied!",
        description: "Deposit address copied to clipboard",
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshot(file);
      toast({
        title: "Screenshot Uploaded",
        description: "Payment proof uploaded successfully",
      });
    }
  };

  const handleSubmit = () => {
    if (!amount || !screenshot) {
      toast({
        title: "Missing Information",
        description: "Please enter amount and upload payment proof",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Deposit Request Submitted",
      description: "Your deposit will be processed within 24 hours",
    });
  };

  return (
    <div className="max-w-md mx-auto space-y-4 pb-20">
      {/* Deposit Methods */}
      <Card className="trading-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Choose Deposit Method
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {depositMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              className={`w-full p-3 rounded-lg border transition-all ${
                selectedMethod === method.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-muted-foreground'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{method.icon}</span>
                  <div className="text-left">
                    <p className="font-semibold">{method.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Min: ${method.minDeposit}
                    </p>
                  </div>
                </div>
                <Badge variant={selectedMethod === method.id ? "default" : "secondary"}>
                  {method.symbol}
                </Badge>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Deposit Address */}
      <Card className="trading-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <QrCode className="h-5 w-5 text-accent" />
            {selectedCrypto?.name} Address
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Deposit Address</span>
              <Button variant="ghost" size="sm" onClick={copyAddress}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <code className="text-sm bg-secondary/50 p-2 rounded block break-all">
              {selectedCrypto?.address}
            </code>
          </div>
          
          <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
            <div className="text-sm text-warning-foreground">
              <p className="font-medium mb-1">Important Notice:</p>
              <ul className="space-y-1 text-xs">
                <li>• Send only {selectedCrypto?.symbol} to this address</li>
                <li>• Minimum deposit: ${selectedCrypto?.minDeposit}</li>
                <li>• Deposits require 3 confirmations</li>
                <li>• Upload payment proof after sending</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deposit Form */}
      <Card className="trading-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload className="h-5 w-5 text-success" />
            Submit Deposit Proof
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="amount" className="text-sm font-medium">
              Deposit Amount (USD)
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1"
              min={selectedCrypto?.minDeposit}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Minimum: ${selectedCrypto?.minDeposit}
            </p>
          </div>

          <div>
            <Label htmlFor="screenshot" className="text-sm font-medium">
              Payment Screenshot
            </Label>
            <div className="mt-1">
              <input
                id="screenshot"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                className="w-full border-dashed"
                onClick={() => document.getElementById('screenshot')?.click()}
              >
                {screenshot ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    Screenshot Uploaded
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Upload Payment Proof
                  </div>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Upload screenshot showing your payment transaction
            </p>
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-success to-success/80 hover:from-success/90 hover:to-success/70"
            size="lg"
          >
            Submit Deposit Request
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileDepositPage;