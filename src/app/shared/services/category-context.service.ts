import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
    providedIn: 'root'
})
export class CategoryContextService {
    private categorySource = new BehaviorSubject<number>(0);
    currentCategory$ = this.categorySource.asObservable();

    constructor(@Inject(PLATFORM_ID) private platformId: Object) {
        if (isPlatformBrowser(this.platformId)) {
            const stored = localStorage.getItem('lastCategory');
            if (stored) {
                this.categorySource.next(+stored);
            }
        }
    }

    setCategory(id: number) {
        if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('lastCategory', id.toString());
        }
        this.categorySource.next(id);
    }

    getCategory(): number {
        return this.categorySource.value;
    }
}
