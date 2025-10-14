# CollabCanvas

Real-time collaborative canvas built with React, TypeScript, Firebase, and Konva.

## Setup

1. Clone and install dependencies
   - `npm install`
2. Create `.env.local` with your Firebase config (see `.env.example`)
3. Start dev server
   - `npm run dev`

## Testing

- Run tests: `npm test`
- Coverage: `npm test -- --coverage`

## Deployment

- Deployed (Firebase Hosting): [collabcanvas-aac98.firebaseapp.com](https://collabcanvas-aac98.firebaseapp.com/)
- Deploy steps:
  1. Build the app: `npm run build`
  2. Deploy hosting: `firebase deploy --only hosting`
  - Note: A predeploy hook will build, bump `APP_VERSION`, and rebuild automatically.

## Documentation

- Product requirements: `docs/prd.md`
- Tasks/roadmap: `docs/task.md`
