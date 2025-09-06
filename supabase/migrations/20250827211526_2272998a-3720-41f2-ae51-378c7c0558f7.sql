-- Fix the trading pairs INSERT with correct column specification
INSERT INTO public.trading_pairs (base_currency, quote_currency, symbol, min_order_size, max_order_size, price_precision, quantity_precision) VALUES
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

-- Update profiles to generate referral codes for existing users
UPDATE public.profiles 
SET referral_code = generate_referral_code() 
WHERE referral_code IS NULL;

-- Create trigger to auto-generate referral codes for new profiles
CREATE OR REPLACE FUNCTION auto_generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_referral_code_trigger
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_referral_code();