# User Document Structure for Firestore

## Required Fields

When creating a user document in the `users` collection, you need these fields:

```json
{
  "id": "user-firebase-auth-uid-here",
  "email": "user@example.com",
  "name": "User Full Name",
  "role": "admin",  // or "board" or "staff"
  "createdAt": "2024-01-15T10:00:00Z"  // Firestore Timestamp
}
```

## Optional Fields

You can also include:

```json
{
  "subscribedToPrivateCalendar": false,  // boolean
  "lastLogin": "2024-01-15T10:00:00Z"   // Firestore Timestamp
}
```

## Complete Example

Here's a complete example user document:

```json
{
  "id": "abc123xyz",
  "email": "admin@bwcc.org",
  "name": "John Doe",
  "role": "admin",
  "subscribedToPrivateCalendar": true,
  "createdAt": {
    "_seconds": 1705315200,
    "_nanoseconds": 0
  },
  "lastLogin": {
    "_seconds": 1705315200,
    "_nanoseconds": 0
  }
}
```

## Role Options

- `"admin"` - Full administrative access
- `"board"` - Board member access
- `"staff"` - Staff member access

## Notes

- The `id` field should match the Firestore document ID (usually the Firebase Auth UID)
- Use Firestore Timestamp objects for date fields (`createdAt`, `lastLogin`)
- If creating via Firebase Console, you can use the timestamp picker or ISO date strings
- The `subscribedToPrivateCalendar` field is used for the private calendar subscription feature

