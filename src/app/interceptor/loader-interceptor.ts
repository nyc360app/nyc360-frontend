import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { GlobalLoaderService } from '../shared/components/global-loader/global-loader.service';

export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
  const loaderService = inject(GlobalLoaderService);
  const isSilentRequest = req.url.includes('/locations/search');

  // Only show loader for 'Outer' (Main) pages
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  const mainPaths = ['', '/', '/public/home', '/public/housing/home', '/public/events/home', '/public/community', '/community'];
  const isDepartmentRoot = /^\/(community|culture|education|health|housing|lifestyle|legal|news|professions|social|transportation|tv)$/.test(currentPath);
  const isMainPage = mainPaths.some(path => currentPath === path) || currentPath.startsWith('/public/category/') || isDepartmentRoot;

  if (isMainPage && !isSilentRequest) {
    loaderService.show();
  }

  return next(req).pipe(
    finalize(() => {
      if (isMainPage && !isSilentRequest) {
        loaderService.hide();
      }
    })
  );
};
