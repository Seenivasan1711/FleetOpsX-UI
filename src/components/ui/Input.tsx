import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export default function Input({ error, ...props }: InputProps) {
  return (
    <input
      className={`w-full px-3 py-2 rounded border focus:ring-2 focus:ring-blue-300 outline-none ${error ? 'border-red-500' : 'border-gray-300'}`}
      {...props}
    />
  )
}
