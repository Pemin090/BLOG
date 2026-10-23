export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  bio?: string;
  role: 'author' | 'reader' | 'admin';
  createdAt: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  tags: string[];
  authorId: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    bio?: string;
  };
  status: 'published' | 'draft';
  readTimeMinutes: number;
  claps: number;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId?: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  parentId?: string | null;
  likes: number;
  createdAt: string;
  replies?: Comment[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconName: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface PlatformStats {
  totalPosts: number;
  totalComments: number;
  totalUsers: number;
  totalViews: number;
  totalClaps: number;
}
