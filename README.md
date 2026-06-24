# DiaCare - Diabetes Risk Assessment Application

DiaCare is a web application designed to help predict the risk of diabetes using patient clinical data. It uses a machine learning model trained on patient health indicators to estimate the probability of diabetes risk.

## Project Structure

```text
DiaCare/
├── app.py                  # Flask web server and backend logic
├── requirements.txt        # Python dependencies
├── diabetes_model.pkl      # Trained Random Forest model
├── scaler.pkl              # Scaler for normalizing inputs
├── model_params.json       # Hyperparameters & metadata of the model
├── templates/              # HTML templates for UI
│   ├── index.html
│   └── about.html
├── static/                 # Static assets (CSS, JS, images)
│   ├── css/
│   ├── js/
│   └── images/
├── .gitignore              # Files ignored by Git
└── README.md               # Project documentation
```

## Features

- **Risk Assessment Predictor:** Input patient data such as glucose level, blood pressure, BMI, age, and insulin to get immediate diabetes risk prediction.
- **SQLite Database Integration:** Saves risk assessment histories for later review.
- **Render Deployment Support:** Configured for seamless deployment on Render.

## Local Setup & Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Abinav-max/Diacare.git
   cd Diacare
   ```

2. **Set up a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application:**
   ```bash
   python app.py
   ```
   Open `http://localhost:5000` in your web browser.

## Deployment on Render

This repository is optimized for [Render](https://render.com).
- **Service Type:** Web Service
- **Environment:** Python
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `gunicorn app:app` (You may need to add `gunicorn` to `requirements.txt` if using it on Render)
