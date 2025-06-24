"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import dynamic from "next/dynamic"

// Dynamically import react-window to avoid SSR issues
const FixedSizeList = dynamic(() => import("react-window").then((mod) => mod.FixedSizeList), { ssr: false })

interface VirtualListProps {
  items: any[]
  itemHeight: number
  height: number
  renderItem: ({ index, style }: { index: number; style: React.CSSProperties }) => React.ReactNode
  onLoadMore?: () => void
  hasMore?: boolean
  loading?: boolean
}

export function VirtualList({
  items,
  itemHeight,
  height,
  renderItem,
  onLoadMore,
  hasMore = false,
  loading = false,
}: VirtualListProps) {
  const [isClient, setIsClient] = useState(false)
  const [isNearBottom, setIsNearBottom] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleScroll = useCallback(
    ({ scrollOffset, scrollUpdateWasRequested }: any) => {
      if (!scrollUpdateWasRequested) {
        const threshold = height * 0.8
        setIsNearBottom(scrollOffset > threshold)
      }
    },
    [height],
  )

  useEffect(() => {
    if (isNearBottom && hasMore && !loading && onLoadMore) {
      onLoadMore()
    }
  }, [isNearBottom, hasMore, loading, onLoadMore])

  const memoizedRenderItem = useMemo(() => renderItem, [renderItem])

  // Don't render on server side
  if (!isClient) {
    return (
      <div style={{ height }} className="flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <FixedSizeList
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      onScroll={handleScroll}
      overscanCount={5}
    >
      {memoizedRenderItem}
    </FixedSizeList>
  )
}
