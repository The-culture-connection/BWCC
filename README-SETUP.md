# Newsletter Notion Integration Setup

## Step 1: Create .env.local file

Create a file named `.env.local` in the root of your project (same level as `package.json`).

## Step 2: Add your Notion credentials

Add these two lines to `.env.local`:

```
NOTION_API_KEY=your_internal_integration_secret_here
NOTION_DATABASE_ID=2c0e4e8e967e8029bd4dfca9d9fb94d7
```

Replace `your_internal_integration_secret_here` with your actual Notion Internal Integration Secret.

## Step 3: Get your Notion credentials

1. **Get API Key:**
   - Go to https://www.notion.so/my-integrations
   - Create a new "Internal" integration
   - Copy the "Internal Integration Secret"

2. **Get Database ID:**
   - Open your Notion database
   - Look at the URL: `https://www.notion.so/workspace/2c0e4e8e967e8029bd4dfca9d9fb94d7`
   - Copy the ID after the last slash (the long alphanumeric string)
   - If there's a `?v=...` part, remove it

3. **Connect Integration to Database:**
   - Open your Notion database
   - Click "..." menu → "Connections" → "Add connections"
   - Select your integration

## Step 4: Configure Database Properties

Your Notion database must have these exact property names:
- **Name** (Title type property)
- **Email** (Email type property)

## Step 5: Restart Server

After creating/updating `.env.local`, restart your Next.js dev server:
```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

## Troubleshooting

- Make sure `.env.local` is in the project root (not in a subfolder)
- No quotes needed around values in `.env.local`
- Restart the server after any changes to `.env.local`
- Check terminal for any error messages

