import React from 'react'
import useAppStore from './store/useAppStore.js'
import { LucideMoonStar, LucideSun } from 'lucide-react'

export default function App() {
  const theme = useAppStore((s: any) => s.theme)
  const setTheme = useAppStore((s: any) => s.setTheme)

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <div>
      <button
        className="absolute top-3 right-4 p-2 rounded bg-gray-200 dark:bg-gray-700"
        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        aria-label="Toggle dark mode"
      >
        {theme === 'dark' ? <LucideSun /> : <LucideMoonStar />}
      </button>
    </div>
  )
}
