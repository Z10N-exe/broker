import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from './LoadingSpinner';
import { cryptoApi, type CryptoPriceData } from '@/services/cryptoApi';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { TrendingUp, TrendingDown, Activity, Zap } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface TradingInterfaceProps {
  balance: number;
  onTradeExecuted?: () => void;
}

export const TradingInterface = ({ balance, onTradeExecuted }: TradingInterfaceProps) => {
  const { user } = useAuth();
  const [selectedPair, setSelectedPair] = useState('BTC/USDT');
  const [orderType, setOrderType] = useState('market');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cryptoData, setCryptoData] = useState<CryptoPriceData[]>([]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    loadCryptoData();
    
    // Set up real-time price updates
    const interval = setInterval(loadCryptoData, 10000); // Update every 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const baseCurrency = selectedPair.split('/')[0];
    const crypto = cryptoData.find(c => c.symbol === baseCurrency);
    if (crypto) {
      setCurrentPrice(crypto.current_price);
    }
  }, [selectedPair, cryptoData]);

  const loadCryptoData = async () => {
    try {
      const data = await cryptoApi.getTrendingCoins(10);
      setCryptoData(data);
      setDataLoading(false);
    } catch (error) {
      console.error('Error loading crypto data:', error);
      setDataLoading(false);
    }
  };

  const handleTrade = async () => {
    if (!amount || (orderType === 'limit' && !price)) {
      toast({
        title: "Invalid Order",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to place trades",
        variant: "destructive"
      });
      return;
    }

    const tradeAmount = parseFloat(amount);
    const tradePrice = orderType === 'limit' ? parseFloat(price) : currentPrice;
    const requiredBalance = tradeAmount * tradePrice;
    
    if (side === 'buy' && requiredBalance > balance) {
      toast({
        title: "Insufficient Balance", 
        description: `You need $${requiredBalance.toFixed(2)} but only have $${balance.toFixed(2)}`,
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Create trade record
      const { data: trade, error } = await supabase
        .from('trades')
        .insert({
          user_id: user.id,
          trading_pair: selectedPair,
          side,
          amount: tradeAmount,
          price: tradePrice,
          total: requiredBalance,
          order_type: orderType,
          trade_type: 'spot',
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Simulate trade execution
      setTimeout(async () => {
        const { error: updateError } = await supabase
          .from('trades')
          .update({ 
            status: 'executed',
            executed_at: new Date().toISOString()
          })
          .eq('id', trade.id);

        if (!updateError) {
          // Update user balance
          if (side === 'buy') {
            const { error: balanceError } = await supabase
              .from('balances')
              .update({ 
                balance: balance - requiredBalance
              })
              .eq('user_id', user.id);

            if (balanceError) {
              console.error('Error updating balance:', balanceError);
            }
          }

          toast({
            title: "Trade Executed!",
            description: `${side.toUpperCase()} ${amount} ${selectedPair.split('/')[0]} at $${tradePrice.toLocaleString()}`,
          });
          
          // Reset form
          setAmount('');
          setPrice('');
          
          // Notify parent component
          onTradeExecuted?.();
        }
        
        setIsLoading(false);
      }, 1500);
    } catch (error: any) {
      console.error('Error executing trade:', error);
      toast({
        title: "Trade Failed",
        description: error.message || "Failed to execute trade",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <Card className="trading-card">
        <CardContent className="flex items-center justify-center p-8">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  const tradingPairs = cryptoData.map(crypto => `${crypto.symbol}/USDT`);
  const currentCrypto = cryptoData.find(c => c.symbol === selectedPair.split('/')[0]);

  return (
    <div className="space-y-6">
      {/* Trading Pair Selector */}
      <Card className="trading-card">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Select value={selectedPair} onValueChange={setSelectedPair}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tradingPairs.map((pair) => (
                    <SelectItem key={pair} value={pair}>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{pair}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  ${currentPrice.toLocaleString(undefined, { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 6 
                  })}
                </div>
                {currentCrypto && (
                  <div className={`text-sm flex items-center gap-1 ${
                    currentCrypto.price_change_percentage_24h >= 0 
                      ? 'text-success' 
                      : 'text-destructive'
                  }`}>
                    {currentCrypto.price_change_percentage_24h >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {currentCrypto.price_change_percentage_24h >= 0 ? '+' : ''}
                    {currentCrypto.price_change_percentage_24h.toFixed(2)}%
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trading Form */}
      <Card className="trading-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Spot Trading
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Buy/Sell Toggle */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={side === 'buy' ? 'success' : 'outline'}
              onClick={() => setSide('buy')}
              className="flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              Buy
            </Button>
            <Button
              variant={side === 'sell' ? 'danger' : 'outline'}
              onClick={() => setSide('sell')}
              className="flex items-center gap-2"
            >
              <TrendingDown className="w-4 h-4" />
              Sell
            </Button>
          </div>

          {/* Order Type */}
          <div className="space-y-2">
            <Label>Order Type</Label>
            <Select value={orderType} onValueChange={setOrderType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="market">Market Order</SelectItem>
                <SelectItem value="limit">Limit Order</SelectItem>
                <SelectItem value="stop">Stop Loss</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Price Input (for limit orders) */}
          {orderType === 'limit' && (
            <div className="space-y-2">
              <Label>Price (USDT)</Label>
              <Input
                placeholder={currentPrice.toString()}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                type="number"
                step="0.00000001"
              />
            </div>
          )}

          {/* Amount Input */}
          <div className="space-y-2">
            <Label>Amount ({selectedPair.split('/')[0]})</Label>
            <Input
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              step="0.00000001"
            />
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setAmount(((balance * 0.25) / currentPrice).toFixed(8))}
              >
                25%
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setAmount(((balance * 0.5) / currentPrice).toFixed(8))}
              >
                50%
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setAmount(((balance * 0.75) / currentPrice).toFixed(8))}
              >
                75%
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setAmount(((balance * 1) / currentPrice).toFixed(8))}
              >
                100%
              </Button>
            </div>
          </div>

          {/* Total Display */}
          <div className="space-y-2">
            <Label>Total (USDT)</Label>
            <div className="text-lg font-semibold p-3 bg-muted rounded-lg">
              {amount && currentPrice 
                ? `$${(parseFloat(amount) * (orderType === 'limit' && price ? parseFloat(price) : currentPrice)).toLocaleString()}`
                : '$0.00'
              }
            </div>
          </div>

          {/* Trade Button */}
          <Button 
            onClick={handleTrade}
            variant={side === 'buy' ? 'success' : 'danger'}
            className="w-full glow-button"
            disabled={isLoading || !amount}
          >
            {isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                {side === 'buy' ? <TrendingUp className="w-4 h-4 mr-2" /> : <TrendingDown className="w-4 h-4 mr-2" />}
                {side === 'buy' ? `Buy ${selectedPair.split('/')[0]}` : `Sell ${selectedPair.split('/')[0]}`}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Market Data */}
      <Card className="trading-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Market Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cryptoData.slice(0, 6).map((crypto) => (
              <div
                key={crypto.symbol}
                className="p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setSelectedPair(`${crypto.symbol}/USDT`)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{crypto.symbol}</p>
                    <p className="text-sm text-muted-foreground">{crypto.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${crypto.current_price.toLocaleString()}</p>
                    <Badge variant={crypto.price_change_percentage_24h >= 0 ? 'default' : 'destructive'}>
                      {crypto.price_change_percentage_24h >= 0 ? '+' : ''}
                      {crypto.price_change_percentage_24h.toFixed(2)}%
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};