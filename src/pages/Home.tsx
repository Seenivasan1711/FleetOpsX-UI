import React from 'react'
import PageLayout from '../components/layout/PageLayout.js'

export default function Home() {
  return (
    <PageLayout>
      <h1 className="text-2xl font-bold text-center mb-4">FleetOpsX Home</h1>
      <p className="text-gray-600 dark:text-gray-300 text-center">
        Welcome to your modern FleetOpsX React UI! This is the home page.
      </p>
    </PageLayout>
  )
}
