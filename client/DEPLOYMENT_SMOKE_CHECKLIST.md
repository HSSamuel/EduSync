# EduSync Frontend Deployment Smoke Checklist

Run this after every deployment.

## Authentication
- Login works for Admin, Teacher, Parent, and Student accounts.
- Refreshing the browser keeps the user signed in.
- Logout clears the session and redirects to login.

## Dashboard
- Admin lands on **Overview** by default.
- Teacher lands on **Manage Subjects** by default.
- Parent lands on **Child's Report Card** by default.
- Student lands on **Overview** by default.
- No role sees a blank first dashboard screen.

## Core API-backed flows
- Subjects load successfully.
- Students list loads for Admin and Teacher where permitted.
- Grades tab loads without malformed API response errors.
- Modules upload succeeds with supported files and fails cleanly with unsupported files.
- School vault uploads succeed with supported files.
- Chat history loads with the shared API response format.
- Finance invoice list loads and checkout returns a payment URL.

## Files and uploads
- PDF upload works.
- DOCX upload works.
- PPTX upload works.
- XLSX upload works.
- PNG/JPEG upload works.
- Unsupported file types return a consistent API error payload.

## Safety and UX
- 403 responses show a useful access-denied message.
- 404 responses show a useful not-found message.
- Browser console shows no uncaught API shape errors.
- Network responses consistently use `{ success, message?, data?, meta? }` for success and `{ success: false, error, code?, details? }` for errors.
