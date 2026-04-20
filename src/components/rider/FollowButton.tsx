import { Button } from '@/components/ui/button';
import { useFollow } from '@/hooks/useFollow';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, UserPlus, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FollowButton({ targetUserId }: { targetUserId: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isFollowing, toggle } = useFollow(targetUserId);

  if (user?.id === targetUserId) return null;

  return (
    <Button
      size="sm"
      variant={isFollowing ? 'outline' : 'default'}
      onClick={() => user ? toggle.mutate() : navigate('/login')}
      disabled={toggle.isPending}
      className="gap-1"
    >
      {toggle.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> :
        isFollowing ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
      {isFollowing ? 'Following' : 'Follow'}
    </Button>
  );
}
