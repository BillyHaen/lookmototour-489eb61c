import { useParams } from 'react-router-dom';
import { useBlogPost, useBlogComments } from '@/hooks/useBlog';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import RichTextContent from '@/components/RichTextContent';
import UserAvatar from '@/components/UserAvatar';
import { Loader2, CalendarDays, MessageCircle } from 'lucide-react';
import ShareButton from '@/components/ShareButton';
import { useSeoMeta } from '@/hooks/useSeoMeta';
import { format } from 'date-fns';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

function CommentItem({ comment, allComments, postId }: { comment: any; allComments: any[]; postId: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const replies = allComments.filter(c => c.parent_id === comment.id);

  const replyMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('blog_comments').insert({
        post_id: postId,
        user_id: user!.id,
        parent_id: comment.id,
        content: replyText.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-comments', postId] });
      setReplyText('');
      setReplying(false);
    },
    onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('blog_comments').delete().eq('id', comment.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['blog-comments', postId] }),
  });

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Link to={`/member/${comment.user_id}`}>
          <UserAvatar src={comment.author_avatar} name={comment.author_name} className="h-8 w-8" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="bg-muted rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Link to={`/member/${comment.user_id}`} className="font-medium text-sm hover:underline">{comment.author_name}</Link>
              <span className="text-xs text-muted-foreground">{format(new Date(comment.created_at), 'dd MMM yyyy HH:mm')}</span>
            </div>
            <p className="text-sm whitespace-pre-line">{comment.content}</p>
          </div>
          <div className="flex gap-2 mt-1">
            {user && <button className="text-xs text-muted-foreground hover:text-primary" onClick={() => setReplying(!replying)}>Balas</button>}
            {user && user.id === comment.user_id && (
              <button className="text-xs text-muted-foreground hover:text-destructive" onClick={() => { if (confirm('Hapus komentar?')) deleteMutation.mutate(); }}>Hapus</button>
            )}
          </div>
          {replying && (
            <div className="mt-2 flex gap-2">
              <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Tulis balasan..." className="min-h-[60px] text-sm" />
              <Button size="sm" disabled={!replyText.trim() || replyMutation.isPending} onClick={() => replyMutation.mutate()}>
                {replyMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Kirim'}
              </Button>
            </div>
          )}
        </div>
      </div>
      {replies.length > 0 && (
        <div className="ml-10 space-y-3 border-l-2 border-border pl-4">
          {replies.map(r => <CommentItem key={r.id} comment={r} allComments={allComments} postId={postId} />)}
        </div>
      )}
    </div>
  );
}

export default function BlogDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: post, isLoading } = useBlogPost(slug || '');
  const { data: comments } = useBlogComments(post?.id || '');
  const [commentText, setCommentText] = useState('');

  useSeoMeta({
    title: post ? `${post.title} - Blog` : 'Blog',
    description: post?.excerpt || post?.content?.replace(/<[^>]*>/g, '').slice(0, 160),
    image: post?.image_url,
    url: window.location.href,
  });
  const commentMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('blog_comments').insert({
        post_id: post!.id,
        user_id: user!.id,
        content: commentText.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-comments', post!.id] });
      setCommentText('');
      toast({ title: 'Komentar terkirim ✅' });
    },
    onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const topLevelComments = (comments || []).filter(c => !c.parent_id);

  if (isLoading) return (
    <div className="min-h-screen"><Navbar /><div className="flex justify-center items-center pt-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></div>
  );

  if (!post) return (
    <div className="min-h-screen"><Navbar /><div className="pt-32 text-center"><h1 className="text-2xl font-bold">Post tidak ditemukan</h1></div><Footer /></div>
  );

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-24 pb-16">
        <article className="container max-w-3xl">
          {post.image_url && (
            <div className="aspect-video rounded-xl overflow-hidden mb-8">
              <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <CalendarDays className="h-4 w-4" />
            {post.published_at ? format(new Date(post.published_at), 'dd MMMM yyyy') : format(new Date(post.created_at), 'dd MMMM yyyy')}
          </div>
          <h1 className="font-heading font-bold text-3xl md:text-4xl mb-4">{post.title}</h1>
          <div className="mb-6">
            <ShareButton
              contentType="blog_post"
              contentId={post.id}
              title={post.title}
              description={post.excerpt || post.content?.replace(/<[^>]*>/g, '').slice(0, 160)}
              slug={post.slug || post.id}
            />
          </div>
          <RichTextContent content={post.content} className="mb-12" />

          {/* Comments section */}
          <section className="border-t border-border pt-8">
            <h2 className="font-heading font-semibold text-xl mb-6 flex items-center gap-2">
              <MessageCircle className="h-5 w-5" /> Komentar ({(comments || []).length})
            </h2>

            {user ? (
              <div className="mb-8 space-y-2">
                <Textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Tulis komentar..." className="min-h-[80px]" />
                <Button disabled={!commentText.trim() || commentMutation.isPending} onClick={() => commentMutation.mutate()}>
                  {commentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Kirim Komentar
                </Button>
              </div>
            ) : (
              <p className="mb-8 text-sm text-muted-foreground">
                <Link to="/login" className="text-primary hover:underline">Masuk</Link> untuk berkomentar.
              </p>
            )}

            <div className="space-y-4">
              {topLevelComments.map(c => <CommentItem key={c.id} comment={c} allComments={comments || []} postId={post.id} />)}
              {topLevelComments.length === 0 && <p className="text-muted-foreground text-sm">Belum ada komentar.</p>}
            </div>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  );
}
