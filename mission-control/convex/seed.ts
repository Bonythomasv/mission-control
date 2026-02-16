import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const seedData = mutation({
  args: {},
  handler: async (ctx) => {
    // Seed activities
    const activities = [
      { type: "task_completed", title: "Set up Mission Control dashboard", category: "development", status: "success" },
      { type: "file_created", title: "Created schema.ts", category: "development", status: "success" },
      { type: "command_executed", title: "npm install dependencies", category: "setup", status: "success" },
      { type: "task_created", title: "Build activity feed", category: "development", status: "success" },
    ];

    for (const activity of activities) {
      await ctx.db.insert("activities", {
        ...activity,
        timestamp: Date.now() - Math.floor(Math.random() * 1000000),
      });
    }

    // Seed scheduled tasks
    const tasks = [
      { title: "Review dashboard", scheduledFor: Date.now() + 86400000, priority: "high", status: "pending" },
      { title: "Add search functionality", scheduledFor: Date.now() + 172800000, priority: "medium", status: "pending" },
      { title: "Weekly backup", scheduledFor: Date.now() + 604800000, priority: "low", status: "pending" },
    ];

    for (const task of tasks) {
      await ctx.db.insert("scheduledTasks", {
        ...task,
        recurrence: "once",
        createdAt: Date.now(),
      });
    }

    // Seed memories
    const memories = [
      { content: "Mission Control uses Next.js + Convex", type: "fact", category: "tech", importance: 8 },
      { content: "Activity feed tracks all OpenClaw actions", type: "note", category: "feature", importance: 9 },
    ];

    for (const memory of memories) {
      const now = Date.now();
      await ctx.db.insert("memories", {
        ...memory,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { success: true, message: "Data seeded successfully" };
  },
});
