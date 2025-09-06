import { supabase } from '@/integrations/supabase/client';

// CryptoAPI Service for real-time crypto data
interface CryptoPriceData {
  id?: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap: number;
  volume_24h: number;
  last_updated: string;
  image?: string;
}

interface WebSocketPriceUpdate {
  symbol: string;
  price: number;
  change24h: number;
  volume: number;
  timestamp: number;
}

class CryptoApiService {
  private priceUpdateCallbacks: Map<string, Set<(data: WebSocketPriceUpdate) => void>> = new Map();
  private priceIntervals: Map<string, number> = new Map();
  private wsConnections: Map<string, any> = new Map();
  private lastPrices: Map<string, number> = new Map();

  // Fetch current crypto prices via edge function
  async getCurrentPrices(symbols: string[] = ['bitcoin', 'ethereum', 'binancecoin']): Promise<CryptoPriceData[]> {
    try {
      const { data, error } = await supabase.functions.invoke('get-crypto-prices', {
        body: { symbols }
      });

      if (error) throw error;
      return data || this.getMockPrices(symbols);
    } catch (error) {
      console.error('Error fetching crypto prices:', error);
      return this.getMockPrices(symbols);
    }
  }

  // Get trending cryptocurrencies
  async getTrendingCoins(limit: number = 10): Promise<CryptoPriceData[]> {
    try {
      const popularCoins = [
        'bitcoin', 'ethereum', 'binancecoin', 'cardano', 'solana', 
        'ripple', 'dogecoin', 'polygon', 'chainlink', 'litecoin'
      ];
      
      const { data, error } = await supabase.functions.invoke('get-crypto-prices', {
        body: { symbols: popularCoins.slice(0, limit) }
      });

      if (error) throw error;
      return data || this.getMockTrendingData();
    } catch (error) {
      console.error('Error fetching trending coins:', error);
      return this.getMockTrendingData();
    }
  }

  // Subscribe to real-time price updates (simulated WebSocket)
  subscribeToPrice(symbol: string, callback: (data: WebSocketPriceUpdate) => void): () => void {
    if (!this.priceUpdateCallbacks.has(symbol)) {
      this.priceUpdateCallbacks.set(symbol, new Set());
    }
    
    this.priceUpdateCallbacks.get(symbol)?.add(callback);
    
    // Start price simulation if not already running
    if (!this.wsConnections.has(symbol)) {
      this.startPriceSimulation(symbol);
    }

    // Return unsubscribe function
    return () => {
      this.priceUpdateCallbacks.get(symbol)?.delete(callback);
      if (this.priceUpdateCallbacks.get(symbol)?.size === 0) {
        this.stopPriceSimulation(symbol);
      }
    };
  }

  private startPriceSimulation(symbol: string) {
    let basePrice = this.getBasePriceForSymbol(symbol);
    
    const interval = setInterval(() => {
      // Simulate realistic price movements
      const volatility = Math.random() * 0.02 - 0.01; // -1% to +1% change
      const newPrice = basePrice * (1 + volatility);
      basePrice = newPrice;
      
      const priceUpdate: WebSocketPriceUpdate = {
        symbol: symbol.toUpperCase(),
        price: newPrice,
        change24h: volatility * 100,
        volume: Math.random() * 1000000000,
        timestamp: Date.now()
      };
      
      // Notify all subscribers
      this.priceUpdateCallbacks.get(symbol)?.forEach(callback => {
        callback(priceUpdate);
      });
    }, 2000); // Update every 2 seconds

    this.wsConnections.set(symbol, interval as any);
  }

  private stopPriceSimulation(symbol: string) {
    const interval = this.wsConnections.get(symbol);
    if (interval) {
      clearInterval(interval as any);
      this.wsConnections.delete(symbol);
    }
  }

  private getBasePriceForSymbol(symbol: string): number {
    const prices: Record<string, number> = {
      'bitcoin': 65000,
      'btc': 65000,
      'ethereum': 3200,
      'eth': 3200,
      'binancecoin': 590,
      'bnb': 590,
      'cardano': 0.45,
      'ada': 0.45,
      'solana': 180,
      'sol': 180,
      'xrp': 0.52,
      'dogecoin': 0.08,
      'doge': 0.08
    };
    
    return prices[symbol.toLowerCase()] || 1;
  }

  private getDisplayName(symbol: string): string {
    const names: Record<string, string> = {
      'bitcoin': 'Bitcoin',
      'ethereum': 'Ethereum',
      'binancecoin': 'BNB',
      'cardano': 'Cardano',
      'solana': 'Solana',
      'xrp': 'XRP',
      'dogecoin': 'Dogecoin'
    };
    
    return names[symbol] || symbol.charAt(0).toUpperCase() + symbol.slice(1);
  }

  private getMockPrices(symbols: string[]): CryptoPriceData[] {
    return symbols.map(symbol => ({
      symbol: symbol.toUpperCase(),
      name: this.getDisplayName(symbol),
      current_price: this.getBasePriceForSymbol(symbol) * (1 + (Math.random() * 0.1 - 0.05)),
      price_change_24h: Math.random() * 2000 - 1000,
      price_change_percentage_24h: Math.random() * 10 - 5,
      market_cap: Math.random() * 1000000000000,
      volume_24h: Math.random() * 10000000000,
      last_updated: new Date().toISOString()
    }));
  }

  private getMockTrendingData(): CryptoPriceData[] {
    const coins = ['bitcoin', 'ethereum', 'binancecoin', 'cardano', 'solana', 'xrp', 'dogecoin'];
    return this.getMockPrices(coins);
  }

  // Cleanup all connections
  cleanup() {
    this.wsConnections.forEach((interval, symbol) => {
      clearInterval(interval as any);
    });
    this.wsConnections.clear();
    this.priceUpdateCallbacks.clear();
  }
}

export const cryptoApi = new CryptoApiService();
export type { CryptoPriceData, WebSocketPriceUpdate };