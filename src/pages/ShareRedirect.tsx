import { useParams, Navigate } from 'react-router-dom';

interface Props {
  to: (slug: string) => string;
}

export default function ShareRedirect({ to }: Props) {
  const params = useParams();
  const slug = params.slug || params.username || '';
  if (!slug) return <Navigate to="/" replace />;
  return <Navigate to={to(slug)} replace />;
}
