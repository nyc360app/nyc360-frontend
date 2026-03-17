import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MyOffersService } from '../../service/my-offers';
import { MyOffer } from '../../models/my-offers';
import { GlobalLoaderService } from '../../../../../../shared/components/global-loader/global-loader.service';

@Component({
  selector: 'app-my-offers',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-offers.html',
  styleUrls: ['./my-offers.scss']
})
export class MyOffersComponent implements OnInit {
  private offersService = inject(MyOffersService);
  private cdr = inject(ChangeDetectorRef); // Inject CDR
  private loaderService = inject(GlobalLoaderService);

  offers: MyOffer[] = [];
  isLoading = true;
  isDeleting = false;

  // Filters & Pagination
  currentFilter: 'all' | 'active' | 'closed' = 'all';
  pagination = { page: 1, pageSize: 20, totalPages: 1, totalCount: 0 };

  ngOnInit() {
    this.loadOffers();
  }

  loadOffers() {
    this.isLoading = true;
    this.loaderService.show();

    let isActiveParam: boolean | undefined = undefined;
    if (this.currentFilter === 'active') isActiveParam = true;
    if (this.currentFilter === 'closed') isActiveParam = false;

    this.offersService.getMyOffers(this.pagination.page, this.pagination.pageSize, isActiveParam).subscribe({
      next: (res) => {
        if (res.isSuccess) {
          this.offers = res.data || []; // Ensure array
          this.pagination.totalPages = res.totalPages;
          this.pagination.totalCount = res.totalCount;
        }
        this.isLoading = false;
        this.loaderService.hide();
        this.cdr.detectChanges(); // Force update
      },
      error: () => {
        this.isLoading = false;
        this.loaderService.hide();
        this.cdr.detectChanges(); // Force update
      }
    });
  }

  deleteOffer(offerId: number) {
    if (confirm('Are you sure you want to delete this job offer?')) {
      this.isDeleting = true;
      this.offersService.deleteOffer(offerId).subscribe({
        next: (res) => {
          if (res.isSuccess) {
            // حذف العنصر من القائمة محلياً لتحديث الواجهة فوراً
            this.offers = this.offers.filter(o => o.id !== offerId);
            this.pagination.totalCount--;
          } else {
            alert('Error deleting offer');
          }
          this.isDeleting = false;
        },
        error: () => {
          this.isDeleting = false;
          alert('Something went wrong');
        }
      });
    }
  }

  setFilter(filter: 'all' | 'active' | 'closed') {
    this.currentFilter = filter;
    this.pagination.page = 1;
    this.loadOffers();
  }

  changePage(newPage: number) {
    if (newPage >= 1 && newPage <= this.pagination.totalPages) {
      this.pagination.page = newPage;
      this.loadOffers();
      window.scrollTo(0, 0);
    }
  }
}