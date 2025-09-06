import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TradingViewWidget } from './TradingView';
import { LoadingSpinner } from './LoadingSpinner';
import { cryptoApi, type CryptoPriceData, type WebSocketPriceUpdate } from '@/services/cryptoApi';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { TrendingUp, TrendingDown, Copy, Zap, Target, Activity, Clock, DollarSign } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CryptoTradingInterfaceProps {
  balance: number;
}

interface TradingPair {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
}

export const CryptoTradingInterface = ({ balance }: CryptoTradingInterfaceProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('spot');
  const [orderType, setOrderType] = useState('market');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [selectedPair, setSelectedPair] = useState('BTC/USDT');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [leverage, setLeverage] = useState('1');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [tradingPairs, setTradingPairs] = useState<TradingPair[]>([]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [recentTrades, setRecentTrades] = useState<any[]>([]);

  useEffect(() => {
    fetchTradingPairs();
    fetchRecentTrades();
  }, []);

  useEffect(() => {
    // Subscribe to real-time price updates for selected pair
    const symbol = selectedPair.split('/')[0].toLowerCase();
    const unsubscribe = cryptoApi.subscribeToPrice(symbol, (update: WebSocketPriceUpdate) => {
      if (update.symbol === symbol.toUpperCase()) {
        setCurrentPrice(update.price);
        
        // Update trading pairs with new price
        setTradingPairs(prev => prev.map(pair => 
          pair.symbol === selectedPair 
            ? { ...pair, price: update.price, change24h: update.change24h }
            : pair
        ));
      }
    });

    return () => unsubscribe();
  }, [selectedPair]);

  const fetchTradingPairs = async () => {
    try {
      const cryptoData = await cryptoApi.getTrendingCoins(10);
      const pairs: TradingPair[] = cryptoData.map(crypto => ({
        symbol: `${crypto.symbol}/USDT`,
        name: crypto.name,
        price: crypto.current_price,
        change24h: crypto.price_change_percentage_24h
      }));
      
      setTradingPairs(pairs);
      
      // Set initial price for selected pair
      const currentPair = pairs.find(pair => pair.symbol === selectedPair);
      if (currentPair) {
        setCurrentPrice(currentPair.price);
      }
    } catch (error) {
      console.error('Error fetching trading pairs:', error);
    }
  };

  const fetchRecentTrades = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentTrades(data || []);
    } catch (error) {
      console.error('Error fetching recent trades:', error);
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
        description: "You don't have enough balance for this trade",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Create trade record in database
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
          trade_type: activeTab,
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
          // Update balance if buy order
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
            title: "Trade Executed Successfully!",
            description: `${side.toUpperCase()} order for ${amount} ${selectedPair.split('/')[0]} executed at $${tradePrice.toLocaleString()}`,
          });
          
          // Refresh recent trades
          fetchRecentTrades();
          
          // Reset form
          setAmount('');
          setPrice('');
        }
        
        setIsLoading(false);
      }, 2000);
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

  const copyTraders = [
    { name: "CryptoPro", roi: "+234%", followers: "12.5K", winRate: "89%", riskLevel: "Medium" },
    { name: "DeFiMaster", roi: "+189%", followers: "8.2K", winRate: "76%", riskLevel: "High" },
    { name: "SafeTrader", roi: "+123%", followers: "15.1K", winRate: "92%", riskLevel: "Low" },
    { name: "DegenKing", roi: "+567%", followers: "5.4K", winRate: "65%", riskLevel: "Extreme" }
  ];

  return (
    <div className="space-y-6">
      {/* Trading Pair Selector & Current Price */}
      <Card className="trading-card">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Select value={selectedPair} onValueChange={setSelectedPair}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tradingPairs.map((pair) => (
                    <SelectItem key={pair.symbol} value={pair.symbol}>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{pair.symbol}</span>
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
                {tradingPairs.find(p => p.symbol === selectedPair) && (
                  <div className={`text-sm ${
                    (tradingPairs.find(p => p.symbol === selectedPair)?.change24h || 0) >= 0 
                      ? 'text-success' 
                      : 'text-destructive'
                  }`}>
                    {(tradingPairs.find(p => p.symbol === selectedPair)?.change24h || 0) >= 0 ? '+' : ''}
                    {(tradingPairs.find(p => p.symbol === selectedPair)?.change24h || 0).toFixed(2)}%
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TradingView Chart */}
      <Card className="trading-card">
        <CardHeader>
          <CardTitle className="text-xl">Price Chart - {selectedPair}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <TradingViewWidget 
              symbol={`BINANCE:${selectedPair.replace('/', '')}`} 
              height={400} 
            />
          </div>
        </CardContent>
      </Card>

      {/* Trading Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="spot">Spot</TabsTrigger>
          <TabsTrigger value="futures">
            <Target className="w-4 h-4 mr-2" />
            Futures
          </TabsTrigger>
          <TabsTrigger value="copy">
            <Copy className="w-4 h-4 mr-2" />
            Copy Trade
          </TabsTrigger>
          <TabsTrigger value="degen">
            <Zap className="w-4 h-4 mr-2" />
            Degen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="spot" className="space-y-4">
          <Card className="trading-card">
            <CardHeader>
              <CardTitle>Spot Trading</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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

              <div className="space-y-2">
                <Label>Order Type</Label>
                <Select value={orderType} onValueChange={setOrderType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="market">Market</SelectItem>
                    <SelectItem value="limit">Limit</SelectItem>
                    <SelectItem value="stop">Stop Loss</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {orderType === 'limit' && (
                <div className="space-y-2">
                  <Label>Price (USDT)</Label>
                  <Input
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    type="number"
                    step="0.00000001"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Amount ({selectedPair.split('/')[0]})</Label>
                <Input
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  type="number"
                  step="0.00000001"
                />
              </div>

              <div className="space-y-2">
                <Label>Total (USDT)</Label>
                <div className="text-lg font-semibold p-3 bg-muted rounded-lg">
                  {amount && currentPrice 
                    ? `$${(parseFloat(amount) * (orderType === 'limit' && price ? parseFloat(price) : currentPrice)).toLocaleString()}`
                    : '$0.00'
                  }
                </div>
              </div>

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
        </TabsContent>

        <TabsContent value="futures" className="space-y-4">
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Futures Trading
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Leverage</Label>
                  <Select value={leverage} onValueChange={setLeverage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1x</SelectItem>
                      <SelectItem value="2">2x</SelectItem>
                      <SelectItem value="5">5x</SelectItem>
                      <SelectItem value="10">10x</SelectItem>
                      <SelectItem value="25">25x</SelectItem>
                      <SelectItem value="50">50x</SelectItem>
                      <SelectItem value="100">100x</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Position Size</Label>
                  <Input
                    placeholder="0.00 USDT"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    type="number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Stop Loss</Label>
                  <Input
                    placeholder="Optional"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    type="number"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Take Profit</Label>
                  <Input
                    placeholder="Optional"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(e.target.value)}
                    type="number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button variant="success" className="w-full" onClick={() => {setSide('buy'); handleTrade();}}>
                  Long
                </Button>
                <Button variant="danger" className="w-full" onClick={() => {setSide('sell'); handleTrade();}}>
                  Short
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="copy" className="space-y-4">
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Copy className="w-5 h-5" />
                Copy Trading
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {copyTraders.map((trader, index) => (
                  <div key={index} className="border border-border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{trader.name}</h4>
                        <p className="text-sm text-muted-foreground">{trader.followers} followers</p>
                      </div>
                      <Badge variant={
                        trader.riskLevel === 'Low' ? 'secondary' :
                        trader.riskLevel === 'Medium' ? 'default' :
                        trader.riskLevel === 'High' ? 'destructive' : 'destructive'
                      }>
                        {trader.riskLevel}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">ROI:</span>
                        <span className="ml-2 text-success font-semibold">{trader.roi}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Win Rate:</span>
                        <span className="ml-2 font-semibold">{trader.winRate}</span>
                      </div>
                    </div>
                    
                    <Button variant="outline" size="sm" className="w-full">
                      Copy Trader
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="degen" className="space-y-4">
          <Card className="trading-card border-warning">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning">
                <Zap className="w-5 h-5" />
                Degen Trading
                <Badge variant="destructive">High Risk</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border border-warning/20 bg-warning/5 rounded-lg">
                <p className="text-sm text-warning-foreground">
                  ⚠️ Warning: Degen trading involves extremely high risk. You can lose your entire balance.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Leverage (Up to 125x)</Label>
                <Select value={leverage} onValueChange={setLeverage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50x</SelectItem>
                    <SelectItem value="75">75x</SelectItem>
                    <SelectItem value="100">100x</SelectItem>
                    <SelectItem value="125">125x ⚠️</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Risk Amount (USDT)</Label>
                <Input
                  placeholder="How much are you willing to lose?"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  type="number"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="success" 
                  className="w-full animate-pulse-glow"
                  onClick={() => {setSide('buy'); handleTrade();}}
                >
                  YOLO Long 🚀
                </Button>
                <Button 
                  variant="danger" 
                  className="w-full animate-pulse-glow"
                  onClick={() => {setSide('sell'); handleTrade();}}
                >
                  YOLO Short 📉
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Trades Panel */}
      <Card className="trading-card mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Trades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTrades.map((trade) => (
              <div key={trade.id} className="glass-panel p-3 animate-fade-in">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Badge variant={trade.side === 'buy' ? 'default' : 'destructive'}>
                      {trade.side.toUpperCase()}
                    </Badge>
                    <span className="font-medium">{trade.trading_pair}</span>
                    <span className="text-sm text-muted-foreground">
                      {trade.amount} @ ${trade.price?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {new Date(trade.created_at).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            {recentTrades.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No trades yet. Start trading to see your activity here.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};