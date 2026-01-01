import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { FileText, Wand2, ArrowRight } from 'lucide-react';
import classNames from 'classnames';

export default function HomePage() {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchArticles() {
            try {
                const { data, error } = await supabase
                    .from('articles')
                    .select('*')
                    .order('created_at', { ascending: false }) // Use created_at
                    .limit(20);

                if (error) throw error;
                setArticles(data || []);
            } catch (e) {
                console.error("Failed to fetch articles", e);
            } finally {
                setLoading(false);
            }
        }
        fetchArticles();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
                    Articles
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    View original scraped content and their AI-enhanced versions side-by-side.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map((article) => (
                    <div key={article.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden flex flex-col">
                        <div className="p-6 flex-1">
                            <div className="flex items-center gap-2 mb-3">
                                <span className={classNames(
                                    "px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide",
                                    article.status === 'enriched'
                                        ? "bg-green-100 text-green-800"
                                        : "bg-gray-100 text-gray-800"
                                )}>
                                    {article.status}
                                </span>
                                <span className="text-xs text-gray-400">
                                    {new Date(article.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                                {article.title}
                            </h3>
                            <p className="text-gray-500 line-clamp-3 text-sm">
                                {article.original_content.substring(0, 150)}...
                            </p>
                        </div>
                        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t border-gray-100">
                            <div className="flex gap-2">
                                <FileText className="w-4 h-4 text-gray-400" />
                                {article.status === 'enriched' && <Wand2 className="w-4 h-4 text-purple-500" />}
                            </div>
                            <Link
                                to={`/article/${article.id}`}
                                className="text-blue-600 font-medium text-sm flex items-center gap-1 hover:text-blue-800 transition-colors"
                            >
                                Read Changes <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                ))}

                {articles.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        No articles found.
                    </div>
                )}
            </div>
        </div >
    );
}
