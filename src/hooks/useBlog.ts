import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useBlogPosts(includeAll = false) {
  return useQuery({
    queryKey: ['blog-posts', includeAll],
    queryFn: async () => {
      let query = supabase.from('blog_posts').select('*').order('published_at', { ascending: false, nullsFirst: false });
      if (!includeAll) query = query.eq('status', 'published');
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useBlogPost(slug: string, allowDraft = false) {
  return useQuery({
    queryKey: ['blog-post', slug, allowDraft],
    queryFn: async () => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
      const column = isUuid ? 'id' : 'slug';
      const { data, error } = await supabase.from('blog_posts').select('*').eq(column, slug).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      if (data.status !== 'published' && !allowDraft) return null;
      return data;
    },
    enabled: !!slug,
  });
}

export function usePostTaxonomy(postId: string | null) {
  return useQuery({
    queryKey: ['post-taxonomy', postId],
    queryFn: async () => {
      if (!postId) return { categories: [], tags: [] };
      const [{ data: cats }, { data: tagLinks }] = await Promise.all([
        supabase.from('blog_post_categories').select('category_id, blog_categories(id, name, slug)').eq('post_id', postId),
        supabase.from('blog_post_tags').select('tag_id, blog_tags(id, name, slug)').eq('post_id', postId),
      ]);
      return {
        categories: (cats || []).map((c: any) => c.blog_categories).filter(Boolean),
        tags: (tagLinks || []).map((t: any) => t.blog_tags).filter(Boolean),
      };
    },
    enabled: !!postId,
  });
}

export function useBlogComments(postId: string) {
  return useQuery({
    queryKey: ['blog-comments', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      if (error) throw error;

      const userIds = [...new Set((data || []).map(c => c.user_id))];
      const profiles: Record<string, { name: string; avatar_url: string | null }> = {};
      if (userIds.length > 0) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('user_id, name, avatar_url')
          .in('user_id', userIds);
        (profileData || []).forEach(p => {
          profiles[p.user_id] = { name: p.name, avatar_url: p.avatar_url };
        });
      }

      return (data || []).map(c => ({
        ...c,
        author_name: profiles[c.user_id]?.name || 'Anonim',
        author_avatar: profiles[c.user_id]?.avatar_url || null,
      }));
    },
    enabled: !!postId,
  });
}
