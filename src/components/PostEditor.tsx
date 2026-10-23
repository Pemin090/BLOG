import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Eye,
  Edit3,
  Image as ImageIcon,
  Send,
  Save,
  Bold,
  Italic,
  Heading2,
  Heading3,
  Quote,
  Code,
  List,
  Link as LinkIcon,
  Sparkles,
  X,
  Plus
} from 'lucide-react';
import { marked } from 'marked';
import confetti from 'canvas-confetti';
import { Post } from '../types/index.js';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.js';

interface PostEditorProps {
  initialPost?: Post | null;
  onClose: () => void;
  onPostSaved: (savedPost: Post) => void;
}

const PRESET_COVERS = [
  {
    name: 'Modern Code',
    url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'Minimalist Workspace',
    url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'Deep Cosmos & Cloud',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'Design & Aesthetics',
    url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'Team & Collaboration',
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'Retro Terminal',
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80'
  }
];

const CATEGORIES = [
  'Engineering',
  'Design & UI',
  'Architecture',
  'DevOps & Cloud',
  'Career & Insights',
  'Artificial Intelligence'
];

export const PostEditor: React.FC<PostEditorProps> = ({
  initialPost,
  onClose,
  onPostSaved
}) => {
  const { success, error: toastError } = useToast();

  const [title, setTitle] = useState(initialPost?.title || '');
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt || '');
  const [content, setContent] = useState(
    initialPost?.content ||
      `## Introduction

Write your compelling opening paragraph here. Draw your readers in with clear concepts and practical takeaways.

---

### Key Concepts

- **Point One**: Explain the technical architecture or rationale.
- **Point Two**: Detail how the code or solution works in practice.

\`\`\`typescript
// Example Code Snippet
function calculateVelocity(distance: number, time: number): number {
  return distance / time;
}
\`\`\`

> "Good design is as little design as possible." — Dieter Rams

### Summary & Next Steps

Summarize the key ideas and invite comments from the community below!`
  );

  const [category, setCategory] = useState(initialPost?.category || 'Engineering');
  const [coverImage, setCoverImage] = useState(
    initialPost?.coverImage || PRESET_COVERS[0].url
  );
  const [tags, setTags] = useState<string[]>(
    initialPost?.tags || ['Engineering', 'Tutorial']
  );
  const [newTagInput, setNewTagInput] = useState('');
  const [status, setStatus] = useState<'published' | 'draft'>(
    initialPost?.status || 'published'
  );
  const [activeTab, setActiveTab] = useState<'write' | 'preview' | 'split'>('split');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customCoverUrl, setCustomCoverUrl] = useState('');

  // Handle markdown insertion helpers
  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = document.getElementById('post-markdown-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end) || 'text';
    const replacement = `${before}${selectedText}${after}`;

    const newContent =
      textarea.value.substring(0, start) +
      replacement +
      textarea.value.substring(end);

    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 10);
  };

  const handleAddTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newTagInput.trim().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (submitStatus: 'published' | 'draft') => {
    if (!title.trim()) {
      toastError('Please provide an article title.');
      return;
    }
    if (!content.trim()) {
      toastError('Article content cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (initialPost) {
        // Update existing
        const res = await api.posts.update(initialPost.id, {
          title,
          excerpt,
          content,
          coverImage,
          category,
          tags,
          status: submitStatus
        });
        success('Article updated successfully!');
        onPostSaved(res.post);
      } else {
        // Create new
        const res = await api.posts.create({
          title,
          excerpt,
          content,
          coverImage,
          category,
          tags,
          status: submitStatus
        });

        if (submitStatus === 'published') {
          confetti({
            particleCount: 120,
            spread: 70,
            origin: { y: 0.6 }
          });
          success('Your story has been published to InkFlow!');
        } else {
          success('Story saved as a draft.');
        }

        onPostSaved(res.post);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save story';
      toastError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Top Action Bar */}
      <div className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-900/90 backdrop-blur-md px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-zinc-400 hover:text-zinc-100 px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Cancel</span>
          </button>
          <span className="hidden sm:inline-block text-zinc-700">|</span>
          <span className="text-xs sm:text-sm font-medium text-zinc-400">
            {initialPost ? 'Editing Story' : 'New Story Draft'}
          </span>
        </div>

        {/* View Mode & Submit Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:flex items-center bg-zinc-800/80 rounded-xl p-0.5 border border-zinc-700/60">
            <button
              onClick={() => setActiveTab('write')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'write' ? 'bg-zinc-900 text-zinc-100 shadow' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Write
            </button>
            <button
              onClick={() => setActiveTab('split')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'split' ? 'bg-zinc-900 text-zinc-100 shadow' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Split View
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'preview' ? 'bg-zinc-900 text-zinc-100 shadow' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Preview
            </button>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit('draft')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-zinc-700 hover:border-zinc-600 bg-zinc-900 text-xs sm:text-sm font-medium text-zinc-300 hover:text-white transition-all disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit('published')}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>{initialPost ? 'Update & Publish' : 'Publish Story'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col space-y-6">
        
        {/* Title Input */}
        <div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Story Title..."
            className="w-full bg-transparent font-serif text-3xl sm:text-5xl text-zinc-100 placeholder:text-zinc-700 focus:outline-none border-b border-transparent focus:border-zinc-800 pb-2 transition-colors"
          />
        </div>

        {/* Excerpt Input */}
        <div>
          <input
            type="text"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Write a brief subtitle or excerpt for search engines and cards..."
            className="w-full bg-transparent text-sm sm:text-base text-zinc-300 placeholder:text-zinc-600 focus:outline-none border-b border-transparent focus:border-zinc-800 pb-1.5 transition-colors"
          />
        </div>

        {/* Metadata Controls: Category & Tags */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Topic Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Tags
            </label>
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-indigo-950/60 text-indigo-200 border border-indigo-800/50"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-rose-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <form onSubmit={handleAddTag} className="flex gap-2">
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                placeholder="Add tag (e.g. React, Nextjs)"
                className="flex-1 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors"
              >
                Add
              </button>
            </form>
          </div>
        </div>

        {/* Cover Image Picker */}
        <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-indigo-400" />
              Cover Image
            </label>
            <span className="text-xs text-zinc-500">Pick a preset or paste a custom URL</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mb-3">
            {PRESET_COVERS.map((preset) => {
              const isSelected = coverImage === preset.url;
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => setCoverImage(preset.url)}
                  className={`relative aspect-[16/10] rounded-xl overflow-hidden border-2 transition-all ${
                    isSelected
                      ? 'border-indigo-500 ring-2 ring-indigo-500/30 scale-102'
                      : 'border-zinc-800 hover:border-zinc-700 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute inset-x-0 bottom-0 bg-black/70 text-[10px] text-zinc-200 py-0.5 px-1 truncate">
                    {preset.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Custom URL Input */}
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="Or paste custom image URL (https://...)"
              value={customCoverUrl}
              onChange={(e) => setCustomCoverUrl(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={() => {
                if (customCoverUrl.trim()) {
                  setCoverImage(customCoverUrl.trim());
                  setCustomCoverUrl('');
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors"
            >
              Apply Image
            </button>
          </div>
        </div>

        {/* Markdown Toolbar */}
        <div className="flex flex-wrap items-center gap-1 p-2 rounded-xl bg-zinc-900 border border-zinc-800">
          <button
            type="button"
            onClick={() => insertMarkdown('**', '**')}
            title="Bold"
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown('*', '*')}
            title="Italic"
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown('## ')}
            title="Heading 2"
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown('### ')}
            title="Heading 3"
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
          >
            <Heading3 className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-4 bg-zinc-800 mx-1" />
          <button
            type="button"
            onClick={() => insertMarkdown('> ')}
            title="Quote"
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown('```typescript\n', '\n```')}
            title="Code Block"
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
          >
            <Code className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown('- ')}
            title="List Item"
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown('[Link text](', ')')}
            title="Hyperlink"
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Content Pane: Split / Write / Preview */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[450px]">
          {/* Write Textarea */}
          <div
            className={`flex flex-col ${
              activeTab === 'preview' ? 'hidden md:hidden' : activeTab === 'write' ? 'md:col-span-2' : ''
            }`}
          >
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Markdown Source</span>
              <span className="font-mono text-[11px] text-zinc-600">
                {content.split(/\s+/).filter(Boolean).length} words
              </span>
            </label>
            <textarea
              id="post-markdown-editor"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tell your story in Markdown..."
              className="w-full flex-1 p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl font-mono text-sm leading-relaxed text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-indigo-500 resize-none transition-colors"
              rows={18}
            />
          </div>

          {/* Rendered Preview Pane */}
          <div
            className={`flex flex-col ${
              activeTab === 'write' ? 'hidden md:hidden' : activeTab === 'preview' ? 'md:col-span-2' : ''
            }`}
          >
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              Live Preview
            </label>
            <div className="flex-1 p-6 bg-zinc-900/30 border border-zinc-800/80 rounded-2xl overflow-y-auto max-h-[600px] markdown-body">
              <div
                dangerouslySetInnerHTML={{
                  __html: marked.parse(content || '*No content yet...*') as string
                }}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
