'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Eye, EyeOff, Star, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { BlogPostForm } from './BlogPostForm';

interface BlogCategory {
  id: string;
  slug: string;
  name_en: string;
  name_vi: string;
  color: string;
}

interface BlogTag {
  id: string;
  slug: string;
  name_en: string;
  name_vi: string;
}

interface BlogPost {
  id: string;
  slug: string;
  title_en: string;
  title_vi: string;
  excerpt_en: string | null;
  excerpt_vi: string | null;
  content_en: string;
  content_vi: string;
  featured_image_url: string | null;
  author_name: string | null;
  author_avatar_url: string | null;
  reading_time: number;
  is_published: boolean;
  is_featured: boolean;
  view_count: number;
  category_id: string | null;
  category: BlogCategory | null;
  tags: BlogTag[];
  created_at: string;
  published_at: string | null;
}

export function BlogPostsManager() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    try {
      const [postsRes, categoriesRes, tagsRes] = await Promise.all([
        fetch('/api/admin/cms/blog/posts'),
        fetch('/api/admin/cms/blog/categories'),
        fetch('/api/admin/cms/blog/tags')
      ]);

      if (postsRes.ok) setPosts(await postsRes.json());
      if (categoriesRes.ok) setCategories(await categoriesRes.json());
      if (tagsRes.ok) setTags(await tagsRes.json());
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateDialog = () => {
    setEditingPost(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (post: BlogPost) => {
    setEditingPost(post);
    setIsDialogOpen(true);
  };

  const handleSaved = () => {
    setIsDialogOpen(false);
    setEditingPost(null);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const res = await fetch(`/api/admin/cms/blog/posts/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Post deleted');
        fetchData();
      } else {
        toast.error('Failed to delete post');
      }
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  const togglePublished = async (post: BlogPost) => {
    try {
      const res = await fetch(`/api/admin/cms/blog/posts/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !post.is_published }),
      });

      if (res.ok) {
        toast.success(post.is_published ? 'Post unpublished' : 'Post published');
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to update post');
    }
  };

  const toggleFeatured = async (post: BlogPost) => {
    try {
      const res = await fetch(`/api/admin/cms/blog/posts/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_featured: !post.is_featured }),
      });

      if (res.ok) {
        toast.success(post.is_featured ? 'Removed from featured' : 'Added to featured');
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to update post');
    }
  };

  const filteredPosts = posts.filter((post) => {
    if (filterCategory !== 'all' && post.category_id !== filterCategory) return false;
    if (filterStatus === 'published' && !post.is_published) return false;
    if (filterStatus === 'draft' && post.is_published) return false;
    if (searchQuery && !post.title_en.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Blog Posts ({filteredPosts.length})</CardTitle>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name_en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPosts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {post.is_featured && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                      <div>
                        <p className="font-medium">{post.title_en}</p>
                        <p className="text-sm text-gray-500">{post.title_vi}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {post.category && (
                      <span
                        className="px-2 py-1 rounded text-xs text-white"
                        style={{ backgroundColor: post.category.color }}
                      >
                        {post.category.name_en}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePublished(post)}
                      className={post.is_published ? 'text-green-600' : 'text-gray-400'}
                    >
                      {post.is_published ? (
                        <><Eye className="h-4 w-4 mr-1" /> Published</>
                      ) : (
                        <><EyeOff className="h-4 w-4 mr-1" /> Draft</>
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>{post.view_count}</TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {post.published_at
                      ? new Date(post.published_at).toLocaleDateString()
                      : new Date(post.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFeatured(post)}
                      className={post.is_featured ? 'text-yellow-500' : 'text-gray-400'}
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(post)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(post.id)} className="text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredPosts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                    No posts found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Post Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPost ? 'Edit Post' : 'Create New Post'}</DialogTitle>
          </DialogHeader>
          <BlogPostForm
            post={editingPost}
            categories={categories}
            tags={tags}
            onSaved={handleSaved}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
