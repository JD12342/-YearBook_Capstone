# GradBook Firebase data model

GradBook uses Firebase Authentication for sign-in, Cloud Firestore for application records, Cloud Storage for media, and Cloud Functions for privileged workflows. The relationships below reflect the implemented collections and are suitable as the basis of the project entity relationship diagram.

```mermaid
erDiagram
  USERS ||--o| ACCOUNT_REQUESTS : submits
  USERS ||--o| STUDENTS : may_link_to
  USERS ||--o| TEACHER_ASSIGNMENTS : receives
  USERS ||--o{ MEMORIES : submits
  SCHOOL_YEARS ||--o{ STRANDS : contains
  SCHOOL_YEARS ||--o{ SECTIONS : contains
  STRANDS ||--o{ SECTIONS : groups
  SECTIONS ||--o{ STUDENTS : contains
  SECTIONS ||--o{ TEACHER_ASSIGNMENTS : assigned_through
  SECTIONS ||--o| ALUMNI_LEADER_SECTIONS : has_one_leader
  SECTIONS ||--o{ MEMORIES : owns
  STUDENTS ||--o{ PHOTOS : has
  SCHOOL_YEARS ||--o{ YEARBOOKS : produces

  USERS {
    string uid PK
    string email
    string fullName
    string role
    string status
    string profileType
  }
  ACCOUNT_REQUESTS {
    string id PK
    string uid FK
    string requestedRole
    string status
  }
  STUDENTS {
    string id PK
    string userId FK
    string lrn
    string sectionId FK
    string schoolYearId FK
  }
  TEACHERS {
    string id PK
    string employeeNumber
    string fullName
    string schoolYearId FK
  }
  TEACHER_ASSIGNMENTS {
    string uid PK
    string schoolYearId FK
    array sectionIds FK
    number photoLimit
    number videoLimit
    number videoDurationLimitSeconds
    string contributorType
    boolean active
  }
  ALUMNI_LEADER_SECTIONS {
    string sectionId PK
    string userId FK
    string schoolYearId FK
  }
  SCHOOL_YEARS {
    string id PK
    string name
    string status
  }
  STRANDS {
    string id PK
    string schoolYearId FK
    string name
  }
  SECTIONS {
    string id PK
    string schoolYearId FK
    string strandId FK
    string name
  }
  MEMORIES {
    string id PK
    string ownerUid FK
    string sectionId FK
    string title
    string caption
    string source
    string contributorType
    string status
    array media
    array expectedVideoDurationsSeconds
    number videoDurationLimitSeconds
  }
  PHOTOS {
    string id PK
    string studentId FK
    string status
    string imageUrl
  }
  YEARBOOKS {
    string id PK
    string schoolYearId FK
    string status
    string coverUrl
  }
```

## Important workflow rules

- `teachers` contains manually created graduation-photo participants. It does not grant login access.
- `teacherAssignments` grants teacher or alumni-leader memory contribution access and stores the administrator-configured limits. New assignments default to 5 photos, 2 videos, and 120 seconds per video.
- `alumniLeaderSections` enforces one alumni leader per section while the person remains visible as a student account.
- Contributor uploads create a `memories` document with `status: pending`. Content Management publishes or rejects that same Firebase record.
- Video duration is checked in the browser before upload and again by the callable Cloud Function before a pending record is reserved. The reported duration and enforced limit are retained in Firestore; each uploaded video also stores its duration in the memory media array.
- Firestore security rules protect administration records. Cloud Functions perform approval, contributor assignment, quota reservation, and other privileged mutations.

## Storage relationships

- `teacher-content/{uid}/{memoryId}/...` stores teacher and alumni-leader memory files. Pending files remain private; published memory files can be read by authorized application users under the Storage rules.
- Student portraits, teacher portraits, yearbook covers, content images, and graduation songs use their existing purpose-specific Storage paths. Their Firestore records retain the related download URL and metadata.
