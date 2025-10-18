'use client'

import { useState } from 'react'
import { Button } from '@tremor/react'

type RunCheckButtonProps = {
  keywordId: string
  keywordText: string
}

export function RunCheckButton({ keywordId, keywordText }: RunCheckButtonProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleRunCheck = async () => {
    setLoading(true)
    setMessage('')
    
    try {
      const response = await fetch('/api/checks/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keywordId }),
      })

      if (response.ok) {
        setMessage('✅ Check completed successfully!')
        // Refresh the page to show new data
        setTimeout(() => window.location.reload(), 1500)
      } else {
        const text = await response.text()
        setMessage(`❌ Error: ${text}`)
      }
    } catch (error) {
      setMessage('❌ Failed to run check')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={handleRunCheck}
        disabled={loading}
        className="px-3 py-1 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title={`Run check for "${keywordText}"`}
      >
        {loading ? (
          <span className="flex items-center space-x-1">
            <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Checking...</span>
          </span>
        ) : (
          '🔄 Run Check'
        )}
      </button>
      {message && (
        <span className="text-xs font-medium">{message}</span>
      )}
    </div>
  )
}
