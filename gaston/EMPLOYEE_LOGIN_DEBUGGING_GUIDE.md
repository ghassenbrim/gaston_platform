# Employee Login Debugging & Testing Guide

## Overview
I've identified and fixed potential issues in the employee authentication flow. This guide helps you verify the fixes and debug any remaining issues.

## Changes Made

### 1. ✅ Enhanced `backend/auth/index.ts` - signIn()
- **Added role normalization**: Converts role to uppercase string
- **Added comprehensive logging**: Tracks role type, value, and Employee status
- **Database validation**: Logs if Employee record exists

**What to look for in console:**
```
[signIn] Recherche utilisateur: employee@example.com
[signIn] Utilisateur trouvé: {id: "...", role: "EMPLOYEE", employeeExists: true}
[signIn] Connexion réussie pour employee@example.com. Role type: string, Value: "EMPLOYEE", Normalized: "EMPLOYEE"
```

### 2. ✅ Enhanced `app/role/welcompage/signe_in/actions.ts` - loginAction()
- **Added input validation**: Checks email/password not empty
- **Better cookie settings**: Added `secure: true, sameSite: "lax"`
- **Detailed logging**: Shows email, role, and redirect URL
- **Better error messages**: Distinguishes between missing credentials and incorrect password

**What to look for in console:**
```
[loginAction] Connexion réussie: employee@example.com avec rôle EMPLOYEE
[loginAction] Redirection vers /role/employeer/dashboard
```

### 3. ✅ Enhanced `app/api/auth/restore/route.ts`
- **Role normalization**: Ensures role is uppercase string
- **Better error handling**: Logs specific errors (missing userId, user not found)
- **Cookie security**: Added `secure: true, sameSite: "lax"`

### 4. ✅ Improved `app/role/employeer/layout.tsx`
- **Better error logging**: Shows HTTP status codes
- **Handles missing profiles**: Logs if Employee record missing (404)
- **Automatic redirect**: Redirects to login on 401 (unauthorized)

### 5. ✅ Improved `hooks/useSessionSync.ts`
- **Better validation**: Logs all validation checks
- **Role mismatch detection**: Redirects if session role doesn't match expected role
- **Clear error messages**: Distinguishes between missing session and role mismatch

## Testing Checklist

### Step 1: Prepare Test Account
1. **In database or admin panel**, create/verify an employee account:
   - Email: `employee@test.com` (or any test email)
   - Password: `password123` (must match what's in database)
   - Role: `EMPLOYEE` (must be uppercase)
   - First Name: `Test`
   - Last Name: `Employee`

   ✅ Verify in database:
   - `SELECT * FROM "User" WHERE email='employee@test.com'`
   - Record should have `role = 'EMPLOYEE'`
   - `SELECT * FROM "Employee" WHERE "userId"='...'`
   - Record should exist with `firstName='Test', lastName='Employee'`

### Step 2: Check Credentials in Database
```sql
-- Verify the password matches exactly (no hashing currently!)
SELECT id, email, password, role FROM "User" WHERE role='EMPLOYEE' LIMIT 1;
```
⚠️ Note: Passwords are currently stored as **plaintext**. Use exact password stored in database.

### Step 3: Test Login with Console Monitoring

1. **Open Browser DevTools** (F12 or Cmd+Option+I)
2. **Go to Console tab** - you'll see detailed logs
3. **Go to Application → Cookies** (keep this open in another window)
4. **Navigate to** `http://localhost:3000/role/welcompage/signe_in`
5. **Enter Credentials**:
   - Email: `employee@test.com`
   - Password: `password123` (exact match from database)
6. **Click Login** and watch console

**Expected Console Output:**
```
[signIn] Recherche utilisateur: employee@test.com
[signIn] Utilisateur trouvé: {id: "uuid-here", role: "EMPLOYEE", employeeExists: true}
[signIn] Connexion réussie pour employee@test.com. Role type: string, Value: "EMPLOYEE", Normalized: "EMPLOYEE"
[loginAction] Connexion réussie: employee@test.com avec rôle EMPLOYEE
[loginAction] Redirection vers /role/employeer/dashboard
```

### Step 4: Verify Cookies Were Set

In Browser DevTools → Application → Cookies → `localhost:3000`

✅ Should see:
```
userId     = "uuid-of-employee"
userRole   = "EMPLOYEE"
```

❌ If missing: Page may have redirected before cookies were saved

### Step 5: Check Middleware Validation

After redirect, you should land on dashboard. If you get redirected back to login:

1. **Check middleware logs** in server console:
   - Look for role comparison: `userRole !== "EMPLOYEE"`
   - Verify it's comparing strings correctly

2. **Verify the path** matches protected route:
   - Path: `/role/employeer/dashboard` ✅ Protected
   - Required: `userRole === "EMPLOYEE"` ✅ Correct

### Step 6: Check Employee Profile Load

Once on dashboard, the layout should fetch the employee profile:

**Expected Console Output:**
```
[EmployeeLayout] Erreur API employeur: 200, {success: true, data: {...}}
// OR if there was an error:
[EmployeeLayout] Erreur API employeur: 404, {success: false, error: "..."}
[EmployeeLayout] Profil employé non trouvé (404). L'admin doit créer le profil.
```

## Troubleshooting

### Issue: "Email ou mot de passe incorrect" Message
**Cause**: Password mismatch

**Solution**:
1. Verify password in database matches exactly (case-sensitive, spaces matter)
2. Ensure no leading/trailing spaces in input fields
3. Check if password needs to match different format (hashed, encoded, etc.)

### Issue: Redirected Back to Login After Submit
**Cause 1**: Cookies not being set
- Check browser cookie settings (should allow httpOnly)
- Check DevTools → Application → Cookies (verify userId and userRole exist)

**Cause 2**: Middleware role validation failing
- Verify `userRole === "EMPLOYEE"` (note: NOT "EMPLOYEER")
- Check middleware is receiving the role cookie correctly

**Cause 3**: Middleware redirecting to wrong path
- Check `dashboardMap` in `actions.ts` has correct path: `/role/employeer/dashboard`
- Verify path doesn't have typo (many places say "employeer" not "employee")

### Issue: Dashboard Loads But Shows No Profile
**Cause**: Employee record missing or profile API failing

**Solution**:
1. Check database:
   ```sql
   SELECT * FROM "Employee" WHERE "userId" = 'your-user-id';
   ```
2. If missing: Admin needs to create employee via `/role/admin/employes`
3. If exists: Check `/api/employeer/settingsemployee` response in Network tab

### Issue: Console Shows No Logs
**Cause**: Logs haven't been deployed yet

**Solution**:
1. Rebuild project: `npm run build`
2. Restart dev server: `npm run dev`
3. Hard refresh browser: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+Delete` (Windows)

## Network Tab Analysis

In Browser DevTools → Network tab, check these requests:

### 1. Login POST Request
- **URL**: `/role/welcompage/signe_in`
- **Status**: 200 ✅
- **Response**: Should show `{success: true, dashboard: "/role/employee/dashboard"}`

### 2. Dashboard Navigation
- **URL**: `/role/employeer/dashboard`
- **Status**: 200 ✅ (or redirect if middleware involved)

### 3. Profile Fetch
- **URL**: `/api/employeer/settingsemployee`
- **Status**: 200 ✅ with profile data
- **Headers**: Should include cookies with `userId`

## Database Validation Query

```sql
-- Find all employees with their users
SELECT 
    u.id as user_id,
    u.email,
    u.role,
    u."password",
    e.id as employee_id,
    e."firstName",
    e."lastName"
FROM "User" u
LEFT JOIN "Employee" e ON u.id = e."userId"
WHERE u.role = 'EMPLOYEE'
ORDER BY u."createdAt" DESC;

-- Specifically check one employee
SELECT * FROM "User" WHERE email = 'employee@test.com';
SELECT * FROM "Employee" WHERE "userId" = '...';
```

## Security Note ⚠️

**CRITICAL**: Implement password hashing immediately!

Current implementation stores passwords as **plaintext**, which is a major security vulnerability.

```typescript
// CURRENT (INSECURE):
if (user.password !== password) { /* ... */ }

// RECOMMENDED (bcrypt):
import bcrypt from 'bcryptjs';
const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
```

## Next Steps

1. ✅ Deploy the enhanced logging changes
2. ✅ Test employee login with debug console visible
3. ✅ Share console output logs if issues persist
4. ✅ Implement password hashing (URGENT)
5. ✅ Consider session timeout and refresh token strategy

---

**Last Updated**: Today
**Status**: Debugging in progress
**Contact**: Review console logs and share output if issues persist
