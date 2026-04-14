import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useBlogPosts(includeAll = false) {
  return useQuery({
    queryKey: ['blog-posts', includeAll],
    queryFn: async () => {
      let query = supabase.from('blog_posts').select('*').order('created_at', { ascending: false });
      if (!includeAll) query = query.eq('status', 'published');
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useBlogPost(slug: string) {
  return useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
      const column = isUuid ? 'id' : 'slug';
      const { data, error } = await supabase.from('blog_posts').select('*').eq(column, slug).single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
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

      // Fetch profiles for comment authors
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
