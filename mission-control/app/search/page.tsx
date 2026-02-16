"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Search,
  FileText,
  Brain,
  Activity,
  Calendar,
  Clock,
  X,
  Filter,
  RefreshCw,
} from "lucide-react";
import { cn, formatDateTime, getRelativeTime } from "@/lib/utils";

const resultIcons = {
  memory: Brain,
  document: FileText,
  activity: Activity,
  task: Calendar,
};

const resultColors = {
  memory: "bg-purple-100 text-purple-700",
  document: "bg-blue-100 text-blue-700",
  activity: "bg-green-100 text-green-700",
  task: "bg-orange-100 text-orange-700",
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search query
  useMemo(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Get all items when no search query
  const allActivities = useQuery(api.activities.getRecentActivities, { limit: 50 });
  const allTasks = useQuery(api.scheduledTasks.getUpcomingTasks, { limit: 50 });
  const allMemories = useQuery(api.search.getMemories, { limit: 50 });
  const allDocuments = useQuery(api.search.getDocuments, { limit: 50 });
  
  // Search results (only when query >= 2 chars)
  const searchResults = useQuery(
    api.search.searchAll,
    debouncedQuery.length >= 2 ? { query: debouncedQuery } : "skip"
  );

  const searchHistory = useQuery(api.search.getSearchHistory, { limit: 10 });

  const filters = [
    { id: "memory", label: "Memories", icon: Brain },
    { id: "document", label: "Documents", icon: FileText },
    { id: "activity", label: "Activities", icon: Activity },
    { id: "task", label: "Tasks", icon: Calendar },
  ];

  const toggleFilter = (filterId: string) => {
    setActiveFilters((prev) =>
      prev.includes(filterId)
        ? prev.filter((f) => f !== filterId)
        : [...prev, filterId]
    );
  };

  // Combine results - either from search or show all
  const displayResults = useMemo(() => {
    // If searching, use search results
    if (debouncedQuery.length >= 2 && searchResults) {
      if (activeFilters.length === 0) return searchResults;
      return {
        memories: activeFilters.includes("memory") ? searchResults.memories : [],
        documents: activeFilters.includes("document") ? searchResults.documents : [],
        activities: activeFilters.includes("activity") ? searchResults.activities : [],
        tasks: activeFilters.includes("task") ? searchResults.tasks : [],
        totalCount: 0,
      };
    }
    
    // Otherwise show all recent items
    return {
      memories: allMemories?.map(m => ({ ...m, type: "memory" })) || [],
      documents: allDocuments?.map(d => ({ ...d, type: "document" })) || [],
      activities: allActivities?.map(a => ({ ...a, type: "activity" })) || [],
      tasks: allTasks?.map(t => ({ ...t, type: "task" })) || [],
      totalCount: (allMemories?.length || 0) + (allDocuments?.length || 0) + (allActivities?.length || 0) + (allTasks?.length || 0),
    };
  }, [searchResults, allMemories, allDocuments, allActivities, allTasks, activeFilters, debouncedQuery]);

  const allResults = useMemo(() => {
    if (!displayResults) return [];
    return [
      ...displayResults.memories.map((r: any) => ({ ...r, resultType: "memory" })),
      ...displayResults.documents.map((r: any) => ({ ...r, resultType: "document" })),
      ...displayResults.activities.map((r: any) => ({ ...r, resultType: "activity" })),
      ...displayResults.tasks.map((r: any) => ({ ...r, resultType: "task" })),
    ].sort((a: any, b: any) => {
      const aTime = a.timestamp || a.updatedAt || a.lastModified || a.scheduledFor || 0;
      const bTime = b.timestamp || b.updatedAt || b.lastModified || b.scheduledFor || 0;
      return bTime - aTime;
    });
  }, [displayResults]);

  const clearSearch = () => {
    setQuery("");
    setDebouncedQuery("");
    setActiveFilters([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Global Search</h1>
          <p className="text-gray-500">Search across memories, documents, activities, and tasks</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="p-2 hover:bg-gray-100 rounded-lg"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search anything..."
          className="block w-full pl-11 pr-10 py-4 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-4 flex items-center"
          >
            <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-2 mr-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-500">Filter by:</span>
        </div>
        {filters.map((filter) => {
          const Icon = filter.icon;
          const isActive = activeFilters.includes(filter.id);
          return (
            <button
              key={filter.id}
              onClick={() => toggleFilter(filter.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary-100 text-primary-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              <Icon className="w-4 h-4" />
              {filter.label}
            </button>
          );
        })}
        {activeFilters.length > 0 && (
          <button
            onClick={() => setActiveFilters([])}
            className="text-sm text-gray-500 hover:text-gray-700 px-2"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Results */}
      <div className="space-y-4">
        {/* Loading state */}
        {query.length >= 2 && !searchResults && (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500">Searching...</p>
          </div>
        )}

        {/* Results count */}
        {(query.length >= 2 || allResults.length > 0) && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {query.length >= 2 ? (
                <>
                  Found <span className="font-medium text-gray-900">{allResults.length}</span> results
                </>
              ) : (
                <>
                  Showing <span className="font-medium text-gray-900">{allResults.length}</span> recent items
                </>
              )}
            </p>
          </div>
        )}

        {/* Results list */}
        {allResults.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {allResults.map((result: any, index) => {
              const Icon = resultIcons[result.resultType as keyof typeof resultIcons];
              const colorClass = resultColors[result.resultType as keyof typeof resultColors];
              return (
                <div
                  key={`${result.resultType}-${result._id}-${index}`}
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
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                          {result.resultType}
                        </span>
                        {result.type && (
                          <span className="text-xs text-gray-400">
                            • {result.type.replace("_", " ")}
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-gray-900">
                        {result.title || result.content?.substring(0, 100) || result.name || "Untitled"}
                      </p>
                      {result.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {result.description}
                        </p>
                      )}
                      {result.content && result.resultType !== "memory" && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {result.content.substring(0, 200)}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        {result.timestamp && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {getRelativeTime(result.timestamp)}
                          </span>
                        )}
                        {result.updatedAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Updated {getRelativeTime(result.updatedAt)}
                          </span>
                        )}
                        {result.scheduledFor && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDateTime(result.scheduledFor)}
                          </span>
                        )}
                        {result.category && (
                          <span className="px-2 py-0.5 bg-gray-100 rounded">
                            {result.category}
                          </span>
                        )}
                        {result.priority && (
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded",
                              result.priority === "high" && "bg-red-100 text-red-700",
                              result.priority === "medium" && "bg-yellow-100 text-yellow-700",
                              result.priority === "low" && "bg-gray-100 text-gray-700"
                            )}
                          >
                            {result.priority}
                          </span>
                        )}
                        {result.path && (
                          <span className="text-gray-400 truncate max-w-[200px]">
                            {result.path}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {query.length >= 2 && allResults.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No results found</p>
            <p className="text-sm text-gray-400 mt-1">
              Try different keywords or check your filters
            </p>
          </div>
        )}

        {/* Loading state for initial data */}
        {query.length < 2 && !allMemories && !allActivities && (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500">Loading items...</p>
          </div>
        )}

        {/* Search tips - shown below results */}
        {query.length < 2 && allResults.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-6 mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Search Tips</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>• Type at least 2 characters to search across all items</li>
              <li>• Search for memories by content</li>
              <li>• Find activities by title or description</li>
              <li>• Look up scheduled tasks</li>
              <li>• Use filters to narrow down results</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
