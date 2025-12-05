# Environment Variables Setup Guide

## Creating .env.local

1. **Create the file** in your project root (same folder as `package.json`)
2. **Name it exactly**: `.env.local` (with the dot at the beginning)

## File Contents

Your `.env.local` file should look exactly like this (replace with your actual values):

```
NOTION_API_KEY=your_actual_secret_here_no_quotes
NOTION_DATABASE_ID=2c0e4e8e967e8029bd4dfca9d9fb94d7
```

## Important Rules:

1. ✅ **NO spaces** around the `=` sign
2. ✅ **NO quotes** around the values
3. ✅ **NO trailing spaces** after values
4. ✅ **One variable per line**
5. ✅ **File must be named `.env.local`** (not `.env` or `env.local`)

## Example of CORRECT format:
```
NOTION_API_KEY=secret_abc123xyz
NOTION_DATABASE_ID=2c0e4e8e967e8029bd4dfca9d9fb94d7
```

## Example of INCORRECT format (don't do this):
```
NOTION_API_KEY = "secret_abc123xyz"  ❌ (has spaces and quotes)
NOTION_API_KEY=secret_abc123xyz   ❌ (has trailing space)
```

## After Creating/Updating .env.local:

1. **STOP your dev server** (Press Ctrl+C in terminal)
2. **START it again** (`npm run dev`)
3. Environment variables are only loaded when the server starts

## Verify It's Working:

After restarting, when you submit the newsletter form, check your terminal. You should see debug logs. If you still see "environment variables not found", double-check:
- File name is exactly `.env.local`
- No typos in variable names
- Values don't have quotes or extra spaces
- You restarted the server after creating/editing the file

