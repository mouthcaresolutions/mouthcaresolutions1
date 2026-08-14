"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Eye,
  Key,
  Link2,
  Link2Off,
  Loader2,
  MessageSquare,
  MonitorSmartphone,
  RefreshCw,
  Settings2,
  Share2,
  Smartphone,
  UserPlus,
  XCircle,
  Building2,
} from "lucide-react";

// ==================== TYPES ====================

interface PlatformCredential {
  key: string;
  label: string;
  placeholder: string;
  type?: string;
  required?: boolean;
}

interface Platform {
  id: string;
  name: string;
  icon: string;
  category: string;
  description: string;
  authType: string;
  docsUrl: string;
  credentials: PlatformCredential[];
  setupGuide: string;
  status: "connected" | "not_connected";
  enabled: boolean;
  lastPostedAt: string | null;
  totalPosts: number;
  lastError: string | null;
  hasToken: boolean;
}

// ==================== PLATFORM ICONS ====================

function PlatformIcon({ platformId, className = "h-6 w-6" }: { platformId: string; className?: string }) {
  switch (platformId) {
    case 'facebook':
      return <Share2 className={className} />;
    case 'instagram':
      return <MonitorSmartphone className={className} />;
    case 'twitter':
      return <MessageSquare className={className} />;
    case 'linkedin':
      return <UserPlus className={className} />;
    case 'whatsapp':
      return <Smartphone className={className} />;
    case 'google_business':
      return <Building2 className={className} />;
    default:
      return <Link2 className={className} />;
  }
}

const PLATFORM_COLORS: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  facebook:       { bg: 'bg-blue-50',       text: 'text-blue-600',  border: 'border-blue-200',  badge: 'bg-blue-100 text-blue-700' },
  instagram:      { bg: 'bg-pink-50',      text: 'text-pink-600',  border: 'border-pink-200',  badge: 'bg-pink-100 text-pink-700' },
  twitter:        { bg: 'bg-gray-50',      text: 'text-gray-700',  border: 'border-gray-200',  badge: 'bg-gray-100 text-gray-700' },
  linkedin:       { bg: 'bg-blue-50',       text: 'text-blue-700',  border: 'border-blue-200',  badge: 'bg-blue-100 text-blue-700' },
  whatsapp:       { bg: 'bg-green-50',     text: 'text-green-600', border: 'border-green-200', badge: 'bg-green-100 text-green-700' },
  google_business: { bg: 'bg-red-50',      text: 'text-red-600',   border: 'border-red-200',  badge: 'bg-red-100 text-red-700' },
};

// ==================== AUTH GUARD ====================

function useAuthGuard() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [verified, setVerified] = useState(false);
  const [token, setToken] = useState('');

  useEffect(() => {
    async function verify() {
      try {
        const t =
          document.cookie
            .split('; ')
            .find((row) => row.startsWith('admin_token='))
            ?.split('=')[1] || localStorage.getItem('admin_token') || '';

        if (!t) {
          router.replace('/rajeshark/login');
          return;
        }

        const res = await fetch('/api/admin/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'verify', token: t }),
        });

        if (!res.ok) {
          localStorage.removeItem('admin_token');
          router.replace('/rajeshark/login');
          return;
        }

        setToken(t);
        setVerified(true);
      } catch {
        router.replace('/rajeshark/login');
      } finally {
        setChecking(false);
      }
    }
    verify();
  }, [router]);

  return { verified, checking, token };
}

// ==================== MAIN PAGE ====================

export default function SocialConnectionsPage() {
  const router = useRouter();
  const { verified, checking, token } = useAuthGuard();
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [apiMessage, setApiMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch platforms
  const fetchPlatforms = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/social-accounts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        router.replace('/rajeshark/login');
        return;
      }
      const data = await res.json();
      setPlatforms(data.platforms || []);
    } catch (e) {
      console.error('Failed to fetch platforms:', e);
    } finally {
      setLoading(false);
    }
  }, [token, router]);

  useEffect(() => {
    if (verified && token) fetchPlatforms();
  }, [verified, token, fetchPlatforms]);

  // Save credentials
  const handleSave = async () => {
    if (!selectedPlatform) return;
    setSaving(selectedPlatform.id);
    setApiMessage(null);
    try {
      const updates: any = {};
      Object.entries(formValues).forEach(([k, v]) => {
        if (v.trim()) updates[k] = v.trim();
      });

      const res = await fetch('/api/admin/social-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'saveTokens', platform: selectedPlatform.id, ...updates }),
      });
      const data = await res.json();

      if (data.success) {
        setApiMessage({ type: 'success', text: `${selectedPlatform.name} credentials saved successfully!` });
        setShowModal(false);
        setFormValues({});
        fetchPlatforms();
      } else {
        setApiMessage({ type: 'error', text: data.error || 'Failed to save credentials' });
      }
    } catch {
      setApiMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSaving(null);
    }
  };

  // Toggle enabled
  const handleToggle = async (platformId: string, enabled: boolean) => {
    try {
      await fetch('/api/admin/social-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'toggleEnabled', platform: platformId, enabled }),
      });
      fetchPlatforms();
    } catch (e) {
      console.error(e);
    }
  };

  // Disconnect
  const handleDisconnect = async (platformId: string) => {
    if (!confirm('Disconnect this platform? All saved credentials will be removed.')) return;
    try {
      await fetch('/api/admin/social-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'disconnect', platform: platformId }),
      });
      fetchPlatforms();
    } catch (e) {
      console.error(e);
    }
  };

  // Open configure modal
  const openConfigure = (platform: Platform) => {
    setSelectedPlatform(platform);
    setFormValues({});
    setApiMessage(null);
    setShowModal(false);
    setShowGuide(false);
    // Use setTimeout to let Dialog mount before opening
    setTimeout(() => setShowModal(true), 0);
  };

  // ==================== RENDER ====================

  if (checking || !verified) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          <p className="text-sm text-gray-500">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Group platforms by category
  const categories = [...new Set(platforms.map((p) => p.category))];
  const connectedCount = platforms.filter((p) => p.status === 'connected').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm md:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/rajeshark"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-teal-600 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Back to Admin</span>
          </Link>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Social Media Connections</h2>
            <p className="hidden text-xs text-gray-500 sm:block">MCS Dental Clinic</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchPlatforms} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/rajeshark">
            <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
              <Settings2 className="h-4 w-4 mr-1" />
              Open Full Social Tab
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
        {/* Status Banner */}
        <Card className="mb-6 bg-gradient-to-r from-teal-600 to-emerald-600 border-0 text-white">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Share2 className="h-5 w-5" /> Social Media Integration
                </h3>
                <p className="text-teal-100 text-sm mt-1">
                  Connect your social media accounts to automatically share blog posts. {connectedCount} of {platforms.length} platforms connected.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex -space-x-2">
                  {platforms.filter((p) => p.status === 'connected').map((p) => (
                    <div
                      key={p.id}
                      className={`h-8 w-8 rounded-full flex items-center justify-center border-2 border-white ${
                        p.id === 'facebook' ? 'bg-blue-500' :
                        p.id === 'instagram' ? 'bg-pink-500' :
                        p.id === 'twitter' ? 'bg-gray-700' :
                        p.id === 'linkedin' ? 'bg-blue-700' :
                        p.id === 'whatsapp' ? 'bg-green-500' :
                        'bg-red-500'
                      }`}
                      title={p.name}
                    >
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    </div>
                  ))}
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  {connectedCount}/{platforms.length}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Message */}
        {apiMessage && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              apiMessage.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {apiMessage.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 shrink-0" />
            )}
            <span className="text-sm">{apiMessage.text}</span>
            <button
              className="ml-auto text-current opacity-60 hover:opacity-100"
              onClick={() => setApiMessage(null)}
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Platform Cards by Category */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          </div>
        ) : (
          <div className="space-y-8">
            {categories.map((category) => {
              const categoryPlatforms = platforms.filter((p) => p.category === category);
              return (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    {category === 'Social' && <Share2 className="h-4 w-4" />}
                    {category === 'Messaging' && <Smartphone className="h-4 w-4" />}
                    {category === 'Business' && <Building2 className="h-4 w-4" />}
                    {category}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryPlatforms.map((platform) => (
                      <PlatformCard
                        key={platform.id}
                        platform={platform}
                        onToggle={handleToggle}
                        onConfigure={openConfigure}
                        onDisconnect={handleDisconnect}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Help Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="h-5 w-5" /> How Social Sharing Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700 font-bold text-sm">1</div>
                <div>
                  <p className="font-medium text-gray-900">Connect Platforms</p>
                  <p className="mt-1">Add your API credentials for each platform you want to post to.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700 font-bold text-sm">2</div>
                <div>
                  <p className="font-medium text-gray-900">Enable & Save</p>
                  <p className="mt-1">Toggle the switch to enable each platform and save your credentials.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700 font-bold text-sm">3</div>
                <div>
                  <p className="font-medium text-gray-900">Auto-Share</p>
                  <p className="mt-1">New blog posts are automatically shared to all enabled platforms.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Configure Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          {selectedPlatform && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      PLATFORM_COLORS[selectedPlatform.id]?.bg || 'bg-gray-50'
                    }`}
                  >
                    <PlatformIcon
                      platformId={selectedPlatform.id}
                      className={`h-5 w-5 ${PLATFORM_COLORS[selectedPlatform.id]?.text || 'text-gray-600'}`}
                    />
                  </div>
                  <div>
                    <DialogTitle>Configure {selectedPlatform.name}</DialogTitle>
                    <DialogDescription>{selectedPlatform.description}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                {/* WhatsApp special message */}
                {selectedPlatform.id === 'whatsapp' ? (
                  <div className="p-4 bg-green-50 rounded-lg text-sm text-green-700 border border-green-200">
                    <p className="font-medium">No API credentials needed!</p>
                    <p className="mt-1 text-green-600">
                      WhatsApp does not support automated posting via API. Blog posts automatically generate shareable WhatsApp links you can use in Status, Groups, or broadcast lists.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Auth Type Badge */}
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        <Key className="h-3 w-3 mr-1" />
                        {selectedPlatform.authType === 'api_key' ? 'API Key' : 'OAuth 2.0'}
                      </Badge>
                      <a
                        href={selectedPlatform.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" /> View API Documentation
                      </a>
                    </div>

                    <Separator />

                    {/* Credential Fields */}
                    <div className="space-y-4">
                      {selectedPlatform.credentials.map((cred) => (
                        <div key={cred.key}>
                          <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                            <Key className="h-3.5 w-3.5 text-gray-400" />
                            {cred.label}
                            {cred.required && <span className="text-red-400">*</span>}
                          </Label>
                          <Input
                            type={cred.type || 'text'}
                            className="mt-1.5 font-mono text-sm"
                            placeholder={cred.placeholder}
                            value={formValues[cred.key] || ''}
                            onChange={(e) =>
                              setFormValues((prev) => ({ ...prev, [cred.key]: e.target.value }))
                            }
                          />
                        </div>
                      ))}
                    </div>

                    {/* Last Error */}
                    {selectedPlatform.lastError && (
                      <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg text-xs text-red-600 border border-red-100">
                        <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>{selectedPlatform.lastError}</span>
                      </div>
                    )}

                    {/* Setup Guide Toggle */}
                    {selectedPlatform.setupGuide && (
                      <div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-teal-600 hover:text-teal-700 p-0 h-auto"
                          onClick={() => setShowGuide(!showGuide)}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          {showGuide ? 'Hide Setup Guide' : 'Show Setup Guide'}
                        </Button>
                        {showGuide && (
                          <pre className="mt-3 p-4 bg-gray-50 rounded-lg text-xs text-gray-600 whitespace-pre-wrap font-mono border border-gray-200 leading-relaxed">
                            {selectedPlatform.setupGuide}
                          </pre>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Actions */}
                <div className="flex justify-between pt-2">
                  {selectedPlatform.status === 'connected' && selectedPlatform.id !== 'whatsapp' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      onClick={() => {
                        handleDisconnect(selectedPlatform.id);
                        setShowModal(false);
                      }}
                    >
                      <Link2Off className="h-4 w-4 mr-1" /> Disconnect
                    </Button>
                  ) : (
                    <div />
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowModal(false)}>
                      Cancel
                    </Button>
                    {selectedPlatform.id !== 'whatsapp' && (
                      <Button
                        size="sm"
                        className="bg-teal-600 hover:bg-teal-700 text-white"
                        onClick={handleSave}
                        disabled={saving === selectedPlatform.id}
                      >
                        {saving === selectedPlatform.id ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Key className="h-4 w-4 mr-1" />
                        )}
                        Save Credentials
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== PLATFORM CARD COMPONENT ====================

function PlatformCard({
  platform,
  onToggle,
  onConfigure,
  onDisconnect,
}: {
  platform: Platform;
  onToggle: (id: string, enabled: boolean) => void;
  onConfigure: (platform: Platform) => void;
  onDisconnect: (id: string) => void;
}) {
  const colors = PLATFORM_COLORS[platform.id] || { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', badge: 'bg-gray-100 text-gray-600' };
  const isConnected = platform.status === 'connected';

  return (
    <Card className={`overflow-hidden transition-all duration-200 hover:shadow-md ${isConnected ? colors.border + ' border-2' : 'border'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors.bg}`}>
              <PlatformIcon platformId={platform.id} className={`h-5 w-5 ${colors.text}`} />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">{platform.name}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{platform.description}</CardDescription>
            </div>
          </div>
          <Switch
            checked={platform.enabled}
            onCheckedChange={(v) => onToggle(platform.id, v)}
          />
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Status Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge
              variant={isConnected ? 'default' : 'secondary'}
              className={`text-xs ${isConnected ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-100'}`}
            >
              {isConnected ? (
                <><CheckCircle2 className="h-3 w-3 mr-1" /> Connected</>
              ) : (
                <><XCircle className="h-3 w-3 mr-1" /> Not Connected</>
              )}
            </Badge>
            {platform.totalPosts > 0 && (
              <span className="text-xs text-gray-400">{platform.totalPosts} posts</span>
            )}
          </div>
          {isConnected && platform.lastPostedAt && (
            <span className="text-xs text-gray-400">
              Last: {new Date(platform.lastPostedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-4">
          {isConnected && platform.id !== 'whatsapp' ? (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 text-xs"
              onClick={() => onDisconnect(platform.id)}
            >
              <Link2Off className="h-3.5 w-3.5 mr-1" /> Disconnect
            </Button>
          ) : null}
          <Button
            variant={isConnected ? 'outline' : 'default'}
            size="sm"
            className={`flex-1 text-xs ${
              isConnected
                ? 'border-teal-200 text-teal-600 hover:bg-teal-50'
                : 'bg-teal-600 hover:bg-teal-700 text-white'
            }`}
            onClick={() => onConfigure(platform)}
          >
            {isConnected ? (
              <><Settings2 className="h-3.5 w-3.5 mr-1" /> Reconfigure</>
            ) : (
              <><Link2 className="h-3.5 w-3.5 mr-1" /> Connect</>
            )}
          </Button>
        </div>

        {/* Error Indicator */}
        {platform.lastError && isConnected && (
          <div className="mt-3 flex items-start gap-1.5 text-xs text-red-500">
            <XCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span className="line-clamp-2">{platform.lastError}</span>
          </div>
        )}

        {/* Docs Link */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <a
            href={platform.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-teal-600 flex items-center gap-1 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            API Documentation
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
