"use client";

import { useState, useEffect } from "react";
import PublicLayout from "@/components/mcs/PublicLayout";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Calendar, BookOpen, ArrowLeft, Clock, Share2, User, ChevronRight, Home } from "lucide-react";
import Link from "next/link";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  metaTitle: string | null;
  metaDesc: string | null;
  content: string;
  excerpt: string | null;
  category: string;
  keywords: string | null;
  author: string;
  scheduledAt: string;
  createdAt: string;
}

export default function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [slug, setSlug] = useState("");

  useEffect(() => {
    params.then(p => setSlug(p.slug));
  }, [params]);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/blog/${encodeURIComponent(slug)}`)
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(data => setPost(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
  const getReadingTime = (content: string) => `${Math.max(3, Math.ceil(content.split(/\s+/).length / 200))} min read`;
  const getWordCount = (content: string) => content.split(/\s+/).length;

  const renderInlineFormatting = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="font-semibold text-gray-800">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return <em key={i}>{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  const renderMarkdown = (md: string) => {
    return md.split("\n").map((line, i) => {
      if (line.startsWith("### ")) {
        return <h3 key={i} className="text-xl font-bold text-gray-900 mt-10 mb-4 leading-tight">{renderInlineFormatting(line.replace("### ", ""))}</h3>;
      }
      if (line.startsWith("## ")) {
        return <h2 key={i} className="text-2xl font-bold text-gray-900 mt-12 mb-5 leading-tight pb-3 border-b border-gray-100">{renderInlineFormatting(line.replace("## ", ""))}</h2>;
      }
      if (line.startsWith("# ")) {
        return <h1 key={i} className="text-3xl font-bold text-gray-900 mt-8 mb-4">{line.replace("# ", "")}</h1>;
      }
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return <li key={i} className="ml-6 text-gray-600 leading-relaxed mb-2 list-disc">{renderInlineFormatting(line.replace(/^[-*]\s/, ""))}</li>;
      }
      if (/^\d+\.\s/.test(line)) {
        return <li key={i} className="ml-6 text-gray-600 leading-relaxed mb-2 list-decimal">{renderInlineFormatting(line.replace(/^\d+\.\s/, ""))}</li>;
      }
      if (line.startsWith("**Q:") || line.startsWith("**Q :")) {
        return <p key={i} className="font-semibold text-gray-900 mt-6 mb-2 text-lg">{renderInlineFormatting(line)}</p>;
      }
      if (line.startsWith("**A:") || line.startsWith("**A :")) {
        return <p key={i} className="text-gray-600 leading-relaxed mb-4 ml-4 pl-4 border-l-[3px] border-teal-500">{renderInlineFormatting(line)}</p>;
      }
      if (line.trim() === "") return <div key={i} className="h-3" />;
      if (line.startsWith("---")) return <hr key={i} className="my-8 border-gray-200" />;
      return <p key={i} className="text-gray-600 leading-relaxed mb-4 text-[16px]">{renderInlineFormatting(line)}</p>;
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: post?.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied!");
    }
  };

  if (loading) {
    return (
      <PublicLayout activeNav="/blog">
        <div className="max-w-3xl mx-auto px-4 py-20">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-4" />
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-8" />
            <div className="space-y-3">{[...Array(8)].map((_, i) => <div key={i} className="h-4 bg-gray-100 rounded" />)}</div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (notFound || !post) {
    return (
      <PublicLayout activeNav="/blog">
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Article Not Found</h1>
          <p className="text-gray-500 mb-8">The article you are looking for does not exist.</p>
          <Link href="/blog" className="text-teal-600 hover:text-teal-800 font-medium">Back to Blog</Link>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout activeNav="/blog">
      <article className="bg-white">
        <div className="bg-gray-50 border-b">
          <div className="max-w-3xl mx-auto px-4 py-3">
            <nav className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
              <Link href="/" className="hover:text-teal-600 flex items-center gap-1"><Home className="h-3.5 w-3.5" /> Home</Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <Link href="/blog" className="hover:text-teal-600">Blog</Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-gray-900 font-medium truncate max-w-[200px]">{post.title}</span>
            </nav>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 pt-10 pb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Badge className="bg-teal-100 text-teal-800 mb-4">{post.category}</Badge>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">{post.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-8 pb-8 border-b">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{post.author}</p>
                  <p className="text-xs text-gray-400">Dental Expert</p>
                </div>
              </div>
              <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {formatDate(post.scheduledAt)}</span>
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {getReadingTime(post.content)}</span>
              <span className="text-gray-400">{getWordCount(post.content)} words</span>
              <button onClick={handleShare} className="ml-auto flex items-center gap-1.5 text-teal-600 hover:text-teal-800 transition-colors">
                <Share2 className="h-4 w-4" /> Share
              </button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
            {renderMarkdown(post.content)}
          </motion.div>

          {post.keywords && (
            <div className="mt-12 pt-8 border-t">
              <p className="text-sm font-medium text-gray-500 mb-3">Related Topics</p>
              <div className="flex flex-wrap gap-2">
                {post.keywords.split(",").map(kw => (
                  <Link key={kw.trim()} href={`/blog?search=${encodeURIComponent(kw.trim())}`} className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full hover:bg-teal-50 hover:text-teal-700 transition-colors">
                    {kw.trim()}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-12 p-8 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl border border-teal-100">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-teal-600 flex items-center justify-center shrink-0">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="font-bold text-teal-900 text-lg mb-1">Need Expert Dental Care in Vijayawada?</h3>
                <p className="text-sm text-teal-700">Visit Mouth Care Solutions for professional treatment by 10 specialist dentists.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <a href="tel:+919866344866" className="bg-teal-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors text-center">Call 9866344866</a>
                <a href="https://wa.me/919866344866?text=Hi%2C%20I%20read%20your%20blog%20and%20want%20to%20book%20an%20appointment." target="_blank" rel="noopener noreferrer" className="bg-[#25D366] text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-[#20bd5a] transition-colors text-center">WhatsApp Us</a>
              </div>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Link href="/blog" className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-800 font-medium">
              <ArrowLeft className="h-4 w-4" /> Back to All Articles
            </Link>
          </div>
        </div>
      </article>
    </PublicLayout>
  );
}