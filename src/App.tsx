import React, { useState, useEffect } from 'react';
import {
  Search,
  SlidersHorizontal,
  PenSquare,
  Sparkles,
  BookOpen,
  TrendingUp,
  Tag,
  Folder,
  Layers,
  ArrowRight,
  RefreshCw,
  Plus,
  Terminal,
  Heart,
  Eye,
  MessageSquare
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ToastProvider, useToast } from './context/ToastContext.js';
import { Navbar } from './components/Navbar.js';
import { AuthModal } from './components/AuthModal.js';
import { PostCard } from './components/PostCard.js';
import { PostView } from './components/PostView.js';
import { PostEditor } from './components/PostEditor.js';
import { ApiExplorer } from './components/ApiExplorer.js';
import { Post, Category, PlatformStats } from './types/index.js';
import { api } from './services/api.js';

function BlogApp() {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const { success, error: toastError } = useToast();

  const [currentView, setCurrentView] = useState<'home' | 'post' | 'editor' | 'api-docs' | 'my-stories'>('home');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [popularTags, setPopularTags] = useState<{ tag: string; count: number }[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch initial data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [postsRes, catRes, tagRes, statsRes] = await Promise.all([
        api.posts.getAll({
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          tag: selectedTag || undefined,
          search: searchQuery.trim() || undefined
        }),
        api.categories.getAll(),
        api.tags.getAll(),
        api.stats.get()
      ]);

      setPosts(postsRes.posts);
      setCategories(catRes.categories);
      setPopularTags(tagRes.tags);
      setStats(statsRes);
    } catch (err) {
      console.error('Failed to load blog data:', err);
      toastError('Could not fetch stories from the backend server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory, selectedTag]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenNewStory = () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    setEditingPost(null);
    setCurrentView('editor');
  };

  const handleSelectPost = async (post: Post) => {
    try {
      // Fetch fresh post by ID/slug to ensure latest views & claps
      const res = await api.posts.getBySlugOrId(post.id);
      setSelectedPost(res.post);
      setCurrentView('post');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setSelectedPost(post);
      setCurrentView('post');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setCurrentView('editor');
  };

  const handleDeletePost = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    if (selectedPost?.id === postId) {
      setSelectedPost(null);
      setCurrentView('home');
    }
    // Refresh stats
    api.stats.get().then(setStats).catch(() => {});
  };

  const handlePostSaved = (savedPost: Post) => {
    // If it was an edit, update in posts list, else prepend
    setPosts(prev => {
      const idx = prev.findIndex(p => p.id === savedPost.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = savedPost;
        return next;
      }
      return [savedPost, ...prev];
    });

    setSelectedPost(savedPost);
    setCurrentView('post');
    api.stats.get().then(setStats).catch(() => {});
  };

  // Filtered stories for "My Stories" view
  const myStories = user ? posts.filter(p => p.authorId === user.id) : [];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Global Navigation Bar */}
      <Navbar
        currentView={currentView}
        onNavigate={(view, postId) => {
          if (postId) {
            const target = posts.find(p => p.id === postId);
            if (target) handleSelectPost(target);
          } else {
            setCurrentView(view);
            if (view === 'home') {
              setSelectedPost(null);
            }
          }
        }}
        onOpenNewStory={handleOpenNewStory}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentView === 'editor' ? (
          <PostEditor
            initialPost={editingPost}
            onClose={() => {
              if (selectedPost) {
                setCurrentView('post');
              } else {
                setCurrentView('home');
              }
            }}
            onPostSaved={handlePostSaved}
          />
        ) : currentView === 'post' && selectedPost ? (
          <PostView
            post={selectedPost}
            allPosts={posts}
            onBack={() => {
              setSelectedPost(null);
              setCurrentView('home');
            }}
            onEdit={handleEditPost}
            onDelete={handleDeletePost}
            onSelectRelatedPost={handleSelectPost}
          />
        ) : currentView === 'api-docs' ? (
          <ApiExplorer />
        ) : currentView === 'my-stories' ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-zinc-800">
              <div>
                <h1 className="font-serif text-3xl sm:text-4xl text-zinc-100">My Stories & Drafts</h1>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                  Manage the publications you have authored on InkFlow.
                </p>
              </div>
              <button
                onClick={handleOpenNewStory}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all shadow-md shadow-indigo-600/30"
              >
                <Plus className="w-4 h-4" />
                <span>Write New Story</span>
              </button>
            </div>

            {myStories.length === 0 ? (
              <div className="text-center py-16 px-4 rounded-3xl bg-zinc-900/30 border border-dashed border-zinc-800">
                <BookOpen className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-zinc-300">You haven't written any stories yet</h3>
                <p className="text-sm text-zinc-500 mt-1 max-w-sm mx-auto">
                  Share your knowledge, architectural insights, or design ideas with the world!
                </p>
                <button
                  onClick={handleOpenNewStory}
                  className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all"
                >
                  <PenSquare className="w-4 h-4" />
                  <span>Start Your First Post</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myStories.map(p => (
                  <PostCard
                    key={p.id}
                    post={p}
                    onClick={() => handleSelectPost(p)}
                    onEdit={() => handleEditPost(p)}
                    onDelete={() => handleDeletePost(p.id)}
                    currentUserId={user?.id}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Home View */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            
            {/* Hero / Platform Overview Strip */}
            <div className="relative rounded-3xl p-6 sm:p-10 mb-10 overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800/80 shadow-2xl">
              <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
              <div className="relative z-10 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium text-indigo-300 bg-indigo-950/70 border border-indigo-800/50 mb-4">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Full-Stack Architecture & Content Platform
                </div>

                <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-zinc-100 leading-tight">
                  Where thoughtful software engineers & designers publish.
                </h1>

                <p className="mt-3 text-sm sm:text-lg text-zinc-400 leading-relaxed max-w-2xl">
                  Explore in-depth articles on distributed architecture, API design, recursive commenting systems, and interface craft.
                </p>

                {/* Platform Analytics Bar */}
                {stats && (
                  <div className="mt-6 pt-6 border-t border-zinc-800/80 flex flex-wrap items-center gap-6 sm:gap-10 text-xs">
                    <div>
                      <span className="block font-serif text-xl sm:text-2xl font-bold text-zinc-100">
                        {stats.totalPosts}
                      </span>
                      <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Published Stories</span>
                    </div>
                    <div>
                      <span className="block font-serif text-xl sm:text-2xl font-bold text-zinc-100">
                        {stats.totalComments}
                      </span>
                      <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Reader Discussions</span>
                    </div>
                    <div>
                      <span className="block font-serif text-xl sm:text-2xl font-bold text-zinc-100">
                        {stats.totalClaps}
                      </span>
                      <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Claps & Reactions</span>
                    </div>
                    <div>
                      <span className="block font-serif text-xl sm:text-2xl font-bold text-zinc-100">
                        {stats.totalViews}
                      </span>
                      <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Total Reads</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Filter Bar: Search & Categories */}
            <div className="space-y-4 mb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Search Bar */}
                <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search by title, keyword, or tag..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-20 py-2 bg-zinc-900/80 border border-zinc-800 rounded-2xl text-xs sm:text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        loadData();
                      }}
                      className="absolute right-12 top-2.5 text-zinc-500 hover:text-zinc-300 text-xs"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1.5 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-xl font-medium transition-colors"
                  >
                    Find
                  </button>
                </form>

                {/* Popular Tags */}
                {popularTags.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                    <span className="text-xs text-zinc-500 shrink-0 flex items-center gap-1 mr-1">
                      <Tag className="w-3 h-3 text-zinc-600" />
                      Tags:
                    </span>
                    {popularTags.slice(0, 5).map(({ tag, count }) => {
                      const isTagSelected = selectedTag === tag;
                      return (
                        <button
                          key={tag}
                          onClick={() => {
                            setSelectedTag(isTagSelected ? null : tag);
                          }}
                          className={`px-2.5 py-1 rounded-xl text-xs font-mono shrink-0 transition-all ${
                            isTagSelected
                              ? 'bg-indigo-600 text-white font-semibold'
                              : 'bg-zinc-900/70 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
                          }`}
                        >
                          #{tag} <span className="opacity-60 text-[10px]">({count})</span>
                        </button>
                      );
                    })}
                    {selectedTag && (
                      <button
                        onClick={() => setSelectedTag(null)}
                        className="text-xs text-indigo-400 hover:underline shrink-0 ml-1"
                      >
                        Reset Tag
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-zinc-800/60 scrollbar-none">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium shrink-0 transition-all ${
                    selectedCategory === 'all'
                      ? 'bg-zinc-100 text-zinc-900 font-semibold shadow-md'
                      : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                  }`}
                >
                  All Topics
                </button>
                {categories.map((cat) => {
                  const isCatSelected = selectedCategory === cat.name;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(isCatSelected ? 'all' : cat.name)}
                      className={`px-4 py-1.5 rounded-full text-xs font-medium shrink-0 transition-all ${
                        isCatSelected
                          ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30'
                          : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                      }`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Loading Spinner */}
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center text-zinc-500">
                <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-3" />
                <span className="text-sm">Fetching stories from database...</span>
              </div>
            ) : posts.length === 0 ? (
              /* Empty Results State */
              <div className="text-center py-20 px-4 rounded-3xl bg-zinc-900/30 border border-dashed border-zinc-800">
                <Search className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-zinc-300">No matching stories found</h3>
                <p className="text-sm text-zinc-500 mt-1 max-w-sm mx-auto">
                  Try adjusting your search terms, removing filters, or be the first to publish on this topic!
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setSelectedTag(null);
                      setSearchQuery('');
                      loadData();
                    }}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors"
                  >
                    Reset All Filters
                  </button>
                  <button
                    onClick={handleOpenNewStory}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors"
                  >
                    Write a Story
                  </button>
                </div>
              </div>
            ) : (
              /* Stories Feed */
              <div className="space-y-8">
                {/* Hero Featured Story (First post if no search filter) */}
                {!searchQuery && selectedCategory === 'all' && !selectedTag && posts.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-3">
                      <TrendingUp className="w-4 h-4" />
                      Featured Publication
                    </div>
                    <PostCard
                      post={posts[0]}
                      featured={true}
                      onClick={() => handleSelectPost(posts[0])}
                      onEdit={() => handleEditPost(posts[0])}
                      onDelete={() => handleDeletePost(posts[0].id)}
                      currentUserId={user?.id}
                    />
                  </div>
                )}

                {/* Grid of Remaining Stories */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-serif text-2xl text-zinc-100">
                      {selectedCategory !== 'all' ? `${selectedCategory} Stories` : 'Recent Stories'}
                    </h3>
                    <span className="text-xs text-zinc-500 font-mono">
                      {(!searchQuery && selectedCategory === 'all' && !selectedTag ? posts.slice(1) : posts).length} articles
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(!searchQuery && selectedCategory === 'all' && !selectedTag ? posts.slice(1) : posts).map(post => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onClick={() => handleSelectPost(post)}
                        onEdit={() => handleEditPost(post)}
                        onDelete={() => handleDeletePost(post.id)}
                        currentUserId={user?.id}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </main>

      {/* Global Auth Modal */}
      <AuthModal />

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-10 mt-16 text-zinc-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-serif text-lg text-zinc-300">InkFlow</span>
            <span className="text-zinc-600">|</span>
            <span>Full-stack blogging & commenting platform</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => setCurrentView('api-docs')}
              className="text-zinc-400 hover:text-indigo-400 transition-colors flex items-center gap-1"
            >
              <Terminal className="w-3.5 h-3.5" />
              REST API Explorer
            </button>
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Back to Top ↑
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BlogApp />
      </ToastProvider>
    </AuthProvider>
  );
}
