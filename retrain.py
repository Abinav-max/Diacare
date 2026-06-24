import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score
import joblib
import json

def main():
    # Load dataset
    df = pd.read_csv('diabetes.csv')

    # Dropping SkinThickness and DiabetesPedigreeFunction
    features = ['Pregnancies', 'Glucose', 'BloodPressure', 'Insulin', 'BMI', 'Age']
    X = df[features]
    y = df['Outcome']

    # Train-test split matching original random state
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Standard Scaling
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Fit Logistic Regression model
    model = LogisticRegression(random_state=42)
    model.fit(X_train_scaled, y_train)

    # Calculate validation accuracy
    y_pred = model.predict(X_test_scaled)
    acc = accuracy_score(y_test, y_pred)
    print(f"Retrained Model Accuracy: {acc:.4f}")

    # Save pickles
    joblib.dump(model, 'diabetes_model.pkl')
    joblib.dump(scaler, 'scaler.pkl')

    # Save parameters for JS fallback calculation path
    params = {
        "features": features,
        "scaler": {
            "mean": scaler.mean_.tolist(),
            "scale": scaler.scale_.tolist()
        },
        "model": {
            "coefficients": model.coef_[0].tolist(),
            "intercept": float(model.intercept_[0])
        },
        "accuracy": float(acc)
    }

    with open('model_params.json', 'w') as f:
        json.dump(params, f, indent=4)

    print("Saved diabetes_model.pkl, scaler.pkl, and model_params.json successfully!")

if __name__ == '__main__':
    main()
