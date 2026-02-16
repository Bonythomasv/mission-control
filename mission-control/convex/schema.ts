import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Activity feed - every single action/task completed
  activities: defineTable({
    type: v.union(
      v.literal("task_completed"),
      v.literal("task_created"),
      v.literal("file_created"),
      v.literal("file_modified"),
      v.literal("command_executed"),
      v.literal("message_sent"),
      v.literal("search_performed"),
      v.literal("cron_scheduled"),
      v.literal("cron_completed"),
      v.literal("note_added")
    ),
    title: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    metadata: v.optional(v.record(v.string(), v.any())),
    status: v.optional(v.union(v.literal("success"), v.literal("failed"), v.literal("pending"))),
    duration: v.optional(v.number()), // in seconds
    sessionKey: v.optional(v.string()),
    timestamp: v.number(), // Unix timestamp
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_type", ["type", "timestamp"])
    .index("by_category", ["category", "timestamp"]),

  // Scheduled tasks - future calendar items
  scheduledTasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    scheduledFor: v.number(), // Unix timestamp
    recurrence: v.optional(v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("once")
    )),
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("cancelled")),
    category: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    source: v.optional(v.string()), // cron, manual, etc.
    metadata: v.optional(v.record(v.string(), v.any())),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_scheduledFor", ["scheduledFor"])
    .index("by_status", ["status", "scheduledFor"])
    .index("by_category", ["category", "scheduledFor"]),

  // Memory entries - long-term memories
  memories: defineTable({
    content: v.string(),
    type: v.union(v.literal("note"), v.literal("decision"), v.literal("fact"), v.literal("preference")),
    category: v.optional(v.string()),
    source: v.optional(v.string()), // which file it came from
    importance: v.optional(v.number()), // 1-10
    tags: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_type", ["type", "updatedAt"])
    .index("by_category", ["category", "updatedAt"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["type", "category", "tags"],
    }),

  // Documents/files indexed for search
  documents: defineTable({
    path: v.string(),
    name: v.string(),
    content: v.string(),
    type: v.union(v.literal("markdown"), v.literal("code"), v.literal("config"), v.literal("other")),
    lastModified: v.number(),
    size: v.optional(v.number()),
  })
    .index("by_path", ["path"])
    .index("by_modified", ["lastModified"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["type", "name"],
    }),

  // Search history
  searches: defineTable({
    query: v.string(),
    results: v.optional(v.array(v.record(v.string(), v.any()))),
    resultCount: v.optional(v.number()),
    timestamp: v.number(),
  }).index("by_timestamp", ["timestamp"]),
});
