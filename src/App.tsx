import React from 'react'
import useAppStore from './store/useAppStore'

export default function App() {
  const theme = useAppStore((s) => s.theme)

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return null
}
