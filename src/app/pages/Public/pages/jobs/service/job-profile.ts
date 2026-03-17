// src/app/features/professions/service/job-profile.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ApiResponse, JobProfileResponse, Applicant } from '../models/job-profile';

@Injectable({ providedIn: 'root' })
export class JobProfileService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/professions/offers`;

  getJobProfile(offerId: string): Observable<ApiResponse<JobProfileResponse>> {
    return this.http.get<ApiResponse<JobProfileResponse>>(`${this.apiUrl}/${offerId}`);
  }

  applyToOffer(jobId: number, coverLetter: string, file?: File): Observable<ApiResponse<number>> {
    const formData = new FormData();
    formData.append('CoverLetter', coverLetter);
    if (file) {
      formData.append('Attachment', file);
    }
    return this.http.post<ApiResponse<number>>(`${this.apiUrl}/${jobId}/apply`, formData);
  }

  getJobApplicants(offerId: number, page: number = 1, pageSize: number = 20): Observable<ApiResponse<Applicant[]>> {
    let params = new HttpParams().set('Page', page).set('PageSize', pageSize);
    return this.http.get<ApiResponse<Applicant[]>>(`${this.apiUrl}/${offerId}/applicants`, { params });
  }

  // ✅ New: Update Application Status
  updateApplicationStatus(applicationId: number, status: number): Observable<ApiResponse<boolean>> {
    // حسب الـ API، الـ Body هو JSON يحتوي على الداتا
    const body = { applicationId, status };
    return this.http.put<ApiResponse<boolean>>(`${environment.apiBaseUrl}/professions/offers/update-application`, body);
  }

  // ✅ New: Share Offer
  shareOffer(offerId: number): Observable<ApiResponse<any>> {
    // POST /api/professions/offers/{OfferId}/share
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${offerId}/share`, {});
  }
}