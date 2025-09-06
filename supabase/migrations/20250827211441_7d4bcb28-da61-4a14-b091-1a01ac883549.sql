-- Add admin roles table for secure admin access
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  admin_password_hash text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_login timestamp with time zone,
  UNIQUE(user_id)
);

-- Enable RLS on admin table
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create admin policies (only admins can access)
CREATE POLICY "Admins can manage admin users" ON public.admin_users
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.user_id = auth.uid()
  )
);

-- Add referral system to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES public.profiles(user_id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_bonus_claimed numeric DEFAULT 0;

-- Add minimum deposit requirement to balances
ALTER TABLE public.balances ADD COLUMN IF NOT EXISTS minimum_deposit_met boolean DEFAULT false;
ALTER TABLE public.balances ADD COLUMN IF NOT EXISTS total_deposited numeric DEFAULT 0;

-- Add payment screenshot and admin review fields to deposits
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS screenshot_path text;
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'bitcoin';
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS btc_address text DEFAULT 'bc1qzn2g79aqkdefkfr9cfd4p8l6x2kzszpjkj5w72';

-- Create cryptocurrency prices table for real-time data
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

-- Only system/admin can update crypto prices
CREATE POLICY "Only system can update crypto prices" ON public.crypto_prices
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.user_id = auth.uid()
  )
);

-- Create trading pairs table
CREATE TABLE IF NOT EXISTS public.trading_pairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency text NOT NULL,
  quote_currency text NOT NULL,
  symbol text NOT NULL UNIQUE, -- e.g., 'BTC/USDT'
  min_order_size numeric DEFAULT 0.001,
  max_order_size numeric DEFAULT 1000000,
  price_precision integer DEFAULT 8,
  quantity_precision integer DEFAULT 8,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on trading pairs (public read access)
ALTER TABLE public.trading_pairs ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read trading pairs
CREATE POLICY "Anyone can view trading pairs" ON public.trading_pairs
FOR SELECT USING (true);

-- Only admins can modify trading pairs
CREATE POLICY "Only admins can modify trading pairs" ON public.trading_pairs
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.user_id = auth.uid()
  )
);

-- Add enhanced fields to trades table
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS fees numeric DEFAULT 0;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS profit_loss numeric;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS notes text;

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

-- Insert popular trading pairs
INSERT INTO public.trading_pairs (base_currency, quote_currency, symbol, min_order_size, max_order_size) VALUES
('BTC', 'USDT', 'BTC/USDT', 0.0001, 1000, 2, 6),
('ETH', 'USDT', 'ETH/USDT', 0.001, 10000, 2, 6),
('BNB', 'USDT', 'BNB/USDT', 0.01, 100000, 2, 6),
('XRP', 'USDT', 'XRP/USDT', 1, 1000000, 4, 0),
('SOL', 'USDT', 'SOL/USDT', 0.01, 100000, 2, 6),
('ADA', 'USDT', 'ADA/USDT', 1, 1000000, 4, 0),
('DOGE', 'USDT', 'DOGE/USDT', 1, 10000000, 6, 0),
('AVAX', 'USDT', 'AVAX/USDT', 0.01, 100000, 2, 6),
('BTC', 'ETH', 'BTC/ETH', 0.0001, 1000, 6, 6),
('ETH', 'BTC', 'ETH/BTC', 0.001, 10000, 8, 6)
ON CONFLICT (symbol) DO NOTHING;

-- Function to generate unique referral codes
CREATE OR REPLACE FUNCTION generate_referral_code() RETURNS text AS $$
DECLARE
  code text;
BEGIN
  LOOP
    -- Generate 8 character alphanumeric code
    code := upper(substr(md5(random()::text), 1, 8));
    
    -- Check if code already exists
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = code) THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;