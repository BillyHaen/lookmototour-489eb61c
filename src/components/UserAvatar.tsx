import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface UserAvatarProps {
  src?: string | null;
  name?: string;
  className?: string;
}

export default function UserAvatar({ src, name, className = 'h-8 w-8' }: UserAvatarProps) {
  const initial = (name || 'U')[0].toUpperCase();
  return (
    <Avatar className={className}>
      <AvatarImage src={src || undefined} alt={name || 'User'} />
      <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
        {initial}
      </AvatarFallback>
    </Avatar>
  );
}
