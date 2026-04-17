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
    title: 'Welcome to YISIL AI',
    description: 'This quick walkthrough covers navigation, portfolio tracking, and transaction logging so you can start fast.',
    route: '/portfolio',
    target: 'center',
    placement: 'center',
    category: 'Welcome',
  },

  {
    id: 'navigation-panel',
    icon: '🧭',
    title: 'Navigation Panel',
    description: 'This side panel is your main hub. Move between Portfolio, Transactions, Dashboard, and Macro / Regime from here.',
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
    description: 'Track invested amount, current value, and overall P&L in one clean snapshot of your portfolio health.',
    route: '/portfolio',
    target: '#portfolio-stats-container',
    placement: 'bottom',
    category: 'Portfolio',
  },

  {
    id: 'portfolio-allocation',
    icon: '🎯',
    title: 'Portfolio Allocation',
    description: 'See how capital is distributed across symbols. The chart reflects your latest market-value allocation.',
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
    description: 'Review each position with buy price, live/current price, quantity, and profit/loss at card level.',
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
    description: 'Use this button to open Transactions and quickly log a new buy entry.',
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
    description: 'Enter symbol, buy price, and quantity to save a new transaction. Entries sync directly with your portfolio.',
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
    description: 'All saved entries appear here, with quick actions to remove transactions that are no longer needed.',
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
    description: 'You are all set. Continue on Portfolio, or jump to Transactions anytime to keep positions updated.',
    route: '/portfolio',
    target: 'center',
    placement: 'center',
    category: 'Done',
  },
]

export const TOUR_STORAGE_KEY = 'stock_predictor_tour_done'
export const TOUR_LOGIN_TRIGGER_KEY = 'stock_predictor_tour_pending'

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

export const queueTourAfterLogin = () => {
  try {
    sessionStorage.setItem(TOUR_LOGIN_TRIGGER_KEY, '1')
  } catch {}
}

export const clearQueuedTour = () => {
  try {
    sessionStorage.removeItem(TOUR_LOGIN_TRIGGER_KEY)
  } catch {}
}
