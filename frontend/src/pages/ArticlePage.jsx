import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, SplitSquareHorizontal, FileText, Wand2 } from 'lucide-react';
import classNames from 'classnames';

export default function ArticlePage() {
    const { id } = useParams();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState('enriched'); // 'original' | 'enriched' | 'split'

    useEffect(() => {
        async function fetchArticle() {
            try {
                const { data, error } = await supabase
                    .from('articles')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;

                setArticle(data);
                if (data.status !== 'enriched') {
                    setMode('original');
                }
            } catch (e) {
                console.error("Failed to load article", e);
            } finally {
                setLoading(false);
            }
        }
        fetchArticle();
    }, [id]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!article) return <div className="text-center py-12">Article not found.</div>;

    return (
        <div>
            <Link to="/" className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Articles
            </Link>

            <header className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{article.title}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 border-b pb-6">
                    <span>Source: <a href={article.source_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{article.source_url}</a></span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span>{new Date(article.created_at).toLocaleDateString()}</span>
                </div>
            </header>

            {/* View Toggle */}
            <div className="sticky top-4 z-10 bg-white/80 backdrop-blur-md shadow-sm border rounded-full p-1 inline-flex mb-8 self-center">
                <button
                    onClick={() => setMode('original')}
                    className={classNames(
                        "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                        mode === 'original' ? "bg-gray-900 text-white shadow" : "text-gray-600 hover:bg-gray-100"
                    )}
                >
                    <FileText className="w-4 h-4" /> Original
                </button>
                <button
                    onClick={() => setMode('enriched')}
                    disabled={article.status !== 'enriched'}
                    className={classNames(
                        "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                        mode === 'enriched' ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow" : "text-gray-600 hover:bg-gray-100",
                        article.status !== 'enriched' && "opacity-50 cursor-not-allowed"
                    )}
                >
                    <Wand2 className="w-4 h-4" /> Enriched AI
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 gap-8 animate-in fade-in duration-500">
                {mode === 'original' && (
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 prose max-w-none text-gray-800">
                        <h2 className="text-gray-400 uppercase tracking-widest text-xs font-bold mb-4">Original Scraped Content</h2>
                        <div className="whitespace-pre-wrap">{article.original_content}</div>
                    </div>
                )}

                {mode === 'enriched' && (
                    <div className="bg-white p-8 rounded-2xl shadow-xl shadow-purple-50 border border-purple-100 ring-1 ring-purple-100 prose prose-lg max-w-none prose-headings:text-gray-900 prose-headings:font-bold prose-p:text-gray-600 prose-p:leading-relaxed prose-a:text-blue-600 prose-strong:text-blue-700 prose-strong:font-bold prose-blockquote:border-l-4 prose-blockquote:border-purple-500 prose-blockquote:bg-purple-50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-li:text-gray-600">
                        <h2 className="text-purple-600 uppercase tracking-widest text-xs font-bold mb-4 flex items-center gap-2">
                            <Wand2 className="w-4 h-4" /> Enhanced Version
                        </h2>
                        <ReactMarkdown>{article.generated_content}</ReactMarkdown>
                    </div>
                )}
            </div>
        </div>
    );
}
