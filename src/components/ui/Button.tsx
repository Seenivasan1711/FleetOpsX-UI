import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

export default function Button({ children, ...props }: ButtonProps) {
  return (
    <button
      className="rounded px-4 py-2 bg-blue-600 text-white dark:bg-blue-400 dark:text-gray-900 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
      {...props}
    >
      {children}
    </button>
  )
}
