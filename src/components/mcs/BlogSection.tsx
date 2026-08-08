"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowRight, BookOpen, Loader2 } from "lucide-react";
import Link from "next/link";

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

export default function BlogSection() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/blog?page=1&limit=6");
      const data = await res.json();
      setPosts(data.posts || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });

  return (
    <section id="blog" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
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
            Stay informed with our latest comprehensive articles on dental health, treatments, and oral care tips from our expert dentists in Vijayawada.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
          </div>
        ) : (
          <>
            {/* Featured post */}
            {posts.length > 0 && (
              <Link href={`/blog/${posts[0].slug}`} className="block mb-8 group">
                <motion.article
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all"
                >
                  <div className="grid md:grid-cols-2 gap-0">
                    <div className="h-52 md:h-auto bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center">
                      <BookOpen className="h-20 w-20 text-teal-300" />
                    </div>
                    <div className="p-6 sm:p-8 flex flex-col justify-center">
                      <Badge className="bg-teal-100 text-teal-800 mb-3 w-fit">{posts[0].category}</Badge>
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 group-hover:text-teal-700 transition-colors leading-tight">
                        {posts[0].title}
                      </h3>
                      <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed text-sm">
                        {posts[0].excerpt || posts[0].metaDesc}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{formatDate(posts[0].scheduledAt)}</span>
                        <span className="text-teal-600 font-medium group-hover:translate-x-1 transition-transform">Read article &rarr;</span>
                      </div>
                    </div>
                  </div>
                </motion.article>
              </Link>
            )}

            {/* Grid of remaining posts */}
            {posts.length > 1 && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
                {posts.slice(1).map((post, i) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link href={`/blog/${post.slug}`} className="block group">
                      <article className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all h-full">
                        <div className="h-40 bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center">
                          <BookOpen className="h-10 w-10 text-teal-200 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="p-5">
                          <Badge variant="secondary" className="bg-teal-50 text-teal-700 text-xs mb-2">{post.category}</Badge>
                          <h4 className="font-semibold text-gray-900 mb-2 group-hover:text-teal-700 transition-colors line-clamp-2 leading-snug text-sm">
                            {post.title}
                          </h4>
                          <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">
                            {post.excerpt || post.metaDesc}
                          </p>
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Calendar className="h-3 w-3" />{formatDate(post.scheduledAt)}
                          </span>
                        </div>
                      </article>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}

            {/* View all button */}
            <div className="text-center">
              <Link href="/blog">
                <Button variant="outline" size="lg" className="border-teal-300 text-teal-700 hover:bg-teal-50">
                  View All {total} Articles <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}