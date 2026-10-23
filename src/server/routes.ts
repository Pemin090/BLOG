import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from './db.js';
import { authenticateToken, optionalAuthenticateToken, generateToken, AuthRequest } from './auth.js';
import { User } from '../types/index.js';

export const apiRouter = Router();

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

// -------------------------------------------------------------
// Authentication Endpoints
// -------------------------------------------------------------

apiRouter.post('/auth/register', (req: Request, res: Response): void => {
  try {
    const { name, email, password, bio, avatar } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    const existingUser = db.findUserByEmail(email);
    if (existingUser) {
      res.status(409).json({ error: 'An account with this email address already exists.' });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const defaultAvatar = avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`;
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newUser: User = {
      id: userId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      avatar: defaultAvatar,
      bio: bio ? bio.trim() : 'Blogger and technology enthusiast.',
      role: 'author',
      createdAt: new Date().toISOString()
    };

    const created = db.createUser(newUser, passwordHash);
    const token = generateToken(created);

    res.status(201).json({
      token,
      user: created,
      message: 'Registration successful! Welcome to InkFlow.'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

apiRouter.post('/auth/login', (req: Request, res: Response): void => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const userRecord = db.findUserByEmail(email);
    if (!userRecord) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isValidPassword = bcrypt.compareSync(password, userRecord.passwordHash);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const { passwordHash: _, ...publicUser } = userRecord;
    const token = generateToken(publicUser);

    res.status(200).json({
      token,
      user: publicUser,
      message: 'Signed in successfully.'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

apiRouter.get('/auth/me', authenticateToken, (req: AuthRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const user = db.findUserById(req.user.id);
  if (!user) {
    res.status(404).json({ error: 'User record not found.' });
    return;
  }

  const { passwordHash: _, ...publicUser } = user;
  res.status(200).json({ user: publicUser });
});

apiRouter.put('/auth/profile', authenticateToken, (req: AuthRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const { name, bio, avatar } = req.body;
  const updated = db.updateUserProfile(req.user.id, {
    ...(name && { name: name.trim() }),
    ...(bio !== undefined && { bio: bio.trim() }),
    ...(avatar && { avatar: avatar.trim() })
  });

  if (!updated) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  res.status(200).json({ user: updated, message: 'Profile updated successfully.' });
});

// Demo accounts fast login for reviewing and testing
apiRouter.post('/auth/demo/:account', (req: Request, res: Response): void => {
  const account = req.params.account;
  const emailMap: Record<string, string> = {
    sarah: 'sarah@example.com',
    alex: 'alex@example.com',
    david: 'david@example.com'
  };

  const email = emailMap[account] || 'sarah@example.com';
  const user = db.findUserByEmail(email);

  if (!user) {
    res.status(404).json({ error: 'Demo account not found.' });
    return;
  }

  const { passwordHash: _, ...publicUser } = user;
  const token = generateToken(publicUser);
  res.status(200).json({ token, user: publicUser, message: `Signed in as demo user ${publicUser.name}` });
});

// -------------------------------------------------------------
// Posts Endpoints
// -------------------------------------------------------------

apiRouter.get('/posts', (req: Request, res: Response): void => {
  try {
    const { category, tag, search, authorId, status } = req.query;

    const posts = db.getPosts({
      category: category as string,
      tag: tag as string,
      search: search as string,
      authorId: authorId as string,
      status: status as string
    });

    res.status(200).json({
      count: posts.length,
      posts
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to retrieve posts.' });
  }
});

apiRouter.get('/posts/:idOrSlug', (req: Request, res: Response): void => {
  const { idOrSlug } = req.params;
  const post = db.findPostByIdOrSlug(idOrSlug);

  if (!post) {
    res.status(404).json({ error: `Post '${idOrSlug}' not found.` });
    return;
  }

  // Increment views
  db.incrementPostViews(post.id);
  post.views += 1;

  res.status(200).json({ post });
});

apiRouter.post('/posts', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required to publish stories.' });
      return;
    }

    const { title, excerpt, content, coverImage, category, tags, status } = req.body;

    if (!title || !title.trim()) {
      res.status(400).json({ error: 'Post title is required.' });
      return;
    }

    if (!content || !content.trim()) {
      res.status(400).json({ error: 'Post content cannot be empty.' });
      return;
    }

    let baseSlug = slugify(title);
    if (!baseSlug) baseSlug = `post-${Date.now()}`;
    const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

    const userRecord = db.findUserById(req.user.id);
    const authorName = userRecord?.name || req.user.name;
    const authorAvatar = userRecord?.avatar || req.user.avatar;
    const authorBio = userRecord?.bio;

    const parsedTags = Array.isArray(tags)
      ? tags.map((t: string) => t.trim()).filter(Boolean)
      : typeof tags === 'string'
      ? tags.split(',').map((t: string) => t.trim()).filter(Boolean)
      : ['General'];

    const readTimeMinutes = calculateReadingTime(content);

    const defaultCovers = [
      'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1432821596592-e2c18b78144f?auto=format&fit=crop&w=1200&q=80'
    ];
    const finalCover = coverImage && coverImage.trim()
      ? coverImage.trim()
      : defaultCovers[Math.floor(Math.random() * defaultCovers.length)];

    const createdPost = db.createPost({
      title: title.trim(),
      slug,
      excerpt: excerpt?.trim() || content.trim().substring(0, 160).replace(/[#*`_]/g, '') + '...',
      content: content.trim(),
      coverImage: finalCover,
      category: category?.trim() || 'Engineering',
      tags: parsedTags.length > 0 ? parsedTags : ['General'],
      authorId: req.user.id,
      author: {
        id: req.user.id,
        name: authorName,
        avatar: authorAvatar,
        bio: authorBio
      },
      status: status === 'draft' ? 'draft' : 'published',
      readTimeMinutes
    });

    res.status(201).json({
      post: createdPost,
      message: 'Post created successfully.'
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post.' });
  }
});

apiRouter.put('/posts/:id', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const { id } = req.params;
    const existing = db.findPostByIdOrSlug(id);

    if (!existing) {
      res.status(404).json({ error: 'Post not found.' });
      return;
    }

    // Permission check: only author or admin can edit
    if (existing.authorId !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({ error: 'You do not have permission to edit this post.' });
      return;
    }

    const { title, excerpt, content, coverImage, category, tags, status } = req.body;

    const updates: Record<string, unknown> = {};
    if (title) updates.title = title.trim();
    if (excerpt !== undefined) updates.excerpt = excerpt.trim();
    if (content) {
      updates.content = content.trim();
      updates.readTimeMinutes = calculateReadingTime(content);
    }
    if (coverImage) updates.coverImage = coverImage.trim();
    if (category) updates.category = category.trim();
    if (tags) {
      updates.tags = Array.isArray(tags)
        ? tags.map((t: string) => t.trim()).filter(Boolean)
        : tags.split(',').map((t: string) => t.trim()).filter(Boolean);
    }
    if (status) updates.status = status;

    const updated = db.updatePost(existing.id, updates);
    res.status(200).json({ post: updated, message: 'Post updated successfully.' });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Failed to update post.' });
  }
});

apiRouter.delete('/posts/:id', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const { id } = req.params;
    const existing = db.findPostByIdOrSlug(id);

    if (!existing) {
      res.status(404).json({ error: 'Post not found.' });
      return;
    }

    // Permission check
    if (existing.authorId !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({ error: 'You do not have permission to delete this post.' });
      return;
    }

    db.deletePost(existing.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post.' });
  }
});

apiRouter.post('/posts/:id/like', (req: Request, res: Response): void => {
  const { id } = req.params;
  const updated = db.incrementPostClaps(id);

  if (!updated) {
    res.status(404).json({ error: 'Post not found.' });
    return;
  }

  res.status(200).json({ claps: updated.claps });
});

// -------------------------------------------------------------
// Comments Endpoints
// -------------------------------------------------------------

apiRouter.get('/posts/:id/comments', (req: Request, res: Response): void => {
  const { id } = req.params;
  const post = db.findPostByIdOrSlug(id);

  if (!post) {
    res.status(404).json({ error: 'Post not found.' });
    return;
  }

  const comments = db.getCommentsForPost(post.id);
  res.status(200).json({ count: comments.length, comments });
});

apiRouter.post('/posts/:id/comments', optionalAuthenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const post = db.findPostByIdOrSlug(id);

    if (!post) {
      res.status(404).json({ error: 'Post not found.' });
      return;
    }

    const { content, parentId, authorName, authorAvatar } = req.body;

    if (!content || !content.trim()) {
      res.status(400).json({ error: 'Comment content cannot be empty.' });
      return;
    }

    let finalAuthorName = authorName?.trim();
    let finalAuthorAvatar = authorAvatar?.trim();
    let finalAuthorId: string | undefined = undefined;

    if (req.user) {
      finalAuthorId = req.user.id;
      finalAuthorName = req.user.name;
      finalAuthorAvatar = req.user.avatar;
    } else {
      if (!finalAuthorName) {
        finalAuthorName = 'Guest Reader';
      }
      if (!finalAuthorAvatar) {
        finalAuthorAvatar = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(finalAuthorName)}`;
      }
    }

    const comment = db.createComment({
      postId: post.id,
      authorId: finalAuthorId,
      authorName: finalAuthorName,
      authorAvatar: finalAuthorAvatar,
      content: content.trim(),
      parentId: parentId || null
    });

    res.status(201).json({
      comment,
      message: 'Comment posted successfully.'
    });
  } catch (error) {
    console.error('Error posting comment:', error);
    res.status(500).json({ error: 'Failed to post comment.' });
  }
});

apiRouter.delete('/comments/:id', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const { id } = req.params;
    const comment = db.getCommentById(id);

    if (!comment) {
      res.status(404).json({ error: 'Comment not found.' });
      return;
    }

    const post = db.findPostByIdOrSlug(comment.postId);
    const isCommentAuthor = comment.authorId === req.user.id;
    const isPostAuthor = post?.authorId === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isCommentAuthor && !isPostAuthor && !isAdmin) {
      res.status(403).json({ error: 'Only the comment author or post owner can delete this comment.' });
      return;
    }

    db.deleteComment(id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment.' });
  }
});

apiRouter.post('/comments/:id/like', (req: Request, res: Response): void => {
  const { id } = req.params;
  const updated = db.likeComment(id);

  if (!updated) {
    res.status(404).json({ error: 'Comment not found.' });
    return;
  }

  res.status(200).json({ likes: updated.likes });
});

// -------------------------------------------------------------
// Categories, Tags, and Stats
// -------------------------------------------------------------

apiRouter.get('/categories', (_req: Request, res: Response): void => {
  const categories = db.getCategories();
  res.status(200).json({ categories });
});

apiRouter.get('/tags', (_req: Request, res: Response): void => {
  const tags = db.getAllTags();
  res.status(200).json({ tags });
});

apiRouter.get('/stats', (_req: Request, res: Response): void => {
  const stats = db.getStats();
  res.status(200).json(stats);
});

apiRouter.post('/seed/reset', (_req: Request, res: Response): void => {
  db.resetToSeed();
  res.status(200).json({ message: 'Database reset to sample articles, users, and comments.' });
});
