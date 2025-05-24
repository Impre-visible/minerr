import { createRoot } from 'react-dom/client'
import { Routes } from '@generouted/react-router'

import './index.css'
import { ThemeProvider } from './components/theme-provider'
import { TooltipProvider } from './components/ui/tooltip'

createRoot(document.getElementById('root')!).render(
  <TooltipProvider>
    <ThemeProvider>
      <Routes />
    </ThemeProvider>
  </TooltipProvider>
)
