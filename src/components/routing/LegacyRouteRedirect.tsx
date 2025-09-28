import { useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import type { RouteKey } from '@/routes/paths';
import { useLocalizedRoutes } from '@/hooks/useLocalizedRoutes';

interface LegacyRouteRedirectProps {
  routeKey: RouteKey;
}

const LegacyRouteRedirect = ({ routeKey }: LegacyRouteRedirectProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { buildPath } = useLocalizedRoutes();

  useEffect(() => {
    const targetPath = buildPath(routeKey, params as Record<string, string | undefined>);

    if (targetPath && targetPath !== location.pathname) {
      navigate(`${targetPath}${location.search}${location.hash}`, { replace: true });
    }
  }, [buildPath, location.hash, location.pathname, location.search, navigate, params, routeKey]);

  return null;
};

export default LegacyRouteRedirect;
