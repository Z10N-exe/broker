import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    TradingView: any;
  }
}

interface TradingViewProps {
  symbol?: string;
  theme?: 'light' | 'dark';
  height?: number;
  width?: string | number;
  interval?: string;
  style?: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
}

export const TradingViewWidget = ({
  symbol = "BINANCE:BTCUSDT",
  theme = "dark",
  height = 400,
  width = "100%",
  interval = "1",
  style = "1"
}: TradingViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (window.TradingView && containerRef.current) {
        new window.TradingView.widget({
          "width": width,
          "height": height,
          "symbol": symbol,
          "interval": interval,
          "timezone": "Etc/UTC",
          "theme": theme,
          "style": style,
          "locale": "en",
          "toolbar_bg": "#f1f3f6",
          "enable_publishing": false,
          "allow_symbol_change": true,
          "container_id": containerRef.current.id
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [symbol, theme, height, width, interval, style]);

  return (
    <div 
      ref={containerRef} 
      id={`tradingview_${Math.random().toString(36).substr(2, 9)}`}
      className="w-full h-full"
    />
  );
};

export const TradingViewMiniWidget = ({
  symbol = "BINANCE:BTCUSDT",
  width = "100%",
  height = 220
}: Pick<TradingViewProps, 'symbol' | 'width' | 'height'>) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      "symbol": symbol,
      "width": width,
      "height": height,
      "locale": "en",
      "dateRange": "12M",
      "colorTheme": "dark",
      "trendLineColor": "rgba(41, 98, 255, 1)",
      "underLineColor": "rgba(41, 98, 255, 0.3)",
      "underLineBottomColor": "rgba(41, 98, 255, 0)",
      "isTransparent": true,
      "autosize": false,
      "largeChartUrl": ""
    });
    
    if (containerRef.current) {
      containerRef.current.appendChild(script);
    }

    return () => {
      if (containerRef.current && containerRef.current.contains(script)) {
        containerRef.current.removeChild(script);
      }
    };
  }, [symbol, width, height]);

  return (
    <div 
      ref={containerRef} 
      className="tradingview-widget-container w-full h-full bg-card rounded-lg overflow-hidden"
    />
  );
};