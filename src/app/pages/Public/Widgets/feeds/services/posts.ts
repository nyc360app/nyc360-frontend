import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
// تأكد أن مسار الـ environment صحيح بالنسبة لمكان هذا الملف
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PostsService {
  // استخدام الرابط الأساسي من ملف البيئة
  private apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) { }

  /**
   * 1. Get Feed (Main Function)
   * دالة لجلب البوستات مع دعم الفلترة والبحث
   */
  getFeed(params: any): Observable<any> {
    let httpParams = new HttpParams()
      .set('Page', params.page || 1)
      .set('PageSize', params.pageSize || 20);

    // إضافة الفلاتر فقط إذا كانت موجودة (غير null أو undefined)

    // فلتر القسم (Category)
    if (params.category !== null && params.category !== undefined) {
      httpParams = httpParams.set('Category', params.category);
    }

    // فلتر المكان (LocationId)
    if (params.locationId) {
      httpParams = httpParams.set('LocationId', params.locationId);
    }

    // بحث بالكلمات (Search)
    if (params.search) {
      httpParams = httpParams.set('Search', params.search);
    }

    // نوع البوست (اختياري)
    if (params.type !== null && params.type !== undefined) {
      httpParams = httpParams.set('Type', params.type);
    }

    return this.http.get(`${this.apiUrl}/posts/feed`, { params: httpParams });
  }

  /**
   * 2. Search Locations (Dropdown)
   * دالة للبحث عن المناطق لملء القائمة المنسدلة
   */
  searchLocations(query: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/locations/search`, {
      params: {
        Query: query,
        Limit: 20
      }
    });
  }
}