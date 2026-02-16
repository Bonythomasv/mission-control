# Mission Control Dashboard

A comprehensive dashboard for tracking OpenClaw activities, scheduled tasks, and workspace search.

## Features

- **Activity Feed**: Real-time tracking of every action, task, file operation, and command
- **Calendar View**: Weekly calendar showing all scheduled tasks with status tracking
- **Global Search**: Search across memories, documents, activities, and tasks

## Tech Stack

- Next.js 15 + React 19 + TypeScript
- Tailwind CSS
- Convex (backend + database)
- date-fns (date utilities)

## Setup

### 1. Install Dependencies

```bash
cd mission-control
npm install
```

### 2. Set up Convex

```bash
npx convex dev
```

This will:
- Create a Convex project
- Deploy the schema and functions
- Give you a `NEXT_PUBLIC_CONVEX_URL`

### 3. Configure Environment

Create `.env.local`:

```env
NEXT_PUBLIC_CONVEX_URL=your_convex_url_here
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Architecture

### Data Models

- **Activities**: Every action performed (task_created, file_modified, command_executed, etc.)
- **ScheduledTasks**: Future tasks with recurrence support
- **Memories**: Long-term knowledge storage with search
- **Documents**: Indexed files for content search
- **Searches**: Search history tracking

### Pages

- `/` - Dashboard with stats overview
- `/activity` - Full activity feed with filtering
- `/calendar` - Weekly calendar view
- `/search` - Global search across all data

## Integration with OpenClaw

To log activities from OpenClaw:

```typescript
// In your OpenClaw actions
await convex.mutation(api.activities.createActivity, {
  type: "task_completed",
  title: "Analyzed Windows crash logs",
  category: "troubleshooting",
  status: "success",
  duration: 45, // seconds
});
```

## Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

Add `NEXT_PUBLIC_CONVEX_URL` to Vercel environment variables.

### Convex Production

```bash
npx convex deploy
```
