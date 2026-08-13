"use client";

import { useState, useEffect, useCallback } from "react";
import PublicLayout from "@/components/mcs/PublicLayout";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar, Search, ArrowLeft, ArrowRight, Loader2, X, BookOpen, Clock, ImageOff } from "lucide-react";

const CATEGORY_FALLBACKS: Record<string, string> = {
  'Oral Hygiene': 'https://images.pexels.com/photos/5622020/pexels-photo-5622020.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Pediatric Dentistry': 'https://images.pexels.com/photos/52527/pexels-photo-52527.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Orthodontics': 'https://images.pexels.com/photos/6528861/pexels-photo-6528861.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Implants & Prosthodontics': 'https://images.pexels.com/photos/6502305/pexels-photo-6502305.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Preventive Dental Care': 'https://images.pexels.com/photos/6627484/pexels-photo-6627484.jpeg?auto=compress&cs=tinysrgb&w=600',
  'General Dentistry': 'https://images.pexels.com/photos/4045552/pexels-photo-4045552.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Cosmetic Dentistry': 'https://images.pexels.com/photos/6627572/pexels-photo-6627572.jpeg?auto=compress&cs=tinysrgb&w=600',
};
const DEFAULT_IMG = 'https://images.pexels.com/photos/4045552/pexels-photo-4045552.jpeg?auto=compress&cs=tinysrgb&w=600';

function extractImage(content: string): string | null {
  const m = content.match(/<img\s+[^>]*src=["']([^"']+)["']/i);
  return m?.[1] || null;
}

function getPostImage(post: BlogPost, content?: string): string {
  if (content) {
    const img = extractImage(content);
    if (img) return img;
  }
  return CATEGORY_FALLBACKS[post.category] || DEFAULT_IMG;
}

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

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  metaTitle: string | null;
  metaDesc: string | null;
  excerpt: string | null;
  category: string;
  keywords: string | null;
  scheduledAt: string;
  createdAt: string;
  thumbUrl: string | null;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "12" });
      if (activeCategory !== "All") params.set("category", activeCategory);
      if (searchQuery) params.set("search", searchQuery);
      const res = await fetch(`/api/blog?${params}`);
      const data = await res.json();
      setPosts(data.posts || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    } finally {
      setLoading(false);
    }
  }, [page, activeCategory, searchQuery]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleCategoryChange = (cat: string) => { setActiveCategory(cat); setPage(1); };
  const handleSearch = () => { setSearchQuery(searchInput); setPage(1); };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });

  const getReadingTime = (excerpt: string | null) => {
    if (!excerpt) return "5 min read";
    const words = excerpt.split(/\s+/).length;
    return `${Math.max(3, Math.ceil(words / 50))} min read`;
  };

  return (
    <PublicLayout activeNav="/blog">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-teal-700 to-emerald-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Badge className="bg-white/20 text-white border-white/30 mb-4">Dental Health Blog</Badge>
            <h1 className="text-3xl sm:text-5xl font-bold mb-4">Expert Dental Tips & Articles</h1>
            <p className="text-teal-100 max-w-2xl mx-auto text-lg">
              Comprehensive dental health guides, treatment information, and expert tips from our specialist dentists in Vijayawada.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Search + Total count */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search dental articles..."
              className="pl-9"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            {searchQuery && (
              <button onClick={() => { setSearchInput(""); setSearchQuery(""); }} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          <p className="text-sm text-gray-500 self-center">{total} articles found</p>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-teal-600 text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-teal-50 border border-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Posts grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 text-teal-600 animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No articles found. Try a different search or category.</p>
          </div>
        ) : (
          <>
            {/* Featured post (first) */}
            {page === 1 && !searchQuery && activeCategory === "All" && posts.length > 0 && (
              <a href={`/blog/${posts[0].slug}`} className="block mb-8 group">
                <motion.article
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl overflow-hidden border border-teal-100 hover:shadow-xl transition-all"
                >
                  <div className="grid md:grid-cols-2 gap-0">
                    <div className="h-64 md:h-auto bg-gradient-to-br from-teal-200 to-emerald-300 flex items-center justify-center overflow-hidden">
                      {posts[0].thumbUrl ? (
                        <img src={posts[0].thumbUrl} alt={posts[0].title} className="w-full h-full object-cover" />
                      ) : (
                        <BookOpen className="h-24 w-24 text-teal-400" />
                      )}
                    </div>
                    <div className="p-8 flex flex-col justify-center">
                      <Badge className="bg-teal-100 text-teal-800 mb-3 w-fit">{posts[0].category}</Badge>
                      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 group-hover:text-teal-700 transition-colors leading-tight">
                        {posts[0].title}
                      </h2>
                      <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                        {posts[0].excerpt || posts[0].metaDesc}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{formatDate(posts[0].scheduledAt)}</span>
                        <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{getReadingTime(posts[0].excerpt)}</span>
                      </div>
                    </div>
                  </div>
                </motion.article>
              </a>
            )}

            {/* Grid of remaining posts */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {(page === 1 && !searchQuery && activeCategory === "All" ? posts.slice(1) : posts).map((post) => (
                  <motion.a
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all group flex flex-col"
                  >
                    <div className="h-44 bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center overflow-hidden">
                      {post.thumbUrl ? (
                        <img src={post.thumbUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <BookOpen className="h-12 w-12 text-teal-300 group-hover:scale-110 transition-transform" />
                      )}
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <Badge variant="secondary" className="bg-teal-50 text-teal-700 text-xs mb-3 w-fit">{post.category}</Badge>
                      <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-teal-700 transition-colors line-clamp-2 leading-snug">
                        {post.title}
                      </h3>
                      <p className="text-sm text-gray-500 mb-4 line-clamp-3 flex-1 leading-relaxed">
                        {post.excerpt || post.metaDesc}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-50 pt-3">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(post.scheduledAt)}</span>
                        <span className="text-teal-600 font-medium group-hover:translate-x-1 transition-transform">Read article &rarr;</span>
                      </div>
                    </div>
                  </motion.a>
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 mt-12">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="border-teal-300">
                  <ArrowLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                          page === pageNum ? "bg-teal-600 text-white" : "hover:bg-teal-50 text-gray-600"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="border-teal-300">
                  Next <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </PublicLayout>
  );
}
