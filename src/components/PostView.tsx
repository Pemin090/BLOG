import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Clock,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  Edit2,
  Trash2,
  Calendar,
  Check,
  Tag
} from 'lucide-react';
import { marked } from 'marked';
import confetti from 'canvas-confetti';
import { Post, Comment } from '../types/index.js';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { CommentSection } from './CommentSection.js';

interface PostViewProps {
  post: Post;
  onBack: () => void;
  onEdit: (post: Post) => void;
  onDelete: (postId: string) => void;
  onSelectRelatedPost: (relatedPost: Post) => void;
  allPosts: Post[];
}

export const PostView: React.FC<PostViewProps> = ({
  post,
  onBack,
  onEdit,
  onDelete,
  onSelectRelatedPost,
  allPosts
}) => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [currentPost, setCurrentPost] = useState<Post>(post);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [claps, setClaps] = useState(post.claps);
  const [isClapping, setIsClapping] = useState(false);

  const isAuthor = user && currentPost.authorId === user.id;

  // Load comments
  useEffect(() => {
    async function fetchComments() {
      try {
        const res = await api.comments.getForPost(currentPost.id);
        setComments(res.comments);
      } catch (err) {
        console.error('Failed to load comments:', err);
      } finally {
        setIsLoadingComments(false);
      }
    }
    fetchComments();
  }, [currentPost.id]);

  const handleClap = async () => {
    setClaps(prev => prev + 1);
    setIsClapping(true);
    setTimeout(() => setIsClapping(false), 300);

    confetti({
      particleCount: 25,
      spread: 45,
      origin: { y: 0.85 },
      colors: ['#f43f5e', '#ec4899', '#a855f7', '#6366f1']
    });

    try {
      const res = await api.posts.like(currentPost.id);
      setClaps(res.claps);
    } catch (err) {
      console.error('Failed to register clap:', err);
    }
  };

  const handleShare = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      success('Link copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toastError('Could not copy link.');
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this story? This cannot be undone.')) return;

    try {
      await api.posts.delete(currentPost.id);
      success('Story deleted successfully.');
      onDelete(currentPost.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete story';
      toastError(msg);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }).format(d);
    } catch {
      return isoString;
    }
  };

  const relatedPosts = allPosts
    .filter(p => p.id !== currentPost.id && (p.category === currentPost.category || p.tags.some(t => currentPost.tags.includes(t))))
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-28">
      {/* Article Navigation Bar */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors py-2 px-3 rounded-xl hover:bg-zinc-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Stories</span>
        </button>

        <div className="flex items-center gap-2">
          {isAuthor && (
            <>
              <button
                onClick={() => onEdit(currentPost)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-600 text-zinc-200 hover:text-white transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Story</span>
              </button>
              <button
                onClick={handleDeletePost}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-zinc-900 border border-rose-900/40 hover:bg-rose-950/40 text-rose-300 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </>
          )}

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-600 text-zinc-300 hover:text-white transition-colors"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{isCopied ? 'Copied' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Main Article Container */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 mt-4">
        
        {/* Meta Header */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">
              {currentPost.category}
            </span>
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <Clock className="w-3.5 h-3.5" />
              <span>{currentPost.readTimeMinutes} min read</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <Eye className="w-3.5 h-3.5" />
              <span>{currentPost.views} reads</span>
            </div>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-zinc-100 leading-tight">
            {currentPost.title}
          </h1>

          <p className="text-lg sm:text-xl text-zinc-400 font-normal leading-relaxed">
            {currentPost.excerpt}
          </p>

          {/* Author Block */}
          <div className="flex items-center gap-4 py-4 border-y border-zinc-800/80">
            <img
              src={currentPost.author.avatar}
              alt={currentPost.author.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-zinc-700 shadow-md"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-zinc-200">{currentPost.author.name}</span>
                <span className="text-zinc-600">•</span>
                <span className="text-xs text-zinc-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-zinc-500" />
                  {formatDate(currentPost.createdAt)}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                {currentPost.author.bio || 'Staff author at InkFlow Publishing.'}
              </p>
            </div>
          </div>
        </div>

        {/* Hero Cover Image */}
        <div className="rounded-3xl overflow-hidden border border-zinc-800/80 mb-10 shadow-2xl aspect-[16/10] bg-zinc-950">
          <img
            src={currentPost.coverImage}
            alt={currentPost.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Markdown Rendered Article Body */}
        <div className="markdown-body">
          <div
            dangerouslySetInnerHTML={{
              __html: marked.parse(currentPost.content) as string
            }}
          />
        </div>

        {/* Tag Cloud */}
        <div className="mt-12 pt-6 border-t border-zinc-800/80">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
            Topics in this story
          </p>
          <div className="flex flex-wrap gap-2">
            {currentPost.tags.map(t => (
              <span
                key={t}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs bg-zinc-900 text-zinc-300 border border-zinc-800 hover:border-zinc-700 transition-colors"
              >
                <Tag className="w-3 h-3 text-indigo-400" />
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Embedded Comments Section */}
        <div id="comments-section">
          <CommentSection
            postId={currentPost.id}
            postAuthorId={currentPost.authorId}
            comments={comments}
            onCommentAdded={(newComment) => {
              if (newComment.parentId) {
                // Attach into nested tree
                setComments(prev => {
                  const updateReplies = (list: Comment[]): Comment[] => {
                    return list.map(c => {
                      if (c.id === newComment.parentId) {
                        return { ...c, replies: [...(c.replies || []), newComment] };
                      }
                      if (c.replies && c.replies.length > 0) {
                        return { ...c, replies: updateReplies(c.replies) };
                      }
                      return c;
                    });
                  };
                  return updateReplies(prev);
                });
              } else {
                setComments(prev => [newComment, ...prev]);
              }
            }}
            onCommentDeleted={(deletedId) => {
              const filterTree = (list: Comment[]): Comment[] => {
                return list
                  .filter(c => c.id !== deletedId)
                  .map(c => ({
                    ...c,
                    replies: c.replies ? filterTree(c.replies) : []
                  }));
              };
              setComments(prev => filterTree(prev));
            }}
          />
        </div>

        {/* Related Articles Footer */}
        {relatedPosts.length > 0 && (
          <div className="mt-16 pt-10 border-t border-zinc-800">
            <h4 className="font-serif text-2xl text-zinc-100 mb-6">
              More Stories You Might Like
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedPosts.map(rp => (
                <div
                  key={rp.id}
                  onClick={() => onSelectRelatedPost(rp)}
                  className="group cursor-pointer p-4 rounded-2xl bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-800/80 transition-all"
                >
                  <img
                    src={rp.coverImage}
                    alt={rp.title}
                    className="w-full aspect-[16/10] object-cover rounded-xl mb-3 group-hover:scale-102 transition-transform"
                  />
                  <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">
                    {rp.category}
                  </span>
                  <h5 className="font-serif text-base text-zinc-200 group-hover:text-indigo-300 line-clamp-2 mt-1">
                    {rp.title}
                  </h5>
                </div>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* Sticky Floating Interaction Bar */}
      <div className="fixed bottom-6 inset-x-0 z-30 flex justify-center px-4 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-3 px-5 py-2.5 rounded-full bg-zinc-900/90 border border-zinc-700/80 backdrop-blur-xl shadow-2xl">
          <button
            onClick={handleClap}
            className={`flex items-center gap-2 text-zinc-300 hover:text-rose-400 transition-all ${isClapping ? 'scale-125 text-rose-400' : ''}`}
            title="Clap for this story"
          >
            <Heart className={`w-4 h-4 ${claps > 0 ? 'text-rose-400 fill-rose-400/20' : ''}`} />
            <span className="text-xs font-semibold">{claps}</span>
          </button>

          <div className="w-[1px] h-4 bg-zinc-700/80" />

          <button
            onClick={() => {
              const el = document.getElementById('comments-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center gap-2 text-zinc-300 hover:text-indigo-400 transition-colors"
            title="Jump to responses"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="text-xs font-semibold">
              {comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)}
            </span>
          </button>

          <div className="w-[1px] h-4 bg-zinc-700/80" />

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-zinc-300 hover:text-white transition-colors text-xs font-medium"
            title="Share story"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isCopied ? 'Copied' : 'Share'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
