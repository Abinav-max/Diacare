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

### 1. Interactive Multi-Step Clinical Wizard
* **User-Centric Progression:** Replaces complex, overwhelming clinical forms with an easy-to-use **3-Step Form Wizard** that guides the user:
  * **Step 1: General & Demographics:** Captures maternal age (clinically significant for risk scaling) and pregnancy history.
  * **Step 2: Vitals & Body Metrics:** Measures body mass index (BMI, $kg/m^2$) as an indicator of adipose concentration and resting diastolic blood pressure (mmHg).
  * **Step 3: Endocrine & Lab Vitals:** Collects critical lab markers, specifically Plasma Glucose (2-hour Oral Glucose Tolerance Test - OGTT, $mg/dL$) and 2-Hour Serum Insulin ($\mu U/mL$).
* **Real-time Tooltips & Validation:** Every input field contains custom inline tooltips explaining the clinical relevance of each metric. Frontend validation checks values instantly (e.g. valid age ranges, whole-number checks, numeric ranges) before enabling the "Next" step.

### 2. Advanced Machine Learning Prediction Engine
* **Double-layered Validation:** Input metrics are validated on both the frontend and backend to prevent execution faults.
* **Pipeline Standardization:** The backend loads `scaler.pkl` to normalize input parameters using the exact means and standard deviations from the clinical training set, preventing feature weight bias.
* **Logistic Regression Classifier:** Runs the normalized features through `diabetes_model.pkl` to determine:
  * **Prediction Outcome:** A binary prediction (`0` for low risk, `1` for high risk).
  * **Statistical Risk Probability:** A continuous probability percentage (0% to 100%) indicating how close the patient is to the classification threshold.

### 3. Real-Time Interactive Reporting Dashboard
* **Dynamic SVG Progress Gauge:** Features a custom circular SVG radial gauge that animates up to the exact calculated risk percentage dynamically.
* **Risk Categorization Badge:** Changes colors and labels dynamically based on the model's output (Low Risk vs. High Risk).
* **Vitals Highlight Bar Charts:** Displays mini status-bars breaking down individual parameters (Age, Glucose, BMI, Blood Pressure) against clinical thresholds to show which features contributed most to the score.
* **Accordion Recommendations:** Generates customized clinical and dietary advice depending on the calculated risk tier (e.g., advising complete metabolic panels, regular physical activity, or consultation details).

### 4. Instant PDF Health Report Generation
* **Client-Side Document Assembly:** Integrates `jspdf` and `jspdf-autotable` libraries directly into the client.
* **Custom Clinical Layout:** Generates a structured PDF document that includes the patient's name, clinical vitals log, risk status, model probability, and recommended wellness guidelines.
* **Ready to Print/Save:** Features a one-click **"Download PDF Report"** button to export reports instantly without server-side PDF overhead.

### 5. Persistent SQLite Assessment Log & History Modal
* **Automatic Database Syncing:** Upon successful risk assessment, the backend records all clinical details (name, vitals, risk probability, classification, and UTC timestamp) to `diabetes.db`.
* **History Modal Viewer:** Users can toggle a historic database panel showing a tabular view of all past assessments, allowing clinicians to review trend histories.

### 6. Premium Responsive UI Design System
* **Atmospheric Styling:** Tailored stylesheet (`style.css`) using modern typography (Outfit and Inter google fonts) and custom CSS variables.
* **Dark Mode & Particle Effects:** Features a sleek default dark theme with animated CSS glow effects, a smooth parallax background image, and a dynamic HTML5 Canvas particle network (`canvas id="bg-particles"`) running in the background.

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

## Deployment Instructions

This application is production-ready and can be deployed to any cloud platform supporting Python/Flask services.

### Requirements for Production
- **Web Server:** A WSGI server such as `gunicorn` (included in `requirements.txt`) should be used to run the application in production.
- **Command:** `gunicorn app:app`
- **Port:** Bind to the port dynamically using the `PORT` environment variable (managed automatically in `app.py`).
