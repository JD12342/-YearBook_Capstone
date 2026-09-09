# GradBook Firebase schema

GradBook uses one Firebase project, one Authentication tenant, one Firestore database, and one Storage bucket. Authentication answers **who signed in**; Firestore and Storage rules answer **what that identity can access**.

## Permission model

There are exactly two authorization roles:

| Role | Purpose | Access |
| --- | --- | --- |
| `Administrator` | Trusted GradBook management account | Full management access to academic, student, photo, publishing, and approval records |
| `User` | Approved community member | Read-only access to published community content |

`Student`, `Teacher`, and `Staff` are profile types, not roles. They all receive the same `User` permissions. A role must never come from a selector on the login page. It is resolved after Firebase Authentication from a trusted custom claim or an active `users/{uid}` document.

The bootstrap administrator is Firebase Auth UID `iVLZld9fcpcPQXbat8jdlmN6AsC3`. After its administrator profile exists, role administration should be performed by a trusted administrator or server-side Admin SDK process.

## Collection map

```text
users/{firebaseAuthUid}
accountRequests/{requestId}

schoolYears/{schoolYearId}
  └─ strands/{strandId}        (logical relationship via schoolYearId)
       └─ sections/{sectionId} (logical relationship via schoolYearId + strandId)
            └─ students/{studentId}
                 └─ photos/{photoDocumentId}

yearbooks/{yearbookId}
announcements/{announcementId}
schoolContent/{contentId}
alumni/{alumniId}
```

These are top-level Firestore collections. The indentation describes logical relationships, not physical subcollections. This keeps admin reporting straightforward while automatic document IDs distribute writes.

## Documents

### `users/{uid}`

The document ID must equal the Firebase Authentication UID.

```js
{
  uid: string,
  email: string,
  fullName: string,
  role: 'Administrator' | 'User',
  profileType: 'Student' | 'Teacher' | 'Staff' | '',
  referenceId: string, // student number, LRN, or employee number
  status: 'active' | 'disabled',
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### `accountRequests/{requestId}`

```js
{
  uid: string,
  email: string,
  fullName: string,
  role: 'User',
  profileType: 'Student' | 'Teacher' | 'Staff',
  referenceId: string,
  status: 'pending' | 'approved' | 'rejected',
  createdAt: Timestamp,
  updatedAt: Timestamp,
  reviewedAt?: Timestamp
}
```

Approval is one atomic batch: update the request to `approved` and upsert `users/{uid}` with `role: 'User'` and `status: 'active'`.

### `schoolYears/{schoolYearId}`

```js
{
  name: string, // for example "2026-2027"
  startYear: number,
  endYear: number,
  displayOrder?: number,
  status: 'active' | 'archived',
  archived: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### `strands/{strandId}`

```js
{
  schoolYearId: string,
  name: string,
  code: string,
  displayOrder?: number,
  status: 'active' | 'archived',
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### `sections/{sectionId}`

```js
{
  schoolYearId: string,
  strandId: string,
  name: string,
  code: string,
  displayOrder?: number,
  status: 'active' | 'archived',
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### `students/{studentId}`

```js
{
  firstName: string,
  middleName: string,
  lastName: string,
  suffix: string,
  studentNumber: string,
  lrn: string,
  email: string,
  schoolYearId: string,
  strandId: string,
  sectionId: string,
  credentials: string,
  awards: string,
  status: 'active' | 'archived',
  photoId: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

`studentNumber` should be unique inside a school year. The app checks `(schoolYearId, studentNumber)` before creating a record.

### `photos/{photoDocumentId}`

```js
{
  studentId: string,
  schoolYearId: string,
  strandId: string,
  sectionId: string,
  source: 'camera' | 'upload',
  status: 'captured' | 'editing' | 'approved' | 'retake_needed',
  originalPath: string,
  editedPath: string,
  originalFileName: string,
  mimeType: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

The image bytes are stored in Firebase Storage, not inside Firestore.

```text
photos/{schoolYearId}/{strandId}/{studentId}/original/{photoId}.jpg
photos/{schoolYearId}/{strandId}/{studentId}/edited/{photoId}.jpg
published/{...approved community assets}
```

### `yearbooks/{yearbookId}`

```js
{
  schoolYearId: string,
  title: string,
  status: 'draft' | 'published' | 'archived',
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### `announcements/{announcementId}`

```js
{
  title: string,
  body: string,
  status: 'draft' | 'published' | 'archived',
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### `schoolContent/{contentId}`

```js
{
  title: string,
  category: 'School Information' | 'School History' | 'School Story' | 'Alumni Gathering',
  body: string,
  status: 'draft' | 'published' | 'archived',
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### `alumni/{alumniId}`

```js
{
  fullName: string,
  graduationYear: string,
  email: string,
  occupation: string,
  status: 'active' | 'archived',
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Access matrix

| Collection/path | Administrator | Active User | Signed-in pending account | Signed out |
| --- | --- | --- | --- | --- |
| Own `users/{uid}` | Read | Read | Read if it exists | No access |
| All user profiles | Manage | No access | No access | No access |
| Account requests | Manage all | Read own | Create/read own | No access |
| Academic, student, and photo records | Manage | No access | No access | No access |
| Published yearbooks, announcements, and school content | Manage | Read | No access | No access |
| Active alumni | Manage | Read | No access | No access |
| Original/edited photo Storage paths | Manage | No access | No access | No access |
| Published Storage paths | Manage | Read | No access | No access |

## Scale plan for 2,000+ accounts

- Firebase Authentication and Firestore are designed for far more than 2,000 connected clients. Capacity is not tied to a role dropdown.
- User portal queries are status-filtered and capped at eight records per content type, so one login does not download whole collections.
- Dashboard totals use server-side `count()` aggregations instead of downloading every student, photo, and yearbook document.
- Student list reads are filtered on the server and capped at 500 documents per view. Normal admin workflow narrows the list by school year, strand, and section.
- Photo binaries remain in Storage. Firestore contains metadata and paths; published pages should use resized thumbnails rather than original camera files.
- Bulk student imports commit in chunks of 400, below Firestore's 500-operation batch ceiling.
- Avoid one frequently updated global counter document. Server-side counts prevent a write hotspot when many users sign in or content changes.
- Keep live listeners limited to small, relevant result sets. GradBook currently uses bounded one-shot reads for community content.
- Use cursor pagination (`limit` plus `startAfter`) before exposing an unfiltered directory to ordinary users.
- Monitor usage and set budget alerts before launch. Load-test realistic traffic in a staging Firebase project rather than production.

## Required deployment

Repository rules do not affect Firebase until they are deployed to project `capstone-b4b3e`:

```powershell
npx firebase-tools deploy --project capstone-b4b3e --only firestore:rules,firestore:indexes,storage
```

After deployment, sign out and sign back in once. The trusted administrator UID can then create/read its profile and access the protected dashboard collections.
