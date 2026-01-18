'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { Plus, Pencil, Trash2, Loader2, Video, Eye, EyeOff, ExternalLink, Play } from 'lucide-react';
import { toast } from 'sonner';

interface PressVideo {
  id: string;
  slug: string;
  title_en: string;
  title_vi: string;
  description_en: string | null;
  description_vi: string | null;
  video_url: string;
  thumbnail_url: string | null;
  video_type: string;
  duration: string | null;
  event_date: string | null;
  sort_order: number;
  is_active: boolean;
  view_count: number;
}

const VIDEO_TYPES = ['youtube', 'vimeo', 'direct'];

export function PressVideosManager() {
  const [videos, setVideos] = useState<PressVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<PressVideo | null>(null);
  const [formData, setFormData] = useState({
    slug: '',
    title_en: '',
    title_vi: '',
    description_en: '',
    description_vi: '',
    video_url: '',
    thumbnail_url: '',
    video_type: 'youtube',
    duration: '',
    event_date: '',
    sort_order: 0,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  const fetchVideos = async () => {
    try {
      const res = await fetch('/api/admin/cms/press/videos');
      if (res.ok) setVideos(await res.json());
    } catch (error) {
      toast.error('Failed to fetch videos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const resetForm = () => {
    setFormData({
      slug: '',
      title_en: '',
      title_vi: '',
      description_en: '',
      description_vi: '',
      video_url: '',
      thumbnail_url: '',
      video_type: 'youtube',
      duration: '',
      event_date: '',
      sort_order: videos.length,
      is_active: true,
    });
    setEditingVideo(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (video: PressVideo) => {
    setEditingVideo(video);
    setFormData({
      slug: video.slug,
      title_en: video.title_en,
      title_vi: video.title_vi,
      description_en: video.description_en || '',
      description_vi: video.description_vi || '',
      video_url: video.video_url,
      thumbnail_url: video.thumbnail_url || '',
      video_type: video.video_type,
      duration: video.duration || '',
      event_date: video.event_date || '',
      sort_order: video.sort_order,
      is_active: video.is_active,
    });
    setIsDialogOpen(true);
  };

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingVideo
        ? `/api/admin/cms/press/videos/${editingVideo.id}`
        : '/api/admin/cms/press/videos';
      const method = editingVideo ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          description_en: formData.description_en || null,
          description_vi: formData.description_vi || null,
          thumbnail_url: formData.thumbnail_url || null,
          duration: formData.duration || null,
          event_date: formData.event_date || null,
        }),
      });
      if (res.ok) {
        toast.success(editingVideo ? 'Video updated' : 'Video created');
        setIsDialogOpen(false);
        resetForm();
        fetchVideos();
      } else {
        toast.error('Failed to save video');
      }
    } catch (error) {
      toast.error('Failed to save video');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;
    try {
      const res = await fetch(`/api/admin/cms/press/videos/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Video deleted');
        fetchVideos();
      }
    } catch (error) {
      toast.error('Failed to delete video');
    }
  };

  const toggleActive = async (video: PressVideo) => {
    try {
      await fetch(`/api/admin/cms/press/videos/${video.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !video.is_active }),
      });
      toast.success(video.is_active ? 'Video deactivated' : 'Video activated');
      fetchVideos();
    } catch (error) {
      toast.error('Failed to update video');
    }
  };

  const getVideoThumbnail = (video: PressVideo) => {
    if (video.thumbnail_url) return video.thumbnail_url;
    if (video.video_type === 'youtube') {
      const videoId = video.video_url.match(
        /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
      );
      if (videoId) return `https://img.youtube.com/vi/${videoId[1]}/mqdefault.jpg`;
    }
    return null;
  };

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
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Video Showcase ({videos.length})
          </CardTitle>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Video
          </Button>
        </CardHeader>
        <CardContent>
          {videos.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No videos yet. Click &quot;Add Video&quot; to create your first video.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Preview</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {videos.map((video) => {
                  const thumbnail = getVideoThumbnail(video);
                  return (
                    <TableRow key={video.id}>
                      <TableCell>{video.sort_order}</TableCell>
                      <TableCell>
                        {thumbnail ? (
                          <div className="relative w-20 h-12 rounded overflow-hidden bg-gray-100">
                            <img
                              src={thumbnail}
                              alt={video.title_en}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <Play className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-20 h-12 rounded bg-gray-100 flex items-center justify-center">
                            <Video className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{video.title_en}</p>
                          <p className="text-sm text-gray-500">{video.title_vi}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="capitalize px-2 py-1 bg-gray-100 rounded text-sm">
                          {video.video_type}
                        </span>
                      </TableCell>
                      <TableCell>{video.duration || '-'}</TableCell>
                      <TableCell>{video.view_count || 0}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActive(video)}
                          className={video.is_active ? 'text-green-600' : 'text-gray-400'}
                        >
                          {video.is_active ? (
                            <>
                              <Eye className="h-4 w-4 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-4 w-4 mr-1" />
                              Inactive
                            </>
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <a
                            href={video.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(video)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(video.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVideo ? 'Edit Video' : 'Add Video'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Title (EN)</Label>
                <Input
                  value={formData.title_en}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      title_en: e.target.value,
                      slug: !editingVideo ? generateSlug(e.target.value) : formData.slug,
                    })
                  }
                  required
                />
              </div>
              <div>
                <Label>Title (VI)</Label>
                <Input
                  value={formData.title_vi}
                  onChange={(e) => setFormData({ ...formData, title_vi: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <Label>Slug</Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Description (EN)</Label>
                <Textarea
                  value={formData.description_en}
                  onChange={(e) =>
                    setFormData({ ...formData, description_en: e.target.value })
                  }
                  rows={2}
                />
              </div>
              <div>
                <Label>Description (VI)</Label>
                <Textarea
                  value={formData.description_vi}
                  onChange={(e) =>
                    setFormData({ ...formData, description_vi: e.target.value })
                  }
                  rows={2}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Video Type</Label>
                <Select
                  value={formData.video_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, video_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VIDEO_TYPES.map((type) => (
                      <SelectItem key={type} value={type} className="capitalize">
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Duration (e.g., 3:45)</Label>
                <Input
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="3:45"
                />
              </div>
            </div>
            <div>
              <Label>Video URL</Label>
              <Input
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Supports YouTube, Vimeo, or direct video URLs
              </p>
            </div>
            <div>
              <Label>Thumbnail URL (optional)</Label>
              <Input
                value={formData.thumbnail_url}
                onChange={(e) =>
                  setFormData({ ...formData, thumbnail_url: e.target.value })
                }
                placeholder="https://..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to auto-generate from YouTube
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Event Date</Label>
                <Input
                  type="date"
                  value={formData.event_date}
                  onChange={(e) =>
                    setFormData({ ...formData, event_date: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) =>
                    setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })
                  }
                  className="w-24"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
              <Label>Active</Label>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingVideo ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
