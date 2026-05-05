# PlaceIQ — Firebase Setup

## 1. Enable services in Firebase Console
- **Authentication** → Sign-in method → enable **Email/Password**
- **Firestore Database** → Create database (production mode)
- **Storage** → Get started

## 2. Paste your config
Open `firebase/firebase-init.js` and replace `firebaseConfig` with the values from
Project Settings → Your apps → Web app.

## 3. Firestore data model

```
users/{uid}
  email:  string
  name:   string
  role:   "student" | "recruiter" | "tpc"
  branch: string?    // students
  cgpa:   number?    // students
  createdAt: timestamp

jobs/{jobId}
  title, company, description, location, salary, deadline, type
  skills:      string[]
  eligibility: string
  recruiterId: string  (uid)
  status: "pending" | "approved" | "rejected"
  createdAt: timestamp

applications/{appId}
  jobId:  string
  userId: string  (student uid)
  status: "applied" | "shortlisted" | "rejected" | "offer"
  createdAt: timestamp
```

## 4. Firestore security rules (paste in Console → Firestore → Rules)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function role() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }

    match /users/{uid} {
      allow read:  if request.auth != null && (request.auth.uid == uid || role() == "tpc");
      allow create: if request.auth != null && request.auth.uid == uid;
      allow update: if request.auth != null && (request.auth.uid == uid || role() == "tpc");
    }

    match /jobs/{jobId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && role() == "recruiter"
                    && request.resource.data.recruiterId == request.auth.uid
                    && request.resource.data.status == "pending";
      allow update, delete: if request.auth != null && (
        role() == "tpc" ||
        (role() == "recruiter" && resource.data.recruiterId == request.auth.uid)
      );
    }

    match /applications/{appId} {
      allow create: if request.auth != null && role() == "student"
                    && request.resource.data.userId == request.auth.uid;
      allow read:   if request.auth != null && (
                      resource.data.userId == request.auth.uid ||
                      role() == "tpc" || role() == "recruiter");
      allow update: if request.auth != null && (role() == "tpc" || role() == "recruiter");
    }
  }
}
```

## 5. Storage rules (resumes)

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /resumes/{uid}/{fileName} {
      allow write: if request.auth != null && request.auth.uid == uid
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('application/pdf|image/.*');
      allow read:  if request.auth != null;
    }
  }
}
```

## 6. Run locally
This is a static site — open `index.html` directly, or:

```
npx serve .
```

Use a local server (not `file://`) so ES module imports work.

## 7. Deploy
```
npm i -g firebase-tools
firebase login
firebase init hosting   # public dir = . (current)
firebase deploy
```
