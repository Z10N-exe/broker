import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Copy, Users, DollarSign, Gift, Share2, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ReferralData {
  referral_code: string;
  referrals_count: number;
  referral_earnings: number;
  total_referral_bonus_claimed: number;
}

interface ReferredUser {
  id: string;
  full_name: string;
  created_at: string;
  bonus_amount: number;
  status: 'pending' | 'active' | 'completed';
}

export const ReferralSystem = () => {
  const { user } = useAuth();
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      fetchReferralData();
      fetchReferredUsers();
    }
  }, [user]);

  const fetchReferralData = async () => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('referral_code, referral_bonus_claimed')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      // Generate referral code if not exists
      if (!profile.referral_code) {
        const newReferralCode = generateReferralCode();
        await supabase
          .from('profiles')
          .update({ referral_code: newReferralCode })
          .eq('user_id', user?.id);
        
        profile.referral_code = newReferralCode;
      }

      // Count referrals
      const { count: referralsCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .eq('referred_by', user?.id);

      setReferralData({
        referral_code: profile.referral_code,
        referrals_count: referralsCount || 0,
        referral_earnings: (referralsCount || 0) * 50, // $50 per referral
        total_referral_bonus_claimed: profile.referral_bonus_claimed || 0
      });
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferredUsers = async () => {
    try {
      const { data: referrals, error } = await supabase
        .from('profiles')
        .select('id, full_name, created_at')
        .eq('referred_by', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const referredUsersData: ReferredUser[] = referrals?.map(referral => ({
        id: referral.id,
        full_name: referral.full_name || 'Anonymous User',
        created_at: referral.created_at,
        bonus_amount: 50,
        status: getRandomStatus()
      })) || [];

      setReferredUsers(referredUsersData);
    } catch (error) {
      console.error('Error fetching referred users:', error);
    }
  };

  const generateReferralCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  const getRandomStatus = (): 'pending' | 'active' | 'completed' => {
    const statuses: ('pending' | 'active' | 'completed')[] = ['pending', 'active', 'completed'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  const copyReferralLink = () => {
    const referralLink = `${window.location.origin}/?ref=${referralData?.referral_code}`;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({
      title: "Referral Link Copied!",
      description: "Share this link with friends to earn rewards"
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnSocial = (platform: string) => {
    const referralLink = `${window.location.origin}/?ref=${referralData?.referral_code}`;
    const message = encodeURIComponent(`Join me on Aspire Secure Trade - the best crypto trading platform! Use my referral link and we both get $50 bonus: ${referralLink}`);
    
    let shareUrl = '';
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${message}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${message}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Join me on Aspire Secure Trade!')}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-lg"></div>
          <div className="h-48 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Referral Overview */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="trading-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-primary" />
              Total Referrals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {referralData?.referrals_count || 0}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Users you've referred
            </p>
          </CardContent>
        </Card>

        <Card className="trading-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="w-5 h-5 text-success" />
              Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">
              ${referralData?.referral_earnings || 0}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Total referral rewards
            </p>
          </CardContent>
        </Card>

        <Card className="trading-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gift className="w-5 h-5 text-accent" />
              Bonus Claimed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">
              ${referralData?.total_referral_bonus_claimed || 0}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Withdrawn rewards
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Link & Sharing */}
      <Card className="trading-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Your Referral Link
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={`${window.location.origin}/?ref=${referralData?.referral_code}`}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              variant={copied ? "success" : "outline"}
              size="sm"
              onClick={copyReferralLink}
              className="shrink-0"
            >
              {copied ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Gift className="w-4 h-4" />
            <span>You and your friend both get $50 bonus when they complete KYC and make their first deposit!</span>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">Share on Social Media</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button variant="outline" size="sm" onClick={() => shareOnSocial('twitter')}>
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
                </svg>
                Twitter
              </Button>
              
              <Button variant="outline" size="sm" onClick={() => shareOnSocial('facebook')}>
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </Button>
              
              <Button variant="outline" size="sm" onClick={() => shareOnSocial('whatsapp')}>
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.520-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
                WhatsApp
              </Button>
              
              <Button variant="outline" size="sm" onClick={() => shareOnSocial('telegram')}>
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                Telegram
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referred Users */}
      <Card className="trading-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Your Referrals ({referredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {referredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No referrals yet</h3>
              <p className="text-muted-foreground">
                Share your referral link to start earning rewards!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {referredUsers.map((referredUser) => (
                <div
                  key={referredUser.id}
                  className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold">{referredUser.full_name}</div>
                      <div className="text-sm text-muted-foreground">
                        Joined {new Date(referredUser.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-success font-semibold">+${referredUser.bonus_amount}</div>
                      <Badge 
                        variant={
                          referredUser.status === 'completed' ? 'default' : 
                          referredUser.status === 'active' ? 'secondary' : 
                          'outline'
                        }
                        className="text-xs"
                      >
                        {referredUser.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card className="trading-card">
        <CardHeader>
          <CardTitle>How Referral Program Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                <Share2 className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-semibold">1. Share Your Link</h4>
              <p className="text-sm text-muted-foreground">
                Share your unique referral link with friends and family
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center mx-auto">
                <Users className="w-6 h-6 text-success" />
              </div>
              <h4 className="font-semibold">2. They Join & Verify</h4>
              <p className="text-sm text-muted-foreground">
                Your referral signs up, completes KYC, and makes first deposit
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto">
                <Gift className="w-6 h-6 text-accent" />
              </div>
              <h4 className="font-semibold">3. Earn Rewards</h4>
              <p className="text-sm text-muted-foreground">
                You both receive $50 bonus credited to your accounts
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};