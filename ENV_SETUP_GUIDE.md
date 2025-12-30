# Environment Variables Setup Guide

## Required Environment Variables for Firebase Admin

Add these to your `.env.local` file. You can get these values from your service account JSON file (`bwccworkspace-firebase-adminsdk-fbsvc-6af0bab4d8.json`).

### Option 1: Individual Environment Variables (Recommended)

```bash
# Required
FIREBASE_PROJECT_ID=bwccworkspace
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@bwccworkspace.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCmYLEud3TTYCEa\n... (rest of your private key) ...\n-----END PRIVATE KEY-----\n"

# Optional (but recommended)
FIREBASE_PRIVATE_KEY_ID=6af0bab4d887311809d72cfb997aa7794f04279e
FIREBASE_CLIENT_ID=102532499843685191862
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40bwccworkspace.iam.gserviceaccount.com
```

**Important Notes:**
- The `FIREBASE_PRIVATE_KEY` must be in quotes and include the `\n` characters (they will be converted to actual newlines)
- Copy the entire private key from your JSON file, including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- Keep the `\n` characters in the private key - they are needed

### Option 2: Single JSON Environment Variable

Alternatively, you can put the entire JSON as a single environment variable:

```bash
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"bwccworkspace","private_key_id":"6af0bab4d887311809d72cfb997aa7794f04279e","private_key":"-----BEGIN PRIVATE KEY-----\n...","client_email":"firebase-adminsdk-fbsvc@bwccworkspace.iam.gserviceaccount.com",...}'
```

**Note:** This must be on a single line or properly escaped.

## Client-Side Firebase Configuration

Also add these for client-side Firebase operations (admin login, etc.):

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=bwccworkspace.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=bwccworkspace
```

Get the API key from Firebase Console → Project Settings → General → Your apps

## Complete .env.local Example

```bash
# Firebase Admin (Server-Side) - Individual Variables
FIREBASE_PROJECT_ID=bwccworkspace
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@bwccworkspace.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCmYLEud3TTYCEa\nkPlXP2UPNd/wt7R6geHRy0EiehteUtGYkM+qV85NdyvcKFito2WGPHk62T2xu58P\nejWZP5QDVFxvuow4fJKvdcE4Mki682vAhYjBZKUcqvvbv7gW0G+VXYPy6EMKNACh\npGg7fKaDcehMbHk0UnsEHTy/mGhsiYLUyrEVldcwCwCENdyOB9SPDltaeqSmepxV\nw8CzXPeuIOUwBRvNShag2INK9ADGG84J6/w2sWg87AhPnGk4z81LAPMzSFb7mjPE\nvJlZsh2nLSK1ffG/T9aniT9keEzdu4kb46/qBAO6GWUjtBPdiEVrxVq0h4t7Au4G\nYWa4noidAgMBAAECggEADLmHyOpWo1/5HYNe/pRDp2vTFSGyX6LqttVDxbOZv5di\nnmIyRRtIFQFQonBCMALiMz0RdzXBk9lUq1Czzrpfw01tcGzPvUuRxceiH9PWCi5Z\n3F9E0VMK6cFjV9rhj8/LPkeTsufz+1DKMj1VF3pLcJwtTG2za2laLTtgjQrGrx5J\njEfUMTp7UQlVsV82aGAWMhkL5CWVByJFHMcxKBb2cYOfWXOvKuh2QHukG7ien+MG\n7mljyDQIc1uMioNjoJCqkmpiO02e+L1dFmcWJ7HhXN+C3m3me8A7ChXoXqPnxg1b\ncuAUzHApQtMA5F4BOG+SDSUx/OkjMWhwEYI7yWd3BQKBgQDjs/vYAsvQGKTG/sYC\nrY/H8GbqwKOJE/iCuV9ZE+rwjpEKltS5FJuuXOu4ZWRjO/SuZqMdHk2l2ekZ8oUH\npsaUtJG5SZUKjqNQTo4pL4orIrasx0/VJiBrfWjwnptHSUUqjO0fkBqv1ZwlA1Gr\n+hAmJKi7/1QQd9jZUyI1RBl+DwKBgQC7Dbz3BFFc7/iQyaSAq+wt8dMBrOI7oJKI\nhjGJ0/o7ZhMjW6j9plSgxeWT9OWoTrQUg+0DcluFIQp2EGpv9Wk7su+glnCzdSLa\n5KVGorkUaLxpRF7tCEB0OPlzgE20OJ/mqKkM19hRgoQKciAH2M4w6a9Qk4C7sf4Z\nTLEbcZh6kwKBgBtP+nRlmXbjjdhEtRGbKfTslBuycas+lv9vJs2zgunJ4AHqJ6fv\nneDjSm760njIt0e4DfavLNco9TnkiippycYKhrQ37EWw6Ev4sDqmdidIaar92UiS\n4y6hg1XhYHTDiCVbdBHmIh1XPPx/kmtTel5o5UhvjvDOv1cKDr9e5MPnAoGAcaLI\n96/x1eobMaque1T2qHrO26ex0NOd8b7EfZz/2fILEmHu6hmQNBPFgvs2Qed+UzBK\nXtusadZGyq7yWo3WnmP4W7DJStyQjjZ1idH1akaun6zfllR7A6BROy/pBOGZksFH\n4fuG+Q23NblbaCj4KpLs5KCXhm99lNUYizmZjm0CgYAuUSe3Ts5fG+HnKWGJja4x\nnG7GwN0JwARAK4TmfVHDrFlFoYfcA+rfKdqCeZYHp3nxT7wFeoT5MBkYyHPKofuv\nnfpHHucMuxgoGORQZ0Uaq+/rD2rF3OcSTrWBgdEfLMbPmUwao3NV8stNyL9qcvro\ntGvbQpjrl67E7Qkrw7G5HA==\n-----END PRIVATE KEY-----\n"
FIREBASE_PRIVATE_KEY_ID=6af0bab4d887311809d72cfb997aa7794f04279e
FIREBASE_CLIENT_ID=102532499843685191862
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40bwccworkspace.iam.gserviceaccount.com

# Firebase Client (Client-Side)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=bwccworkspace.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=bwccworkspace
```

## How to Get Your Values

1. Open your `bwccworkspace-firebase-adminsdk-fbsvc-6af0bab4d8.json` file
2. Copy each value to the corresponding environment variable:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the `\n` characters)
   - `private_key_id` → `FIREBASE_PRIVATE_KEY_ID`
   - `client_id` → `FIREBASE_CLIENT_ID`
   - `client_x509_cert_url` → `FIREBASE_CLIENT_X509_CERT_URL`

## After Adding Variables

1. Save your `.env.local` file
2. **Restart your development server** (important - environment variables are only loaded on startup)
3. Test the newsletter subscription again

