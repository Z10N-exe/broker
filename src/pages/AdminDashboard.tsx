import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { EnhancedStatsCard } from '@/components/EnhancedStatsCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  DollarSign, 
  FileText, 
  Bell, 
  Shield,
  Eye,
  Check,
  X,
  ArrowLeft,
  Activity,
  TrendingUp,
  AlertTriangle,
  UserCheck,
  Download,
  ExternalLink
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationText, setNotificationText] = useState('');
  const [notificationTitle, setNotificationTitle] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBalance: 0,
    pendingDeposits: 0,
    tradingVolume: 0
  });

  // Fetch all data on component mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
      
      // Set up real-time subscriptions and cleanup
      const cleanup = setupRealTimeSubscriptions();
      
      return cleanup; // Return cleanup function for useEffect
    }
  }, [isAuthenticated]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUsers(),
        fetchDeposits(),
        fetchTrades(),
        fetchNotifications()
      ]);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        *,
        balances (
          balance,
          daily_profit_loss,
          profit_loss_percentage
        )
      `);

    if (profilesError) {
      console.error('Error fetching users:', profilesError);
      return;
    }

    setUsers(profiles || []);
    updateStats();
  };

  const fetchDeposits = async () => {
    const { data: depositsData, error } = await supabase
      .from('deposits')
      .select(`
        *,
        profiles!inner (
          full_name,
          user_id
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching deposits:', error);
      return;
    }

    setDeposits(depositsData || []);
  };

  const fetchTrades = async () => {
    const { data: tradesData, error } = await supabase
      .from('trades')
      .select(`
        *,
        profiles!inner (
          full_name,
          user_id
        )
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching trades:', error);
      return;
    }

    setTrades(tradesData || []);
  };

  const fetchNotifications = async () => {
    const { data: notificationsData, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching notifications:', error);
      return;
    }

    setNotifications(notificationsData || []);
  };

  const updateStats = () => {
    const totalUsers = users.length;
    const totalBalance = users.reduce((sum, user) => {
      const balance = user.balances?.[0]?.balance || 0;
      return sum + Number(balance);
    }, 0);
    const pendingDeposits = deposits.filter(d => d.status === 'pending').length;
    const tradingVolume = trades.reduce((sum, trade) => sum + Number(trade.total || 0), 0);

    setStats({
      totalUsers,
      totalBalance,
      pendingDeposits,
      tradingVolume
    });
  };

  const setupRealTimeSubscriptions = () => {
    // Subscribe to deposits changes
    const depositsSubscription = supabase
      .channel('admin-deposits-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deposits' }, () => {
        fetchDeposits();
      })
      .subscribe();

    // Subscribe to profiles changes (for KYC updates)
    const profilesSubscription = supabase
      .channel('admin-profiles-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchUsers();
      })
      .subscribe();

    // Subscribe to balances changes
    const balancesSubscription = supabase
      .channel('admin-balances-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'balances' }, () => {
        fetchUsers();
      })
      .subscribe();

    // Subscribe to trades changes
    const tradesSubscription = supabase
      .channel('admin-trades-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trades' }, () => {
        fetchTrades();
      })
      .subscribe();

    // Subscribe to notifications changes
    const notificationsSubscription = supabase
      .channel('admin-notifications-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        fetchNotifications();
      })
      .subscribe();

    // Auto-refresh data every 30 seconds as backup
    const refreshInterval = setInterval(() => {
      fetchAllData();
    }, 30000);

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(depositsSubscription);
      supabase.removeChannel(profilesSubscription);
      supabase.removeChannel(balancesSubscription);
      supabase.removeChannel(tradesSubscription);
      supabase.removeChannel(notificationsSubscription);
      clearInterval(refreshInterval);
    };
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Ratking345') {
      setIsAuthenticated(true);
      toast({
        title: "Admin Access Granted",
        description: "Welcome to the admin dashboard",
      });
    } else {
      toast({
        title: "Access Denied",
        description: "Invalid password",
        variant: "destructive"
      });
    }
  };

  const approveDeposit = async (depositId: string, amount: number, userId: string) => {
    setLoading(true);
    try {
      // Update deposit status
      const { error: depositError } = await supabase
        .from('deposits')
        .update({ 
          status: 'approved',
          confirmed_at: new Date().toISOString(),
          reviewed_at: new Date().toISOString()
        })
        .eq('id', depositId);

      if (depositError) throw depositError;

      // Update or create user balance
      const { data: existingBalance } = await supabase
        .from('balances')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existingBalance) {
        // Update existing balance
        const { error: balanceError } = await supabase
          .from('balances')
          .update({ 
            balance: Number(existingBalance.balance) + Number(amount)
          })
          .eq('user_id', userId);

        if (balanceError) throw balanceError;
      } else {
        // Create new balance record
        const { error: balanceError } = await supabase
          .from('balances')
          .insert({ 
            user_id: userId,
            balance: Number(amount),
            currency: 'USD'
          });

        if (balanceError) throw balanceError;
      }

      toast({
        title: "Deposit Approved",
        description: "User balance has been updated successfully",
      });
      
      // Refresh data
      await fetchAllData();
    } catch (error) {
      console.error('Error approving deposit:', error);
      toast({
        title: "Error",
        description: "Failed to approve deposit",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const rejectDeposit = async (depositId: string) => {
    try {
      const { error } = await supabase
        .from('deposits')
        .update({ 
          status: 'rejected',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', depositId);

      if (error) throw error;

      toast({
        title: "Deposit Rejected",
        description: "User has been notified",
        variant: "destructive"
      });
      
      await fetchDeposits();
    } catch (error) {
      console.error('Error rejecting deposit:', error);
      toast({
        title: "Error",
        description: "Failed to reject deposit",
        variant: "destructive"
      });
    }
  };

  const updateUserBalance = async (userId: string, newBalance: number) => {
    try {
      const { error } = await supabase
        .from('balances')
        .upsert({ 
          user_id: userId,
          balance: newBalance,
          currency: 'USD'
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: "Balance Updated",
        description: "User balance has been modified",
      });
      
      await fetchUsers();
    } catch (error) {
      console.error('Error updating balance:', error);
      toast({
        title: "Error",
        description: "Failed to update balance",
        variant: "destructive"
      });
    }
  };

  const broadcastNotification = async () => {
    if (!notificationText.trim() || !notificationTitle.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both title and message",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Get all user IDs to send notifications to
      const userIds = users.map(user => user.user_id);
      
      // Create notifications for all users
      const notifications = userIds.map(userId => ({
        user_id: userId,
        title: notificationTitle,
        message: notificationText,
        type: 'announcement'
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;

      toast({
        title: "Notification Sent",
        description: `Broadcast sent to all ${users.length} users`,
      });
      
      setNotificationText('');
      setNotificationTitle('');
      await fetchNotifications();
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive"
      });
    }
  };

  const viewKYCDocument = (documentUrl: string) => {
    if (documentUrl) {
      window.open(documentUrl, '_blank');
    } else {
      toast({
        title: "No Document",
        description: "No KYC document available for this user",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    updateStats();
  }, [users, deposits, trades]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-between items-center mb-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Admin Access</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Admin Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" variant="hero">
                Access Dashboard
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Aspire Secure Trade Control Panel</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Site
          </Button>
        </div>

         {/* Enhanced Stats Overview */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
           <EnhancedStatsCard
             title="Total Users"
             value={stats.totalUsers.toString()}
             change="+12% this month"
             changeType="positive"
             icon={Users}
             iconColor="text-primary"
           />
           
           <EnhancedStatsCard
             title="Total Balance"
             value={`$${stats.totalBalance.toLocaleString()}`}
             change="+8.2% today"
             changeType="positive"
             icon={DollarSign}
             iconColor="text-success"
           />
           
           <EnhancedStatsCard
             title="Pending Deposits"
             value={stats.pendingDeposits.toString()}
             change={stats.pendingDeposits > 2 ? "High volume" : "Normal"}
             changeType={stats.pendingDeposits > 2 ? "warning" : "neutral"}
             icon={FileText}
             iconColor="text-warning"
           />
           
           <EnhancedStatsCard
             title="Trading Volume"
             value={`$${stats.tradingVolume.toLocaleString()}`}
             change="+15.3% today"
             changeType="positive"
             icon={Activity}
             iconColor="text-accent"
           />
         </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="deposits">Deposits</TabsTrigger>
            <TabsTrigger value="trading">Trading</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <LoadingSpinner text="Loading users..." />
                ) : (
                  <div className="space-y-4">
                     {users.map((user) => (
                       <div key={user.id} className="glass-panel p-4 animate-fade-in">
                         <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                           <div className="flex-1 space-y-3">
                             <div className="flex items-center gap-3 flex-wrap">
                               <h4 className="font-semibold text-lg">{user.full_name || 'No name'}</h4>
                               <Badge variant="secondary">
                                 ID: {user.user_id}
                               </Badge>
                               <Badge variant={
                                 user.kyc_status === 'approved' ? 'default' :
                                 user.kyc_status === 'pending' ? 'secondary' : 'destructive'
                               }>
                                 KYC: {user.kyc_status}
                               </Badge>
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                               <div>
                                 <span className="text-muted-foreground">Balance:</span>
                                 <span className="ml-2 font-semibold text-success">
                                   ${(user.balances?.[0]?.balance || 0).toLocaleString()}
                                 </span>
                               </div>
                               <div>
                                 <span className="text-muted-foreground">Email:</span>
                                 <span className="ml-2">{user.user_id}</span>
                               </div>
                               <div>
                                 <span className="text-muted-foreground">Phone:</span>
                                 <span className="ml-2">{user.phone_number || 'N/A'}</span>
                               </div>
                             </div>
                           </div>
                           
                           <div className="flex gap-2 items-center">
                             <Input
                               placeholder="New balance"
                               className="w-32"
                               onKeyDown={(e) => {
                                 if (e.key === 'Enter') {
                                   const newBalance = parseFloat((e.target as HTMLInputElement).value);
                                   if (!isNaN(newBalance)) {
                                     updateUserBalance(user.user_id, newBalance);
                                     (e.target as HTMLInputElement).value = '';
                                   }
                                 }
                               }}
                             />
                             {user.id_document_url && (
                               <Button 
                                 variant="outline" 
                                 size="sm"
                                 onClick={() => viewKYCDocument(user.id_document_url)}
                               >
                                 <Eye className="h-4 w-4" />
                               </Button>
                             )}
                           </div>
                         </div>
                       </div>
                     ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deposits" className="space-y-4">
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Deposit Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <LoadingSpinner text="Processing deposit..." />
                ) : (
                  <div className="space-y-4">
                     {deposits.map((deposit) => (
                       <div key={deposit.id} className="glass-panel p-4 animate-fade-in">
                         <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                           <div className="flex-1 space-y-2">
                             <div className="flex items-center gap-3 flex-wrap">
                               <h4 className="font-semibold text-lg">{deposit.profiles?.full_name || 'Unknown User'}</h4>
                               <Badge variant={
                                 deposit.status === 'approved' ? 'default' :
                                 deposit.status === 'rejected' ? 'destructive' : 'secondary'
                               }>
                                 {deposit.status}
                               </Badge>
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                               <div>
                                 <span className="text-muted-foreground">Amount:</span>
                                 <span className="ml-2 font-semibold text-success">
                                   ${Number(deposit.amount).toLocaleString()} {deposit.currency}
                                 </span>
                               </div>
                               <div>
                                 <span className="text-muted-foreground">User ID:</span>
                                 <span className="ml-2 font-mono text-xs">{deposit.user_id}</span>
                               </div>
                               <div>
                                 <span className="text-muted-foreground">Date:</span>
                                 <span className="ml-2">{new Date(deposit.created_at).toLocaleDateString()}</span>
                               </div>
                             </div>
                             {deposit.screenshot_url && (
                               <div className="mt-2">
                                 <Button
                                   variant="outline"
                                   size="sm"
                                   onClick={() => window.open(deposit.screenshot_url, '_blank')}
                                   className="flex items-center gap-2"
                                 >
                                   <ExternalLink className="h-4 w-4" />
                                   View Screenshot
                                 </Button>
                               </div>
                             )}
                           </div>
                           
                           {deposit.status === 'pending' && (
                             <div className="flex gap-2">
                               <Button
                                 variant="success"
                                 size="sm"
                                 onClick={() => approveDeposit(deposit.id, deposit.amount, deposit.user_id)}
                                 disabled={loading}
                                 className="glow-button"
                               >
                                 <Check className="h-4 w-4 mr-2" />
                                 Approve
                               </Button>
                               <Button
                                 variant="danger"
                                 size="sm"
                                 onClick={() => rejectDeposit(deposit.id)}
                                 disabled={loading}
                               >
                                 <X className="h-4 w-4 mr-2" />
                                 Reject
                               </Button>
                             </div>
                           )}
                         </div>
                       </div>
                     ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trading" className="space-y-4">
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Trading Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <EnhancedStatsCard
                       title="Active Traders"
                       value={users.filter(u => u.kyc_status === 'approved').length.toString()}
                       icon={UserCheck}
                       iconColor="text-success"
                     />
                     <EnhancedStatsCard
                       title="Total Volume"
                       value={`$${stats.tradingVolume.toLocaleString()}`}
                       icon={Activity}
                       iconColor="text-primary"
                     />
                     <EnhancedStatsCard
                       title="Recent Trades"
                       value={trades.length.toString()}
                       icon={TrendingUp}
                       iconColor="text-accent"
                     />
                   </div>
                   
                   <div className="mt-6">
                     <h4 className="font-semibold mb-4">Recent Trading Activity</h4>
                     <div className="space-y-3">
                       {trades.slice(0, 5).map((trade) => (
                         <div key={trade.id} className="glass-panel p-3 text-sm">
                           <div className="flex justify-between items-center">
                             <span>{trade.profiles?.full_name || 'Anonymous'} - {trade.trading_pair} ({trade.side})</span>
                             <span className={trade.side === 'buy' ? "text-success" : "text-danger"}>
                               ${Number(trade.amount).toLocaleString()}
                             </span>
                           </div>
                         </div>
                       ))}
                       {trades.length === 0 && (
                         <div className="glass-panel p-3 text-sm text-muted-foreground text-center">
                           No recent trades found
                         </div>
                       )}
                     </div>
                   </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Broadcast Notifications
                </CardTitle>
              </CardHeader>
               <CardContent className="space-y-4">
                 <div className="space-y-2">
                   <Label htmlFor="notificationTitle">Title</Label>
                   <Input
                     id="notificationTitle"
                     placeholder="Enter notification title..."
                     value={notificationTitle}
                     onChange={(e) => setNotificationTitle(e.target.value)}
                   />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="notification">Message</Label>
                   <Textarea
                     id="notification"
                     placeholder="Enter notification message for all users..."
                     value={notificationText}
                     onChange={(e) => setNotificationText(e.target.value)}
                     rows={4}
                     className="resize-none"
                   />
                 </div>
                 <Button 
                   onClick={broadcastNotification} 
                   className="flex items-center gap-2 glow-button"
                   variant="hero"
                 >
                   <Bell className="h-4 w-4" />
                   Send to All {users.length} Users
                 </Button>
                 
                 <div className="mt-6">
                   <h4 className="font-semibold mb-3">Recent Notifications</h4>
                   <div className="space-y-2 text-sm">
                     {notifications.slice(0, 5).map((notification) => (
                       <div key={notification.id} className="glass-panel p-3">
                         <div className="flex justify-between">
                           <div>
                             <div className="font-medium">{notification.title}</div>
                             <div className="text-muted-foreground text-xs">{notification.message}</div>
                           </div>
                           <span className="text-muted-foreground text-xs">
                             {new Date(notification.created_at).toLocaleDateString()}
                           </span>
                         </div>
                       </div>
                     ))}
                     {notifications.length === 0 && (
                       <div className="glass-panel p-3 text-muted-foreground text-center">
                         No notifications sent yet
                       </div>
                     )}
                   </div>
                 </div>
               </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="referrals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Referral Network</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Referral tracking system coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;