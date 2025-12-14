  import React from 'react'

  export default function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <main className="mx-auto max-w-3xl py-8">{children}</main>
    </div>
  )
}
