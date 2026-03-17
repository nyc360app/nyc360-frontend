import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

export interface CommunityLeaderApplicationPayload {
  fullName: string;
  email: string;
  phoneNumber: string;
  communityName: string;
  location: string;
  verificationFile: File;
  profileLink: string;
  motivation: string;
  experience: string;
  ledBefore: 'public' | 'private';
  weeklyAvailability: '1-3' | '4-7' | '8-12' | '10+';
  agreedToGuidelines: boolean;
}

@Component({
  selector: 'app-community-leader-application-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './community-leader-application-modal.html',
  styleUrls: ['./community-leader-application-modal.scss']
})
export class CommunityLeaderApplicationModalComponent implements OnInit {
  @Input() fullName: string = '';
  @Input() email: string = '';
  @Input() phoneNumber: string = '';

  @Output() close = new EventEmitter<void>();
  @Output() submitApplication = new EventEmitter<CommunityLeaderApplicationPayload>();

  private fb = inject(FormBuilder);

  selectedVerificationFile: File | null = null;
  isDraggingFile = false;

  readonly locationOptions = [
    'Bronx',
    'Brooklyn',
    'Manhattan',
    'Queens',
    'Staten Island'
  ];

  readonly leaderApplicationForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', [Validators.required, Validators.minLength(7)]],
    communityName: ['', [Validators.required, Validators.minLength(2)]],
    location: ['', Validators.required],
    profileLink: ['', [Validators.required, Validators.minLength(5)]],
    motivation: ['', [Validators.required, Validators.minLength(20)]],
    experience: ['', [Validators.required, Validators.minLength(20)]],
    ledBefore: ['public', Validators.required],
    weeklyAvailability: ['1-3', Validators.required],
    agreedToGuidelines: [false, Validators.requiredTrue],
    verificationFile: [null as File | null, Validators.required]
  });

  ngOnInit(): void {
    this.leaderApplicationForm.patchValue({
      fullName: this.fullName || '',
      email: this.email || '',
      phoneNumber: this.phoneNumber || ''
    });
  }

  closeModal(): void {
    this.close.emit();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0] || null;
    this.updateSelectedFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingFile = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingFile = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingFile = false;
    const file = event.dataTransfer?.files?.[0] || null;
    this.updateSelectedFile(file);
  }

  submit(): void {
    if (!this.selectedVerificationFile || this.leaderApplicationForm.invalid) {
      this.leaderApplicationForm.markAllAsTouched();
      return;
    }

    const value = this.leaderApplicationForm.getRawValue();
    this.submitApplication.emit({
      fullName: String(value.fullName || '').trim(),
      email: String(value.email || '').trim(),
      phoneNumber: String(value.phoneNumber || '').trim(),
      communityName: String(value.communityName || '').trim(),
      location: String(value.location || '').trim(),
      verificationFile: this.selectedVerificationFile,
      profileLink: String(value.profileLink || '').trim(),
      motivation: String(value.motivation || '').trim(),
      experience: String(value.experience || '').trim(),
      ledBefore: (value.ledBefore || 'public') as 'public' | 'private',
      weeklyAvailability: (value.weeklyAvailability || '1-3') as '1-3' | '4-7' | '8-12' | '10+',
      agreedToGuidelines: !!value.agreedToGuidelines
    });
  }

  private updateSelectedFile(file: File | null): void {
    if (!file) return;
    this.selectedVerificationFile = file;
    this.leaderApplicationForm.patchValue({ verificationFile: file });
    this.leaderApplicationForm.get('verificationFile')?.markAsTouched();
  }
}