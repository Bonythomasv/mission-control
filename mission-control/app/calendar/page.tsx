"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  isToday,
  addWeeks,
  subWeeks,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle2,
  Circle,
  XCircle,
  Clock,
} from "lucide-react";
import { cn, addDays as addDaysUtil } from "@/lib/utils";

const priorityColors = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-gray-100 text-gray-700 border-gray-200",
};

const statusIcons = {
  pending: Circle,
  completed: CheckCircle2,
  cancelled: XCircle,
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const weekStart = useMemo(
    () => startOfWeek(currentDate, { weekStartsOn: 0 }),
    [currentDate]
  );

  const weekTasks = useQuery(api.scheduledTasks.getTasksByWeek, {
    weekStart: weekStart.getTime(),
  });

  const taskStats = useQuery(api.scheduledTasks.getTaskStats);

  const completeTask = useMutation(api.scheduledTasks.completeTask);
  const updateTask = useMutation(api.scheduledTasks.updateTask);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const navigateWeek = (direction: "prev" | "next") => {
    setCurrentDate((prev) =>
      direction === "prev" ? subWeeks(prev, 1) : addWeeks(prev, 1)
    );
  };

  const goToToday = () => setCurrentDate(new Date());

  const getTasksForDay = (day: Date) => {
    return weekTasks?.filter((task) =>
      isSameDay(new Date(task.scheduledFor), day)
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-500">Weekly view of scheduled tasks</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateWeek("prev")}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goToToday}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Today
          </button>
          <button
            onClick={() => navigateWeek("next")}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="ml-2 flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>
      </div>

      {/* Stats */}
      {taskStats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-900">
              {taskStats.total}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500">This Week</p>
            <p className="text-2xl font-bold text-blue-600">
              {taskStats.thisWeek}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">
              {taskStats.pending}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500">Overdue</p>
            <p className="text-2xl font-bold text-red-600">
              {taskStats.overdue}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-2xl font-bold text-green-600">
              {taskStats.completed}
            </p>
          </div>
        </div>
      )}

      {/* Week Header */}
      <div className="bg-white rounded-t-xl border border-gray-200 border-b-0">
        <div className="grid grid-cols-7">
          {weekDays.map((day, i) => (
            <div
              key={i}
              className={cn(
                "p-4 text-center border-r border-gray-200 last:border-r-0",
                isToday(day) && "bg-primary-50"
              )}
            >
              <p className="text-sm text-gray-500">{format(day, "EEE")}</p>
              <p
                className={cn(
                  "text-lg font-semibold mt-1",
                  isToday(day) ? "text-primary-700" : "text-gray-900"
                )}
              >
                {format(day, "d")}
              </p>
              {isToday(day) && (
                <span className="inline-block mt-1 text-xs text-primary-600 font-medium">
                  Today
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-b-xl border border-gray-200">
        <div className="grid grid-cols-7 min-h-[400px]">
          {weekDays.map((day, i) => {
            const dayTasks = getTasksForDay(day) ?? [];
            return (
              <div
                key={i}
                className={cn(
                  "p-2 border-r border-gray-200 last:border-r-0 min-h-[400px]",
                  isToday(day) && "bg-primary-50/30"
                )}
              >
                <div className="space-y-2">
                  {dayTasks.map((task) => {
                    const StatusIcon = statusIcons[task.status];
                    return (
                      <div
                        key={task._id}
                        onClick={() => setSelectedTask(task)}
                        className={cn(
                          "p-2 rounded-lg border cursor-pointer hover:shadow-sm transition-all",
                          task.status === "completed" &&
                            "bg-gray-50 border-gray-200 opacity-60",
                          task.status === "pending" &&
                            (priorityColors[task.priority || "low"] ||
                              "bg-white border-gray-200")
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <StatusIcon
                            className={cn(
                              "w-4 h-4 flex-shrink-0 mt-0.5",
                              task.status === "completed" && "text-green-500",
                              task.status === "pending" && "text-gray-400",
                              task.status === "cancelled" && "text-red-400"
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                "text-sm font-medium truncate",
                                task.status === "completed" && "line-through"
                              )}
                            >
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-xs text-gray-500 truncate mt-0.5">
                                {task.description}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              {format(new Date(task.scheduledFor), "h:mm a")}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedTask(null)}
        >
          <div
            className="bg-white rounded-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedTask.title}
            </h3>
            {selectedTask.description && (
              <p className="text-gray-600 mt-2">{selectedTask.description}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-4">
              <span
                className={cn(
                  "px-2 py-1 rounded text-xs",
                  priorityColors[selectedTask.priority || "low"]
                )}
              >
                {selectedTask.priority || "low"} priority
              </span>
              <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                {selectedTask.recurrence !== "once"
                  ? selectedTask.recurrence
                  : "one-time"}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Scheduled: {formatDateTime(selectedTask.scheduledFor)}
            </p>
            <div className="flex gap-2 mt-6">
              {selectedTask.status === "pending" && (
                <button
                  onClick={() => {
                    completeTask({ id: selectedTask._id });
                    setSelectedTask(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Complete
                </button>
              )}
              <button
                onClick={() => setSelectedTask(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
