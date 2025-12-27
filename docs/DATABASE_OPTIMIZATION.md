# Database Optimization

## Indexes Added

### Feedbacks Table
| Index | Columns | Purpose |
|-------|---------|---------|
| `status` | status | Filter by status |
| `departmentId` | departmentId | Filter by department |
| `userId` | userId | Filter user's feedbacks |
| `forwardedToId` | forwardedToId | Manager's forwarded feedbacks |
| `createdAt` | createdAt | Sort by date |
| `deletedAt` | deletedAt | Soft delete queries |
| `status_departmentId` | status, departmentId | Combined filter |
| `status_forwardedToId` | status, forwardedToId | Manager view |

### Users Table
| Index | Columns | Purpose |
|-------|---------|---------|
| `role` | role | Filter by role |
| `isActive` | isActive | Active users only |
| `departmentId` | departmentId | Filter by department |
| `role_isActive` | role, isActive | Active managers/employees |
| `departmentId_role` | departmentId, role | Department members by role |

## Migration

To apply the indexes:

```bash
# Development
npx prisma migrate dev --name add_performance_indexes

# Production (use with caution)
npx prisma db push
```

## Query Optimization Tips

### 1. Use `select` to limit fields
```typescript
// Bad
const feedbacks = await prisma.feedbacks.findMany();

// Good
const feedbacks = await prisma.feedbacks.findMany({
  select: { id: true, title: true, status: true }
});
```

### 2. Use pagination
```typescript
const feedbacks = await prisma.feedbacks.findMany({
  take: 20,
  skip: page * 20,
  orderBy: { createdAt: 'desc' }
});
```

### 3. Avoid N+1 with `include`
```typescript
// Bad - N+1 queries
const feedbacks = await prisma.feedbacks.findMany();
for (const feedback of feedbacks) {
  const messages = await prisma.messages.findMany({
    where: { feedbackId: feedback.id }
  });
}

// Good - single query with join
const feedbacks = await prisma.feedbacks.findMany({
  include: { messages: true }
});
```

### 4. Use `_count` for counts
```typescript
const departments = await prisma.departments.findMany({
  include: {
    _count: {
      select: { feedbacks: true }
    }
  }
});
```

### 5. Use transactions for multiple writes
```typescript
await prisma.$transaction([
  prisma.feedbacks.update({ ... }),
  prisma.notifications.create({ ... }),
]);
```

## Monitoring

Check slow queries in PostgreSQL:
```sql
SELECT query, calls, mean_time, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```
