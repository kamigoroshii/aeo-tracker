'use client'

import { useEffect, useState } from 'react'
import { AreaChart } from '@tremor/react'

type TrendChartProps = {
  data: any[]
}

export function TrendChart({ data }: TrendChartProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="h-72 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading chart...</div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-gray-500">
        <p>No trend data available yet. Check back after running some checks.</p>
      </div>
    )
  }

  return (
    <AreaChart
      className="h-72 mt-4"
      data={data}
      index="day"
      categories={['Visibility %']}
      colors={['blue']}
      yAxisWidth={40}
      showAnimation={true}
    />
  )
}
