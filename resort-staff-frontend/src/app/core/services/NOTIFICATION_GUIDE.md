# Notification System Guide

## Overview
A centralized notification system handles all success and error messages consistently across the application.

## Architecture

### 1. **NotificationService** (notification.service.ts)
- Centralized service managing notification state
- Uses RxJS BehaviorSubject for reactive updates
- Provides: `success()`, `error()`, `info()` methods

```typescript
// Methods
notify.success(message, durationMs = 4000);
notify.error(message, durationMs = 6000);
notify.info(message, durationMs = 4000);
notify.clear(); // Manual dismiss
```

### 2. **API Message Interceptor** (api-message.interceptor.ts)
- **Automatically handles ALL HTTP responses**
- Detects success/error from backend response
- Sends notifications without component involvement
- Intercepts all POST, PUT, PATCH, DELETE calls

**Feature:** Mutating requests (POST, PUT, PATCH, DELETE) show success messages automatically if the request succeeds.

### 3. **Api Alert Component** (shared/components/api-alert)
- Displays notifications at the top of the page
- Premium styled toast with icons
- Dark theme support
- Smooth animations
- Mobile responsive

_Already integrated in app.component.ts_

## How It Works

### Automatic Message Handling (No Code Needed)
```typescript
// Component code
this.staffService.createStaff(data).subscribe({
  next: () => {
    this.router.navigate(['/staff']); // Just navigate
    // ✅ Message is automatically shown by interceptor
  },
  error: () => {
    // ✅ Error message automatically shown by interceptor
  }
});
```

### Manual Notification (Optional)
```typescript
private notify = inject(NotificationService);

// Show custom message
this.notify.success('Staff member added successfully!');
this.notify.error('Failed to update staff');
this.notify.info('Loading staff list...');

// Clear notification manually
this.notify.clear();
```

## Message Flow

```
API Call
   ↓
HTTP Response
   ↓
apiMessageInterceptor (checks response)
   ↓
NotificationService (stores message in state$)
   ↓
ApiAlertComponent (listens to state$, displays message)
   ↓
Auto-dismiss after (4s for success, 6s for error)
```

## Backend Response Format

For automatic success message detection:
```json
{
  "success": true,
  "message": "Staff created successfully",
  "data": { ... }
}
```

For automatic error message detection:
```json
{
  "success": false,
  "message": "Invalid staff data",
  "error": "..."
}
```

## Notification Types

### Success (Green)
- Duration: 4000ms (configurable)
- Shows checkmark icon
- Gradient green background
- Light theme: dark green text
- Dark theme: light green text

### Error (Red)
- Duration: 6000ms (configurable)
- Shows warning icon
- Gradient red background
- Light theme: dark red text
- Dark theme: light red text

### Info (Blue)
- Duration: 4000ms (configurable)
- Shows info icon
- Gradient blue background
- Light theme: dark blue text
- Dark theme: light blue text

## Common Patterns

### Form Submission
```typescript
onSubmit() {
  this.loading = true;
  
  this.service.saveData(data).subscribe({
    next: () => {
      this.loading = false;
      this.router.navigate(['/list']);
      // ✅ Success message auto-shown
    },
    error: () => {
      this.loading = false;
      // ✅ Error message auto-shown
    }
  });
}
```

### List Operations
```typescript
loadData() {
  this.service.getData().subscribe({
    next: (res) => {
      this.data = res.data;
      // ✅ No message needed for GET requests
    },
    error: () => {
      // ✅ Error message auto-shown
    }
  });
}
```

### Want Manual Control?
```typescript
deleteItem(id: number) {
  this.service.delete(id).subscribe({
    next: () => {
      this.notify.success('Item deleted successfully');
      this.loadData();
    },
    error: () => {
      this.notify.error('Failed to delete item');
    }
  });
}
```

## Styling Customization

All notification styles are in: `shared/components/api-alert/api-alert.component.css`

CSS Variables used:
- `--bg`: Notification background (gradient)
- `--text`: Text color
- `--border`: Border color
- `--icon-bg`: Icon background
- `--icon`: Icon color

Dark theme overrides automatically applied based on `:root[data-theme='dark']`

## Migration from Old System

### Remove These Imports
```typescript
// ❌ Remove these
import { ToastrService } from 'ngx-toastr';
toastr = inject(ToastrService);
```

### Replace With
```typescript
// ✅ Use this
import { NotificationService } from '..';
private notify = inject(NotificationService);
```

### Simplify subscribe blocks
```typescript
// ❌ Old
error: (err) => {
  this.toastr.error(err.message);
}

// ✅ New (delete this block entirely for auto-handling)
error: () => {
  // Auto-handled by interceptor
}
```

## Testing

The notification system works with all API methods:
- ✅ GET (no auto-message)
- ✅ POST (auto success message)
- ✅ PUT (auto success message)
- ✅ PATCH (auto success message)
- ✅ DELETE (auto success message)
- ✅ Errors (auto error message for all)

## Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

## Performance

- Zero performance impact
- Lazy loaded with app
- Message state efficiently managed
- Minimal re-renders
- Auto garbage collection on dismiss
