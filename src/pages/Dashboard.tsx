import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { EnhancedStatsCard } from '@/components/EnhancedStatsCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import MobileBottomNav from '@/components/MobileBottomNav';
import MobileBalanceCard from '@/components/MobileBalanceCard';
import MobileDepositPage from '@/components/MobileDepositPage';
import { CryptoPriceDisplay, CryptoPriceGrid } from '@/components/CryptoPriceDisplay';
import { ReferralSystem } from '@/components/ReferralSystem';
import { TradingViewMiniWidget } from '@/components/TradingView';
import { 
  LogOut, 
  Upload, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Plus,
  Bell,
  Settings,
  Home,
  BarChart3,
  User,
  DollarSign,
  RefreshCw,
  Download,
  Menu,
  History,
  Activity,
  Target,
  CreditCard,
  ArrowDownLeft,
  Shield,
  Clock,
  Users,
  Share2,
  ArrowLeft
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useIsMobile } from '@/hooks/use-mobile';

interface Balance {
  id: string;
  balance: number;
  daily_profit_loss: number;
  profit_loss_percentage: number;
  currency: string;
  minimum_deposit_met: boolean;
  total_deposited: number;
  locked_balance: number;
  updated_at: string;
  last_update_date: string;
  user_id: string;
}

interface CryptoPrice {
  symbol: string;
  name: string;
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  id: string;
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

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [balance, setBalance] = useState<Balance | null>(null);
  const [cryptoPrices, setCryptoPrices] = useState<CryptoPrice[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const isMobile = useIsMobile();
  
  // Get the current tab from URL parameters
  const currentTab = searchParams.get('tab') || 'overview';

  useEffect(() => {
    if (user) {
      fetchUserData();
      fetchCryptoPrices();
      fetchTrades();
      
      // Set up real-time subscriptions for user data
      const balanceChannel = supabase
        .channel('user-balance-updates')
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'balances',
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchUserData();
        })
        .subscribe();

      const tradesChannel = supabase
        .channel('user-trades-updates')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'trades',
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchTrades();
        })
        .subscribe();

      // Auto-refresh crypto prices every 30 seconds
      const priceInterval = setInterval(fetchCryptoPrices, 30000);

      return () => {
        supabase.removeChannel(balanceChannel);
        supabase.removeChannel(tradesChannel);
        clearInterval(priceInterval);
      };
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      const { data, error } = await supabase
        .from('balances')
        .select('*')
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
            currency: 'USD',
            minimum_deposit_met: false,
            total_deposited: 0
          })
          .select()
          .single();
          
        if (insertError) throw insertError;
        setBalance(newBalance as Balance);
      } else {
        setBalance(data as Balance);
      }
    } catch (error: any) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Error",
        description: "Failed to load account data",
        variant: "destructive"
      });
    }
  };

  const fetchTrades = async () => {
    try {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTrades(data || []);
    } catch (error: any) {
      console.error('Error fetching trades:', error);
    }
  };

  const fetchCryptoPrices = async () => {
    try {
      const { data, error } = await supabase
        .from('crypto_prices')
        .select('*')
        .order('market_cap', { ascending: false })
        .limit(10);

      if (error) throw error;
      setCryptoPrices(data || []);
    } catch (error: any) {
      console.error('Error fetching crypto prices:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-20">
        {/* Mobile Header */}
        <header className="sticky top-0 bg-card/80 backdrop-blur-xl border-b border-border z-40">
          <div className="flex justify-between items-center h-16 px-4">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Aspire Secure Trade
              </h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" className="text-primary" onClick={() => navigate('/notifications')}>
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <User className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Mobile Content */}
        <div className="px-4 py-6">
          {currentTab === 'deposit' ? (
            <MobileDepositPage />
          ) : currentTab === 'withdraw' ? (
            <Card className="trading-card">
              <CardContent className="text-center py-12">
                <Download className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {!balance?.minimum_deposit_met 
                    ? "Make a deposit to enable withdrawals"
                    : "Withdrawal feature coming soon"
                  }
                </p>
                <Button variant="outline" className="mt-4" onClick={() => navigate('/withdraw')}>
                  Go to Withdraw Page
                </Button>
              </CardContent>
            </Card>
          ) : currentTab === 'history' ? (
            <Card className="trading-card">
              <CardContent className="text-center py-12">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No transaction history yet</p>
                <Button variant="outline" className="mt-4" onClick={() => navigate('/deposit')}>
                  Make Your First Deposit
                </Button>
              </CardContent>
            </Card>
          ) : currentTab === 'kyc' ? (
            <Card className="trading-card">
              <CardHeader>
                <CardTitle>Identity Verification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Upload ID Document</Label>
                  <Input type="file" accept="image/*" className="mt-2" />
                </div>
                <div>
                  <Label>Upload Selfie with ID</Label>
                  <Input type="file" accept="image/*" className="mt-2" />
                </div>
                <Button className="w-full bg-gradient-to-r from-primary to-accent" onClick={() => navigate('/kyc')}>
                  Go to Full KYC Page
                </Button>
              </CardContent>
            </Card>
          ) : (
            <MobileBalanceCard balance={balance} userName={user?.email?.split('@')[0] || 'User'} />
          )}
        </div>

        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Aspire Secure Trade
              </h1>
              {balance && !balance.minimum_deposit_met && (
                <Badge variant="destructive">Deposit Required</Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/notifications')}>
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
                <Settings className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Balance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="trading-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center">
                <Wallet className="h-4 w-4 mr-2" />
                Total Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">${balance?.balance?.toFixed(2) || '0.00'}</p>
              <p className="text-sm text-muted-foreground mt-1">{balance?.currency || 'USD'}</p>
            </CardContent>
          </Card>

          <Card className="trading-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center">
                {(balance?.daily_profit_loss || 0) >= 0 ? (
                  <TrendingUp className="h-4 w-4 mr-2 text-success" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-2 text-destructive" />
                )}
                24h P&L
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${(balance?.daily_profit_loss || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                ${balance?.daily_profit_loss?.toFixed(2) || '0.00'}
              </p>
              <p className={`text-sm mt-1 ${(balance?.profit_loss_percentage || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                {(balance?.profit_loss_percentage || 0) >= 0 ? '+' : ''}{balance?.profit_loss_percentage?.toFixed(2) || '0.00'}%
              </p>
            </CardContent>
          </Card>

          <Card className="trading-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                Total Deposited
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">${balance?.total_deposited?.toFixed(2) || '0.00'}</p>
              <p className="text-sm text-muted-foreground mt-1">Lifetime</p>
            </CardContent>
          </Card>

          <Card className="trading-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Account Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={balance?.minimum_deposit_met ? "default" : "destructive"} className="text-sm">
                {balance?.minimum_deposit_met ? "Active" : "Inactive"}
              </Badge>
              <p className="text-sm text-muted-foreground mt-2">
                {balance?.minimum_deposit_met 
                  ? "Trading enabled" 
                  : "Deposit required to trade"
                }
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Button variant="outline" onClick={() => navigate('/trade')}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Trade
          </Button>
          <Button variant="outline" onClick={() => navigate('/deposit')}>
            <Upload className="h-4 w-4 mr-2" />
            Deposit
          </Button>
          <Button variant="outline" onClick={() => navigate('/withdraw')}>
            <Download className="h-4 w-4 mr-2" />
            Withdraw
          </Button>
          <Button variant="outline" onClick={() => navigate('/kyc')}>
            <User className="h-4 w-4 mr-2" />
            KYC
          </Button>
        </div>

        {/* Recent Trades */}
        <Card className="trading-card">
          <CardHeader>
            <CardTitle>Recent Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trades.map((trade) => (
                <div key={trade.id} className="flex justify-between items-center p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Badge variant={trade.side === 'buy' ? "secondary" : "destructive"}>
                      {trade.side.toUpperCase()}
                    </Badge>
                    <div>
                      <p className="font-semibold">{trade.trading_pair}</p>
                      <p className="text-sm text-muted-foreground">
                        {trade.amount} @ ${trade.price}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${trade.total?.toLocaleString()}</p>
                    <Badge variant={
                      trade.status === 'executed' ? 'secondary' : 
                      trade.status === 'pending' ? 'default' : 'destructive'
                    }>
                      {trade.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {trades.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <p className="mb-4">No trades yet. Start trading to see your activity here.</p>
                  <Button variant="hero" onClick={() => navigate('/trade')}>
                    Start Trading
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;