"use client"

import { useState, useEffect } from "react"
import TweetFeed from "@/components/tweet-feed"
import SearchBar from "@/components/search-bar"
import FilterBar from "@/components/filter-bar"
import LoadingScreen from "@/components/loading-screen"
import Image from "next/image"

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)
  const [isFiltering, setIsFiltering] = useState(false)
  const [tweets, setTweets] = useState([])
  const [filteredTweets, setFilteredTweets] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState("recent")
  const [minLikes, setMinLikes] = useState(0)
  const [dateRange, setDateRange] = useState({ start: "", end: "" })
  const [selectedAuthors, setSelectedAuthors] = useState([])
  const [selectedCategories, setSelectedCategories] = useState([])
  const [categories, setCategories] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [tweetsPerPage, setTweetsPerPage] = useState(9) // Changed to multiple of 3
  const [paginatedTweets, setPaginatedTweets] = useState([])

  // Load data from public/data.json and show loading screen for exactly 2 seconds
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/tweets");
        const { tweets: data } = await response.json();

        // Parse date strings like "4th April 2024"
        const parseDateString = (dateStr) => {
          // Check if the date is in the format like "4th April 2024"
          if (typeof dateStr === 'string' && dateStr.match(/\d+(st|nd|rd|th)\s+\w+\s+\d{4}/)) {
            // Remove ordinal suffix (st, nd, rd, th)
            const normalized = dateStr.replace(/(\d+)(st|nd|rd|th)/, "$1");
            return new Date(normalized);
          }
          // Try standard parsing for other formats
          return new Date(dateStr);
        };

        // Map API response to the required tweet format
        const mappedTweets = data
          .filter(item => item.flag === true) // Only include tweets where flag is true
          .map((item) => ({
            id: item._id,
            author: {
              name: item.screen_name,
              handle: `@${item.screen_name.toLowerCase()}`,
              avatar: "/placeholder.svg", // Placeholder for avatar
            },
            avatar_url: item.avatar_url,
            content: item.tweet_text,
            tweet_url: item.tweet_url,
            timestamp: item.created_at,
            date: parseDateString(item.created_at),
            likes: item.favorite_count,
            retweets: item.retweet_count,
            replies: item.reply_count,
            tags: item.category ? [item.category] : [], // Use category as a tag
          }));

        setTweets(mappedTweets);
        setFilteredTweets(mappedTweets);
      } catch (error) {
        console.error("Error loading tweets:", error);
      }

      // Always wait exactly 2 seconds before hiding loading screen
      setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    };

    fetchData();
  }, []);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        const { categories: categoryData } = await response.json();
        setCategories(categoryData || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategories([]);
      }
    };

    fetchCategories();
  }, []);

  // Handle search and filtering
  useEffect(() => {
    // Show filtering state while applying filters
    setIsFiltering(true)
    
    const applyFilters = () => {
      let result = [...tweets]

      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        result = result.filter(
          (tweet) =>
            tweet.content.toLowerCase().includes(query) ||
            tweet.author.name.toLowerCase().includes(query) ||
            tweet.author.handle.toLowerCase().includes(query) ||
            tweet.tags.some((tag) => tag.toLowerCase().includes(query))
        )
      }

      if (minLikes > 0) {
        result = result.filter(tweet => tweet.likes >= minLikes)
      }

      if (dateRange.start || dateRange.end) {
        result = result.filter(tweet => {
          const tweetDate = tweet.date.getTime()
          const startDate = dateRange.start ? new Date(dateRange.start).getTime() : 0
          const endDate = dateRange.end ? new Date(dateRange.end).getTime() : Infinity
          return tweetDate >= startDate && tweetDate <= endDate
        })
      }

      if (selectedAuthors.length > 0) {
        result = result.filter(tweet => 
          selectedAuthors.some(author => 
            tweet.author.handle.toLowerCase() === author.toLowerCase()
          )
        );
      }

      // Fix the category filtering logic in the applyFilters function
      if (selectedCategories.length > 0) {
        result = result.filter(tweet => 
          tweet.tags && tweet.tags.some(tag => 
            selectedCategories.includes(tag)
          )
        );
      }

      if (activeFilter !== "all") {
        switch (activeFilter) {
          case "popular":
            result = result.sort((a, b) => b.likes - a.likes)
            break
          case "recent":
            // Ensure we're sorting by the parsed Date object, not the string
            result = result.sort((a, b) => {
              // Check if we have valid date objects
              const dateA = a.date instanceof Date && !isNaN(a.date) ? a.date.getTime() : 0;
              const dateB = b.date instanceof Date && !isNaN(b.date) ? b.date.getTime() : 0;
              return dateB - dateA;
            })
            break
          case "discussed":
            result = result.sort((a, b) => b.replies - a.replies)
            break
          default:
            break
        }
      }

      setFilteredTweets(result)
      setCurrentPage(1) // Reset to first page when filters change
      setIsFiltering(false)
    }

    // Debounce filter changes slightly to prevent UI freezing during rapid changes
    const timeoutId = setTimeout(applyFilters, 300)
    return () => clearTimeout(timeoutId)
  }, [searchQuery, activeFilter, tweets, minLikes, dateRange, selectedAuthors, selectedCategories])

  // Apply pagination to filtered tweets
  useEffect(() => {
    const indexOfLastTweet = currentPage * tweetsPerPage;
    const indexOfFirstTweet = indexOfLastTweet - tweetsPerPage;
    setPaginatedTweets(filteredTweets.slice(indexOfFirstTweet, indexOfLastTweet));
  }, [filteredTweets, currentPage, tweetsPerPage]);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  const nextPage = () => {
    if (currentPage < Math.ceil(filteredTweets.length / tweetsPerPage)) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Handle tag click to filter tweets
  const handleTagClick = (tag) => {
    setSearchQuery(tag);
  };

  if (isLoading) {
    return <LoadingScreen />
  }
  console.log(tweets)
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <div className="flex items-center">
              <Image 
                src="/header.jpeg" 
                alt="Clinical Threads Logo" 
                width={128} 
                height={128} 
                className="object-contain"
              />
            </div>
            <div className="text-center sm:text-right text-sm text-white/70 font-mono space-y-1.5">              
              <p>a curated collection of clinical tweets</p>
              <p>organized categorically for your ease</p>
              <p>made by <a href="https://x.com/@saketh_vinj" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline hover:text-cyan-300 transition-colors">@saketh_vinj</a></p>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
            <FilterBar 
              activeFilter={activeFilter} 
              setActiveFilter={setActiveFilter} 
              minLikes={minLikes} 
              setMinLikes={setMinLikes} 
              dateRange={dateRange} 
              setDateRange={setDateRange}
              selectedAuthors={selectedAuthors}
              setSelectedAuthors={setSelectedAuthors}
              selectedCategories={selectedCategories}
              setSelectedCategories={setSelectedCategories}
              categories={categories}
              resultsCount={filteredTweets.length}
              totalCount={tweets.length}
              isFiltering={isFiltering}
            />
          </div>
        </header>
        
        {isFiltering ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-pulse text-white/70 font-mono">Updating results...</div>
          </div>
        ) : filteredTweets.length > 0 ? (
          <>
            <TweetFeed tweets={paginatedTweets} onTagClick={handleTagClick} />
            <div className="mt-8 flex flex-col items-center">
              <div className="flex items-center space-x-1 text-sm font-mono">
                <p className="text-white/70">
                  Showing {((currentPage - 1) * tweetsPerPage) + 1} - {Math.min(currentPage * tweetsPerPage, filteredTweets.length)} of {filteredTweets.length} tweets
                </p>
              </div>
              <div className="mt-4 flex items-center space-x-3">
                <button 
                  onClick={prevPage} 
                  disabled={currentPage === 1}
                  className={`px-3 py-1.5 text-sm font-mono border border-white/20 rounded-md ${currentPage === 1 ? 'text-white/40 cursor-not-allowed' : 'text-white hover:bg-white/5'} transition-colors`}
                >
                  ← Prev
                </button>
                <div className="flex space-x-1.5">
                  {Array.from({ length: Math.min(5, Math.ceil(filteredTweets.length / tweetsPerPage)) }, (_, i) => {
                    // Show a window of pages around current page
                    let pageNum;
                    const totalPages = Math.ceil(filteredTweets.length / tweetsPerPage);
                    
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return pageNum <= totalPages ? (
                      <button
                        key={pageNum}
                        onClick={() => paginate(pageNum)}
                        className={`w-8 h-8 text-sm flex items-center justify-center rounded-md font-mono
                          ${currentPage === pageNum ? 'bg-white text-black' : 'text-white border border-white/20 hover:bg-white/10'} transition-colors`}
                      >
                        {pageNum}
                      </button>
                    ) : null;
                  })}
                </div>
                <button 
                  onClick={nextPage} 
                  disabled={currentPage >= Math.ceil(filteredTweets.length / tweetsPerPage)}
                  className={`px-3 py-1.5 text-sm font-mono border border-white/20 rounded-md ${
                    currentPage >= Math.ceil(filteredTweets.length / tweetsPerPage) 
                      ? 'text-white/40 cursor-not-allowed' 
                      : 'text-white hover:bg-white/5'
                  } transition-colors`}
                >
                  Next →
                </button>
              </div>
              <div className="mt-4 flex items-center space-x-2">
                <label className="text-white/70 text-xs font-mono">Tweets per page:</label>
                <select 
                  value={tweetsPerPage}
                  onChange={(e) => {
                    setTweetsPerPage(Number(e.target.value));
                    setCurrentPage(1); // Reset to first page when changing items per page
                  }}
                  className="bg-black text-white border border-white/20 rounded-md px-2 py-1 text-xs font-mono focus:outline-none focus:border-white/50"
                >
                  <option value={3}>3</option>
                  <option value={6}>6</option>
                  <option value={9}>9</option>
                  <option value={12}>12</option>
                  <option value={15}>15</option>
                  <option value={21}>21</option>
                </select>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-white/70 font-mono text-lg mb-2">No matching tweets found</p>
            <p className="text-white/50 font-mono text-sm">Try adjusting your search criteria or filters</p>
          </div>
        )}
      </div>
    </main>
  )
}
