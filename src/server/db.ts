import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { User, Post, Comment, Category } from '../types/index.js';

interface DatabaseSchema {
  users: (User & { passwordHash: string })[];
  posts: Post[];
  comments: Comment[];
  categories: Category[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'blog_database.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getInitialDatabase(): DatabaseSchema {
  const salt = bcrypt.genSaltSync(10);
  const defaultPasswordHash = bcrypt.hashSync('password123', salt);

  const users: (User & { passwordHash: string })[] = [
    {
      id: 'usr_sarah',
      name: 'Sarah Chen',
      email: 'sarah@example.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      bio: 'Staff Software Architect & open-source contributor. Writing about distributed systems, React, and RESTful architectures.',
      role: 'author',
      createdAt: '2026-09-15T10:00:00.000Z',
      passwordHash: defaultPasswordHash
    },
    {
      id: 'usr_alex',
      name: 'Alex Morgan',
      email: 'alex@example.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
      bio: 'Design Systems Lead and Product Designer. Obsessed with typography, micro-interactions, and design-to-code pipelines.',
      role: 'author',
      createdAt: '2026-09-18T14:30:00.000Z',
      passwordHash: defaultPasswordHash
    },
    {
      id: 'usr_david',
      name: 'David Kim',
      email: 'david@example.com',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
      bio: 'DevOps & Cloud Engineer specializing in zero-downtime deployments, Docker containers, and high-throughput APIs.',
      role: 'author',
      createdAt: '2026-09-20T09:15:00.000Z',
      passwordHash: defaultPasswordHash
    }
  ];

  const categories: Category[] = [
    {
      id: 'cat_engineering',
      name: 'Engineering',
      slug: 'engineering',
      description: 'Full-stack software development, architectural patterns, and practical code tutorials.',
      iconName: 'Code2'
    },
    {
      id: 'cat_design',
      name: 'Design & UI',
      slug: 'design',
      description: 'Interface design, typography, design systems, and delightful user experiences.',
      iconName: 'Palette'
    },
    {
      id: 'cat_architecture',
      name: 'Architecture',
      slug: 'architecture',
      description: 'System design, database modeling, RESTful API design, and scalability.',
      iconName: 'Layers'
    },
    {
      id: 'cat_devops',
      name: 'DevOps & Cloud',
      slug: 'devops',
      description: 'Infrastructure, continuous integration, monitoring, and production reliability.',
      iconName: 'Terminal'
    }
  ];

  const posts: Post[] = [
    {
      id: 'post_1',
      title: 'Mastering RESTful APIs: Design Patterns, Status Codes, and Best Practices',
      slug: 'mastering-restful-apis-design-patterns-best-practices',
      excerpt: 'A comprehensive deep dive into designing robust, predictable, and scalable RESTful APIs that both developers and frontend applications love.',
      content: `## Why REST Still Dominates Modern Software

REST (Representational State Transfer) remains the gold standard foundation for web APIs decades after Roy Fielding first introduced it in his dissertation. While GraphQL, gRPC, and WebSockets each solve specialized communication topologies, REST delivers unmatched predictability, caching capabilities, and universal tool compatibility.

In this guide, we'll dissect how production-grade REST APIs are structured from database query down to HTTP status codes.

---

### 1. Resource-Centric URL Design

URLs should represent **nouns** (resources), never verbs. HTTP methods (\`GET\`, \`POST\`, \`PUT\`, \`PATCH\`, \`DELETE\`) define what action is being executed on that resource.

\`\`\`http
GET    /api/posts          # Retrieve a collection of posts
POST   /api/posts          # Create a new post
GET    /api/posts/:id      # Retrieve a specific post
PUT    /api/posts/:id      # Replace or update a post entirely
PATCH  /api/posts/:id      # Partial update of a post
DELETE /api/posts/:id      # Remove a post
\`\`\`

#### Nested Sub-resources
When an entity logically belongs to another, nested sub-resources keep the relationship transparent:

\`\`\`http
GET  /api/posts/:postId/comments   # Fetch all comments for a post
POST /api/posts/:postId/comments   # Add a comment to that post
\`\`\`

Avoid nesting deeper than 2 or 3 levels. For example, instead of \`/api/posts/:postId/comments/:commentId/likes\`, you can create a direct \`/api/comments/:commentId/like\` endpoint.

---

### 2. Status Codes: Speaking the Language of HTTP

Never return \`200 OK\` with an internal \`{ "error": true }\` payload. Proper status codes make client-side error handling straightforward:

- **\`200 OK\`**: Successful standard query or update.
- **\`201 Created\`**: New resource generated. Always include the created entity in the response body.
- **\`204 No Content\`**: Operation succeeded, no body returned (ideal for \`DELETE\`).
- **\`400 Bad Request\`**: Validation failure or malformed payload.
- **\`401 Unauthorized\`**: Authentication credentials missing or invalid token.
- **\`403 Forbidden\`**: Authenticated, but user lacks permission to modify this specific resource.
- **\`404 Not Found\`**: Resource with the specified ID or slug doesn't exist.
- **\`409 Conflict\`**: Conflict like duplicate email address or username.
- **\`500 Internal Server Error\`**: Unhandled server exception.

---

### 3. Stateless Token Authentication with JWT

In stateless REST architecture, the server doesn't retain session records in memory between requests. Instead, the client sends a cryptographically signed JSON Web Token (JWT) inside the \`Authorization\` header:

\`\`\`typescript
// Authorization Header:
// Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

import jwt from 'jsonwebtoken';

export function verifyAuthHeader(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}
\`\`\`

---

### 4. Conclusion & Key Takeaways

A well-crafted REST API is self-documenting, resilient, and effortless to test. Try out the live API explorer tab in this app to interact directly with these endpoints and watch how headers, status codes, and payloads behave in real time!`,
      coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
      category: 'Engineering',
      tags: ['REST', 'API Design', 'Express', 'Node.js', 'Architecture'],
      authorId: 'usr_sarah',
      author: {
        id: 'usr_sarah',
        name: 'Sarah Chen',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
        bio: 'Staff Software Architect & open-source contributor.'
      },
      status: 'published',
      readTimeMinutes: 6,
      claps: 142,
      views: 1250,
      createdAt: '2026-10-18T14:20:00.000Z',
      updatedAt: '2026-10-18T14:20:00.000Z'
    },
    {
      id: 'post_2',
      title: 'Building Modern Comments Systems: Nested Replies, Moderation, and UX',
      slug: 'building-modern-comments-systems-nested-replies-ux',
      excerpt: 'Explore how to model recursive relational trees, maintain optimistic UI updates, and foster constructive user discussions in full-stack applications.',
      content: `## The Art of Conversational Interfaces on the Web

User interaction transforms static content into a thriving community. However, commenting systems are deceptively complex to build correctly. You need to handle nested hierarchies, author attribution, permission enforcement, and responsive UI updates.

Let's break down the technical architecture behind a threaded comment system.

---

### Data Modeling: Adjacency List Pattern

The simplest and most effective way to store tree structures in document and relational databases is the **Adjacency List** pattern. Each comment record stores an optional \`parentId\`:

\`\`\`typescript
interface Comment {
  id: string;
  postId: string;
  authorId?: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  parentId?: string | null; // Points to another comment ID if this is a reply
  likes: number;
  createdAt: string;
}
\`\`\`

When fetching comments for a post, you query all comments matching \`postId\`. Then, you can easily reconstitute the tree in memory:

\`\`\`typescript
export function nestComments(flatComments: Comment[]): Comment[] {
  const commentMap = new Map<string, Comment & { replies: Comment[] }>();
  const roots: (Comment & { replies: Comment[] })[] = [];

  // Pass 1: Map all items with empty replies array
  flatComments.forEach(comment => {
    commentMap.set(comment.id, { ...comment, replies: [] });
  });

  // Pass 2: Connect children to parents or root array
  flatComments.forEach(comment => {
    const node = commentMap.get(comment.id)!;
    if (comment.parentId && commentMap.has(comment.parentId)) {
      commentMap.get(comment.parentId)!.replies.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}
\`\`\`

---

### Optimistic UI Updates for Instant Gratification

Nobody likes waiting 500 milliseconds with a frozen spinner after clicking "Post Comment". With React and modern state management, we can:

1. Create a temporary local comment item with a unique client ID.
2. Immediately prepend it to the active comments array.
3. Fire the \`POST /api/posts/:id/comments\` API request in the background.
4. On success, replace the temporary comment with the server-acknowledged record.
5. On failure, revert the local state and notify the user with a toast.

---

### Security & Permission Boundaries

A fundamental rule of comment systems:
- Anyone logged in can create comments.
- **Only the author** of the comment or the **author of the post** should have authorization to delete it.

\`\`\`typescript
app.delete('/api/comments/:id', authenticateToken, (req, res) => {
  const comment = db.comments.find(c => c.id === req.params.id);
  if (!comment) return res.status(404).json({ error: 'Comment not found' });

  const post = db.posts.find(p => p.id === comment.postId);
  const isCommentAuthor = comment.authorId === req.user.id;
  const isPostAuthor = post?.authorId === req.user.id;

  if (!isCommentAuthor && !isPostAuthor) {
    return res.status(403).json({ error: 'Not permitted to delete this comment' });
  }

  // Delete comment & any orphaned replies
  db.deleteComment(comment.id);
  res.status(204).send();
});
\`\`\`

Leave your thoughts below to test our live nested commenting engine!`,
      coverImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
      category: 'Engineering',
      tags: ['Comments', 'React', 'FullStack', 'Data Structures', 'UX'],
      authorId: 'usr_alex',
      author: {
        id: 'usr_alex',
        name: 'Alex Morgan',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
        bio: 'Design Systems Lead and Product Designer.'
      },
      status: 'published',
      readTimeMinutes: 5,
      claps: 88,
      views: 890,
      createdAt: '2026-10-19T11:00:00.000Z',
      updatedAt: '2026-10-19T11:00:00.000Z'
    },
    {
      id: 'post_3',
      title: 'Design Systems in Practice: Typography, Spatial Rhythm, and Micro-Interactions',
      slug: 'design-systems-in-practice-typography-spatial-rhythm',
      excerpt: 'How thoughtful typography pairing, consistent proportional scale, and subtle fluid animations elevate standard web applications into timeless digital reading experiences.',
      content: `## The Craft of Digital Typography

A blog platform is, above all else, a stage for words and ideas. When readers land on an article, typography and spacing determine whether they stay immersed or abandon the page in fatigue.

Here are the principles we implemented right here in InkFlow to deliver an exquisite reading experience.

---

### 1. Typographic Contrast: Serif Headlines & Sans-Serif Body

Editorial publishing thrives on character. Pairing an expressive, high-contrast serif font like **Instrument Serif** for headlines with a clean geometric sans like **Plus Jakarta Sans** for body copy produces immediate literary sophistication.

- **Headings**: Evoke the authority of classic editorial journals.
- **Body Text**: Tuned for maximum legibility at 17-18px with a generous 1.7 line-height.
- **Code Blocks**: Displayed in **JetBrains Mono** with syntax highlighting contrast.

---

### 2. The Golden Ratio of Measure (Line Length)

A reader's eye naturally tires if a line of text exceeds 75-80 characters, and breaks concentration if it falls below 45 characters. In CSS, we constrain the reading column:

\`\`\`css
.article-prose {
  max-width: 68ch; /* 68 characters per line maximum */
  margin-left: auto;
  margin-right: auto;
}
\`\`\`

---

### 3. Tactile Micro-Interactions

Actions should feel physical and rewarding:
- Clapping for an article releases an energetic particle burst.
- Submitting comments slides the new item into view with a smooth staggered transition.
- Author avatars feature high-density outlines and hover status indicators.

Check out how the reading experience feels on both desktop and mobile screens!`,
      coverImage: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80',
      category: 'Design & UI',
      tags: ['Design Systems', 'Typography', 'CSS', 'UI/UX', 'MicroInteractions'],
      authorId: 'usr_alex',
      author: {
        id: 'usr_alex',
        name: 'Alex Morgan',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
        bio: 'Design Systems Lead and Product Designer.'
      },
      status: 'published',
      readTimeMinutes: 4,
      claps: 219,
      views: 1820,
      createdAt: '2026-10-20T16:45:00.000Z',
      updatedAt: '2026-10-20T16:45:00.000Z'
    },
    {
      id: 'post_4',
      title: 'Zero to Production: Building Scalable Full-Stack Architecture with Node & React',
      slug: 'zero-to-production-scalable-full-stack-node-react',
      excerpt: 'From database normalization and express route controllers to client-side caching and responsive layouts — the blueprint for modern web systems.',
      content: `## Bridging Client and Server

Every successful full-stack developer understands how data flows across the wire: from the persistent disk store, through express route controllers, validated by middleware, transmitted over JSON HTTP streams, and finally rendered by React component trees.

In this post, we map out the complete mental model.

---

### The Three Layers of Full-Stack Architecture

1. **The Storage & Data Integrity Layer**:
   - Manages state persistence.
   - Enforces referential integrity (e.g. deleting a post cleans up orphan comments).
   - Handles migrations and atomic transaction writes.

2. **The API & Business Logic Layer**:
   - Authentication & role checking.
   - Payload schema validation.
   - Rate limiting and standard error encapsulation.

3. **The Presentation & Client State Layer**:
   - React hooks managing server cache and active route state.
   - Optimistic mutations for perceived speed.
   - Accessible keyboard navigation and semantic HTML.

Happy coding and enjoy creating your own blog stories!`,
      coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
      category: 'Architecture',
      tags: ['Architecture', 'Node.js', 'React', 'FullStack', 'DevOps'],
      authorId: 'usr_david',
      author: {
        id: 'usr_david',
        name: 'David Kim',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
        bio: 'DevOps & Cloud Engineer.'
      },
      status: 'published',
      readTimeMinutes: 5,
      claps: 95,
      views: 640,
      createdAt: '2026-10-21T08:30:00.000Z',
      updatedAt: '2026-10-21T08:30:00.000Z'
    }
  ];

  const comments: Comment[] = [
    {
      id: 'cmt_1',
      postId: 'post_1',
      authorId: 'usr_alex',
      authorName: 'Alex Morgan',
      authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
      content: 'The section on status codes should be required reading for every backend engineer! Returning 200 with an error object inside has caused so many frontend headaches.',
      parentId: null,
      likes: 12,
      createdAt: '2026-10-18T16:00:00.000Z'
    },
    {
      id: 'cmt_2',
      postId: 'post_1',
      authorId: 'usr_sarah',
      authorName: 'Sarah Chen',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      content: '100% agreed Alex! Especially when handling automated retries or interceptors in axios/fetch. Using real 4xx and 5xx codes lets the client handle auth expiration cleanly.',
      parentId: 'cmt_1',
      likes: 8,
      createdAt: '2026-10-18T16:45:00.000Z'
    },
    {
      id: 'cmt_3',
      postId: 'post_1',
      authorId: 'usr_david',
      authorName: 'David Kim',
      authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
      content: 'Great writeup Sarah. One addition: on sub-resources, keeping URLs shallow (max 2 levels) also makes CDN cache-busting significantly easier to configure.',
      parentId: null,
      likes: 15,
      createdAt: '2026-10-18T18:10:00.000Z'
    },
    {
      id: 'cmt_4',
      postId: 'post_2',
      authorId: 'usr_sarah',
      authorName: 'Sarah Chen',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      content: 'The 2-pass adjacency list tree builder is so clean and O(N). Recursion can sometimes blow up call stacks with deep trees, but using a hash map avoids that completely.',
      parentId: null,
      likes: 9,
      createdAt: '2026-10-19T13:20:00.000Z'
    }
  ];

  return { users, posts, comments, categories };
}

class DatabaseService {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadDatabase();
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        if (parsed.users && parsed.posts && parsed.comments) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to read database file, initializing with fresh seed data.', e);
    }

    const initial = getInitialDatabase();
    this.saveDatabase(initial);
    return initial;
  }

  private saveDatabase(dataToSave: DatabaseSchema = this.data) {
    try {
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(dataToSave, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Error writing database to disk:', err);
    }
  }

  // --- Users ---
  public getUsers(): User[] {
    return this.data.users.map(({ passwordHash, ...user }) => user);
  }

  public findUserById(id: string): (User & { passwordHash: string }) | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public findUserByEmail(email: string): (User & { passwordHash: string }) | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public createUser(user: User, passwordHash: string): User {
    const newUserRecord = { ...user, passwordHash };
    this.data.users.push(newUserRecord);
    this.saveDatabase();
    const { passwordHash: _, ...publicUser } = newUserRecord;
    return publicUser;
  }

  public updateUserProfile(id: string, updates: Partial<User>): User | null {
    const index = this.data.users.findIndex(u => u.id === id);
    if (index === -1) return null;

    this.data.users[index] = {
      ...this.data.users[index],
      ...updates,
      id
    };

    // Also update author info across their posts and comments
    const updatedUser = this.data.users[index];
    this.data.posts.forEach(post => {
      if (post.authorId === id) {
        post.author.name = updatedUser.name;
        post.author.avatar = updatedUser.avatar;
        if (updatedUser.bio) post.author.bio = updatedUser.bio;
      }
    });

    this.data.comments.forEach(comment => {
      if (comment.authorId === id) {
        comment.authorName = updatedUser.name;
        comment.authorAvatar = updatedUser.avatar;
      }
    });

    this.saveDatabase();
    const { passwordHash: _, ...publicUser } = updatedUser;
    return publicUser;
  }

  // --- Posts ---
  public getPosts(filters?: {
    category?: string;
    tag?: string;
    search?: string;
    authorId?: string;
    status?: string;
  }): Post[] {
    let posts = [...this.data.posts];

    if (filters?.status) {
      posts = posts.filter(p => p.status === filters.status);
    } else {
      // Default to published unless requested
      posts = posts.filter(p => p.status === 'published');
    }

    if (filters?.category) {
      posts = posts.filter(p => p.category.toLowerCase() === filters.category!.toLowerCase());
    }

    if (filters?.tag) {
      posts = posts.filter(p => p.tags.some(t => t.toLowerCase() === filters.tag!.toLowerCase()));
    }

    if (filters?.authorId) {
      posts = posts.filter(p => p.authorId === filters.authorId);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      posts = posts.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    // Sort by latest createdAt descending
    return posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public findPostByIdOrSlug(idOrSlug: string): Post | undefined {
    return this.data.posts.find(p => p.id === idOrSlug || p.slug === idOrSlug);
  }

  public incrementPostViews(idOrSlug: string): Post | null {
    const post = this.findPostByIdOrSlug(idOrSlug);
    if (!post) return null;
    post.views += 1;
    this.saveDatabase();
    return post;
  }

  public incrementPostClaps(id: string): Post | null {
    const post = this.data.posts.find(p => p.id === id);
    if (!post) return null;
    post.claps += 1;
    this.saveDatabase();
    return post;
  }

  public createPost(postData: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'claps'>): Post {
    const id = `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newPost: Post = {
      ...postData,
      id,
      views: 0,
      claps: 0,
      createdAt: now,
      updatedAt: now
    };

    this.data.posts.unshift(newPost);
    this.saveDatabase();
    return newPost;
  }

  public updatePost(id: string, updates: Partial<Post>): Post | null {
    const index = this.data.posts.findIndex(p => p.id === id);
    if (index === -1) return null;

    const existing = this.data.posts[index];
    const updatedPost: Post = {
      ...existing,
      ...updates,
      id,
      authorId: existing.authorId,
      author: existing.author,
      updatedAt: new Date().toISOString()
    };

    this.data.posts[index] = updatedPost;
    this.saveDatabase();
    return updatedPost;
  }

  public deletePost(id: string): boolean {
    const initialLen = this.data.posts.length;
    this.data.posts = this.data.posts.filter(p => p.id !== id);

    if (this.data.posts.length !== initialLen) {
      // Cascade delete comments belonging to this post
      this.data.comments = this.data.comments.filter(c => c.postId !== id);
      this.saveDatabase();
      return true;
    }
    return false;
  }

  // --- Comments ---
  public getCommentsForPost(postId: string): Comment[] {
    const postComments = this.data.comments
      .filter(c => c.postId === postId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    // Build threaded hierarchy
    const map = new Map<string, Comment & { replies: Comment[] }>();
    const roots: (Comment & { replies: Comment[] })[] = [];

    postComments.forEach(c => {
      map.set(c.id, { ...c, replies: [] });
    });

    postComments.forEach(c => {
      const node = map.get(c.id)!;
      if (c.parentId && map.has(c.parentId)) {
        map.get(c.parentId)!.replies.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  public createComment(commentData: {
    postId: string;
    authorId?: string;
    authorName: string;
    authorAvatar: string;
    content: string;
    parentId?: string | null;
  }): Comment {
    const id = `cmt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newComment: Comment = {
      id,
      postId: commentData.postId,
      authorId: commentData.authorId,
      authorName: commentData.authorName,
      authorAvatar: commentData.authorAvatar,
      content: commentData.content,
      parentId: commentData.parentId || null,
      likes: 0,
      createdAt: new Date().toISOString()
    };

    this.data.comments.push(newComment);
    this.saveDatabase();
    return newComment;
  }

  public likeComment(id: string): Comment | null {
    const comment = this.data.comments.find(c => c.id === id);
    if (!comment) return null;
    comment.likes += 1;
    this.saveDatabase();
    return comment;
  }

  public deleteComment(id: string): boolean {
    const initialLen = this.data.comments.length;
    // Also delete any direct replies
    const toDeleteIds = new Set<string>([id]);
    this.data.comments.forEach(c => {
      if (c.parentId && toDeleteIds.has(c.parentId)) {
        toDeleteIds.add(c.id);
      }
    });

    this.data.comments = this.data.comments.filter(c => !toDeleteIds.has(c.id));
    if (this.data.comments.length !== initialLen) {
      this.saveDatabase();
      return true;
    }
    return false;
  }

  public getCommentById(id: string): Comment | undefined {
    return this.data.comments.find(c => c.id === id);
  }

  // --- Categories & Tags ---
  public getCategories(): Category[] {
    return this.data.categories;
  }

  public getAllTags(): { tag: string; count: number }[] {
    const countMap: Record<string, number> = {};
    this.data.posts.forEach(p => {
      if (p.status === 'published') {
        p.tags.forEach(t => {
          countMap[t] = (countMap[t] || 0) + 1;
        });
      }
    });

    return Object.entries(countMap)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }

  // --- Platform Stats ---
  public getStats(): {
    totalPosts: number;
    totalComments: number;
    totalUsers: number;
    totalViews: number;
    totalClaps: number;
  } {
    const totalViews = this.data.posts.reduce((sum, p) => sum + p.views, 0);
    const totalClaps = this.data.posts.reduce((sum, p) => sum + p.claps, 0);

    return {
      totalPosts: this.data.posts.filter(p => p.status === 'published').length,
      totalComments: this.data.comments.length,
      totalUsers: this.data.users.length,
      totalViews,
      totalClaps
    };
  }

  public resetToSeed(): void {
    this.data = getInitialDatabase();
    this.saveDatabase();
  }
}

export const db = new DatabaseService();
