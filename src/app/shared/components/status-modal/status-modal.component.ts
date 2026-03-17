import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-status-modal',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './status-modal.component.html',
    styleUrls: ['./status-modal.component.scss']
})
export class StatusModalComponent {
    @Input() isOpen: boolean = false;
    @Input() type: 'success' | 'error' = 'success';
    @Input() title: string = '';
    @Input() message: string = '';
    @Output() close = new EventEmitter<void>();

    onClose() {
        this.close.emit();
    }
}
