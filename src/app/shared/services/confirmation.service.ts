import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface ConfirmationOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info' | 'success';
}

@Injectable({
    providedIn: 'root'
})
export class ConfirmationService {
    private showModalSource = new Subject<ConfirmationOptions>();
    private responseSource = new Subject<boolean>();

    showModal$ = this.showModalSource.asObservable();
    response$ = this.responseSource.asObservable(); // Component listens to this to close itself effectively if needed, but mainly the caller listens.

    // We need a way to link a specific confirmation to its result. 
    // Simplified strictly for single-modal use case (standard web app).

    confirm(options: ConfirmationOptions): Promise<boolean> {
        return new Promise((resolve) => {
            this.showModalSource.next(options);

            // Subscribe once to the response source
            const sub = this.responseSource.subscribe((res) => {
                resolve(res);
                sub.unsubscribe();
            });
        });
    }

    resolve(result: boolean) {
        this.responseSource.next(result);
    }
}
