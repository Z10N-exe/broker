import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Gift,
  Users,
  Download,
  Bitcoin
} from 'lucide-react';
import axios from 'axios';

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

interface CryptoData {
  price: number;
  priceChange24h: number;
  lastUpdated: string;
}

interface TradeData {
  timestamp: string;
  price: number;
}

interface MobileBalanceCardProps {
  balance: Balance | null;
  userName: string;
}

const MobileBalanceCard = ({ balance, userName }: MobileBalanceCardProps) => {
  const [cryptoData, setCryptoData] = useState<CryptoData | null>(null);
  const [tradeData, setTradeData] = useState<TradeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const LIVECOINWATCH_API_KEY = 'f89f3c7d-6b44-4ef3-880c-237d4565f97f'; // Your API key

  const fetchCryptoData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch current price
      const priceResponse = await axios.post(
        'https://api.livecoinwatch.com/coins/single',
        {
          currency: 'USD',
          code: 'BTC',
          meta: false, // Set to true if you need additional metadata
        },
        {
          headers: {
            'content-type': 'application/json',
            'x-api-key': LIVECOINWATCH_API_KEY,
          },
        }
      );

      const priceData = priceResponse.data;
      if (!priceData || !priceData.rate) {
        throw new Error('Invalid price data from Live Coin Watch');
      }

      setCryptoData({
        price: priceData.rate,
        priceChange24h: priceData.delta?.day ? (priceData.delta.day - 1) * 100 : 0, // Convert to percentage
        lastUpdated: new Date().toLocaleString(), // Live Coin Watch doesn't provide last_updated_at
      });

      // Fetch historical data for chart (last 24 hours, hourly)
      const startTime = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago
      const endTime = Date.now();
      const tradeResponse = await axios.post(
        'https://api.livecoinwatch.com/coins/single/history',
        {
          currency: 'USD',
          code: 'BTC',
          start: startTime,
          end: endTime,
        },
        {
          headers: {
            'content-type': 'application/json',
            'x-api-key': LIVECOINWATCH_API_KEY,
          },
        }
      );

      if (!tradeResponse.data.history || !Array.isArray(tradeResponse.data.history)) {
        throw new Error('Invalid historical data from Live Coin Watch');
      }

      const trades = tradeResponse.data.history.slice(-5).map((point: any) => ({
        timestamp: new Date(point.date).toLocaleTimeString(),
        price: point.rate,
      }));
      setTradeData(trades);

      setLoading(false);
    } catch (err) {
      console.error('Error fetching crypto data:', err.response || err.message);
      setError('Failed to fetch crypto data from Live Coin Watch. Please try again.');
      setCryptoData({
        price: 0,
        priceChange24h: 0,
        lastUpdated: new Date().toLocaleString(),
      });
      setTradeData([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCryptoData();
    const interval = setInterval(fetchCryptoData, 120000); // Update every 2 minutes
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      {/* Welcome Section */}
      <Card className="bg-gradient-to-r from-primary/20 to-accent/20 border-primary/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-foreground">
              Welcome to Aspire Secure Trade
            </h2>
            <button className="text-muted-foreground hover:text-foreground">
              ✕
            </button>
          </div>
          <p className="text-accent font-medium mb-2">Hello, {userName}!</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Account Summary</span>
              {!balance?.minimum_deposit_met && (
                <Badge variant="destructive" className="text-xs"></Badge>
              )}
            </div>
            <p className="text-3xl font-bold text-success">
              $6820.00
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Locked Balance</span>
            </div>
            <p className="text-2xl font-semibold text-warning">
              ${balance?.locked_balance?.toFixed(2) || '0.00'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Live Crypto Price Card */}
      <Card className="trading-card p-4">
        <div className="flex items-center gap-2 mb-2">
          <Bitcoin className="h-4 w-4 text-primary" />
          <span className="text-sm text-muted-foreground">Bitcoin (BTC) Price</span>
        </div>
        {loading ? (
          <p className="text-xl font-bold text-muted-foreground">Loading...</p>
        ) : error ? (
          <div className="text-sm text-destructive">
            {error}
            <button
              onClick={fetchCryptoData}
              className="ml-2 text-primary underline"
            >
              Retry
            </button>
          </div>
        ) : (
          <div>
            <p className="text-xl font-bold text-primary">
              ${cryptoData?.price.toFixed(2) || 'N/A'}
            </p>
            <p className={`text-sm ${cryptoData?.priceChange24h >= 0 ? 'text-success' : 'text-destructive'}`}>
              24h: {cryptoData?.priceChange24h.toFixed(2) || '0.00'}%
              {cryptoData?.priceChange24h >= 0 ? (
                <TrendingUp className="inline h-4 w-4 ml-1" />
              ) : (
                <TrendingDown className="inline h-4 w-4 ml-1" />
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              Last updated: {cryptoData?.lastUpdated || 'N/A'}
            </p>
          </div>
        )}
      </Card>

      {/* Recent Trades Card */}
      <Card className="trading-card p-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-sm text-muted-foreground">Recent BTC Trades</span>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading trades...</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : tradeData.length > 0 ? (
          <ul className="space-y-1">
            {tradeData.map((trade, index) => (
              <li key={index} className="text-sm text-foreground">
                {trade.timestamp}: ${trade.price.toFixed(2)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No trade data available</p>
        )}
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="trading-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-success" />
            <span className="text-sm text-muted-foreground">Total Profit</span>
          </div>
          <p className="text-xl font-bold text-success">$6800.00</p>
        </Card>

        <Card className="trading-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="h-4 w-4 text-accent" />
            <span className="text-sm text-muted-foreground">Bonus</span>
          </div>
          <p className="text-xl font-bold text-accent">$20.00</p>
        </Card>

        <Card className="trading-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Referral Bonus</span>
          </div>
          <p className="text-xl font-bold text-primary">$0.00</p>
        </Card>

        <Card className="trading-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Download className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Withdraw</span>
          </div>
          <p className="text-xl font-bold text-muted-foreground">$0.00</p>
        </Card>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-secondary/50 h-1 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
          style={{ 
            width: balance?.minimum_deposit_met ? '100%' : '10%' 
          }}
        />
      </div>
    </div>
  );
};

export default MobileBalanceCard;