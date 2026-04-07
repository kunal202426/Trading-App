AI-POWERED TRADING PLATFORM

A comprehensive stock prediction and portfolio management platform with AI-powered signals, real-time analysis, and intelligent trading insights for the Indian stock market.

## Features

### AI-Powered Intelligence
- **42-Feature ML Pipeline** - Multi-model ensemble for BUY/SELL signal generation
- **Real-Time Predictions** - ULTRA_SHORT to POSITIONAL timeframe signals
- **Regime Detection** - Automatic market regime classification (BULL/BEAR/SIDEWAYS)
- **Confidence Scoring** - Every signal comes with confidence percentage

### Portfolio Management
- **Live Portfolio Tracking** - Real-time P&L, holdings, and drawdown analysis
- **Risk Intelligence** - Dynamic stop-loss, volatility-adjusted position sizing
- **Transaction History** - Complete trade journal with performance metrics
- **Paper Trading** - Practice with virtual capital before going live

### Technical Analysis Suite
- **Deep Analysis** - MACD, RSI, Bollinger Bands, ADX, OBV, and more
- **Seasonality Patterns** - Historical seasonal analysis for NSE/BSE stocks
- **Macro Dashboard** - India-specific indicators (FII/DII flows, sector rotation)
- **Model Health Monitoring** - Real-time ML model performance tracking

### Modern UI/UX
- **Smooth Parallax Scrolling** - Premium landing page with Lenis smooth scroll
- **Framer Motion Animations** - Buttery smooth transitions and interactions
- **Responsive Design** - Mobile-first approach, works on all devices
- **Dark Mode Ready** - Eye-friendly interface for long trading sessions

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern component-based architecture
- **Vite** - Lightning-fast build tool and dev server
- **Material-UI** - Premium component library
- **Framer Motion** - Advanced animation library
- **Lenis** - Smooth scroll library
- **React Router** - Client-side routing
- **Recharts** - Beautiful, responsive charts

### Backend
- **Python 3.8+** - Core prediction engine
- **FastAPI** - High-performance REST API
- **Firebase** - Authentication and Firestore database
- **scikit-learn** - Machine learning models
- **pandas/numpy** - Data processing
- **yfinance** - Real-time stock data

### ML Pipeline
- **Multi-Model Ensemble** - XGBoost, Random Forest, Gradient Boosting
- **Feature Engineering** - 42 technical indicators and derived features
- **Drift Detection** - Automatic model retraining on data drift
- **Backtesting** - Historical performance validation

## Installation

### Prerequisites
- Node.js 16+ and npm
- Python 3.8+
- Git

### Clone Repository
```bash
git clone https://github.com/kunal202426/Stock_prediction.git
cd Stock_prediction
```

### Backend Setup
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run API server
python api.py
```

### Frontend Setup
```bash
cd stock-ui

# Install dependencies
npm install

# Run development server
npm run dev
```

Visit `http://localhost:5173` to see the app!

##  Deployment

### Frontend (Vercel/Netlify)
```bash
cd stock-ui
npm run build
# Deploy the dist/ folder
```

### Backend (Railway/Render)
```bash
# Deploy api.py with Python 3.8+ environment
# Set environment variables for Firebase credentials
```

## Project Structure

```
Stock_prediction/
├── stock-ui/                 # React frontend
│   ├── src/
│   │   ├── pages/           # Page components
│   │   ├── components/      # Reusable components
│   │   ├── contexts/        # React contexts (Auth, etc.)
│   │   └── assets/          # Images and static files
│   └── public/              # Public assets
├── api.py                   # FastAPI backend
├── dynamic_predictor.py     # ML prediction engine
├── layer2_feature_engineering.py
├── layer3_4_models_ensemble.py
├── layer5_6_drift_execution.py
└── main_orchestrator.py    # Prediction orchestrator
```

## Key Components

### Landing Page
- Premium parallax scrolling experience
- Animated statistics counter
- Live ticker strip
- Scroll-triggered "How It Works" section
- Horizontal showcase with morphing cards
- Social proof and testimonials

### Dashboard
- Real-time stock analysis
- AI-generated BUY/SELL signals
- Portfolio overview with live P&L
- Recent predictions timeline

### Deep Analysis
- Full technical indicator suite
- Multi-timeframe charts
- Prediction history and accuracy
- Entry/exit recommendations

## Environment Variables

Create `.env` file:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Performance

- **Prediction Accuracy**: ~68.4% (backtested)
- **Response Time**: <500ms average API latency
- **Uptime**: 99.5%+ (monitored)
- **Page Load**: <2s on 3G connection

##  Contributing

This is a prototype project. Contributions, issues, and feature requests are welcome!

## 📄 License

This project is for educational and demonstration purposes only and a project under the Internship at YES Securities.

##  Disclaimer

**Important**: This is a PROTOTYPE for demonstration purposes.

- Investments in securities market are subject to market risks.
- Past performance is not indicative of future results.
- This platform does NOT provide investment advice.
- Always consult a certified financial advisor before making investment decisions.
- The developer is not responsible for any financial losses.

## DEVELOPER
**Kunal Mathur**
Full Stack Developer Intern, Bengaluru
[GitHub](https://github.com/kunal202426)

---


