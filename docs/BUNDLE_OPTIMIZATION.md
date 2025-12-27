# Bundle Optimization Guide

## Current Bundle Status

| Metric | Size |
|--------|------|
| Client (static) | 4.41 MB |
| Server | 34.48 MB |
| Total | 38.89 MB |

## Available Commands

```bash
# Run bundle analyzer (opens in browser)
npm run analyze

# Generate bundle report in terminal
npm run bundle-report
```

## Heavy Dependencies

| Package | Size | Status |
|---------|------|--------|
| next | 134 MB | Required - framework |
| prisma | 86 MB | Server-only |
| @prisma/client | 73 MB | Server-only |
| lucide-react | 34 MB | ✅ Tree-shaked via individual imports |
| typescript | 22 MB | Dev-only |
| date-fns | 21 MB | ✅ Tree-shakeable |
| vazirmatn | 18 MB | Font files |
| recharts | 5.6 MB | ⚠️ Consider lazy loading |

## Optimizations Applied

### 1. Tree Shaking
- Lucide icons imported individually
- date-fns uses modular imports

### 2. Code Splitting
- Dynamic imports for heavy components
- Route-based splitting via Next.js App Router

### 3. Server Components
- Prisma only runs server-side
- API routes handle database operations

## Recommendations

### High Priority
1. **Lazy load Recharts** - Only load on analytics pages
2. **Dynamic import modals** - Load dialogs on demand

### Medium Priority
1. Consider lighter alternatives to recharts if only basic charts needed
2. Review unused date-fns functions

### Low Priority
1. Font subsetting for vazirmatn (only Persian characters)

## Monitoring

Run `npm run bundle-report` after major changes to track bundle size evolution.
