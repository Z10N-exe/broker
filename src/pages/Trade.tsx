import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { TradingInterface } from '@/components/TradingInterface';
import { TradingViewWidget } from '@/components/TradingView';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown,
  Activity,
  DollarSign,
  AlertTriangle
} from 'lucide-react';

interface Balance {
  balance: number;
}

interface Trade {
  id: string;
  trading_pair: string;
  side: string;
  amount: number;
  price: number;
  total?: number;
  status: string;
  created_at: string;
}

const Trade = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [balance, setBalance] = useState<Balance | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserData();
      fetchTrades();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      const { data, error } = await supabase
        .from('balances')
        .select('balance')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (!data) {
        // Create initial balance record
        const { data: newBalance, error: insertError } = await supabase
          .from('balances')
          .insert({
            user_id: user?.id,
            balance: 0,
            currency: 'USD'
          })
          .select('balance')
          .single();
          
        if (insertError) throw insertError;
        setBalance(newBalance);
      } else {
        setBalance(data);
      }
    } catch (error: any) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Error",
        description: "Failed to load account data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTrades = async () => {
    try {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setTrades(data || []);
    } catch (error: any) {
      console.error('Error fetching trades:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              <h1 className="text-2xl font-bold">Trading Platform</h1>
              {balance && balance.balance === 0 && (
                <Badge variant="destructive">Deposit Required to Trade</Badge>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="text-lg font-bold">${balance?.balance?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!balance || balance.balance === 0 ? (
          /* Deposit Required Notice */
          <Card className="trading-card mb-8">
            <CardContent className="text-center py-12">
              <AlertTriangle className="h-16 w-16 text-warning mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Trading Disabled</h2>
              <p className="text-muted-foreground mb-6">
                You need to make a minimum deposit to start trading. Once approved, you'll have access to all trading features.
              </p>
              <Button 
                onClick={() => navigate('/deposit')}
                variant="hero"
                className="glow-button"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Make a Deposit
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Trading Interface */
          <div className="space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="trading-card">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <DollarSign className="h-8 w-8 text-success" />
                    <div>
                      <p className="text-sm text-muted-foreground">Portfolio Value</p>
                      <p className="text-2xl font-bold">${balance.balance.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="trading-card">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Activity className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Trades</p>
                      <p className="text-2xl font-bold">{trades.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="trading-card">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <TrendingUp className="h-8 w-8 text-accent" />
                    <div>
                      <p className="text-sm text-muted-foreground">Win Rate</p>
                      <p className="text-2xl font-bold">
                        {trades.length > 0 ? 
                          ((trades.filter(t => t.status === 'executed').length / trades.length) * 100).toFixed(1) 
                          : '0.0'
                        }%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Trading Interface */}
            <TradingInterface 
              balance={balance.balance} 
              onTradeExecuted={() => {
                fetchUserData();
                fetchTrades();
              }}
            />
          </div>
        )}

        {/* Trading History */}
        {trades.length > 0 && (
          <Card className="trading-card mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Trading History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trades.map((trade) => (
                  <div key={trade.id} className="flex justify-between items-center p-4 border border-border rounded-lg glass-panel">
                    <div className="flex items-center gap-4">
                      <Badge variant={trade.side === 'buy' ? 'default' : 'destructive'}>
                        {trade.side === 'buy' ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {trade.side.toUpperCase()}
                      </Badge>
                      <div>
                        <p className="font-semibold">{trade.trading_pair}</p>
                        <p className="text-sm text-muted-foreground">
                          {trade.amount} @ ${trade.price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${trade.total?.toLocaleString()}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          trade.status === 'executed' ? 'default' : 
                          trade.status === 'pending' ? 'secondary' : 'destructive'
                        }>
                          {trade.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(trade.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Trade;