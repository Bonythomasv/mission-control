"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Activity,
  Calendar,
  CheckCircle,
  Clock,
  Search,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const activityStats = useQuery(api.activities.getActivityStats);
  const taskStats = useQuery(api.scheduledTasks.getTaskStats);
  const recentActivities = useQuery(api.activities.getRecentActivities, { limit: 5 });
  const upcomingTasks = useQuery(api.scheduledTasks.getUpcomingTasks, { limit: 5 });

  const stats = [
    {
      label: "Activities Today",
      value: activityStats?.today ?? 0,
      icon: Activity,
      color: "bg-blue-500",
      href: "/activity",
    },
    {
      label: "Tasks This Week",
      value: taskStats?.thisWeek ?? 0,
      icon: Calendar,
      color: "bg-green-500",
      href: "/calendar",
    },
    {
      label: "Pending Tasks",
      value: taskStats?.pending ?? 0,
      icon: Clock,
      color: "bg-yellow-500",
      href: "/calendar",
    },
    {
      label: "Total Activities",
      value: activityStats?.total ?? 0,
      icon: TrendingUp,
      color: "bg-purple-500",
      href: "/activity",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Overview of your OpenClaw workspace</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="bg-white p-6 rounded-xl border border-gray-200 hover:border-primary-500 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Activity</h2>
            <Link
              href="/activity"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentActivities?.length === 0 && (
              <p className="p-6 text-gray-500 text-sm">No activities yet</p>
            )}
            {recentActivities?.map((activity) => (
              <div key={activity._id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${
                      activity.status === "success"
                        ? "bg-green-500"
                        : activity.status === "failed"
                        ? "bg-red-500"
                        : "bg-yellow-500"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.type.replace("_", " ")} •{" "}
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Upcoming Tasks</h2>
            <Link
              href="/calendar"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View calendar
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {upcomingTasks?.length === 0 && (
              <p className="p-6 text-gray-500 text-sm">No upcoming tasks</p>
            )}
            {upcomingTasks?.map((task) => (
              <div key={task._id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {task.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(task.scheduledFor).toLocaleString()}
                      {task.priority && (
                        <span
                          className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                            task.priority === "high"
                              ? "bg-red-100 text-red-700"
                              : task.priority === "medium"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {task.priority}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Search */}
      <Link
        href="/search"
        className="block bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white hover:shadow-lg transition-shadow"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-lg">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Global Search</h3>
            <p className="text-primary-100">
              Search across memories, documents, activities, and tasks
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
}
