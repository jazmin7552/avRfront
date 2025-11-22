import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');

  console.log('🔐 Interceptor ejecutándose');
  console.log('🎫 Token encontrado:', token ? 'SÍ' : 'NO');

  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log('✅ Headers agregados:', cloned.headers.get('Authorization'));
    return next(cloned);
  }

  console.log('⚠️ No se agregó token (no existe)');
  return next(req);
};
