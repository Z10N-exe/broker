-- Create crypto prices table for real-time data
CREATE TABLE IF NOT EXISTS public.crypto_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL UNIQUE,
  name text NOT NULL,
  current_price numeric NOT NULL,
  price_change_24h numeric DEFAULT 0,
  price_change_percentage_24h numeric DEFAULT 0,
  market_cap numeric,
  volume_24h numeric,
  last_updated timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on crypto prices (public read access)
ALTER TABLE public.crypto_prices ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read crypto prices
CREATE POLICY "Anyone can view crypto prices" ON public.crypto_prices
FOR SELECT USING (true);

-- Insert popular crypto prices for initial data
INSERT INTO public.crypto_prices (symbol, name, current_price, price_change_24h, price_change_percentage_24h, market_cap, volume_24h) VALUES
('BTC', 'Bitcoin', 43250.00, 1250.00, 2.98, 847500000000, 25400000000),
('ETH', 'Ethereum', 2650.00, -45.30, -1.68, 318600000000, 12800000000),
('USDT', 'Tether', 1.00, 0.001, 0.10, 96200000000, 35600000000),
('BNB', 'Binance Coin', 325.80, 8.20, 2.58, 48900000000, 1240000000),
('XRP', 'XRP', 0.62, 0.018, 2.99, 33500000000, 1180000000),
('SOL', 'Solana', 98.45, -2.15, -2.14, 43200000000, 2350000000),
('USDC', 'USD Coin', 1.00, 0.00, 0.02, 25100000000, 4560000000),
('ADA', 'Cardano', 0.485, 0.012, 2.54, 17200000000, 485000000),
('DOGE', 'Dogecoin', 0.082, 0.003, 3.80, 11800000000, 625000000),
('AVAX', 'Avalanche', 37.20, 1.45, 4.05, 14600000000, 410000000)
ON CONFLICT (symbol) DO UPDATE SET
current_price = EXCLUDED.current_price,
price_change_24h = EXCLUDED.price_change_24h,
price_change_percentage_24h = EXCLUDED.price_change_percentage_24h,
last_updated = now();

-- Add referral system to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES public.profiles(user_id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_bonus_claimed numeric DEFAULT 0;