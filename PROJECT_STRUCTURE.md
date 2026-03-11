# Stock Prediction Project - Clean Structure

## ✅ Cleaned Project Structure

### Backend (Python)
```
Stock_prediction/
├── api.py                          # FastAPI server (main entry point)
├── dynamic_predictor.py            # Main prediction orchestrator
├── layer1_data_pipeline.py         # Market data loading
├── layer2_feature_engineering.py   # Feature engineering
├── layer3_4_models_ensemble.py     # ML models & ensemble
├── layer5_6_drift_execution.py     # Drift detection & regime
├── main_orchestrator.py            # Standalone backtesting utility
├── backtest_results.csv            # Generated backtest output
└── model_cache/                    # Cached trained models
```

### Frontend (React)
```
stock-ui/src/
├── App.jsx                         # Main app & routing
├── main.jsx                        # React entry point
├── theme.js                        # MUI theme config
├── firebase.jsx                    # Firebase config
│
├── components/
│   ├── CardSwap.jsx               # Card animation component
│   ├── NewsMarquee.jsx            # News ticker component
│   └── layout/
│       └── Navbar.jsx             # Top navigation bar
│
├── contexts/
│   └── AuthContext.jsx            # Firebase auth context
│
└── pages/
    ├── Dashboard.jsx              # Main dashboard with predictions
    ├── DeepAnalysis.jsx           # Detailed stock analysis
    ├── Portfolio.jsx              # Portfolio management
    ├── Transactions.jsx           # Transaction history
    ├── Login.jsx                  # Login page
    ├── Signup.jsx                 # Signup page
    ├── StockAnalysis.jsx          # Stock analysis page
    ├── MacroDashboard.jsx         # Macro indicators
    ├── ModelHealth.jsx            # Model performance
    └── Seasonality.jsx            # Seasonality analysis
```

## 🗑️ Removed Files

### Duplicate Files (Already removed)
- ❌ `src/pages/LoginPage.jsx` (duplicate of Login.jsx)
- ❌ `src/pages/SignupPage.jsx` (duplicate of Signup.jsx)
- ❌ `src/pages/PortfolioPage.jsx` (duplicate of Portfolio.jsx)
- ❌ `src/pages/TransactionPage.jsx` (duplicate of Transactions.jsx)
- ❌ `src/context/AuthContext.jsx` (wrong path, contexts/AuthContext.jsx is used)
- ❌ `src/firebase.js` (duplicate of firebase.jsx)
- ❌ `src/store/predictionStore.js` (unused)

### Test Files (Removed)
- ❌ `test_fundamentals.py`

## 🔗 API Endpoints

### Working Endpoints
- `GET /health` - Health check
- `GET /predict/{symbol}` - Single stock prediction
- `GET /predict/batch/stocks?symbols=X,Y,Z` - Batch predictions
- `GET /chart/{symbol}` - OHLCV + indicators
- `GET /portfolio` - Mock portfolio data
- `GET /news/{symbol}` - News articles with sentiment
- `GET /fundamentals/{symbol}` - Quick fundamentals overlay

## 🎯 Active Routes

### Frontend Routes
- `/` → Redirects to `/portfolio`
- `/login` - Login page
- `/signup` - Signup page
- `/portfolio` - Portfolio management
- `/transactions` - Transaction history
- `/dashboard` - Main AI dashboard
- `/analysis` - Stock analysis
- `/analysis/:symbol` - Deep analysis for specific stock
- `/health` - Model health metrics
- `/macro` - Macro dashboard
- `/seasonality/:symbol` - Seasonality patterns

## 🔧 How to Run

### Backend
```bash
cd Stock_prediction
python api.py
# or
uvicorn api:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd stock-ui
npm run dev
```

### Backtesting (Optional)
```bash
python main_orchestrator.py
# Generates backtest_results.csv
```

## 📦 All Components Working
✅ Authentication (Firebase)
✅ Real-time predictions (5 horizons)
✅ Chart visualization with indicators
✅ News sentiment analysis
✅ Quick fundamentals overlay
✅ Portfolio tracking
✅ Transaction management
✅ Back navigation with route state
✅ Macro regime detection

---
*Last cleaned: March 9, 2026*
