import { mutation } from "./_generated/server";

export const clearAllTasks = mutation({
  args: {},
  handler: async (ctx) => {
    const tasks = await ctx.db.query("scheduledTasks").collect();
    for (const task of tasks) {
      await ctx.db.delete(task._id);
    }
    return { deleted: tasks.length };
  },
});

export const clearAllActivities = mutation({
  args: {},
  handler: async (ctx) => {
    const activities = await ctx.db.query("activities").collect();
    for (const activity of activities) {
      await ctx.db.delete(activity._id);
    }
    return { deleted: activities.length };
  },
});

export const clearAllMemories = mutation({
  args: {},
  handler: async (ctx) => {
    const memories = await ctx.db.query("memories").collect();
    for (const memory of memories) {
      await ctx.db.delete(memory._id);
    }
    return { deleted: memories.length };
  },
});
