<div align="center">
  <h1>Trading App</h1>
  <p>AI-assisted trading and analytics platform focused on market signals, portfolio tracking and technical analysis.</p>
</div>

---

## Overview

This project combines a React frontend with a Python/FastAPI backend to provide stock analysis, ML-based predictions and portfolio management features.

The system was built to explore how machine learning pipelines can be integrated into a trading workflow while still exposing interpretable analytics and technical indicators.

> Disclaimer: This project is experimental and intended for educational purposes only.

---

## System Architecture

### Frontend
Responsible for:
- dashboards and portfolio views
- displaying predictions and analytics
- user interaction and authentication

### Backend
Handles:
- market data processing
- feature engineering
- ML inference pipeline
- API responses for frontend

### ML Pipeline
The prediction layer uses multiple models and engineered features to generate trading signals across different timeframes.

The pipeline includes:
- technical indicators
- momentum signals
- volatility-based features
- ensemble-based prediction logic

---

## Features

### Trading Analytics
- technical indicators
- market trend analysis
- portfolio tracking
- paper trading support

### ML Layer
- ensemble prediction pipeline
- confidence scoring
- market regime detection
- drift monitoring concepts

### Risk Management
- stop-loss logic
- volatility-aware sizing
- trade monitoring

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite, Material UI |
| Backend | Python, FastAPI |
| ML | scikit-learn, pandas, numpy |
| Database | Firebase |
| Data Source | yfinance |

---

## Running Locally

### Backend
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python api.py
```

### Frontend
```bash
cd stock-ui
npm install
npm run dev
```

---

## Project Structure

```text
Trading-App/
├── stock-ui/
├── backend/
│   ├── api.py
│   ├── dynamic_predictor.py
│   ├── layer2_feature_engineering.py
│   ├── layer3_4_models_ensemble.py
│   └── main_orchestrator.py
```

---

## Design Notes

The goal of the project is not just prediction accuracy, but also understanding how market data pipelines, ML systems and frontend analytics can work together in a single application.

The architecture is intentionally modular so components like feature engineering, inference and visualization can evolve independently.

---

## Future Improvements

- live websocket market feeds
- improved backtesting engine
- explainable AI for signal generation
- advanced portfolio analytics
- distributed inference pipeline

---

## License

MIT © Kunal Mathur
