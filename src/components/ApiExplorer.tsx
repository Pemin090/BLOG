import React, { useState } from 'react';
import {
  Terminal,
  Send,
  Copy,
  Check,
  RefreshCw,
  Database,
  Layers,
  Key,
  ShieldCheck,
  Code2,
  Cpu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { api } from '../services/api.js';

interface EndpointDef {
  id: string;
  category: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  title: string;
  description: string;
  requiresAuth: boolean;
  defaultPayload?: string;
  defaultParams?: string;
}

const ENDPOINTS: EndpointDef[] = [
  // Auth
  {
    id: 'auth_login',
    category: 'Authentication',
    method: 'POST',
    path: '/api/auth/login',
    title: 'User Login',
    description: 'Authenticates with email and password, returning JWT bearer token and user profile.',
    requiresAuth: false,
    defaultPayload: JSON.stringify(
      {
        email: 'sarah@example.com',
        password: 'password123'
      },
      null,
      2
    )
  },
  {
    id: 'auth_register',
    category: 'Authentication',
    method: 'POST',
    path: '/api/auth/register',
    title: 'Register New User',
    description: 'Registers a new author account with hashed credentials using bcrypt.',
    requiresAuth: false,
    defaultPayload: JSON.stringify(
      {
        name: 'Taylor Swift',
        email: `taylor_${Math.floor(Math.random() * 1000)}@example.com`,
        password: 'password123',
        bio: 'Songwriter and full-stack enthusiast'
      },
      null,
      2
    )
  },
  {
    id: 'auth_me',
    category: 'Authentication',
    method: 'GET',
    path: '/api/auth/me',
    title: 'Current User Profile',
    description: 'Retrieves current authenticated profile from JWT in Authorization header.',
    requiresAuth: true
  },

  // Posts
  {
    id: 'posts_get_all',
    category: 'Posts',
    method: 'GET',
    path: '/api/posts',
    title: 'List All Posts',
    description: 'Returns published blog posts with optional filtering by category, tag, or search term.',
    requiresAuth: false,
    defaultParams: '?category=Engineering'
  },
  {
    id: 'posts_get_single',
    category: 'Posts',
    method: 'GET',
    path: '/api/posts/post_1',
    title: 'Get Single Post',
    description: 'Retrieves complete post markdown and increments view counter.',
    requiresAuth: false
  },
  {
    id: 'posts_create',
    category: 'Posts',
    method: 'POST',
    path: '/api/posts',
    title: 'Create Blog Post',
    description: 'Publishes a new blog story. Requires valid Authorization token.',
    requiresAuth: true,
    defaultPayload: JSON.stringify(
      {
        title: 'Building High-Performance Web Applications in 2026',
        excerpt: 'An exploration of modern bundlers, edge caching, and atomic state synchronization.',
        content: '## Edge Rendering & Performance\n\nOptimizing performance is both an art and a science...',
        category: 'Engineering',
        tags: ['Performance', 'WebDev', 'Architecture'],
        status: 'published'
      },
      null,
      2
    )
  },
  {
    id: 'posts_like',
    category: 'Posts',
    method: 'POST',
    path: '/api/posts/post_1/like',
    title: 'Clap / Like Post',
    description: 'Increments the claps counter for a post.',
    requiresAuth: false
  },

  // Comments
  {
    id: 'comments_get',
    category: 'Comments',
    method: 'GET',
    path: '/api/posts/post_1/comments',
    title: 'Get Post Comments',
    description: 'Fetches threaded hierarchical comments for a specific post.',
    requiresAuth: false
  },
  {
    id: 'comments_create',
    category: 'Comments',
    method: 'POST',
    path: '/api/posts/post_1/comments',
    title: 'Post Comment / Reply',
    description: 'Submits a new comment or threaded response. Supports guest names or member token.',
    requiresAuth: false,
    defaultPayload: JSON.stringify(
      {
        content: 'Fascinating article! How do you handle database migrations with this architecture?',
        authorName: 'Alex Techie',
        parentId: null
      },
      null,
      2
    )
  },

  // Metadata & Stats
  {
    id: 'stats_get',
    category: 'System',
    method: 'GET',
    path: '/api/stats',
    title: 'Platform Analytics',
    description: 'Returns real-time aggregated metrics: posts, comments, users, total views, and claps.',
    requiresAuth: false
  },
  {
    id: 'categories_get',
    category: 'System',
    method: 'GET',
    path: '/api/categories',
    title: 'List Categories',
    description: 'Returns all blog categories.',
    requiresAuth: false
  }
];

export const ApiExplorer: React.FC = () => {
  const { token, isAuthenticated, user } = useAuth();
  const { success, error: toastError } = useToast();

  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointDef>(ENDPOINTS[0]);
  const [requestUrl, setRequestUrl] = useState<string>(ENDPOINTS[0].path);
  const [requestBody, setRequestBody] = useState<string>(ENDPOINTS[0].defaultPayload || '');
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});
  const [responseBody, setResponseBody] = useState<string>('');
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'tester' | 'architecture'>('tester');

  const handleSelectEndpoint = (ep: EndpointDef) => {
    setSelectedEndpoint(ep);
    setRequestUrl(ep.path + (ep.defaultParams || ''));
    setRequestBody(ep.defaultPayload || '');
    setResponseStatus(null);
    setResponseBody('');
    setResponseTime(null);
  };

  const handleSendRequest = async () => {
    setIsLoading(true);
    setResponseStatus(null);
    setResponseBody('');
    const startTime = performance.now();

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers
      };

      if (['POST', 'PUT', 'PATCH'].includes(selectedEndpoint.method) && requestBody.trim()) {
        options.body = requestBody;
      }

      const res = await fetch(requestUrl, options);
      const elapsed = Math.round(performance.now() - startTime);
      setResponseTime(elapsed);
      setResponseStatus(res.status);

      const headerObj: Record<string, string> = {};
      res.headers.forEach((v, k) => {
        headerObj[k] = v;
      });
      setResponseHeaders(headerObj);

      if (res.status === 204) {
        setResponseBody('/* 204 No Content - Successful Deletion */');
      } else {
        const json = await res.json().catch(() => null);
        setResponseBody(json ? JSON.stringify(json, null, 2) : '/* Non-JSON response */');
      }
    } catch (err: unknown) {
      const elapsed = Math.round(performance.now() - startTime);
      setResponseTime(elapsed);
      setResponseStatus(500);
      setResponseBody(JSON.stringify({ error: err instanceof Error ? err.message : 'Network error' }, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  const copyCurl = () => {
    const authHeader = token ? ` -H "Authorization: Bearer ${token}"` : '';
    const bodyFlag = ['POST', 'PUT'].includes(selectedEndpoint.method) && requestBody.trim()
      ? ` -d '${requestBody.replace(/'/g, "\\'")}'`
      : '';
    const curl = `curl -X ${selectedEndpoint.method} "http://localhost:3000${requestUrl}" -H "Content-Type: application/json"${authHeader}${bodyFlag}`;

    navigator.clipboard.writeText(curl);
    setIsCopied(true);
    success('cURL command copied to clipboard!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleResetDatabase = async () => {
    if (!window.confirm('Reset database to original sample articles, authors, and comments?')) return;

    try {
      await api.seed.reset();
      success('Database reset to fresh sample state.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Reset failed';
      toastError(msg);
    }
  };

  const getMethodBadgeColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800/80';
      case 'POST':
        return 'bg-indigo-950 text-indigo-300 border-indigo-800/80';
      case 'PUT':
        return 'bg-amber-950 text-amber-300 border-amber-800/80';
      case 'DELETE':
        return 'bg-rose-950 text-rose-300 border-rose-800/80';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs uppercase tracking-wider mb-1">
            <Terminal className="w-4 h-4" />
            Full-Stack REST Architecture
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-zinc-100">
            Interactive REST API Playground & Docs
          </h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            Test real HTTP endpoints live, inspect request headers and JSON payloads, review status codes, and explore how the backend database models data.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-zinc-900 rounded-xl p-1 border border-zinc-800">
            <button
              onClick={() => setActiveTab('tester')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'tester' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              API Tester
            </button>
            <button
              onClick={() => setActiveTab('architecture')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'architecture' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Architecture & DB
            </button>
          </div>

          <button
            onClick={handleResetDatabase}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white transition-colors"
            title="Reset database to sample posts"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Reset Seed Data</span>
          </button>
        </div>
      </div>

      {activeTab === 'architecture' ? (
        /* Architecture & Diagram View */
        <div className="space-y-8 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
              <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400 mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg text-zinc-100 mb-2">1. Client Layer (React 19)</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Single Page Application built with Vite and React hooks. Utilizes token-based authentication via localStorage and optimistic mutations for instantaneous comment & clap updates.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
              <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400 mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg text-zinc-100 mb-2">2. Express & Router</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Express server mounts RESTful endpoints under <code>/api</code>. Middlewares handle JSON parsing, logging, and JWT signature verification before delegating to route controllers.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
              <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 mb-4">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg text-zinc-100 mb-2">3. Storage & Integrity</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Persistent database engine stored in JSON format with atomic disk synchronization. Enforces referential integrity (cascading comment deletes on post deletion) and password hashing with bcrypt.
              </p>
            </div>
          </div>

          {/* Database Schema Visualizer */}
          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800">
            <h3 className="font-serif text-2xl text-zinc-100 mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-400" />
              Database Models & Relationships
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-amber-400 font-bold block mb-2">User Model</span>
                <ul className="space-y-1 text-zinc-400">
                  <li>id: string (PK)</li>
                  <li>name: string</li>
                  <li>email: string (Unique)</li>
                  <li>passwordHash: string (Bcrypt)</li>
                  <li>avatar: string</li>
                  <li>role: 'author' | 'reader'</li>
                  <li>createdAt: ISOString</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-indigo-400 font-bold block mb-2">Post Model</span>
                <ul className="space-y-1 text-zinc-400">
                  <li>id: string (PK)</li>
                  <li>title: string</li>
                  <li>slug: string (Unique)</li>
                  <li>excerpt: string</li>
                  <li>content: string (Markdown)</li>
                  <li>category: string</li>
                  <li>tags: string[]</li>
                  <li>authorId: string (FK -&gt; User)</li>
                  <li>claps: number</li>
                  <li>views: number</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-emerald-400 font-bold block mb-2">Comment Model</span>
                <ul className="space-y-1 text-zinc-400">
                  <li>id: string (PK)</li>
                  <li>postId: string (FK -&gt; Post)</li>
                  <li>authorId?: string (FK)</li>
                  <li>authorName: string</li>
                  <li>content: string</li>
                  <li>parentId?: string (Adjacency Tree)</li>
                  <li>likes: number</li>
                  <li>createdAt: ISOString</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Interactive API Tester */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
          
          {/* Endpoint Sidebar */}
          <div className="lg:col-span-4 space-y-2 max-h-[700px] overflow-y-auto pr-1">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-2 mb-2">
              Select Endpoint
            </p>
            {ENDPOINTS.map((ep) => {
              const isSelected = selectedEndpoint.id === ep.id;
              return (
                <button
                  key={ep.id}
                  onClick={() => handleSelectEndpoint(ep)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-zinc-800/90 border-indigo-500/80 shadow-md'
                      : 'bg-zinc-900/40 border-zinc-800/60 hover:bg-zinc-800/50 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getMethodBadgeColor(
                        ep.method
                      )}`}
                    >
                      {ep.method}
                    </span>
                    {ep.requiresAuth && (
                      <span className="flex items-center gap-1 text-[10px] text-amber-400 font-mono">
                        <Key className="w-3 h-3" />
                        Auth
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-zinc-200 truncate">{ep.title}</p>
                  <p className="text-[11px] font-mono text-zinc-500 truncate">{ep.path}</p>
                </button>
              );
            })}
          </div>

          {/* Tester Main Panel */}
          <div className="lg:col-span-8 flex flex-col space-y-4">
            
            {/* Active Endpoint Info Card */}
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold border ${getMethodBadgeColor(
                      selectedEndpoint.method
                    )}`}
                  >
                    {selectedEndpoint.method}
                  </span>
                  <h3 className="font-semibold text-base text-zinc-100">{selectedEndpoint.title}</h3>
                </div>
                
                <button
                  onClick={copyCurl}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-300 hover:text-white transition-colors"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Copied' : 'Copy cURL'}</span>
                </button>
              </div>

              <p className="text-xs text-zinc-400 mb-4">{selectedEndpoint.description}</p>

              {/* URL Bar */}
              <div className="flex gap-2">
                <div className="flex-1 flex items-center bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 font-mono text-xs text-zinc-200 focus-within:border-indigo-500">
                  <span className="text-zinc-600 select-none mr-1">http://localhost:3000</span>
                  <input
                    type="text"
                    value={requestUrl}
                    onChange={(e) => setRequestUrl(e.target.value)}
                    className="flex-1 bg-transparent text-indigo-300 focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleSendRequest}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/25 transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Request</span>
                    </>
                  )}
                </button>
              </div>

              {/* Auth Status Notification in Explorer */}
              <div className="mt-3 flex items-center justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-800/60">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className={`w-3.5 h-3.5 ${isAuthenticated ? 'text-emerald-400' : 'text-zinc-600'}`} />
                  Token Header:{' '}
                  <span className={isAuthenticated ? 'text-emerald-300 font-mono' : 'text-zinc-500'}>
                    {isAuthenticated ? `Bearer (Signed in as ${user?.name})` : 'None (Anonymous)'}
                  </span>
                </span>
                {!isAuthenticated && selectedEndpoint.requiresAuth && (
                  <span className="text-amber-400 text-[11px]">Sign in in the navbar for a real token!</span>
                )}
              </div>
            </div>

            {/* Request Payload Editor (if POST/PUT) */}
            {['POST', 'PUT'].includes(selectedEndpoint.method) && (
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
                  Request JSON Body
                </label>
                <textarea
                  rows={6}
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl font-mono text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
            )}

            {/* Response Console */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  HTTP Response
                </span>
                {responseStatus && (
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span
                      className={`px-2 py-0.5 rounded font-bold ${
                        responseStatus >= 200 && responseStatus < 300
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : responseStatus >= 400 && responseStatus < 500
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}
                    >
                      Status: {responseStatus}
                    </span>
                    {responseTime !== null && <span className="text-zinc-500">{responseTime}ms</span>}
                  </div>
                )}
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 min-h-[180px] max-h-[350px] overflow-auto font-mono text-xs">
                {isLoading ? (
                  <div className="flex items-center justify-center h-28 text-zinc-500 gap-2">
                    <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                    <span>Executing HTTP request...</span>
                  </div>
                ) : responseBody ? (
                  <pre className="text-emerald-300/90 whitespace-pre-wrap">{responseBody}</pre>
                ) : (
                  <div className="text-zinc-600 italic py-8 text-center">
                    Click "Send Request" above to execute this endpoint against the Express server.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
