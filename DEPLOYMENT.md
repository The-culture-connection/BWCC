# Deployment Guide

## Why Deploy?
Google Calendar subscriptions require a publicly accessible URL. `localhost` won't work because Google's servers can't reach your local machine.

## Recommended: Deploy to Vercel

Vercel is the easiest and best option for Next.js applications. It's free for hobby projects and automatically handles:
- SSL certificates (HTTPS)
- CDN distribution
- Serverless functions
- Automatic deployments from Git

## Deployment Steps

### 1. Push to GitHub/GitLab/Bitbucket
```bash
# Make sure your code is committed
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Deploy to Vercel

**Option A: Via Vercel Dashboard**
1. Go to [vercel.com](https://vercel.com)
2. Sign up/login with GitHub
3. Click "New Project"
4. Import your repository
5. Configure:
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

**Option B: Via CLI**
```bash
npm install -g vercel
vercel login
vercel
# Follow the prompts
```

### 3. Set Environment Variables in Vercel

**Critical:** You MUST set these in Vercel Dashboard → Settings → Environment Variables:

```
NOTION_API_KEY=your_notion_api_key_here
NOTION_REQUESTS_DATABASE_ID=your_requests_database_id
NOTION_EVENTS_DATABASE_ID=your_events_database_id
NOTION_PEOPLE_DATABASE_ID=your_people_database_id
```

**Where to find these:**
- Copy from your local `.env.local` file
- Make sure to remove dashes from database IDs

### 4. Redeploy After Adding Environment Variables

After adding environment variables, you need to redeploy:
- Go to Vercel Dashboard → Deployments
- Click "..." on the latest deployment
- Select "Redeploy"

### 5. Update Google Calendar Subscription

Once deployed, your feed URL will be:
```
https://your-domain.vercel.app/api/calendar/feed
```

**For public calendar:**
```
https://your-domain.vercel.app/api/calendar/feed
```

**For private calendar:**
```
https://your-domain.vercel.app/api/calendar/feed?private=true&password=BWCC2025
```

1. Remove the old localhost subscription from Google Calendar
2. Add the new production URL
3. The calendar name should now appear as "BWCC - Public" or "BWCC - Private"
4. Events should sync automatically

## Custom Domain (Optional)

1. Go to Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update the calendar feed URL in Google Calendar if needed

## Testing After Deployment

1. Visit `https://your-domain.vercel.app/api/calendar/feed` in a browser
2. You should see the iCal feed content
3. Download it and verify events are included
4. Subscribe to it in Google Calendar
5. Check that events appear and calendar name is correct

## Troubleshooting

**Events not showing:**
- Verify environment variables are set correctly
- Check Vercel deployment logs for errors
- Ensure Notion databases are shared with your integration
- Verify events have Status = "Approved" and "Public Event?" = true

**Calendar name still showing as URL:**
- Remove and re-add the calendar subscription
- Wait 5-10 minutes for Google Calendar to refresh
- Manually rename in Google Calendar settings if needed

**404 errors:**
- Verify the deployment succeeded
- Check that all routes are included in the build
- Check Vercel deployment logs

## Other Hosting Options

If you prefer not to use Vercel:
- **Netlify**: Similar to Vercel, also supports Next.js
- **Railway**: Simple deployment with database options
- **DigitalOcean App Platform**: More control, slightly more setup
- **AWS/GCP/Azure**: Full control but more complex setup

