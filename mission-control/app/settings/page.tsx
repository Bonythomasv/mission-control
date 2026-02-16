"use client";

import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import {
  Settings,
  Database,
  Activity,
  Calendar,
  Search,
  Trash2,
  Download,
} from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");

  const stats = useQuery(api.activities.getActivityStats);
  const taskStats = useQuery(api.scheduledTasks.getTaskStats);

  const tabs = [
    { id: "general", label: "General", icon: Settings },
    { id: "data", label: "Data Management", icon: Database },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage your Mission Control dashboard</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === "general" && (
        <div className="space-y-6">
          {/* Stats Overview */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Data Overview</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Activity className="w-4 h-4" />
                  <span className="text-sm">Activities</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.total ?? 0}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Tasks</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {taskStats?.total ?? 0}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Search className="w-4 h-4" />
                  <span className="text-sm">Searches</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">—</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Database className="w-4 h-4" />
                  <span className="text-sm">Storage</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">Convex</p>
              </div>
            </div>
          </div>

          {/* About */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              About Mission Control
            </h3>
            <p className="text-gray-600 mb-4">
              Mission Control is your dashboard for tracking all OpenClaw
              activities, scheduled tasks, and workspace data. It provides:
            </p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <Activity className="w-4 h-4 mt-1 text-primary-600" />
                <span>Real-time activity feed of every action</span>
              </li>
              <li className="flex items-start gap-2">
                <Calendar className="w-4 h-4 mt-1 text-primary-600" />
                <span>Weekly calendar view with task management</span>
              </li>
              <li className="flex items-start gap-2">
                <Search className="w-4 h-4 mt-1 text-primary-600" />
                <span>Global search across all workspace data</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === "data" && (
        <div className="space-y-6">
          {/* Data Export */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Export Data</h3>
            <p className="text-gray-600 mb-4">
              Download your data for backup or analysis.
            </p>
            <div className="flex flex-wrap gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">
                <Download className="w-4 h-4" />
                Export Activities
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">
                <Download className="w-4 h-4" />
                Export Tasks
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">
                <Download className="w-4 h-4" />
                Export All Data
              </button>
            </div>
          </div>

          {/* Data Cleanup */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Data Cleanup</h3>
            <p className="text-gray-600 mb-4">
              Manage your data storage. These actions cannot be undone.
            </p>
            <div className="space-y-2">
              <button className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors group">
                <div className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5 text-gray-400 group-hover:text-red-500" />
                  <div>
                    <p className="font-medium text-gray-900 group-hover:text-red-700">
                      Clear Old Activities
                    </p>
                    <p className="text-sm text-gray-500">
                      Remove activities older than 90 days
                    </p>
                  </div>
                </div>
              </button>
              <button className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors group">
                <div className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5 text-gray-400 group-hover:text-red-500" />
                  <div>
                    <p className="font-medium text-gray-900 group-hover:text-red-700">
                      Clear Search History
                    </p>
                    <p className="text-sm text-gray-500">
                      Remove all search history
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
