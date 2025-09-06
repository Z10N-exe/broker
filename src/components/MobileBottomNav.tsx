import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Download, 
  Upload, 
  History, 
  Shield,
  Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: History, label: 'History', path: '/dashboard?tab=history' },
    { icon: Upload, label: 'Deposit', path: '/dashboard?tab=deposit' },
    { icon: Home, label: 'Home', path: '/dashboard' },
    { icon: Download, label: 'Withdraw', path: '/dashboard?tab=withdraw' },
    { icon: Shield, label: 'Security', path: '/dashboard?tab=kyc' },
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' && !location.search;
    }
    return location.pathname + location.search === path;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 md:hidden">
      <div className="flex items-center justify-around py-2 px-4">
        {navItems.map((item) => (
          <Button
            key={item.path}
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center gap-1 h-auto py-2 px-3 ${
              isActive(item.path) 
                ? 'text-primary bg-primary/10' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => navigate(item.path)}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default MobileBottomNav;