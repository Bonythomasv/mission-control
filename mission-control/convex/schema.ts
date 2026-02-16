import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Activity feed - every single action/task completed
  activities: defineTable({
    type: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    metadata: v.optional(v.record(v.string(), v.any())),
    status: v.optional(v.string()),
    duration: v.optional(v.number()),
    sessionKey: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_type", ["type"]),

  // Scheduled tasks - future calendar items
  scheduledTasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    scheduledFor: v.number(),
    recurrence: v.optional(v.string()),
    status: v.string(),
    category: v.optional(v.string()),
    priority: v.optional(v.string()),
    source: v.optional(v.string()),
    metadata: v.optional(v.record(v.string(), v.any())),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_scheduledFor", ["scheduledFor"])
    .index("by_status", ["status"]),

  // Memory entries - long-term memories
  memories: defineTable({
    content: v.string(),
    type: v.string(),
    category: v.optional(v.string()),
    source: v.optional(v.string()),
    importance: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_updated", ["updatedAt"]),

  // Documents/files indexed for search
  documents: defineTable({
    path: v.string(),
    name: v.string(),
    content: v.string(),
    type: v.string(),
    lastModified: v.number(),
    size: v.optional(v.number()),
  })
    .index("by_path", ["path"])
    .index("by_modified", ["lastModified"]),

  // Search history
  searches: defineTable({
    query: v.string(),
    resultCount: v.optional(v.number()),
    timestamp: v.number(),
  }).index("by_timestamp", ["timestamp"]),
});
