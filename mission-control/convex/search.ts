import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// === GLOBAL SEARCH ===

export const searchAll = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const query = args.query.toLowerCase();
    
    // Search memories (by content)
    const allMemories = await ctx.db
      .query("memories")
      .order("desc")
      .take(100);
    const memories = allMemories.filter(m => 
      m.content.toLowerCase().includes(query)
    ).slice(0, limit);
    
    // Search documents (by name or content)
    const allDocuments = await ctx.db
      .query("documents")
      .order("desc")
      .take(100);
    const documents = allDocuments.filter(d => 
      d.name.toLowerCase().includes(query) || 
      d.content.toLowerCase().includes(query)
    ).slice(0, limit);
    
    // Search activities (by title/description)
    const allActivities = await ctx.db
      .query("activities")
      .order("desc")
      .take(100);
    const activities = allActivities.filter(a => 
      a.title.toLowerCase().includes(query) || 
      (a.description && a.description.toLowerCase().includes(query))
    ).slice(0, limit);
    
    // Search scheduled tasks (by title/description)
    const allTasks = await ctx.db
      .query("scheduledTasks")
      .order("desc")
      .take(100);
    const tasks = allTasks.filter(t => 
      t.title.toLowerCase().includes(query) || 
      (t.description && t.description.toLowerCase().includes(query))
    ).slice(0, limit);

    // Record search
    await ctx.db.insert("searches", {
      query: args.query,
      resultCount: memories.length + documents.length + activities.length + tasks.length,
      timestamp: Date.now(),
    });

    return {
      memories: memories.map(m => ({ ...m, type: "memory" as const })),
      documents: documents.map(d => ({ ...d, type: "document" as const })),
      activities: activities.map(a => ({ ...a, type: "activity" as const })),
      tasks: tasks.map(t => ({ ...t, type: "task" as const })),
      totalCount: memories.length + documents.length + activities.length + tasks.length,
    };
  },
});

export const getSearchHistory = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    return await ctx.db
      .query("searches")
      .withIndex("by_timestamp")
      .order("desc")
      .take(limit);
  },
});

// === MEMORIES ===

export const getMemories = query({
  args: {
    type: v.optional(v.string()),
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    
    if (args.type) {
      return await ctx.db
        .query("memories")
        .withIndex("by_type", (q) => q.eq("type", args.type))
        .order("desc")
        .take(limit);
    } else if (args.category) {
      const all = await ctx.db
        .query("memories")
        .order("desc")
        .take(100);
      return all.filter(m => m.category === args.category).slice(0, limit);
    }
    
    return await ctx.db
      .query("memories")
      .order("desc")
      .take(limit);
  },
});

export const createMemory = mutation({
  args: {
    content: v.string(),
    type: v.string(),
    category: v.optional(v.string()),
    source: v.optional(v.string()),
    importance: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("memories", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateMemory = mutation({
  args: {
    id: v.id("memories"),
    content: v.optional(v.string()),
    category: v.optional(v.string()),
    importance: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    return await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// === DOCUMENTS ===

export const getDocuments = query({
  args: {
    type: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    
    if (args.type) {
      return await ctx.db
        .query("documents")
        .withIndex("by_type", (q) => q.eq("type", args.type))
        .order("desc")
        .take(limit);
    }
    
    return await ctx.db
      .query("documents")
      .withIndex("by_modified")
      .order("desc")
      .take(limit);
  },
});

export const createOrUpdateDocument = mutation({
  args: {
    path: v.string(),
    name: v.string(),
    content: v.string(),
    type: v.string(),
    size: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("documents")
      .withIndex("by_path", (q) => q.eq("path", args.path))
      .first();
    
    if (existing) {
      return await ctx.db.patch(existing._id, {
        ...args,
        lastModified: Date.now(),
      });
    }
    
    return await ctx.db.insert("documents", {
      ...args,
      lastModified: Date.now(),
    });
  },
});
