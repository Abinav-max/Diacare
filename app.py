import os
import numpy as np
import pandas as pd
import joblib
import shutil
import sqlite3
from flask import Flask, request, jsonify, render_template, send_from_directory

# Database Initialisation
DATABASE_PATH = 'diabetes.db'

def init_db():
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS risk_assessments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_name TEXT,
            age INTEGER,
            pregnancies INTEGER,
            bmi REAL,
            blood_pressure INTEGER,
            glucose INTEGER,
            insulin INTEGER,
            risk_probability REAL,
            prediction_outcome INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

init_db()


# Ensure static/images directory exists
os.makedirs(os.path.join('static', 'images'), exist_ok=True)

app = Flask(__name__, template_folder='templates', static_folder='static')

# File paths
MODEL_PATH = 'diabetes_model.pkl'
SCALER_PATH = 'scaler.pkl'

# Features in exact model order
FEATURES = ['Pregnancies', 'Glucose', 'BloodPressure', 'Insulin', 'BMI', 'Age']

# Valid ranges for inputs
VALID_RANGES = {
    'Pregnancies': (0, 20),
    'Glucose': (0, 300),
    'BloodPressure': (0, 200),
    'Insulin': (0, 900),
    'BMI': (0, 100),
    'Age': (0, 120)
}

# Helper to validate input ranges
def validate_inputs(data):
    errors = {}
    for feature in FEATURES:
        val = data.get(feature)
        if val is None or val == '':
            errors[feature] = "This field is required."
            continue
        try:
            val_float = float(val)
            if feature == 'Age' and not val_float.is_integer():
                errors[feature] = "Age must be a whole number."
                continue
            min_val, max_val = VALID_RANGES[feature]
            if not (min_val <= val_float <= max_val):
                errors[feature] = f"Must be between {min_val} and {max_val}."
        except ValueError:
            errors[feature] = "Must be a valid number."
    return errors

# Home Route
@app.route('/')
def home():
    return render_template('index.html')

# About Route
@app.route('/about')
def about():
    return render_template('about.html')

# Static files fallback (if needed)
@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

# Prediction Endpoint
@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "No input data provided."}), 400

        # Validate fields
        errors = validate_inputs(data)
        if errors:
            return jsonify({"status": "validation_error", "errors": errors}), 400

        # Check if model and scaler are loaded
        if not os.path.exists(MODEL_PATH) or not os.path.exists(SCALER_PATH):
            return jsonify({
                "status": "error", 
                "message": "Model files not found. Please run 'python retrain.py' to generate the model and scaler."
            }), 500

        # Load scaler and model
        scaler = joblib.load(SCALER_PATH)
        model = joblib.load(MODEL_PATH)

        # Order input features correctly
        ordered_values = [float(data[feat]) for feat in FEATURES]
        
        # Format as DataFrame to keep feature names
        input_df = pd.DataFrame([ordered_values], columns=FEATURES)
        
        # Scale and predict
        input_scaled = scaler.transform(input_df)
        prediction = int(model.predict(input_scaled)[0])
        probability = float(model.predict_proba(input_scaled)[0][1])
        prob_pct = round(probability * 100, 2)

        # Save assessment to SQLite database
        try:
            conn = sqlite3.connect(DATABASE_PATH)
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO risk_assessments 
                (patient_name, age, pregnancies, bmi, blood_pressure, glucose, insulin, risk_probability, prediction_outcome)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                data.get('PatientName', 'Anonymous'),
                int(float(data['Age'])),
                int(float(data['Pregnancies'])),
                float(data['BMI']),
                int(float(data['BloodPressure'])),
                int(float(data['Glucose'])),
                int(float(data['Insulin'])),
                prob_pct,
                prediction
            ))
            conn.commit()
            conn.close()
        except Exception as db_err:
            print("⚠️ Database insertion failed:", db_err)

        # Return results
        return jsonify({
            "status": "success",
            "prediction": prediction,
            "probability": prob_pct,
            "inputs": data
        })

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# Route to view prediction history
@app.route('/history')
def history():
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM risk_assessments ORDER BY created_at DESC')
        rows = cursor.fetchall()
        conn.close()
        
        history_list = []
        for row in rows:
            history_list.append({
                "id": row[0],
                "patient_name": row[1],
                "age": row[2],
                "pregnancies": row[3],
                "bmi": row[4],
                "blood_pressure": row[5],
                "glucose": row[6],
                "insulin": row[7],
                "risk_probability": row[8],
                "prediction_outcome": row[9],
                "created_at": row[10]
            })
        return jsonify({"status": "success", "history": history_list})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    # Print launch instructions
    print("🚀 Diabetes Prediction Web Application is starting...")
    print("📂 Server Templates directory: ", os.path.abspath('templates'))
    print("📂 Server Static directory: ", os.path.abspath('static'))
    
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
