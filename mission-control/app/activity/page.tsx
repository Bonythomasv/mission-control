"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatDateTime, getRelativeTime, cn } from "@/lib/utils";
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  MessageSquare,
  Search,
  Calendar,
  Terminal,
  Activity,
  Filter,
  RefreshCw,
} from "lucide-react";

const activityIcons: Record<string, React.ElementType> = {
  task_completed: CheckCircle,
  task_created: Calendar,
  file_created: FileText,
  file_modified: FileText,
  command_executed: Terminal,
  message_sent: MessageSquare,
  search_performed: Search,
  cron_scheduled: Clock,
  cron_completed: CheckCircle,
  note_added: FileText,
};

const activityColors: Record<string, string> = {
  task_completed: "bg-green-100 text-green-700",
  task_created: "bg-blue-100 text-blue-700",
  file_created: "bg-purple-100 text-purple-700",
  file_modified: "bg-yellow-100 text-yellow-700",
  command_executed: "bg-gray-100 text-gray-700",
  message_sent: "bg-indigo-100 text-indigo-700",
  search_performed: "bg-pink-100 text-pink-700",
  cron_scheduled: "bg-orange-100 text-orange-700",
  cron_completed: "bg-green-100 text-green-700",
  note_added: "bg-teal-100 text-teal-700",
};

export default function ActivityPage() {
  const [filter, setFilter] = useState<string>("all");
  const [category, setCategory] = useState<string>("");
  
  const activities = useQuery(
    api.activities.getRecentActivities,
    filter !== "all" ? { type: filter, limit: 100 } : { limit: 100 }
  );
  const stats = useQuery(api.activities.getActivityStats);

  const filteredActivities = activities?.filter((a) =>
    category ? a.category === category : true
  );

  const categories = Array.from(
    new Set(activities?.map((a) => a.category).filter(Boolean) ?? [])
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Feed</h1>
          <p className="text-gray-500">Every action and task completed</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <RefreshCw className="w-4 h-4" />
          <span>Real-time updates</span>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500">Today</p>
            <p className="text-2xl font-bold text-gray-900">{stats.today}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500">This Week</p>
            <p className="text-2xl font-bold text-gray-900">{stats.thisWeek}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500">Success Rate</p>
            <p className="text-2xl font-bold text-green-600">
              {stats.total > 0
                ? Math.round((stats.byStatus.success / stats.total) * 100)
                : 0}
              %
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              filter === "all"
                ? "bg-primary-100 text-primary-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            All Types
          </button>
          {Object.keys(activityIcons).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize",
                filter === type
                  ? "bg-primary-100 text-primary-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              {type.replace("_", " ")}
            </button>
          ))}
        </div>
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
            <button
              onClick={() => setCategory("")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm transition-colors",
                category === ""
                  ? "bg-gray-800 text-white"
                  : "bg-gray-100 text-gray-700"
              )}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat ?? "")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm transition-colors",
                  category === cat
                    ? "bg-gray-800 text-white"
                    : "bg-gray-100 text-gray-700"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Activity List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {filteredActivities?.length === 0 && (
            <div className="p-12 text-center">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No activities found</p>
              <p className="text-sm text-gray-400 mt-1">
                Activities will appear here as they occur
              </p>
            </div>
          )}
          {filteredActivities?.map((activity) => {
            const Icon = activityIcons[activity.type] || Activity;
            const colorClass = activityColors[activity.type] || "bg-gray-100 text-gray-700";
            return (
              <div
                key={activity._id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                      colorClass
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {activity.title}
                        </p>
                        {activity.description && (
                          <p className="text-sm text-gray-500 mt-1">
                            {activity.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                          <span className="capitalize">
                            {activity.type.replace("_", " ")}
                          </span>
                          {activity.category && (
                            <>
                              <span>•</span>
                              <span className="px-2 py-0.5 bg-gray-100 rounded">
                                {activity.category}
                              </span>
                            </>
                          )}
                          {activity.duration && (
                            <>
                              <span>•</span>
                              <span>{activity.duration}s</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm text-gray-500">
                          {getRelativeTime(activity.timestamp)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDateTime(activity.timestamp)}
                        </p>
                        {activity.status && (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 mt-2 text-xs",
                              activity.status === "success" && "text-green-600",
                              activity.status === "failed" && "text-red-600",
                              activity.status === "pending" && "text-yellow-600"
                            )}
                          >
                            {activity.status === "success" && (
                              <CheckCircle className="w-3 h-3" />
                            )}
                            {activity.status === "failed" && (
                              <XCircle className="w-3 h-3" />
                            )}
                            {activity.status === "pending" && (
                              <Clock className="w-3 h-3" />
                            )}
                            {activity.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
