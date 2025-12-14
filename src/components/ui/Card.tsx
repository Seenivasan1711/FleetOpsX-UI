import React from 'react'

export default function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      {children}
    </div>
  )
}
