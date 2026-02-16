import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// === ACTIVITY FEED QUERIES ===

export const getRecentActivities = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()),
    type: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    
    let activities;
    if (args.type) {
      activities = await ctx.db
        .query("activities")
        .withIndex("by_type", (q) => q.eq("type", args.type))
        .order("desc")
        .take(limit);
    } else if (args.category) {
      activities = await ctx.db
        .query("activities")
        .withIndex("by_category", (q) => q.eq("category", args.category))
        .order("desc")
        .take(limit);
    } else {
      activities = await ctx.db
        .query("activities")
        .withIndex("by_timestamp")
        .order("desc")
        .take(limit);
    }

    return activities;
  },
});

export const getActivitiesByDateRange = query({
  args: {
    startTime: v.number(),
    endTime: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("activities")
      .withIndex("by_timestamp", (q) => 
        q.gte("timestamp", args.startTime).lte("timestamp", args.endTime)
      )
      .order("desc")
      .collect();
  },
});

export const getActivityStats = query({
  args: {},
  handler: async (ctx) => {
    const allActivities = await ctx.db.query("activities").collect();
    
    const stats = {
      total: allActivities.length,
      byType: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
      byStatus: { success: 0, failed: 0, pending: 0 } as Record<string, number>,
      today: 0,
      thisWeek: 0,
    };

    const now = Date.now();
    const today = new Date().setHours(0, 0, 0, 0);
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    for (const activity of allActivities) {
      // By type
      stats.byType[activity.type] = (stats.byType[activity.type] || 0) + 1;
      
      // By category
      if (activity.category) {
        stats.byCategory[activity.category] = (stats.byCategory[activity.category] || 0) + 1;
      }
      
      // By status
      if (activity.status) {
        stats.byStatus[activity.status]++;
      }
      
      // Time-based
      if (activity.timestamp >= today) stats.today++;
      if (activity.timestamp >= weekAgo) stats.thisWeek++;
    }

    return stats;
  },
});

// === ACTIVITY MUTATIONS ===

export const createActivity = mutation({
  args: {
    type: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    metadata: v.optional(v.record(v.string(), v.any())),
    status: v.optional(v.string()),
    duration: v.optional(v.number()),
    sessionKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("activities", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

export const updateActivityStatus = mutation({
  args: {
    id: v.id("activities"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.id, { status: args.status });
  },
});
