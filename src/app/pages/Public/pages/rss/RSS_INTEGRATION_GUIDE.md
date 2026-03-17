# RSS Feed Connection - Integration Guide

## How to Add "Connect RSS Feed" Button to Any Category Page

### Example: Adding to Housing Page

```typescript
import { Router } from '@angular/router';
import { CategoryEnum } from '../path/to/categories';

export class HousingHomeComponent {
  private router = inject(Router);

  navigateToConnectRss() {
    this.router.navigate(['/rss/connect'], {
      queryParams: { category: CategoryEnum.Housing }
    });
  }
}
```

### HTML Button Example

```html
<button (click)="navigateToConnectRss()" class="connect-rss-btn">
  <i class="fa fa-rss"></i>
  Connect RSS Feed
</button>
```

### Available Categories

- `CategoryEnum.Community` = 0
- `CategoryEnum.Culture` = 1
- `CategoryEnum.Education` = 2
- `CategoryEnum.Health` = 3
- `CategoryEnum.Housing` = 4
- `CategoryEnum.Lifestyle` = 5
- `CategoryEnum.Legal` = 6
- `CategoryEnum.News` = 7
- `CategoryEnum.Professions` = 8
- `CategoryEnum.Social` = 9
- `CategoryEnum.Transportation` = 10
- `CategoryEnum.Tv` = 11

### Direct Link Example

```html
<a [routerLink]="['/rss/connect']" [queryParams]="{ category: 4 }">
  Connect Housing RSS Feed
</a>
```

### Features

✅ Category is automatically pre-selected from query parameter
✅ Category badge is displayed in the form header
✅ After successful connection, user is redirected back to the category page
✅ No dropdown needed - category is passed via URL
✅ Works with all existing categories from CATEGORY_THEMES

### URL Format

```
/rss/connect?category=4
```

Where `4` is the CategoryEnum value for Housing.
