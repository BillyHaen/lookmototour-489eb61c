import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Taxonomy {
  id: string;
  name: string;
  slug: string;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export function useCategories() {
  return useQuery({
    queryKey: ['blog-categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('blog_categories').select('*').order('name');
      if (error) throw error;
      return (data || []) as Taxonomy[];
    },
  });
}

export function useTags() {
  return useQuery({
    queryKey: ['blog-tags'],
    queryFn: async () => {
      const { data, error } = await supabase.from('blog_tags').select('*').order('name');
      if (error) throw error;
      return (data || []) as Taxonomy[];
    },
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase.from('blog_categories').insert({ name, slug: slugify(name) }).select().single();
      if (error) throw error;
      return data as Taxonomy;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['blog-categories'] }),
    onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });
}

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase.from('blog_tags').insert({ name, slug: slugify(name) }).select().single();
      if (error) throw error;
      return data as Taxonomy;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['blog-tags'] }),
    onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });
}

export function usePostCategories(postId: string | null) {
  return useQuery({
    queryKey: ['post-categories', postId],
    queryFn: async () => {
      if (!postId) return [];
      const { data, error } = await supabase.from('blog_post_categories').select('category_id').eq('post_id', postId);
      if (error) throw error;
      return (data || []).map(d => d.category_id);
    },
    enabled: !!postId,
  });
}

export function usePostTags(postId: string | null) {
  return useQuery({
    queryKey: ['post-tags', postId],
    queryFn: async () => {
      if (!postId) return [];
      const { data, error } = await supabase.from('blog_post_tags').select('tag_id').eq('post_id', postId);
      if (error) throw error;
      return (data || []).map(d => d.tag_id);
    },
    enabled: !!postId,
  });
}

export async function syncPostCategories(postId: string, categoryIds: string[]) {
  await supabase.from('blog_post_categories').delete().eq('post_id', postId);
  if (categoryIds.length) {
    await supabase.from('blog_post_categories').insert(categoryIds.map(c => ({ post_id: postId, category_id: c })));
  }
}

export async function syncPostTags(postId: string, tagIds: string[]) {
  await supabase.from('blog_post_tags').delete().eq('post_id', postId);
  if (tagIds.length) {
    await supabase.from('blog_post_tags').insert(tagIds.map(t => ({ post_id: postId, tag_id: t })));
  }
}
