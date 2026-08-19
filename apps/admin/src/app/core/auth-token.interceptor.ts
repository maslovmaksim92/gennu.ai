import { HttpInterceptorFn } from '@angular/common/http';
import { getAdminAccessToken } from './auth.service';

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const token = getAdminAccessToken();

  if (!token || !req.url.startsWith('/api')) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    }),
  );
};
