export interface TourStep {
  id: string
  title: string
  description: string
  increases?: string
  decreases?: string
  tip?: string
  route?: string
  target: string
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center'
  icon: string
  category: string
}

export const TOUR_STEPS: TourStep[] = [
  // ─── WELCOME ───
  {
    id: 'welcome',
    icon: '👋',
    title: 'Welcome to Stock Predictor',
    description: 'Your AI-powered stock analysis dashboard. Let\'s quickly cover navigation, portfolio, and transactions.',
    route: '/portfolio',
    target: 'center',
    placement: 'center',
    category: 'Welcome',
  },

  {
    id: 'navigation-panel',
    icon: '🧭',
    title: 'Navigation Panel',
    description: 'Use this side panel to move between Portfolio, Transactions, and other modules. This is your main navigation hub.',
    route: '/portfolio',
    target: '#app-navigation-panel',
    placement: 'right',
    category: 'Navigation',
  },

  // ─── PORTFOLIO PAGE ───
  {
    id: 'portfolio-stats',
    icon: '📊',
    title: 'Portfolio Overview',
    description: 'Track your total invested capital, current portfolio value, and overall profit/loss at a glance. Your dashboard in one view.',
    route: '/portfolio',
    target: '#portfolio-stats-container',
    placement: 'bottom',
    category: 'Portfolio',
  },

  {
    id: 'portfolio-allocation',
    icon: '🎯',
    title: 'Portfolio Allocation',
    description: 'See how your capital is distributed across different stocks. The pie chart shows your current allocation by market value.',
    increases: 'Adding more stocks or increasing quantities adds to allocation',
    decreases: 'Selling stocks or reducing quantities shrinks allocation',
    route: '/portfolio',
    target: '#portfolio-allocation-chart',
    placement: 'left',
    category: 'Portfolio',
  },

  {
    id: 'portfolio-holdings',
    icon: '💼',
    title: 'Your Holdings',
    description: 'View all your stock positions. You can see buy price, current price, quantity, and profit/loss for each holding.',
    tip: 'Click any stock symbol to analyze it deeply with technical indicators and predictions.',
    route: '/portfolio',
    target: '#portfolio-holdings-list',
    placement: 'top',
    category: 'Portfolio',
  },

  {
    id: 'portfolio-go-transactions',
    icon: '👉',
    title: 'Go To Transactions',
    description: 'Click this button anytime to open the Transactions page and add a new stock entry.',
    route: '/portfolio',
    target: '#portfolio-transactions-btn',
    placement: 'bottom',
    category: 'Portfolio',
  },

  // ─── TRANSACTIONS PAGE ───
  {
    id: 'transactions-add',
    icon: '➕',
    title: 'Add New Transaction',
    description: 'Record a new stock purchase by entering the symbol, buy price, and quantity. Your transactions are saved in real-time.',
    increases: 'Adding more transactions increases your portfolio holdings',
    route: '/transactions',
    target: '#transactions-form',
    placement: 'bottom',
    category: 'Transactions',
  },

  {
    id: 'transactions-list',
    icon: '📝',
    title: 'Transaction History',
    description: 'All your historical transactions appear here. You can delete entries that are no longer relevant.',
    tip: 'Most recent transactions appear first.',
    route: '/transactions',
    target: '#transactions-list-section',
    placement: 'top',
    category: 'Transactions',
  },

  // ─── DONE ───
  {
    id: 'done',
    icon: '🎯',
    title: 'Ready to Trade!',
    description: 'Great job. You have covered navigation, portfolio, and transactions. You are now back on Portfolio to continue.',
    route: '/portfolio',
    target: 'center',
    placement: 'center',
    category: 'Done',
  },
]

export const TOUR_STORAGE_KEY = 'stock_predictor_tour_done'

export const hasDoneTour = () => {
  try {
    return !!localStorage.getItem(TOUR_STORAGE_KEY)
  } catch {
    return false
  }
}

export const markTourDone = () => {
  try {
    localStorage.setItem(TOUR_STORAGE_KEY, '1')
  } catch {}
}

export const resetTour = () => {
  try {
    localStorage.removeItem(TOUR_STORAGE_KEY)
  } catch {}
}
