import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// === SCHEDULED TASKS QUERIES ===

export const getUpcomingTasks = query({
  args: {
    limit: v.optional(v.number()),
    from: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const from = args.from ?? Date.now();
    const limit = args.limit ?? 50;
    
    return await ctx.db
      .query("scheduledTasks")
      .withIndex("by_scheduledFor", (q) => q.gte("scheduledFor", from))
      .order("asc")
      .take(limit);
  },
});

export const getTasksByWeek = query({
  args: {
    weekStart: v.number(), // Sunday timestamp
  },
  handler: async (ctx, args) => {
    const weekEnd = args.weekStart + 7 * 24 * 60 * 60 * 1000;
    
    return await ctx.db
      .query("scheduledTasks")
      .withIndex("by_scheduledFor", (q) => 
        q.gte("scheduledFor", args.weekStart).lte("scheduledFor", weekEnd)
      )
      .order("asc")
      .collect();
  },
});

export const getTasksByMonth = query({
  args: {
    year: v.number(),
    month: v.number(), // 0-11
  },
  handler: async (ctx, args) => {
    const startOfMonth = new Date(args.year, args.month, 1).getTime();
    const endOfMonth = new Date(args.year, args.month + 1, 0).getTime();
    
    return await ctx.db
      .query("scheduledTasks")
      .withIndex("by_scheduledFor", (q) => 
        q.gte("scheduledFor", startOfMonth).lte("scheduledFor", endOfMonth)
      )
      .order("asc")
      .collect();
  },
});

export const getTaskById = query({
  args: { id: v.id("scheduledTasks") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getTaskStats = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const today = new Date().setHours(0, 0, 0, 0);
    const weekEnd = today + 7 * 24 * 60 * 60 * 1000;

    const allTasks = await ctx.db.query("scheduledTasks").collect();
    
    const stats = {
      total: allTasks.length,
      pending: 0,
      completed: 0,
      cancelled: 0,
      overdue: 0,
      today: 0,
      thisWeek: 0,
      byPriority: { low: 0, medium: 0, high: 0 } as Record<string, number>,
    };

    for (const task of allTasks) {
      // By status
      stats[task.status]++;
      
      // Overdue
      if (task.status === "pending" && task.scheduledFor < now) {
        stats.overdue++;
      }
      
      // By priority
      if (task.priority) {
        stats.byPriority[task.priority]++;
      }
      
      // Time-based
      if (task.scheduledFor >= today && task.scheduledFor < today + 24 * 60 * 60 * 1000) {
        stats.today++;
      }
      if (task.scheduledFor >= today && task.scheduledFor < weekEnd) {
        stats.thisWeek++;
      }
    }

    return stats;
  },
});

// === SCHEDULED TASKS MUTATIONS ===

export const createTask = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    scheduledFor: v.number(),
    recurrence: v.optional(v.string()),
    category: v.optional(v.string()),
    priority: v.optional(v.string()),
    source: v.optional(v.string()),
    metadata: v.optional(v.record(v.string(), v.any())),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("scheduledTasks", {
      ...args,
      status: "pending",
      recurrence: args.recurrence ?? "once",
      createdAt: Date.now(),
    });
  },
});

export const updateTask = mutation({
  args: {
    id: v.id("scheduledTasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    scheduledFor: v.optional(v.number()),
    status: v.optional(v.string()),
    category: v.optional(v.string()),
    priority: v.optional(v.string()),
    metadata: v.optional(v.record(v.string(), v.any())),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    return await ctx.db.patch(id, updates);
  },
});

export const completeTask = mutation({
  args: { id: v.id("scheduledTasks") },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.id, {
      status: "completed",
      completedAt: Date.now(),
    });
  },
});

export const deleteTask = mutation({
  args: { id: v.id("scheduledTasks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
