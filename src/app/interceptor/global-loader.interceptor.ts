import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { GlobalLoaderService } from '../shared/components/global-loader/global-loader.service';
import { finalize } from 'rxjs/operators';

export const globalLoaderInterceptor: HttpInterceptorFn = (req, next) => {
    const loaderService = inject(GlobalLoaderService);

    // Define which requests should trigger the loader
    // Filter for posts/news related endpoints or public content
    if (req.url.includes('/api/posts') || req.url.includes('/api/news') || req.url.includes('/api/public')) {
        loaderService.show();
        return next(req).pipe(
            finalize(() => loaderService.hide())
        );
    }

    return next(req);
};
