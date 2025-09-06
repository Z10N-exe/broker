import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, 
  Shield, 
  Upload,
  FileText,
  Camera,
  Check,
  AlertCircle,
  Info,
  Clock
} from 'lucide-react';

const KYC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [idDocument, setIdDocument] = useState<File | null>(null);
  const [selfieDocument, setSelfieDocument] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [kycStatus, setKycStatus] = useState('pending');

  const handleSubmitKYC = async () => {
    if (!idDocument || !selfieDocument) {
      toast({
        title: "Missing Documents",
        description: "Please upload both ID document and selfie photo",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Upload ID document
      const idFileExt = idDocument.name.split('.').pop();
      const idFileName = `${user?.id}_id_${Date.now()}.${idFileExt}`;
      
      const { error: idUploadError } = await supabase.storage
        .from('kyc-documents')
        .upload(`id/${idFileName}`, idDocument);

      if (idUploadError) throw idUploadError;

      // Upload selfie document
      const selfieFileExt = selfieDocument.name.split('.').pop();
      const selfieFileName = `${user?.id}_selfie_${Date.now()}.${selfieFileExt}`;
      
      const { error: selfieUploadError } = await supabase.storage
        .from('kyc-documents')
        .upload(`selfie/${selfieFileName}`, selfieDocument);

      if (selfieUploadError) throw selfieUploadError;

      // Update profile with KYC information
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          id_document_url: `id/${idFileName}`,
          selfie_document_url: `selfie/${selfieFileName}`,
          kyc_status: 'submitted',
          kyc_submitted_at: new Date().toISOString()
        })
        .eq('user_id', user?.id);

      if (updateError) throw updateError;

      setKycStatus('submitted');
      toast({
        title: "KYC Documents Submitted",
        description: "Your identity verification documents have been submitted for review. You'll be notified once reviewed.",
      });

      // Reset form
      setIdDocument(null);
      setSelfieDocument(null);

    } catch (error: any) {
      console.error('Error submitting KYC:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit KYC documents. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (kycStatus) {
      case 'approved':
        return <Badge variant="default" className="bg-success"><Check className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'submitted':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Under Review</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <h1 className="text-2xl font-bold">Identity Verification</h1>
              {getStatusBadge()}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Information Panel */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Why Verify Your Identity?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Enhanced Security</h4>
                    <p className="text-sm text-muted-foreground">
                      Protect your account from unauthorized access and fraud
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-success mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Higher Limits</h4>
                    <p className="text-sm text-muted-foreground">
                      Unlock higher deposit and withdrawal limits
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-accent mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Compliance</h4>
                    <p className="text-sm text-muted-foreground">
                      Meet regulatory requirements for financial services
                    </p>
                  </div>
                </div>
              </div>

              {/* Requirements */}
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <h4 className="font-semibold mb-2">Document Requirements</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Government-issued photo ID (passport, driver's license)</li>
                  <li>• Clear, high-resolution images</li>
                  <li>• All four corners visible</li>
                  <li>• No glare or shadows</li>
                  <li>• Documents must be valid and not expired</li>
                </ul>
              </div>

              {/* Privacy Notice */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-2">Privacy & Security</h4>
                <p className="text-sm text-muted-foreground">
                  Your personal information is encrypted and stored securely. 
                  We comply with data protection regulations and will never 
                  share your information without your consent.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Upload Form */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* ID Document Upload */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Government-Issued ID
                </Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setIdDocument(e.target.files?.[0] || null)}
                    className="hidden"
                    id="id-upload"
                  />
                  <label htmlFor="id-upload" className="cursor-pointer">
                    {idDocument ? (
                      <div className="flex items-center gap-2 text-success">
                        <Check className="h-5 w-5" />
                        <span>{idDocument.name}</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload ID document
                        </p>
                      </div>
                    )}
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Accepted: Passport, Driver's License, National ID
                </p>
              </div>

              {/* Selfie Upload */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Selfie with ID
                </Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSelfieDocument(e.target.files?.[0] || null)}
                    className="hidden"
                    id="selfie-upload"
                  />
                  <label htmlFor="selfie-upload" className="cursor-pointer">
                    {selfieDocument ? (
                      <div className="flex items-center gap-2 text-success">
                        <Check className="h-5 w-5" />
                        <span>{selfieDocument.name}</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Camera className="h-8 w-8 text-muted-foreground mx-auto" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload selfie with ID
                        </p>
                      </div>
                    )}
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Hold your ID next to your face and take a clear photo
                </p>
              </div>

              {/* Submit Button */}
              <Button 
                onClick={handleSubmitKYC}
                disabled={loading || !idDocument || !selfieDocument || kycStatus === 'submitted'}
                className="w-full glow-button"
                variant="hero"
              >
                {loading ? (
                  "Uploading Documents..."
                ) : kycStatus === 'submitted' ? (
                  "Documents Submitted"
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Submit for Verification
                  </>
                )}
              </Button>

              {/* Status Message */}
              {kycStatus === 'submitted' && (
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <div>
                      <h4 className="font-semibold">Under Review</h4>
                      <p className="text-sm text-muted-foreground">
                        Your documents are being reviewed. This typically takes 1-3 business days.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tips */}
              <div className="space-y-2 text-xs text-muted-foreground">
                <h4 className="font-semibold text-foreground">Tips for better approval:</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Ensure documents are clearly visible and readable</li>
                  <li>Use good lighting and avoid shadows</li>
                  <li>Make sure your face is clearly visible in the selfie</li>
                  <li>Don't cover any part of the document</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default KYC;