import { createContext, useContext, useState, useCallback } from 'react'
import { load, save } from '../services/storage'

const SettingsContext = createContext(null)

const DEFAULT_SETTINGS = {
  version: 1,
  accessKey: '',
  appName: 'quote_card_studio',
  contentFilter: 'high',
  lastRatio: '4:5',
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => ({
    ...DEFAULT_SETTINGS,
    ...load('settings', {}),
  }))

  const updateSettings = useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      save('settings', next)
      return next
    })
  }, [])

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>{children}</SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
