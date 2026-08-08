"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {  Calendar, Search, ArrowLeft, ArrowRight, BookOpen, X, Loader2 } from "lucide-react";

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
}

interface BlogPostFull {
  id: string;
  slug: string;
  title: string;
  metaTitle: string | null;
  metaDesc: string | null;
  excerpt: string | null;
  content: string;
  category: string;
  keywords: string | null;
  author: string;
  scheduledAt: string;
  createdAt: string;
}

export default function BlogSection() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPostFull | null>(null);
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
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12",
      });
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

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setPage(1);
  };

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setPage(1);
  };

  const openPost = async (slug: string) => {
    try {
      const res = await fetch(`/api/blog/${encodeURIComponent(slug)}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedPost(data);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      console.error("Failed to fetch post:", err);
    }
  };

  const closePost = () => {
    setSelectedPost(null);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Blog post detail view
  if (selectedPost) {
    return (
      <section id="blog" className="py-20 bg-white min-h-screen">
        <div className="max-w-3xl mx-auto px-4">
          <button
            onClick={closePost}
            className="flex items-center gap-2 text-teal-600 hover:text-teal-800 mb-8 font-medium text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to All Articles
          </button>

          <article>
            <Badge className="bg-teal-100 text-teal-800 mb-4">
              {selectedPost.category}
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">
              {selectedPost.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-8 pb-6 border-b">
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />
                {selectedPost.author}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formatDate(selectedPost.scheduledAt)}
              </span>
            </div>
            <div className="prose prose-gray max-w-none">
              {selectedPost.content
                .split("\n")
                .map((line, i) => {
                  if (line.startsWith("## ")) {
                    return (
                      <h2
                        key={i}
                        className="text-xl font-bold text-gray-900 mt-8 mb-3"
                      >
                        {line.replace("## ", "")}
                      </h2>
                    );
                  }
                  if (line.startsWith("# ")) {
                    return (
                      <h1
                        key={i}
                        className="text-2xl font-bold text-gray-900 mt-8 mb-3"
                      >
                        {line.replace("# ", "")}
                      </h1>
                    );
                  }
                  if (line.trim() === "") {
                    return <br key={i} />;
                  }
                  return (
                    <p
                      key={i}
                      className="text-gray-600 leading-relaxed mb-3"
                    >
                      {line}
                    </p>
                  );
                })}
            </div>
          </article>

          <div className="mt-10 p-6 bg-teal-50 rounded-xl border border-teal-100">
            <h3 className="font-semibold text-teal-900 mb-2">
              Need Dental Care in Vijayawada?
            </h3>
            <p className="text-sm text-teal-700 mb-4">
              Visit Mouth Care Solutions for expert dental treatment. Call us or
              book your appointment on WhatsApp today!
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="tel:+919866344866"
                className="inline-flex items-center gap-2 bg-teal-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
              >
                Call 9866344866
              </a>
              <a
                href="https://wa.me/919866344866?text=Hi%2C%20I%20read%20your%20blog%20and%20want%20to%20book%20an%20appointment."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#25D366] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#20bd5a] transition-colors"
              >
                WhatsApp Us
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Blog listing view
  return (
    <section id="blog" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-teal-600 font-semibold text-sm uppercase tracking-wider mb-2"
          >
            Dental Health Blog
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
          >
            Expert Dental Tips & Articles
          </motion.h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Stay informed with our latest articles on dental health, treatments,
            and oral care tips from our expert dentists in Vijayawada.
          </p>
        </div>

        {/* Search + Total count */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search articles..."
              className="pl-9"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchInput("");
                  setSearchQuery("");
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          <p className="text-sm text-gray-500 self-center">
            {total} articles found
          </p>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-teal-600 text-white"
                  : "bg-white text-gray-600 hover:bg-teal-50 border border-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Posts grid */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500">No articles found. Try a different search or category.</p>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <AnimatePresence mode="popLayout">
                {posts.map((post) => (
                  <motion.article
                    key={post.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group"
                    onClick={() => openPost(post.slug)}
                  >
                    <Badge
                      variant="secondary"
                      className="bg-teal-50 text-teal-700 text-xs mb-3"
                    >
                      {post.category}
                    </Badge>
                    <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-teal-700 transition-colors line-clamp-2 leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                      {post.excerpt || post.metaDesc}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(post.scheduledAt)}
                      </span>
                      <span className="text-teal-600 font-medium group-hover:translate-x-1 transition-transform">
                        Read more &rarr;
                      </span>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 mt-10">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="border-teal-300"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="border-teal-300"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
