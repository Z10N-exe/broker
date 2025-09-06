import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch latest crypto prices from CoinGecko API
    const cryptoIds = ['bitcoin', 'ethereum', 'binancecoin', 'cardano', 'solana', 'ripple', 'dogecoin', 'polygon', 'chainlink', 'litecoin']
    
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoIds.join(',')}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`
    )

    if (!response.ok) {
      throw new Error('Failed to fetch crypto prices')
    }

    const data = await response.json()
    console.log('Fetched crypto data:', data)

    // Transform data for our database
    const cryptoPrices = Object.entries(data).map(([id, priceData]: [string, any]) => {
      const symbolMap: Record<string, string> = {
        'bitcoin': 'BTC',
        'ethereum': 'ETH', 
        'binancecoin': 'BNB',
        'cardano': 'ADA',
        'solana': 'SOL',
        'ripple': 'XRP',
        'dogecoin': 'DOGE',
        'polygon': 'MATIC',
        'chainlink': 'LINK',
        'litecoin': 'LTC'
      }

      const nameMap: Record<string, string> = {
        'bitcoin': 'Bitcoin',
        'ethereum': 'Ethereum',
        'binancecoin': 'BNB',
        'cardano': 'Cardano', 
        'solana': 'Solana',
        'ripple': 'XRP',
        'dogecoin': 'Dogecoin',
        'polygon': 'Polygon',
        'chainlink': 'Chainlink',
        'litecoin': 'Litecoin'
      }

      return {
        symbol: symbolMap[id] || id.toUpperCase(),
        name: nameMap[id] || id,
        current_price: priceData.usd,
        price_change_24h: priceData.usd_24h_change || 0,
        price_change_percentage_24h: priceData.usd_24h_change || 0,
        market_cap: priceData.usd_market_cap || 0,
        volume_24h: priceData.usd_24h_vol || 0
      }
    })

    // Update or insert crypto prices
    for (const crypto of cryptoPrices) {
      const { error } = await supabase
        .from('crypto_prices')
        .upsert(
          crypto,
          { 
            onConflict: 'symbol',
            ignoreDuplicates: false 
          }
        )

      if (error) {
        console.error(`Error updating ${crypto.symbol}:`, error)
      } else {
        console.log(`Updated ${crypto.symbol}: $${crypto.current_price}`)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Updated ${cryptoPrices.length} crypto prices`,
        data: cryptoPrices 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in crypto-webhook:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})