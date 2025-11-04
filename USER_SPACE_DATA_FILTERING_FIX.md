# User Space Data Filtering Fix

## Problem
User space (espace utilisateur) was showing ALL data (clinics, sensors, alerts) instead of filtering by the user's assigned clinics. The issue was that management components (`CliniqueManagement`, `SensorManagement`, `AlertesManagement`) were calling API functions directly instead of using the role-filtered React Query hooks.

## Root Cause
The React Query hooks (`useSensors()`, `useCliniques()`, `useAlertes()`) were correctly implemented with role-based filtering, but the management components were bypassing them by directly importing and calling API functions like:
- `getSensors()` in SensorManagement
- `getCliniques()` in CliniqueManagement  
- `getAlertes()` in AlertesManagement

This meant that even though the hooks would filter data based on user role, the components were loading unfiltered data directly.

## Solution
Modified all three management components to exclusively use React Query hooks for data loading:

### 1. CliniqueManagement Component
**File:** `frontend3/src/components/cliniques/clinique-management.tsx`

**Changes:**
- Added import: `import { useCliniques } from '../../queries/cliniques';`
- Added React Query hook: `const { data: cliniquesData = [], isLoading: queryLoading, refetch } = useCliniques();`
- Added useEffect to sync hook data to component state:
  ```tsx
  useEffect(() => {
    if (cliniquesData) {
      setCliniques(cliniquesData);
    }
  }, [cliniquesData]);
  ```
- Modified `reloadCliniques()` to use `await refetch()` instead of `getCliniques()`
- Modified `refreshAll()` to use `await refetch()` instead of direct API calls

### 2. SensorManagement Component
**File:** `frontend3/src/components/sensors/sensor-management.tsx`

**Changes:**
- Added imports:
  ```tsx
  import { useSensors } from '../../queries/sensors';
  import { useCliniques } from '../../queries/cliniques';
  ```
- Added React Query hooks:
  ```tsx
  const { data: sensorsData = [], isLoading: sensorsLoading, refetch: refetchSensors } = useSensors();
  const { data: cliniquesData = [], refetch: refetchCliniques } = useCliniques();
  ```
- Added useEffects to sync hook data:
  ```tsx
  useEffect(() => {
    if (sensorsData) {
      setSensors(sensorsData as any);
    }
  }, [sensorsData]);

  useEffect(() => {
    if (cliniquesData) {
      setLocalCliniques(cliniquesData as any);
    }
  }, [cliniquesData]);

  useEffect(() => {
    setIsLoading(sensorsLoading);
  }, [sensorsLoading]);
  ```
- Replaced `loadSensors()` to use `await refetchSensors()` instead of `getSensors()`
- Replaced `loadCliniques()` to use `await refetchCliniques()` instead of `getCliniques()`

### 3. AlertesManagement Component
**File:** `frontend3/src/components/alertes/alertes-management.tsx`

**Changes:**
- Removed direct import of `getAlertes`
- Added import: `import { useAlertes } from "../../queries/alertes";`
- Added React Query hook: `const { data: alertesData = [], isLoading, refetch } = useAlertes();`
- Added useEffect to sync hook data:
  ```tsx
  useEffect(() => {
    if (alertesData) {
      setAlertes(alertesData);
    }
  }, [alertesData]);
  ```
- Simplified `refresh()` to use `await refetch()` instead of `getAlertes()`
- Replaced all `loading` variable references with `isLoading` from the hook
- Removed manual loading state management (now handled by React Query)

## How It Works

### Role Detection Flow
1. `useIsAdmin()` hook checks `localStorage.getItem('role')` to determine if user is admin
2. Each React Query hook (`useSensors`, `useCliniques`, `useAlertes`) uses `useIsAdmin()` to conditionally call:
   - **Admin:** Standard endpoints (`/api/capteurs`, `/api/cliniques`, `/api/alertes`)
   - **User:** User-scoped endpoints (`/api/users/{id}/capteurs`, `/api/users/{id}/cliniques`, `/api/users/{id}/alertes`)

### Backend Filtering
User-scoped endpoints filter data through the `clinique_user` pivot table:
```php
// In CliniqueController
$user->cliniques()->with('floors.services.capteurs')->get()

// In CapteurController  
whereHas('service.floor', function ($q) use ($cliniqueIds) {
    $q->whereIn('clinique_id', $cliniqueIds);
})

// In AlerteController
whereHas('capteur.service.floor', function ($q) use ($cliniqueIds) {
    $q->whereIn('clinique_id', $cliniqueIds);
})
```

### Data Flow
```
Component Mount
    ↓
React Query Hook (useSensors/useCliniques/useAlertes)
    ↓
Check useIsAdmin()
    ↓
Call appropriate API endpoint
    ├─ Admin: /api/capteurs (all data)
    └─ User: /api/users/{id}/capteurs (filtered by assigned clinics)
    ↓
Backend filters via pivot table (users only)
    ↓
Data returned to hook
    ↓
useEffect syncs to component state
    ↓
Component renders filtered data
```

## Testing Checklist

To verify the fix works correctly:

1. **Admin Test:**
   - Login as admin
   - Navigate to `/capteurs`, `/cliniques`, `/alertes`
   - Should see ALL data from all clinics

2. **User Test:**
   - Login as user1 (assigned to clinique X)
   - Navigate to `/user/capteurs`, `/user/cliniques`, `/user/alertes`
   - Should ONLY see data from clinique X
   - Navbar badge count should show only alerts from clinique X
   - Management components should show only sensors/floors/services from clinique X

3. **Cross-Access Prevention:**
   - Admin trying to access `/user/dashboard` → redirected to `/`
   - User trying to access `/capteurs` → redirected to `/user/dashboard`

## Files Modified

1. `frontend3/src/components/cliniques/clinique-management.tsx`
2. `frontend3/src/components/sensors/sensor-management.tsx`
3. `frontend3/src/components/alertes/alertes-management.tsx`

## Related Files (Already Implemented)

- `frontend3/src/queries/sensors.ts` - React Query hook with role filtering
- `frontend3/src/queries/cliniques.ts` - React Query hook with role filtering
- `frontend3/src/queries/alertes.ts` - React Query hook with role filtering
- `frontend3/src/hooks/useIsAdmin.ts` - Role detection hook
- `frontend3/src/components/alertes/alertes-api.ts` - Added `getAlertesCountsByUser()`
- `backend/app/Http/Controllers/CliniqueController.php` - User-scoped endpoints
- `backend/app/Http/Controllers/CapteurController.php` - User-scoped endpoints
- `backend/app/Http/Controllers/AlerteController.php` - User-scoped endpoints

## Build Status
✅ Build successful: 1071.99 kB (gzipped 304.82 kB)
✅ No TypeScript errors
✅ All components compile successfully

## Security Notes

This fix ensures that:
- Users cannot see data from clinics they're not assigned to
- Data filtering happens at both backend (SQL queries) and frontend (React Query hooks)
- Components cannot bypass filtering by calling API directly
- Role checks are centralized in `useIsAdmin()` hook
- All management components consistently use the same filtered data source

## Next Steps

1. Test with multiple users assigned to different clinics
2. Verify pagination works correctly with filtered data
3. Test refresh/refetch operations maintain proper filtering
4. Verify search and filter operations work on filtered dataset only
5. Test that creating/editing entities respects user's assigned clinics
