/**
 * Get the base URL for the application
 * Works in both client and server contexts
 * Supports Railway and other hosting platforms
 */
export function getBaseUrl(): string {
  // In server-side rendering (API routes, Server Components)
  if (typeof window === 'undefined') {
    // Check for Railway public domain
    if (process.env.RAILWAY_PUBLIC_DOMAIN) {
      return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
    }
    
    // Check for VERCEL_URL (fallback)
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    
    // Check for custom NEXT_PUBLIC_BASE_URL
    if (process.env.NEXT_PUBLIC_BASE_URL) {
      return process.env.NEXT_PUBLIC_BASE_URL;
    }
    
    // Default fallback for local development
    return 'http://localhost:3000';
  }
  
  // Client-side: use window.location
  return window.location.origin;
}

/**
 * Get the calendar feed URL
 */
export function getCalendarFeedUrl(isPrivate: boolean = false): string {
  const baseUrl = getBaseUrl();
  if (isPrivate) {
    return `${baseUrl}/api/calendar/feed?private=true&password=BWCC2025`;
  }
  return `${baseUrl}/api/calendar/feed`;
}

