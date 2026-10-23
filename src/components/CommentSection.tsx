import React, { useState } from 'react';
import { MessageSquare, Heart, Reply, Trash2, Send, CornerDownRight, User } from 'lucide-react';
import { Comment, User as UserType } from '../types/index.js';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';

interface CommentSectionProps {
  postId: string;
  postAuthorId: string;
  comments: Comment[];
  onCommentAdded: (newComment: Comment) => void;
  onCommentDeleted: (commentId: string) => void;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  postAuthorId,
  comments,
  onCommentAdded,
  onCommentDeleted
}) => {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const { success, error: toastError } = useToast();

  const [newCommentText, setNewCommentText] = useState('');
  const [guestName, setGuestName] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [likedComments, setLikedComments] = useState<Record<string, number>>({});

  const formatRelativeTime = (isoString: string) => {
    try {
      const past = new Date(isoString).getTime();
      const now = Date.now();
      const diffSec = Math.floor((now - past) / 1000);

      if (diffSec < 60) return 'Just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return `${diffHour}h ago`;
      const diffDay = Math.floor(diffHour / 24);
      if (diffDay < 30) return `${diffDay}d ago`;

      return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(isoString));
    } catch {
      return 'recently';
    }
  };

  const handleCreateComment = async (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault();
    const content = parentId ? replyText.trim() : newCommentText.trim();

    if (!content) return;

    if (!isAuthenticated && !guestName.trim() && !parentId) {
      toastError('Please enter your name or sign in to comment.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.comments.create(postId, {
        content,
        parentId,
        authorName: isAuthenticated ? user?.name : (guestName.trim() || 'Guest Reader')
      });

      onCommentAdded(res.comment);
      if (parentId) {
        setReplyText('');
        setReplyingToId(null);
      } else {
        setNewCommentText('');
      }
      success('Response posted!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to post response';
      toastError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (commentId: string, currentLikes: number) => {
    // Optimistic update
    const previous = likedComments[commentId] ?? currentLikes;
    setLikedComments(prev => ({ ...prev, [commentId]: previous + 1 }));

    try {
      const res = await api.comments.like(commentId);
      setLikedComments(prev => ({ ...prev, [commentId]: res.likes }));
    } catch (err) {
      // Revert
      setLikedComments(prev => ({ ...prev, [commentId]: previous }));
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await api.comments.delete(commentId);
      onCommentDeleted(commentId);
      success('Comment removed.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not delete comment';
      toastError(msg);
    }
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const isPostAuthor = comment.authorId === postAuthorId;
    const isCommentAuthor = user && comment.authorId === user.id;
    const canDelete = isAuthenticated && (isCommentAuthor || (user && user.id === postAuthorId));
    const likesCount = likedComments[comment.id] ?? comment.likes;

    return (
      <div
        key={comment.id}
        className={`group relative ${isReply ? 'ml-6 sm:ml-10 mt-3 pt-3 border-t border-zinc-800/50' : 'p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/70 mb-4'}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={comment.authorAvatar}
              alt={comment.authorName}
              className="w-8 h-8 rounded-full object-cover border border-zinc-700 bg-zinc-800"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-zinc-200">{comment.authorName}</span>
                {isPostAuthor && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-medium uppercase bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                    Author
                  </span>
                )}
              </div>
              <span className="text-xs text-zinc-500">{formatRelativeTime(comment.createdAt)}</span>
            </div>
          </div>

          {canDelete && (
            <button
              onClick={() => handleDelete(comment.id)}
              className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-400 p-1 rounded transition-all"
              title="Delete Comment"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Comment Body */}
        <p className="mt-3 text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
          {comment.content}
        </p>

        {/* Engagement Actions */}
        <div className="mt-3 flex items-center gap-4 text-xs">
          <button
            onClick={() => handleLike(comment.id, comment.likes)}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-rose-400 transition-colors"
          >
            <Heart className={`w-3.5 h-3.5 ${likesCount > 0 ? 'text-rose-400 fill-rose-400/20' : ''}`} />
            <span>{likesCount}</span>
          </button>

          {!isReply && (
            <button
              onClick={() => setReplyingToId(replyingToId === comment.id ? null : comment.id)}
              className="flex items-center gap-1.5 text-zinc-400 hover:text-indigo-400 transition-colors"
            >
              <Reply className="w-3.5 h-3.5" />
              <span>Reply</span>
            </button>
          )}
        </div>

        {/* Nested Reply Box */}
        {replyingToId === comment.id && (
          <form
            onSubmit={(e) => handleCreateComment(e, comment.id)}
            className="mt-3 pt-3 border-t border-zinc-800/60 flex flex-col gap-2 animate-in fade-in duration-150"
          >
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <CornerDownRight className="w-3.5 h-3.5 text-indigo-400" />
              <span>Replying to {comment.authorName}</span>
            </div>
            <textarea
              rows={2}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write your reply..."
              className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 resize-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReplyingToId(null)}
                className="px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !replyText.trim()}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
              >
                Reply
              </button>
            </div>
          </form>
        )}

        {/* Render Nested Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-1">
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="mt-12 pt-8 border-t border-zinc-800/80">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-serif text-2xl sm:text-3xl text-zinc-100 flex items-center gap-2.5">
          <MessageSquare className="w-5 h-5 text-indigo-400" />
          Responses ({comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)})
        </h3>

        {!isAuthenticated && (
          <button
            onClick={() => openAuthModal('login')}
            className="text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
          >
            Sign in for full member perks
          </button>
        )}
      </div>

      {/* Main Comment Composer */}
      <form
        onSubmit={(e) => handleCreateComment(e, null)}
        className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shadow-inner mb-8"
      >
        <div className="flex items-start gap-3">
          <img
            src={
              isAuthenticated && user
                ? user.avatar
                : 'https://api.dicebear.com/7.x/identicon/svg?seed=guest'
            }
            alt="Current avatar"
            className="w-9 h-9 rounded-full object-cover border border-zinc-700 mt-1"
          />
          <div className="flex-1 space-y-3">
            {!isAuthenticated && (
              <div>
                <input
                  type="text"
                  placeholder="Your Name (or Guest Reader)"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full sm:w-64 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            <textarea
              rows={3}
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="What are your thoughts on this story? Share your perspective..."
              className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 resize-none transition-colors"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-zinc-500">
                Markdown styling supported
              </span>
              <button
                type="submit"
                disabled={isSubmitting || !newCommentText.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-medium transition-all shadow-md shadow-indigo-600/25 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publish Response</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-10 px-4 rounded-2xl bg-zinc-900/20 border border-dashed border-zinc-800">
            <MessageSquare className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-zinc-400">No responses yet</p>
            <p className="text-xs text-zinc-500 mt-1">Be the first to share your thoughts!</p>
          </div>
        ) : (
          comments.map(c => renderComment(c))
        )}
      </div>
    </section>
  );
};
