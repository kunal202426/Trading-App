<div align="center">
  <h1>💹 Trading App — AI-Powered Stock Platform</h1>
  <p><strong>Real-time stock analytics, AI-generated BUY/SELL signals, and portfolio management for the Indian market</strong></p>

  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB"/>
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white"/>
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white"/>
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black"/>
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge"/>

  <br/><br/>
  <a href="https://ysil.vercel.app">🌐 Live Demo</a> &nbsp;•&nbsp;
  <a href="https://github.com/kunal202426/Trading-App/issues">🐛 Report Bug</a>
</div>

---

## 📖 Overview

A full-stack trading platform built as part of an internship at **YES Securities**. It combines a React frontend with a Python/FastAPI backend and a 42-feature ML ensemble to generate real-time stock predictions, portfolio tracking, and deep technical analysis for NSE/BSE stocks.

> ⚠️ **Disclaimer:** This is a prototype for educational/demonstration purposes only. Not financial advice. Investments are subject to market risks.

---

## ✨ Features

### 🤖 AI Intelligence
- **42-Feature ML Pipeline** — XGBoost, Random Forest & Gradient Boosting ensemble
- **BUY/SELL Signals** — ULTRA_SHORT to POSITIONAL timeframe predictions
- **Regime Detection** — Auto market classification (BULL / BEAR / SIDEWAYS)
- **Confidence Scoring** — Every signal with confidence percentage
- **Drift Detection** — Automatic model retraining on data drift

### 💼 Portfolio Management
- Live P&L, holdings, and drawdown analysis
- Dynamic stop-loss & volatility-adjusted position sizing
- Complete trade journal with performance metrics
- Paper trading with virtual capital

### 📊 Technical Analysis
- MACD, RSI, Bollinger Bands, ADX, OBV and more
- Seasonality patterns for NSE/BSE stocks
- FII/DII flows, sector rotation macro dashboard
- Real-time ML model health monitoring

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Material-UI, Framer Motion |
| Backend | Python, FastAPI, scikit-learn, pandas, numpy |
| Database | Firebase Firestore |
| Auth | Firebase Authentication |
| Data | yfinance (Yahoo Finance API) |
| Deployment | Vercel (frontend), Railway/Render (backend) |

---

## 🚀 Getting Started

### Backend
```bash
git clone https://github.com/kunal202426/Trading-App.git
cd Trading-App

python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python api.py
```

### Frontend
```bash
cd stock-ui
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 🔑 Environment Variables

Create `stock-ui/.env`:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## 📁 Project Structure

```
Trading-App/
├── stock-ui/                  # React frontend
│   └── src/
│       ├── pages/             # Dashboard, Analysis, Portfolio
│       ├── components/        # Reusable UI components
│       └── contexts/          # Auth context
├── backend/
│   ├── api.py                 # FastAPI server
│   ├── dynamic_predictor.py   # ML prediction engine
│   ├── layer2_feature_engineering.py
│   ├── layer3_4_models_ensemble.py
│   └── main_orchestrator.py   # Prediction orchestrator
```

---

## 📊 Performance

- **Prediction Accuracy:** ~68.4% (backtested)
- **API Latency:** <500ms average
- **Page Load:** <2s on 3G
- **Uptime:** 99.5%+

---

## 📄 License

MIT © [Kunal Mathur](https://github.com/kunal202426) — Built as part of internship at YES Securities
