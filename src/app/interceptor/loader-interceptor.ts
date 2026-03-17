import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { GlobalLoaderService } from '../shared/components/global-loader/global-loader.service';

export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
  const loaderService = inject(GlobalLoaderService);

  // Only show loader for 'Outer' (Main) pages
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  const mainPaths = ['', '/', '/public/home', '/public/housing/home', '/public/events/home', '/public/community'];
  const isMainPage = mainPaths.some(path => currentPath === path) || currentPath.startsWith('/public/category/');

  if (isMainPage) {
    loaderService.show();
  }

  return next(req).pipe(
    finalize(() => {
      if (isMainPage) {
        loaderService.hide();
      }
    })
  );
};