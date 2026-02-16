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
    
    // Search memories
    const memories = await ctx.db
      .query("memories")
      .withSearchIndex("search_content", (q) => q.search("content", args.query))
      .take(limit);
    
    // Search documents
    const documents = await ctx.db
      .query("documents")
      .withSearchIndex("search_content", (q) => q.search("content", args.query))
      .take(limit);
    
    // Search activities (by title/description)
    const activities = await ctx.db
      .query("activities")
      .filter((q) => q.or(
        q.contains(q.field("title"), args.query),
        q.contains(q.field("description"), args.query)
      ))
      .order("desc")
      .take(limit);
    
    // Search scheduled tasks
    const tasks = await ctx.db
      .query("scheduledTasks")
      .filter((q) => q.or(
        q.contains(q.field("title"), args.query),
        q.contains(q.field("description"), args.query)
      ))
      .order("desc")
      .take(limit);

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
      return await ctx.db
        .query("memories")
        .withIndex("by_category", (q) => q.eq("category", args.category))
        .order("desc")
        .take(limit);
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
    type: v.union(v.literal("note"), v.literal("decision"), v.literal("fact"), v.literal("preference")),
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
    type: v.union(v.literal("markdown"), v.literal("code"), v.literal("config"), v.literal("other")),
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
