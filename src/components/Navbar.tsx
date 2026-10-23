import React, { useState } from 'react';
import { PenSquare, Terminal, User as UserIcon, LogOut, ChevronDown, BookOpen, Layers, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface NavbarProps {
  currentView: 'home' | 'post' | 'editor' | 'api-docs' | 'my-stories';
  onNavigate: (view: 'home' | 'post' | 'editor' | 'api-docs' | 'my-stories', postId?: string) => void;
  onOpenNewStory: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, onOpenNewStory }) => {
  const { user, isAuthenticated, logout, openAuthModal, demoLogin } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center space-x-6">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 text-left group transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-400 p-[1px] shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-zinc-950 rounded-[11px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </div>
            <div>
              <span className="font-serif text-2xl tracking-tight text-zinc-100 group-hover:text-indigo-400 transition-colors">
                InkFlow
              </span>
              <span className="hidden md:inline-block ml-2 text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-950/60 text-indigo-300 border border-indigo-800/40">
                Full-Stack CMS
              </span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => onNavigate('home')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'home'
                  ? 'text-zinc-100 bg-zinc-800/70'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
            >
              Stories
            </button>
            <button
              onClick={() => onNavigate('api-docs')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'api-docs'
                  ? 'text-indigo-300 bg-indigo-950/40 border border-indigo-800/40'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              REST API Explorer
            </button>
            {isAuthenticated && (
              <button
                onClick={() => onNavigate('my-stories')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'my-stories'
                    ? 'text-zinc-100 bg-zinc-800/70'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`}
              >
                My Stories
              </button>
            )}
          </nav>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          {/* Write / New Story Button */}
          <button
            onClick={onOpenNewStory}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-md shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <PenSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Write Story</span>
          </button>

          {/* User Profile or Sign In */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900/80 transition-all text-left"
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-lg object-cover border border-zinc-700"
                />
                <span className="hidden sm:inline text-sm font-medium text-zinc-200 max-w-[120px] truncate">
                  {user.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </button>

              {isDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2 border-b border-zinc-800/80">
                      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Signed in as</p>
                      <p className="text-sm font-medium text-zinc-100 truncate">{user.name}</p>
                      <p className="text-xs text-zinc-400 truncate">{user.email}</p>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onOpenNewStory();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800/80 hover:text-zinc-100 transition-colors"
                      >
                        <PenSquare className="w-4 h-4 text-indigo-400" />
                        New Story
                      </button>
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onNavigate('my-stories');
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800/80 hover:text-zinc-100 transition-colors"
                      >
                        <BookOpen className="w-4 h-4 text-indigo-400" />
                        My Stories
                      </button>
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onNavigate('api-docs');
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800/80 hover:text-zinc-100 transition-colors"
                      >
                        <Terminal className="w-4 h-4 text-indigo-400" />
                        REST API Explorer
                      </button>
                    </div>

                    <div className="border-t border-zinc-800/80 pt-1">
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-400 hover:bg-rose-950/30 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => openAuthModal('login')}
                className="px-3.5 py-1.5 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => openAuthModal('register')}
                className="hidden sm:inline-flex px-3.5 py-1.5 text-sm font-medium rounded-xl border border-zinc-700 hover:border-zinc-600 bg-zinc-900 text-zinc-200 hover:text-white transition-colors"
              >
                Create Account
              </button>
              <button
                onClick={() => demoLogin('sarah')}
                title="Quick login as author Sarah Chen"
                className="px-2.5 py-1 text-xs font-mono rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-all"
              >
                Demo Author
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
