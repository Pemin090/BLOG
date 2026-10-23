import React from 'react';
import { Clock, Eye, Heart, Edit2, Trash2, Tag } from 'lucide-react';
import { Post } from '../types/index.js';

interface PostCardProps {
  post: Post;
  featured?: boolean;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  currentUserId?: string;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  featured = false,
  onClick,
  onEdit,
  onDelete,
  currentUserId
}) => {
  const isAuthor = currentUserId && post.authorId === currentUserId;

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).format(date);
    } catch {
      return isoString;
    }
  };

  if (featured) {
    return (
      <article
        onClick={onClick}
        className="group relative cursor-pointer grid grid-cols-1 lg:grid-cols-12 gap-6 bg-zinc-900/50 hover:bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700/80 rounded-3xl p-6 lg:p-8 transition-all duration-300 shadow-xl overflow-hidden"
      >
        {/* Cover Image */}
        <div className="lg:col-span-7 overflow-hidden rounded-2xl relative aspect-[16/10] bg-zinc-950">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-zinc-900/90 text-indigo-300 border border-indigo-500/30 backdrop-blur-md">
              {post.category}
            </span>
          </div>
          {post.status === 'draft' && (
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-500/90 text-black">
                Draft
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 text-xs text-zinc-400 mb-3">
              <span className="font-medium text-zinc-300">{formatDate(post.createdAt)}</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                <span>{post.readTimeMinutes} min read</span>
              </div>
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl leading-tight text-zinc-100 group-hover:text-indigo-300 transition-colors mb-3">
              {post.title}
            </h2>

            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed line-clamp-3 mb-4">
              {post.excerpt}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-6">
              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs bg-zinc-800/80 text-zinc-300 border border-zinc-700/50"
                >
                  <Tag className="w-3 h-3 text-zinc-500" />
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Author & Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-800/80">
            <div className="flex items-center gap-3">
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="w-10 h-10 rounded-full object-cover border border-zinc-700"
              />
              <div>
                <p className="text-sm font-semibold text-zinc-200">{post.author.name}</p>
                <p className="text-xs text-zinc-500">{post.author.bio || 'Staff Writer'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-zinc-400">
              <div className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                <span>{post.claps}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-zinc-500" />
                <span>{post.views}</span>
              </div>

              {isAuthor && (
                <div className="flex items-center gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                  {onEdit && (
                    <button
                      onClick={onEdit}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                      title="Edit Story"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={onDelete}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-900/50 text-zinc-300 hover:text-rose-400 transition-colors"
                      title="Delete Story"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      onClick={onClick}
      className="group relative cursor-pointer flex flex-col bg-zinc-900/40 hover:bg-zinc-900/70 border border-zinc-800/70 hover:border-zinc-700/80 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-lg"
    >
      {/* Cover Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-zinc-950">
        <img
          src={post.coverImage}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-zinc-900/90 text-indigo-300 border border-indigo-500/30 backdrop-blur-md">
            {post.category}
          </span>
        </div>
        {post.status === 'draft' && (
          <div className="absolute top-3 right-3">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-amber-500/90 text-black">
              Draft
            </span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
            <span>{formatDate(post.createdAt)}</span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-zinc-600" />
              <span>{post.readTimeMinutes} min</span>
            </div>
          </div>

          <h3 className="font-serif text-xl sm:text-2xl leading-snug text-zinc-100 group-hover:text-indigo-300 transition-colors mb-2 line-clamp-2">
            {post.title}
          </h3>

          <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed line-clamp-2 mb-4">
            {post.excerpt}
          </p>
        </div>

        <div>
          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-4">
            {post.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="inline-block px-2 py-0.5 rounded text-[11px] bg-zinc-800/80 text-zinc-400 border border-zinc-700/40"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Author and Stats Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-zinc-800/60">
            <div className="flex items-center gap-2">
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="w-7 h-7 rounded-full object-cover border border-zinc-700"
              />
              <span className="text-xs font-medium text-zinc-300 truncate max-w-[110px]">
                {post.author.name}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3 text-rose-400" />
                <span>{post.claps}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3 text-zinc-500" />
                <span>{post.views}</span>
              </div>

              {isAuthor && (
                <div className="flex items-center gap-1 ml-1" onClick={(e) => e.stopPropagation()}>
                  {onEdit && (
                    <button
                      onClick={onEdit}
                      className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={onDelete}
                      className="p-1 rounded bg-zinc-800 hover:bg-rose-900/50 text-zinc-300 hover:text-rose-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};
