# Research Findings: QuestLife Data Persistence

**Date**: 2025-09-20 | **Feature**: Data Persistence and API Integration

## Executive Summary
Research focused on connecting React/Zustand frontend to Express/SQLite backend, ensuring data persistence across sessions, and handling authentication for data mutations. All technical uncertainties have been resolved.

## Key Decisions

### 1. Zustand to API Connection Pattern
**Decision**: Direct API calls in store actions with optimistic updates
**Rationale**:
- Maintains existing store structure without major refactoring
- Optimistic updates provide instant feedback for gamified experience
- Simple error handling with rollback capability
**Alternatives considered**:
- TanStack Query: Too heavy for current scale
- Redux Toolkit Query: Would require complete store migration

### 2. Data Persistence Strategy
**Decision**: SQLite transactions with explicit rollback support
**Rationale**:
- better-sqlite3 provides native transaction support
- WAL mode enables concurrent reads
- Automatic rollback on errors prevents partial updates
**Alternatives considered**:
- Manual transaction management: More error-prone
- Stored procedures: Not supported in SQLite

### 3. Authentication Pattern
**Decision**: JWT in memory + validation on every mutation
**Rationale**:
- Existing PIN auth system already uses JWTs
- Memory storage prevents XSS attacks
- Server-side validation ensures security
**Alternatives considered**:
- HttpOnly cookies: Would require backend changes
- Session storage: Less secure than memory

### 4. Cross-Tab Synchronization
**Decision**: Storage events + periodic sync checks
**Rationale**:
- Native browser API requires no dependencies
- Handles both active updates and background sync
- Last-write-wins strategy matches game semantics
**Alternatives considered**:
- BroadcastChannel API: Limited browser support
- WebSockets: Overkill for local application

### 5. Error Recovery
**Decision**: Exponential backoff with 3 retries + saga pattern for complex operations
**Rationale**:
- Prevents data loss from transient failures
- Saga pattern enables clean rollback of multi-step operations
- Aligns with gamification principle (never lose progress)
**Alternatives considered**:
- Circuit breaker: Too complex for current needs
- Simple retry: Insufficient for multi-step operations

## Implementation Patterns

### Store Update Pattern
```typescript
// Replace mock data generation with API call
loadDashboard: async () => {
  set({ isLoading: true, error: null });
  try {
    const data = await dashboardApi.getDashboard();
    set({ dashboardData: data, isLoading: false, lastUpdated: new Date() });
  } catch (error) {
    set({ error: error.message, isLoading: false });
    throw error;
  }
}
```

### Transaction Pattern
```typescript
// Ensure atomic quest completion
db.transaction(() => {
  updateQuestStatus(questId, 'completed');
  updateCharacterXP(userId, xpGained);
  updateStreak(userId);
  invalidateCache(userId);
})();
```

### Optimistic Update Pattern
```typescript
// Immediate UI update with rollback capability
const originalData = get().dashboardData;
set({ dashboardData: optimisticData });

try {
  const result = await api.quickComplete(questId);
  set({ dashboardData: result });
} catch (error) {
  set({ dashboardData: originalData }); // Rollback
  throw error;
}
```

## Technical Constraints

1. **SQLite Limitations**:
   - No concurrent writes (handled by WAL mode + busy timeout)
   - 5-second busy timeout configured
   - Transactions limited to synchronous operations

2. **JWT Constraints**:
   - 7-day expiry requires refresh strategy
   - Token must be included in every API request
   - Size limited to prevent header overflow

3. **Browser Storage**:
   - localStorage limited to 5-10MB
   - Cross-tab events fire only on actual changes
   - Private browsing may restrict storage

## Performance Considerations

1. **Dashboard Loading**: Target <1s achieved through:
   - 5-minute cache with timestamp validation
   - Parallel data fetching where possible
   - Minimal data transformation

2. **Quest Completion**: Target <500ms achieved through:
   - Optimistic updates for instant feedback
   - Background sync for non-critical updates
   - Indexed database queries

3. **Memory Management**:
   - Zustand stores use shallow equality checks
   - Cache invalidation prevents memory leaks
   - Pending operations map prevents duplicates

## Security Requirements

1. **Authentication**: PIN verification required for all mutations
2. **Token Storage**: Access tokens in memory only
3. **Data Validation**: Server-side validation on all inputs
4. **Error Messages**: No sensitive data in error responses

## Risk Mitigation

| Risk | Mitigation | Impact |
|------|------------|--------|
| Database corruption | WAL mode + regular backups | Low |
| Token expiry during operation | Automatic refresh before operations | Medium |
| Network failure during quest completion | Saga pattern with compensation | Low |
| Concurrent tab updates | Last-write-wins + event sync | Low |
| Cache inconsistency | TTL-based invalidation | Low |

## Implementation Priority

1. **Phase 1**: Replace mock data in dashboardStore (Critical)
2. **Phase 2**: Add transaction support for quest completion (Critical)
3. **Phase 3**: Implement cross-tab synchronization (Important)
4. **Phase 4**: Add retry logic with exponential backoff (Nice to have)
5. **Phase 5**: Implement saga pattern for complex operations (Future)

## Validation Criteria

- [ ] Dashboard loads real data on page refresh
- [ ] Quest completions persist after browser refresh
- [ ] Goal/class creation works with authentication
- [ ] Multiple tabs show consistent data
- [ ] Failed operations don't corrupt data
- [ ] XP calculations match database state

---
*Research complete. All technical uncertainties resolved. Ready for design phase.*