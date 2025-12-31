import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, BookOpen } from 'lucide-react';

export default function Layout({ children }) {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <nav className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                                <Bot className="h-8 w-8 text-blue-600" />
                                <span className="font-bold text-xl tracking-tight">BeyondChats AutoBlog</span>
                            </Link>
                        </div>
                        <div className="flex items-center">
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Phase 3 Demo
                            </span>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>

            <footer className="bg-white border-t mt-auto">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
                    &copy; {new Date().getFullYear()} BeyondChats Automation.
                </div>
            </footer>
        </div>
    );
}
