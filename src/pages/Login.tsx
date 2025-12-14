import React from 'react'
import PageLayout from '../components/layout/PageLayout.js'

export default function Login() {
  return (
    <PageLayout>
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <p className="text-gray-600 dark:text-gray-300">
        Sign in to your account below.
      </p>
    </PageLayout>
  )
}
