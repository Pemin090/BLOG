import { User, Post, Comment, Category, AuthResponse, PlatformStats } from '../types/index.js';

const TOKEN_KEY = 'inkflow_auth_token';

export const tokenStorage = {
  get: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string): void => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch (e) {
      console.warn('Unable to write to localStorage', e);
    }
  },
  remove: (): void => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (e) {
      console.warn('Unable to remove token from localStorage', e);
    }
  }
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  const token = tokenStorage.get();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.error || `HTTP ${response.status}: Request failed`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  auth: {
    login: (credentials: { email: string; password: string }): Promise<AuthResponse> =>
      request<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      }),

    register: (payload: {
      name: string;
      email: string;
      password: string;
      bio?: string;
      avatar?: string;
    }): Promise<AuthResponse> =>
      request<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    getMe: (): Promise<{ user: User }> =>
      request<{ user: User }>('/api/auth/me'),

    updateProfile: (updates: Partial<User>): Promise<{ user: User; message: string }> =>
      request<{ user: User; message: string }>('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(updates)
      }),

    demoLogin: (account: 'sarah' | 'alex' | 'david'): Promise<AuthResponse> =>
      request<AuthResponse>(`/api/auth/demo/${account}`, {
        method: 'POST'
      })
  },

  posts: {
    getAll: (params?: {
      category?: string;
      tag?: string;
      search?: string;
      authorId?: string;
      status?: string;
    }): Promise<{ count: number; posts: Post[] }> => {
      const searchParams = new URLSearchParams();
      if (params?.category) searchParams.set('category', params.category);
      if (params?.tag) searchParams.set('tag', params.tag);
      if (params?.search) searchParams.set('search', params.search);
      if (params?.authorId) searchParams.set('authorId', params.authorId);
      if (params?.status) searchParams.set('status', params.status);

      const qs = searchParams.toString();
      return request<{ count: number; posts: Post[] }>(`/api/posts${qs ? `?${qs}` : ''}`);
    },

    getBySlugOrId: (idOrSlug: string): Promise<{ post: Post }> =>
      request<{ post: Post }>(`/api/posts/${encodeURIComponent(idOrSlug)}`),

    create: (data: {
      title: string;
      content: string;
      excerpt?: string;
      category?: string;
      tags?: string[];
      coverImage?: string;
      status?: 'published' | 'draft';
    }): Promise<{ post: Post; message: string }> =>
      request<{ post: Post; message: string }>('/api/posts', {
        method: 'POST',
        body: JSON.stringify(data)
      }),

    update: (
      id: string,
      updates: Partial<Post>
    ): Promise<{ post: Post; message: string }> =>
      request<{ post: Post; message: string }>(`/api/posts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      }),

    delete: (id: string): Promise<void> =>
      request<void>(`/api/posts/${id}`, {
        method: 'DELETE'
      }),

    like: (id: string): Promise<{ claps: number }> =>
      request<{ claps: number }>(`/api/posts/${id}/like`, {
        method: 'POST'
      })
  },

  comments: {
    getForPost: (postId: string): Promise<{ count: number; comments: Comment[] }> =>
      request<{ count: number; comments: Comment[] }>(`/api/posts/${postId}/comments`),

    create: (
      postId: string,
      data: {
        content: string;
        parentId?: string | null;
        authorName?: string;
        authorAvatar?: string;
      }
    ): Promise<{ comment: Comment; message: string }> =>
      request<{ comment: Comment; message: string }>(`/api/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),

    delete: (commentId: string): Promise<void> =>
      request<void>(`/api/comments/${commentId}`, {
        method: 'DELETE'
      }),

    like: (commentId: string): Promise<{ likes: number }> =>
      request<{ likes: number }>(`/api/comments/${commentId}/like`, {
        method: 'POST'
      })
  },

  categories: {
    getAll: (): Promise<{ categories: Category[] }> =>
      request<{ categories: Category[] }>('/api/categories')
  },

  tags: {
    getAll: (): Promise<{ tags: { tag: string; count: number }[] }> =>
      request<{ tags: { tag: string; count: number }[] }>('/api/tags')
  },

  stats: {
    get: (): Promise<PlatformStats> =>
      request<PlatformStats>('/api/stats')
  },

  seed: {
    reset: (): Promise<{ message: string }> =>
      request<{ message: string }>('/api/seed/reset', {
        method: 'POST'
      })
  }
};
