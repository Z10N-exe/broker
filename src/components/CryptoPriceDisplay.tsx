import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { cryptoApi, type CryptoPriceData, type WebSocketPriceUpdate } from '@/services/cryptoApi';
import { LoadingSpinner } from './LoadingSpinner';

interface CryptoPriceDisplayProps {
  symbol?: string;
  showChart?: boolean;
  compact?: boolean;
}

export const CryptoPriceDisplay = ({ 
  symbol = 'bitcoin', 
  showChart = false,
  compact = false 
}: CryptoPriceDisplayProps) => {
  const [priceData, setPriceData] = useState<CryptoPriceData | null>(null);
  const [realtimePrice, setRealtimePrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | 'neutral'>('neutral');

  useEffect(() => {
    // Fetch initial price data
    const fetchInitialData = async () => {
      try {
        const data = await cryptoApi.getCurrentPrices([symbol]);
        if (data.length > 0) {
          setPriceData(data[0]);
          setRealtimePrice(data[0].current_price);
        }
      } catch (error) {
        console.error('Error fetching initial price data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();

    // Subscribe to real-time updates
    const unsubscribe = cryptoApi.subscribeToPrice(symbol, (update: WebSocketPriceUpdate) => {
      if (update.symbol.toLowerCase() === symbol.toLowerCase()) {
        const previousPrice = realtimePrice || priceData?.current_price || 0;
        
        // Determine price direction
        if (update.price > previousPrice) {
          setPriceDirection('up');
        } else if (update.price < previousPrice) {
          setPriceDirection('down');
        }
        
        setRealtimePrice(update.price);
        
        // Update price data with new values
        if (priceData) {
          setPriceData(prev => prev ? {
            ...prev,
            current_price: update.price,
            price_change_24h: update.change24h,
            price_change_percentage_24h: update.change24h,
            last_updated: new Date().toISOString()
          } : null);
        }

        // Reset direction after animation
        setTimeout(() => setPriceDirection('neutral'), 1000);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [symbol, realtimePrice, priceData]);

  if (loading) {
    return (
      <Card className="trading-card">
        <CardContent className="flex items-center justify-center p-6">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  if (!priceData) {
    return (
      <Card className="trading-card">
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">Failed to load price data</p>
        </CardContent>
      </Card>
    );
  }

  const currentPrice = realtimePrice || priceData.current_price;
  const isPositive = priceData.price_change_percentage_24h >= 0;
  
  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <span className="font-semibold">{priceData.symbol}</span>
          </div>
        </div>
        
        <div className="text-right">
          <div className={`font-semibold transition-colors duration-300 ${
            priceDirection === 'up' ? 'text-success animate-pulse' :
            priceDirection === 'down' ? 'text-destructive animate-pulse' :
            'text-foreground'
          }`}>
            ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className={`text-sm ${isPositive ? 'text-success' : 'text-destructive'}`}>
            {isPositive ? '+' : ''}{priceData.price_change_percentage_24h.toFixed(2)}%
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="trading-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <span>{priceData.name}</span>
            <Badge variant="outline">{priceData.symbol}</Badge>
          </div>
          <div className="flex items-center gap-1 text-sm">
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-success" />
            ) : (
              <TrendingDown className="w-4 h-4 text-destructive" />
            )}
            <span className={isPositive ? 'text-success' : 'text-destructive'}>
              {isPositive ? '+' : ''}{priceData.price_change_percentage_24h.toFixed(2)}%
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className={`text-3xl font-bold transition-all duration-300 ${
            priceDirection === 'up' ? 'text-success animate-pulse scale-105' :
            priceDirection === 'down' ? 'text-destructive animate-pulse scale-105' :
            'text-foreground'
          }`}>
            ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
          </div>
          
          <div className={`text-sm ${isPositive ? 'text-success' : 'text-destructive'}`}>
            {isPositive ? '+' : ''}${Math.abs(priceData.price_change_24h).toLocaleString(undefined, { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            })} (24h)
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="text-muted-foreground">Market Cap</div>
            <div className="font-semibold">
              ${(priceData.market_cap / 1e9).toFixed(2)}B
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-muted-foreground">24h Volume</div>
            <div className="font-semibold">
              ${(priceData.volume_24h / 1e9).toFixed(2)}B
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Last updated: {new Date(priceData.last_updated).toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
};

export const CryptoPriceGrid = () => {
  const [cryptoData, setCryptoData] = useState<CryptoPriceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrendingCoins = async () => {
      try {
        const data = await cryptoApi.getTrendingCoins(8);
        setCryptoData(data);
      } catch (error) {
        console.error('Error fetching trending coins:', error);
        // Use fallback data if API fails
        setCryptoData([
          { symbol: 'BTC', name: 'Bitcoin', current_price: 65000, price_change_percentage_24h: 2.5, market_cap: 1200000000000, volume_24h: 25000000000, last_updated: new Date().toISOString(), price_change_24h: 1500 },
          { symbol: 'ETH', name: 'Ethereum', current_price: 3200, price_change_percentage_24h: -1.2, market_cap: 400000000000, volume_24h: 15000000000, last_updated: new Date().toISOString(), price_change_24h: -40 }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingCoins();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchTrendingCoins, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className="trading-card">
        <CardHeader>
          <CardTitle>Market Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <LoadingSpinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="trading-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Market Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {cryptoData.map((crypto, index) => (
            <CryptoPriceDisplay 
              key={crypto.symbol + index}
              symbol={crypto.symbol.toLowerCase()}
              compact={true}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};