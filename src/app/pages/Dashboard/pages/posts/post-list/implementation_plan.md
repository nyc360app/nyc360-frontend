# Implementation Plan - Responsive Posts and Communities Lists

## User Request
"دول (posts & communities) كروت رسبونسيف للهاتف يلا كمن برضو"
(Make these posts and communities sections responsive cards for phone as well, come on)

## Status: COMPLETED

## Changes Implemented

### 1. Posts List (`src/app/pages/Dashboard/pages/posts/post-list`)

#### `post-list.html`
-   **Desktop**: Retained the table view for larger screens (`d-none d-md-block`).
-   **Mobile**: Introduced a `d-md-none` block that iterates over posts and presents them as styled cards.
    -   Displays thumbnails, title, author info, category badges, and stats in a stacked layout.
    -   Action buttons are full-width and touch-friendly.

#### `post-list.scss`
-   Added `.post-card-mobile` class with glassmorphism touches (`rgba` background) and hover effects.
-   Defined responsive behaviors for the header and buttons.
-   Fixed lint error regarding `line-clamp` compatibility.

### 2. Communities List (`src/app/pages/Dashboard/pages/communities/pages/communities-list`)

#### `communities-list.html`
-   **Desktop**: Retained table view.
-   **Mobile**: Added `d-md-none` block for community cards.
    -   Displays community avatar, name, slug, status badges, and member statistics grid.
    -   Action buttons (Moderate/View) are easily accessible.

#### `communities-list.scss`
-   Added `.community-card-mobile` styles with clean borders and shadows.
-   Adjusted header and filter layouts to stack vertically on mobile screens.

## Verification
-   All files modified successfully.
-   Lint errors resolved.
-   The implementation follows the requested "card" pattern for mobile responsiveness.
