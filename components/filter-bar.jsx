"use client"

import { Button } from "@/components/ui/button"
import { X, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge";

export default function FilterBar({ 
  activeFilter, 
  setActiveFilter, 
  minLikes, 
  setMinLikes, 
  dateRange, 
  setDateRange,
  selectedAuthors,
  setSelectedAuthors,
  selectedCategories,
  setSelectedCategories,
  categories,
  resultsCount,
  totalCount,
  isFiltering
}) {
  const [availableAuthors, setAvailableAuthors] = useState([]);

  const filters = [
    { id: "all", label: "All" },
    { id: "popular", label: "Popular" },
    { id: "recent", label: "Recent" },
    { id: "discussed", label: "Most Discussed" },
  ]

  const handleResetFilters = () => {
    setMinLikes(0);
    setDateRange({ start: "", end: "" });
    setActiveFilter("recent");
    setSelectedCategories([]);
  };

  const toggleCategory = (categoryName) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryName)) {
        return prev.filter(cat => cat !== categoryName);
      } else {
        return [...prev, categoryName];
      }
    });
  };

  return (
    <div className="w-full md:w-auto">
      {/* Filter container - always visible */}
      <div className="space-y-3 bg-black border border-white/20 rounded-lg p-3 md:p-4">
        {/* Main filters row */}
        <div className="flex flex-wrap gap-2 justify-between">
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <Button
                key={filter.id}
                variant={activeFilter === filter.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(filter.id)}
                aria-pressed={activeFilter === filter.id}
                className={`font-mono text-xs transition-all ${
                  activeFilter === filter.id
                    ? "bg-white text-black hover:bg-zinc-200 hover:text-black shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                    : "bg-black border-white/30 text-white hover:bg-white/10 hover:text-white"
                }`}
              >
                {filter.label}
              </Button>
            ))}
          </div>
          
          {/* Results count display */}
          <div className="flex items-center font-mono text-xs">
            {isFiltering ? (
              <div className="flex items-center text-white/70">
                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                <span>Updating...</span>
              </div>
            ) : (
              <div className="text-white/70">
                Showing <span className="text-white font-semibold">{resultsCount}</span> of <span className="text-white/90">{totalCount}</span> tweets
              </div>
            ) }
          </div>
        </div>

        {/* All filters panel */}
        <div className="space-y-3">
          {/* Category filter section */}
          <div className="border-b border-white/10 pb-3">
            <p className="text-xs font-mono text-white mb-2 flex items-center">
              Filter by Category:
            </p>
            <div className="flex flex-wrap gap-2 mt-1">
              {categories && categories.length > 0 && categories.map(category => (
                <Badge 
                  key={category._id} 
                  variant={selectedCategories.includes(category.category_name) ? "default" : "outline"}
                  className={`cursor-pointer ${
                    selectedCategories.includes(category.category_name) 
                      ? "bg-white text-black" 
                      : "bg-transparent text-white/70 hover:bg-white/10"
                  }`}
                  onClick={() => toggleCategory(category.category_name)}
                >
                  {category.category_name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Filter by minimum likes */}
          <div className="flex items-center flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-mono text-white">Minimum Likes:</label>
              <input
                type="number"
                value={minLikes}
                onChange={(e) => setMinLikes(Number(e.target.value))}
                className="w-20 p-1.5 bg-black border border-white/30 rounded text-white text-xs font-mono focus:border-white focus:outline-none focus:ring-1 focus:ring-white/50 transition-all"
              />
            </div>

            {/* Filter by date range */}
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs font-mono text-white">Date Range:</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                className="p-1.5 bg-black border border-white/30 rounded text-white text-xs font-mono focus:border-white focus:outline-none focus:ring-1 focus:ring-white/50 transition-all"
              />
              <span className="text-white/60">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                className="p-1.5 bg-black border border-white/30 rounded text-white text-xs font-mono focus:border-white focus:outline-none focus:ring-1 focus:ring-white/50 transition-all"
              />
            </div>
            
            {/* Reset filters button */}
            <Button 
              onClick={handleResetFilters}
              variant="outline" 
              size="sm"
              className="text-xs font-mono bg-transparent border-white/30 text-white/70 hover:bg-red-900/20 hover:border-red-500/50 hover:text-red-400 ml-auto"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Reset Filters
            </Button>
          </div>
          
          {/* Active filters summary */}
          {(minLikes > 0 || dateRange.start || dateRange.end || selectedCategories.length > 0) && (
            <div className="pt-2 border-t border-white/10">
              <p className="text-xs font-mono text-white/60 flex flex-wrap gap-2 items-center">
                Active filters:
                {minLikes > 0 && <span className="text-white bg-white/10 px-2 py-0.5 rounded">{minLikes}+ likes</span>}
                {dateRange.start && <span className="text-white bg-white/10 px-2 py-0.5 rounded">From: {dateRange.start}</span>}
                {dateRange.end && <span className="text-white bg-white/10 px-2 py-0.5 rounded">To: {dateRange.end}</span>}
                {selectedCategories.map(category => (
                  <span key={category} className="text-white bg-white/10 px-2 py-0.5 rounded flex items-center gap-1">
                    {category}
                    <button 
                      onClick={() => toggleCategory(category)} 
                      className="ml-1 hover:text-red-400"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
