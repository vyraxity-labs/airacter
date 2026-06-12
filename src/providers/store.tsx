'use client'

import { createContext, useContext, useState } from 'react'

const AppContext = createContext<{
  asideIsOpen: boolean
  setAsideIsOpen: (value: boolean) => void
}>({
  asideIsOpen: false,
  setAsideIsOpen: () => {},
})

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [asideIsOpen, setAsideIsOpen] = useState(false)

  return (
    <AppContext.Provider value={{ asideIsOpen, setAsideIsOpen }}>
      {children}
    </AppContext.Provider>
  )
}

export const useAppContext = () => {
  return useContext(AppContext)
}
