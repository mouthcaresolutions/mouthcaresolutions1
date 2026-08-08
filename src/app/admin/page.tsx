"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboard, FileText, Bot, LogOut, Search, Plus, Trash2, Edit3, Play, Settings, Loader2, FileBarChart, Clock, CheckCircle, XCircle, RefreshCw, ChevronLeft, ChevronRight, ExternalLink, BarChart3, Calendar, ArrowUpRight
} from "lucide-react";

const CATEGORIES = [
  "All",
  "General Dentistry",
  "Cosmetic Dentistry",
  "Oral Hygiene",
  "Pediatric Dentistry",
  "Implants & Prosthodontics",
  "Orthodontics",
  "Preventive Dental Care",
];

interface Post {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string | null;
  category: string;
  keywords: string | null;
  status: string;
  scheduledAt: string;
  createdAt: string;
  updatedAt: string;
}

interface AutoBloggerLog {
  id: string;
  status: string;
  postsCreated: number;
  postsFailed: number;
  error: string | null;
  duration: number;
  ranAt: string;
}

type Tab = "dashboard" | "posts" | "autoblogger" | "newpost";

export default function AdminPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [user, setUser] = useState<{ username: string; name: string; role: string } | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [loading, setLoading] = useState(true);
  const [mobileSidebar, setMobileSidebar] = useState(false);

  // Dashboard state
  const [stats, setStats] = useState<any>(null);

  // Posts state
  const [posts, setPosts] = useState<Post[]>([]);
  const [postTotal, setPostTotal] = useState(0);
  const [postPage, setPostPage] = useState(1);
  const [postFilter, setPostFilter] = useState("All");
  const [postSearch, setPostSearch] = useState("");
  const [postSearchInput, setPostSearchInput] = useState("");

  // Auto-blogger state
  const [bloggerConfig, setBloggerConfig] = useState<any>(null);
  const [bloggerLogs, setBloggerLogs] = useState<AutoBloggerLog[]>([]);
  const [bloggerTreatments, setBloggerTreatments] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState("");
  const [bulkTreatment, setBulkTreatment] = useState("");
  const [bulkCount, setBulkCount] = useState(10);
  const [bulkGenerating, setBulkGenerating] = useState(false);

  // New post state
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newExcerpt, setNewExcerpt] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newKeywords, setNewKeywords] = useState("");
  const [newStatus, setNewStatus] = useState("published");
  const [savingPost, setSavingPost] = useState(false);

  // Edit post state
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  const getToken = useCallback(() => localStorage.getItem("admin_token") || "", []);

  useEffect(() => {
    const t = getToken();
    const u = localStorage.getItem("admin_user");
    if (!t || !u) {
      router.push("/admin/login");
      return;
    }
    // Defer setState to avoid synchronous setState in effect
    queueMicrotask(() => {
      setToken(t);
      setUser(JSON.parse(u));
      setLoading(false);
    });
  }, [getToken, router]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats", { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.status === 401) { router.push("/admin/login"); return; }
      const data = await res.json();
      setStats(data);
    } catch (e) { console.error(e); }
  }, [getToken, router]);

  const fetchPosts = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: postPage.toString(), limit: "15" });
      if (postFilter !== "All") params.set("category", postFilter);
      if (postSearch) params.set("search", postSearch);
      const res = await fetch(`/api/admin/posts?${params}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.status === 401) { router.push("/admin/login"); return; }
      const data = await res.json();
      setPosts(data.posts || []);
      setPostTotal(data.total || 0);
    } catch (e) { console.error(e); }
  }, [getToken, router, postPage, postFilter, postSearch]);

  const fetchBlogger = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/autoblogger", { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.status === 401) { router.push("/admin/login"); return; }
      const data = await res.json();
      setBloggerConfig(data.config);
      setBloggerLogs(data.logs || []);
      setBloggerTreatments(data.treatments || []);
    } catch (e) { console.error(e); }
  }, [getToken, router]);

  useEffect(() => {
    if (!token) return;
    const load = async () => { try { await fetchStats(); } catch(e) { /* ignore */ } };
    load();
  }, [token]);

  useEffect(() => {
    if (!token || activeTab !== "posts") return;
    const load = async () => { try { await fetchPosts(); } catch(e) { /* ignore */ } };
    load();
  }, [token, activeTab]);

  useEffect(() => {
    if (!token || activeTab !== "autoblogger") return;
    const load = async () => { try { await fetchBlogger(); } catch(e) { /* ignore */ } };
    load();
  }, [token, activeTab]);

  const logout = () => {
    fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout", token }),
    });
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    router.push("/admin/login");
  };

  const deletePost = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    await fetch(`/api/admin/posts?id=${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    fetchPosts();
  };

  const togglePostStatus = async (post: Post) => {
    const newStatus = post.status === "published" ? "draft" : "published";
    await fetch("/api/admin/posts", {
      method: "PUT",
      headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id: post.id, status: newStatus }),
    });
    fetchPosts();
  };

  const saveNewPost = async () => {
    if (!newTitle || !newContent || !newCategory) return;
    setSavingPost(true);
    try {
      const res = await fetch("/api/admin/posts", {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle, content: newContent, excerpt: newExcerpt,
          category: newCategory, keywords: newKeywords, status: newStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewTitle(""); setNewContent(""); setNewExcerpt("");
        setNewKeywords(""); setNewStatus("published");
        setActiveTab("posts");
        alert("Post created!");
      }
    } catch (e) { console.error(e); }
    setSavingPost(false);
  };

  const saveEditPost = async () => {
    if (!editingPost) return;
    try {
      await fetch("/api/admin/posts", {
        method: "PUT",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify(editingPost),
      });
      setEditingPost(null);
      fetchPosts();
    } catch (e) { console.error(e); }
  };

  const generateNow = async (count: number = 3) => {
    setGenerating(true);
    setGenProgress(`Generating ${count} articles...`);
    try {
      const res = await fetch("/api/admin/autoblogger", {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generateNow", count }),
      });
      const data = await res.json();
      setGenProgress(`Done! Created: ${data.postsCreated}, Failed: ${data.postsFailed}, Time: ${data.duration}s`);
      fetchBlogger();
    } catch (e) { setGenProgress("Generation failed"); }
    setGenerating(false);
    setTimeout(() => setGenProgress(""), 5000);
  };

  const bulkGenerate = async () => {
    if (!bulkTreatment) return;
    setBulkGenerating(true);
    setGenProgress(`Generating ${bulkCount} articles for ${bulkTreatment}...`);
    try {
      const res = await fetch("/api/admin/autoblogger", {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bulkGenerate", treatmentName: bulkTreatment, count: bulkCount }),
      });
      const data = await res.json();
      setGenProgress(`Done! Created: ${data.postsCreated}, Failed: ${data.postsFailed}, Time: ${data.duration}s`);
      fetchBlogger();
    } catch (e) { setGenProgress("Generation failed"); }
    setBulkGenerating(false);
    setTimeout(() => setGenProgress(""), 5000);
  };

  const updateBloggerConfig = async (updates: any) => {
    try {
      const res = await fetch("/api/admin/autoblogger", {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateConfig", ...updates }),
      });
      const data = await res.json();
      if (data.success) setBloggerConfig(data.config);
    } catch (e) { console.error(e); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  const sidebarItems = [
    { id: "dashboard" as Tab, label: "Dashboard", icon: LayoutDashboard },
    { id: "posts" as Tab, label: "All Posts", icon: FileText },
    { id: "newpost" as Tab, label: "New Post", icon: Plus },
    { id: "autoblogger" as Tab, label: "Auto Blogger", icon: Bot },
  ];

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:w-64 bg-teal-900 text-white flex-col fixed inset-y-0 left-0 z-40">
        <div className="p-5 border-b border-teal-800">
          <h2 className="text-lg font-bold">MCS Admin</h2>
          <p className="text-teal-300 text-xs">Content Dashboard</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === item.id
                  ? "bg-teal-700 text-white"
                  : "text-teal-200 hover:bg-teal-800 hover:text-white"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-teal-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-teal-200">{user?.name || "Admin"}</span>
            <Button variant="ghost" size="sm" onClick={logout} className="text-teal-300 hover:text-white hover:bg-teal-800">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          <a href="/" className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-200">
            <ExternalLink className="h-3 w-3" /> View Website
          </a>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileSidebar && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileSidebar(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-teal-900 text-white p-5">
            <h2 className="text-lg font-bold mb-4">MCS Admin</h2>
            <nav className="space-y-1">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setMobileSidebar(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium ${
                    activeTab === item.id ? "bg-teal-700" : "text-teal-200"
                  }`}
                >
                  <item.icon className="h-4 w-4" /> {item.label}
                </button>
              ))}
            </nav>
            <button onClick={logout} className="mt-6 text-sm text-teal-300 flex items-center gap-2">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 min-h-screen">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 hover:bg-gray-100 rounded-md" onClick={() => setMobileSidebar(true)}>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-900">
              {activeTab === "dashboard" && "Dashboard"}
              {activeTab === "posts" && "All Posts"}
              {activeTab === "newpost" && "Create New Post"}
              {activeTab === "autoblogger" && "Auto Blogger"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" target="_blank" className="text-sm text-teal-600 hover:text-teal-800 hidden sm:flex items-center gap-1">
              <ExternalLink className="h-3.5 w-3.5" /> View Site
            </a>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-1" /> Logout
            </Button>
          </div>
        </header>

        <div className="p-4 lg:p-8">
          {/* ==================== DASHBOARD TAB ==================== */}
          {activeTab === "dashboard" && stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Total Posts</p><p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalPosts}</p></div><FileBarChart className="h-10 w-10 text-teal-100" /></div></CardContent></Card>
                <Card><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Published</p><p className="text-3xl font-bold text-green-600 mt-1">{stats.publishedPosts}</p></div><CheckCircle className="h-10 w-10 text-green-100" /></div></CardContent></Card>
                <Card><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Drafts</p><p className="text-3xl font-bold text-amber-600 mt-1">{stats.draftPosts}</p></div><FileText className="h-10 w-10 text-amber-100" /></div></CardContent></Card>
                <Card><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">This Week</p><p className="text-3xl font-bold text-blue-600 mt-1">{stats.recentWeekPosts}</p></div><ArrowUpRight className="h-10 w-10 text-blue-100" /></div></CardContent></Card>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader><CardTitle className="text-base">Posts by Category</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(stats.postsByCategory || []).map((c: any) => (
                        <div key={c.category} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{c.category}</span>
                          <div className="flex items-center gap-3">
                            <div className="w-32 bg-gray-100 rounded-full h-2">
                              <div className="bg-teal-500 h-2 rounded-full" style={{ width: `${Math.min(100, (c._count.category / (stats.totalPosts || 1)) * 100)}%` }} />
                            </div>
                            <span className="text-sm font-medium text-gray-600 w-8 text-right">{c._count.category}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base">Recent Posts</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(stats.recentPosts || []).map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                          <div className="min-w-0 flex-1 mr-3">
                            <p className="text-sm font-medium text-gray-800 truncate">{p.title}</p>
                            <p className="text-xs text-gray-400">{p.category} &middot; {formatDate(p.scheduledAt)}</p>
                          </div>
                          <Badge variant="secondary" className="shrink-0 text-xs bg-teal-50 text-teal-700">{p.category.split(' ')[0]}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {stats.autoBloggerConfig && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Auto Blogger Status</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div><p className="text-sm text-gray-500">Status</p><p className={`font-semibold mt-1 ${stats.autoBloggerConfig.status === 'running' ? 'text-blue-600' : 'text-green-600'}`}>{stats.autoBloggerConfig.status}</p></div>
                      <div><p className="text-sm text-gray-500">Total Generated</p><p className="text-2xl font-bold mt-1">{stats.autoBloggerConfig.totalGenerated}</p></div>
                      <div><p className="text-sm text-gray-500">Posts/Day Setting</p><p className="text-2xl font-bold mt-1">{stats.autoBloggerConfig.postsPerDay}</p></div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ==================== POSTS TAB ==================== */}
          {activeTab === "posts" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full sm:w-auto">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="Search posts..." value={postSearchInput} onChange={(e) => setPostSearchInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { setPostSearch(postSearchInput); setPostPage(1); } }} className="pl-9" />
                  </div>
                  <Select value={postFilter} onValueChange={(v) => { setPostFilter(v); setPostPage(1); }}>
                    <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Button onClick={() => setActiveTab("newpost")} className="bg-teal-600 hover:bg-teal-700 text-white shrink-0">
                  <Plus className="h-4 w-4 mr-1" /> New Post
                </Button>
              </div>

              <div className="text-sm text-gray-500">{postTotal} posts total</div>

              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left p-3 font-medium text-gray-500">Title</th>
                        <th className="text-left p-3 font-medium text-gray-500 hidden md:table-cell">Category</th>
                        <th className="text-left p-3 font-medium text-gray-500 hidden sm:table-cell">Date</th>
                        <th className="text-left p-3 font-medium text-gray-500">Status</th>
                        <th className="text-right p-3 font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {posts.map((post) => (
                        <tr key={post.id} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="p-3 max-w-xs"><p className="font-medium text-gray-900 truncate">{post.title}</p><p className="text-xs text-gray-400 mt-0.5">{post.slug.substring(0, 40)}...</p></td>
                          <td className="p-3 hidden md:table-cell"><Badge variant="secondary" className="text-xs bg-teal-50 text-teal-700">{post.category}</Badge></td>
                          <td className="p-3 text-gray-500 hidden sm:table-cell whitespace-nowrap">{formatDate(post.scheduledAt)}</td>
                          <td className="p-3"><Badge variant={post.status === "published" ? "default" : "secondary"} className={post.status === "published" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>{post.status}</Badge></td>
                          <td className="p-3 text-right whitespace-nowrap">
                            <Button variant="ghost" size="sm" onClick={() => togglePostStatus(post)} className="text-gray-500 hover:text-teal-600"><RefreshCw className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => setEditingPost(post)} className="text-gray-500 hover:text-blue-600"><Edit3 className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => deletePost(post.id)} className="text-gray-500 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-center items-center gap-3">
                <Button variant="outline" size="sm" disabled={postPage <= 1} onClick={() => setPostPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                <span className="text-sm text-gray-500">Page {postPage} of {Math.max(1, Math.ceil(postTotal / 15))}</span>
                <Button variant="outline" size="sm" disabled={postPage >= Math.ceil(postTotal / 15)} onClick={() => setPostPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
              </div>

              {/* Edit Dialog */}
              <Dialog open={!!editingPost} onOpenChange={() => setEditingPost(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>Edit Post</DialogTitle></DialogHeader>
                  {editingPost && (
                    <div className="space-y-4">
                      <div><Label>Title</Label><Input value={editingPost.title} onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })} /></div>
                      <div><Label>Category</Label><Select value={editingPost.category} onValueChange={(v) => setEditingPost({ ...editingPost, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.filter(c => c !== "All").map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                      <div><Label>Content (Markdown)</Label><Textarea value={editingPost.content} onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })} rows={15} className="font-mono text-sm" /></div>
                      <div className="flex gap-3"><Button onClick={saveEditPost} className="bg-teal-600 hover:bg-teal-700 text-white">Save Changes</Button><Button variant="outline" onClick={() => setEditingPost(null)}>Cancel</Button></div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* ==================== NEW POST TAB ==================== */}
          {activeTab === "newpost" && (
            <div className="max-w-3xl space-y-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Create New Post</CardTitle><CardDescription>Write a new blog post manually</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <div><Label htmlFor="np-title">Title</Label><Input id="np-title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Article title..." /></div>
                  <div><Label htmlFor="np-cat">Category</Label><Select value={newCategory} onValueChange={setNewCategory}><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent>{CATEGORIES.filter(c => c !== "All").map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label htmlFor="np-excerpt">Excerpt</Label><Textarea id="np-excerpt" value={newExcerpt} onChange={(e) => setNewExcerpt(e.target.value)} placeholder="Brief summary..." rows={2} /></div>
                  <div><Label htmlFor="np-content">Content (Markdown)</Label><Textarea id="np-content" value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder="# Article Title\n\nYour content here..." rows={15} className="font-mono text-sm" /></div>
                  <div><Label htmlFor="np-kw">Keywords (comma separated)</Label><Input id="np-kw" value={newKeywords} onChange={(e) => setNewKeywords(e.target.value)} placeholder="root canal, vijayawada, dentist" /></div>
                  <div className="flex items-center gap-3">
                    <Label>Status:</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="published">Published</SelectItem><SelectItem value="draft">Draft</SelectItem></SelectContent></Select>
                  </div>
                  <Button onClick={saveNewPost} disabled={savingPost || !newTitle || !newContent || !newCategory} className="bg-teal-600 hover:bg-teal-700 text-white">
                    {savingPost && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Publish Post
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ==================== AUTO BLOGGER TAB ==================== */}
          {activeTab === "autoblogger" && (
            <div className="space-y-6">
              {/* Config Card */}
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bot className="h-5 w-5" /> Auto Blogger Settings</CardTitle><CardDescription>Configure automatic blog post generation for SEO</CardDescription></CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div><p className="font-medium">Auto Blogging</p><p className="text-sm text-gray-500">Automatically generate and publish SEO articles</p></div>
                    <Switch checked={bloggerConfig?.enabled} onCheckedChange={(v) => updateBloggerConfig({ enabled: v })} />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div><Label>Posts Per Day</Label><Select value={bloggerConfig?.postsPerDay?.toString() || "3"} onValueChange={(v) => updateBloggerConfig({ postsPerDay: parseInt(v) })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">1 post/day</SelectItem><SelectItem value="2">2 posts/day</SelectItem><SelectItem value="3">3 posts/day</SelectItem><SelectItem value="5">5 posts/day</SelectItem></SelectContent></Select></div>
                    <div><Label>Status</Label><p className={`mt-2 font-semibold ${bloggerConfig?.status === 'running' ? 'text-blue-600' : 'text-green-600'}`}>{bloggerConfig?.status || 'idle'}</p></div>
                  </div>
                  <div><Label>Categories</Label><Input value={bloggerConfig?.categories || ''} onChange={(e) => updateBloggerConfig({ categories: e.target.value })} placeholder="Comma separated categories" /></div>
                  {bloggerConfig && <div className="grid sm:grid-cols-3 gap-4 pt-2 border-t"><div><p className="text-xs text-gray-500">Total Generated</p><p className="text-xl font-bold">{bloggerConfig.totalGenerated}</p></div><div><p className="text-xs text-gray-500">Failed</p><p className="text-xl font-bold text-red-600">{bloggerConfig.failedCount}</p></div><div><p className="text-xs text-gray-500">Last Run</p><p className="text-sm font-medium mt-1">{bloggerConfig.lastRunAt ? formatDate(bloggerConfig.lastRunAt) : 'Never'}</p></div></div>}
                </CardContent>
              </Card>

              {/* Quick Generate */}
              <Card>
                <CardHeader><CardTitle className="text-base">Quick Generate</CardTitle><CardDescription>Generate posts immediately</CardDescription></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {[1, 3, 5].map(n => (
                      <Button key={n} onClick={() => generateNow(n)} disabled={generating} variant="outline" className="border-teal-300 hover:bg-teal-50">
                        {generating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Play className="h-4 w-4 mr-1" />}
                        Generate {n} Post{n > 1 ? 's' : ''}
                      </Button>
                    ))}
                  </div>
                  {genProgress && <p className="mt-3 text-sm text-teal-700 bg-teal-50 p-3 rounded-lg">{genProgress}</p>}
                </CardContent>
              </Card>

              {/* Bulk Generate by Treatment */}
              <Card>
                <CardHeader><CardTitle className="text-base">Bulk Generate by Treatment</CardTitle><CardDescription>Generate multiple articles for a specific dental treatment</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-3 gap-3">
                    <Select value={bulkTreatment} onValueChange={setBulkTreatment}>
                      <SelectTrigger><SelectValue placeholder="Select treatment" /></SelectTrigger>
                      <SelectContent>{bloggerTreatments.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={bulkCount.toString()} onValueChange={(v) => setBulkCount(parseInt(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="5">5 articles</SelectItem><SelectItem value="10">10 articles</SelectItem><SelectItem value="20">20 articles</SelectItem><SelectItem value="50">50 articles</SelectItem></SelectContent>
                    </Select>
                    <Button onClick={bulkGenerate} disabled={bulkGenerating || !bulkTreatment} className="bg-teal-600 hover:bg-teal-700 text-white">
                      {bulkGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Bot className="h-4 w-4 mr-2" />}
                      Bulk Generate
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Generation Logs */}
              <Card>
                <CardHeader><CardTitle className="text-base">Generation History</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b"><tr><th className="text-left p-3 font-medium text-gray-500">Date</th><th className="text-left p-3 font-medium text-gray-500">Status</th><th className="text-left p-3 font-medium text-gray-500">Created</th><th className="text-left p-3 font-medium text-gray-500">Failed</th><th className="text-left p-3 font-medium text-gray-500">Duration</th></tr></thead>
                      <tbody>
                        {bloggerLogs.map((log) => (
                          <tr key={log.id} className="border-b last:border-0">
                            <td className="p-3 text-gray-600">{formatDate(log.ranAt)}</td>
                            <td className="p-3"><Badge variant={log.status === 'success' ? 'default' : 'destructive'} className={log.status === 'success' ? 'bg-green-100 text-green-700' : ''}>{log.status}</Badge></td>
                            <td className="p-3 font-medium text-green-600">{log.postsCreated}</td>
                            <td className="p-3 font-medium text-red-600">{log.postsFailed}</td>
                            <td className="p-3 text-gray-500">{log.duration}s</td>
                          </tr>
                        ))}
                        {bloggerLogs.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-gray-400">No generation history yet</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
