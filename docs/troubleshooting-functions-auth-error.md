# Troubleshooting: Firebase Functions Auth Token Validation Error

## Error Message

```
Failed to validate auth token. SyntaxError: Expected property name or '}' in JSON at position 4
    at JSON.parse (<anonymous>)
    at firebaseConfig (/workspace/node_modules/firebase-functions/lib/common/config.js:32:22)
```

## What This Means

This error occurs when Firebase Functions tries to parse its internal configuration JSON and encounters malformed JSON. This happens **before** your function code runs, during the authentication token validation phase.

## Common Causes

1. **Malformed Runtime Config Variables** - Environment variables set in Firebase Console that contain invalid JSON
2. **Corrupted FIREBASE_CONFIG** - The internal Firebase configuration variable is malformed
3. **Invalid Environment Variables** - Environment variables with special characters or formatting issues

## Solutions

### Solution 1: Check Firebase Console Environment Variables

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `collabcanvas-aac98`
3. Go to **Functions** → **Runtime Config** (or **Environment Variables**)
4. Check all environment variables for:
   - Invalid JSON syntax
   - Unescaped quotes or special characters
   - Missing or extra commas/braces
5. **Delete or fix** any malformed variables

### Solution 2: Clear Runtime Config

If you have runtime config variables that might be causing issues:

```bash
# List current runtime config
firebase functions:config:get

# Remove specific config variables if they're malformed
firebase functions:config:unset variable_name

# Or reset all config (be careful!)
# You'll need to set them again after
```

### Solution 3: Redeploy Functions

Sometimes a corrupted deployment can cause this. Try redeploying:

```bash
cd functions
npm run build
firebase deploy --only functions
```

### Solution 4: Check for Malformed Secrets

If you're using Firebase Secrets (like `OPENAI_API_KEY`), ensure they're set correctly:

```bash
# List secrets
firebase functions:secrets:access

# Verify OPENAI_API_KEY is set correctly
firebase functions:secrets:access OPENAI_API_KEY
```

### Solution 5: Verify Firebase Admin Initialization

The code has been updated to handle initialization errors more gracefully. If the error persists, you can try explicitly initializing Firebase Admin:

```typescript
// In functions/src/index.ts
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    // Explicitly set project ID if needed
    // projectId: 'collabcanvas-aac98'
  });
}
```

### Solution 6: Check for Corrupted Deployment

If none of the above work, try:

1. **Delete and redeploy the function**:
   ```bash
   firebase functions:delete aiCanvasCommand
   firebase deploy --only functions
   ```

2. **Check function logs** for more details:
   ```bash
   firebase functions:log --only aiCanvasCommand
   ```

## Prevention

1. **Always validate JSON** before setting environment variables
2. **Use Firebase Secrets** for sensitive data instead of runtime config
3. **Test locally** with emulators before deploying
4. **Monitor logs** after deployment to catch issues early

## Verification

After applying fixes, verify the function works:

1. Check function logs:
   ```bash
   firebase functions:log --only aiCanvasCommand --limit 10
   ```

2. Test the function from your app
3. Look for successful authentication in logs

## Still Having Issues?

If the error persists:

1. Check the full error stack trace in Firebase Console → Functions → Logs
2. Verify your Firebase project settings
3. Ensure you have the correct permissions
4. Try creating a new function to test if it's function-specific

## Related Issues

- This error is different from the "Unauthenticated" error we fixed earlier
- That error was in the client-side code
- This error is in the Firebase Functions runtime itself


