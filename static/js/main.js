// DiaCare Frontend Controller

document.addEventListener('DOMContentLoaded', () => {
    // View container elements
    const landingView = document.getElementById('landing-view');
    const nameView = document.getElementById('name-view');
    const assessmentView = document.getElementById('assessment-view');

    // Welcome Screen & Name screen elements
    const startAssessmentBtn = document.getElementById('start-assessment-btn');
    const nameContinueBtn = document.getElementById('name-continue-btn');
    const nameBackBtn = document.getElementById('name-back-btn');
    const patientNameField = document.getElementById('patient-name');
    const errorPatientName = document.getElementById('error-patient-name');
    const userGreetingName = document.getElementById('user-greeting-name');

    // Form Wizard Elements
    const form = document.getElementById('predictor-form');
    const formSteps = document.querySelectorAll('.form-step');
    const stepDots = document.querySelectorAll('.step-dot');
    const stepLines = document.querySelectorAll('.step-line');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');
    const resetBtn = document.getElementById('reset-btn');
    
    // Result Elements
    const placeholderView = document.getElementById('placeholder-view');
    const resultsView = document.getElementById('results-view');
    const riskPct = document.getElementById('risk-pct');
    const riskStatus = document.getElementById('risk-status');
    const riskInterpretation = document.getElementById('risk-interpretation');
    const gaugeProgressBar = document.getElementById('gauge-progress-bar');
    const reportTime = document.getElementById('report-time');
    const recommendationsList = document.getElementById('recommendations-list');

    // Patient Details Summary elements
    const summaryName = document.getElementById('summary-name');
    const summaryAge = document.getElementById('summary-age');
    const summaryPregnancies = document.getElementById('summary-pregnancies');
    const summaryBmi = document.getElementById('summary-bmi');
    const summaryBp = document.getElementById('summary-bp');
    const summaryGlucose = document.getElementById('summary-glucose');
    const summaryInsulin = document.getElementById('summary-insulin');

    // Mini metrics breakdown elements
    const mGlucose = document.getElementById('m-glucose');
    const mBmi = document.getElementById('m-bmi');
    const mAge = document.getElementById('m-age');
    const mBp = document.getElementById('m-bp');

    const miniGlucoseFill = document.querySelector('#mini-glucose .mini-fill');
    const miniBmiFill = document.querySelector('#mini-bmi .mini-fill');
    const miniAgeFill = document.querySelector('#mini-age .mini-fill');
    const miniBpFill = document.querySelector('#mini-bp .mini-fill');

    // State
    let currentStep = 1;
    const totalSteps = formSteps.length;
    let modelParams = null; // Loaded dynamically if available
    let patientName = "Anonymous";

    // Features and valid ranges
    const VALID_RANGES = {
        'Pregnancies': { min: 0, max: 20, label: "Pregnancies" },
        'Glucose': { min: 50, max: 300, label: "Glucose" },
        'BloodPressure': { min: 40, max: 150, label: "Diastolic Blood Pressure" },
        'Insulin': { min: 5, max: 900, label: "Serum Insulin" },
        'BMI': { min: 10, max: 70, label: "BMI" },
        'Age': { min: 21, max: 120, label: "Age" }
    };

    // Hardcoded parameters (fallback) based on Logistic Regression trained on Pima Indians with imputed medians
    const FALLBACK_PARAMS = {
        "scaler": {
            "mean": [3.7427, 120.8550, 69.4153, 81.4381, 31.9834, 32.9072],
            "scale": [3.3106, 32.0090, 18.4975, 116.1401, 7.7343, 11.4941]
        },
        "model": {
            "coefficients": [0.2110, 1.0667, -0.2405, -0.1580, 0.8097, 0.4166],
            "intercept": -0.8894
        }
    };

    // Initialize: Load Model Parameters if server is serving JSON, otherwise catch and use fallback
    async function loadModelParams() {
        try {
            const response = await fetch('/model_params.json');
            if (response.ok) {
                modelParams = await response.json();
                console.log("✅ Successfully loaded model parameters from JSON.");
            } else {
                throw new Error("Could not fetch model_params.json");
            }
        } catch (e) {
            console.warn("⚠️ Local model parameters JSON not loadable (probably static file / CORS). Using built-in fallback model.");
            modelParams = FALLBACK_PARAMS;
        }
    }
    loadModelParams();

    // Force dark-mode as default layout
    document.body.classList.add('dark-mode');
    document.body.classList.remove('light-mode');

    // Welcome / Landing screen transitions
    if (startAssessmentBtn) {
        startAssessmentBtn.addEventListener('click', () => {
            landingView.classList.add('hidden');
            nameView.classList.remove('hidden');
            patientNameField.value = '';
            errorPatientName.classList.remove('visible');
            errorPatientName.textContent = '';
            patientNameField.parentElement.classList.remove('error');
            patientNameField.focus();
        });
    }

    if (nameBackBtn) {
        nameBackBtn.addEventListener('click', () => {
            nameView.classList.add('hidden');
            landingView.classList.remove('hidden');
        });
    }

    if (nameContinueBtn) {
        nameContinueBtn.addEventListener('click', () => {
            const enteredName = patientNameField.value.trim();
            if (!enteredName) {
                errorPatientName.textContent = "Your name is required.";
                errorPatientName.classList.add('visible');
                patientNameField.parentElement.classList.add('error');
                patientNameField.focus();
                return;
            }

            // Validate name: only allow ASCII letters and spaces (both cases)
            const asciiLettersOnly = /^[a-zA-Z\s]+$/;
            if (!asciiLettersOnly.test(enteredName)) {
                errorPatientName.textContent = "Name must contain only letters and spaces.";
                errorPatientName.classList.add('visible');
                patientNameField.parentElement.classList.add('error');
                patientNameField.focus();
                return;
            }

            patientName = enteredName;
            userGreetingName.textContent = patientName;
            
            // Transition to main wizard
            nameView.classList.add('hidden');
            assessmentView.classList.remove('hidden');
            currentStep = 1;
            updateStepUI();
        });
    }

    // Step Navigation
    function updateStepUI() {
        // Hide/Show steps
        formSteps.forEach(step => {
            step.classList.remove('active');
            if (parseInt(step.dataset.step) === currentStep) {
                step.classList.add('active');
            }
        });

        // Update step dots and line indicators
        stepDots.forEach(dot => {
            const stepNum = parseInt(dot.dataset.step);
            dot.classList.remove('active', 'completed');
            if (stepNum === currentStep) {
                dot.classList.add('active');
            } else if (stepNum < currentStep) {
                dot.classList.add('completed');
            }
        });

        stepLines.forEach((line, index) => {
            line.classList.remove('completed');
            if (index < currentStep - 1) {
                line.classList.add('completed');
            }
        });

        // Update button visibility
        if (currentStep === 1) {
            prevBtn.disabled = true;
            prevBtn.classList.add('disabled');
        } else {
            prevBtn.disabled = false;
            prevBtn.classList.remove('disabled');
        }

        if (currentStep === totalSteps) {
            nextBtn.classList.add('hidden');
            submitBtn.classList.remove('hidden');
        } else {
            nextBtn.classList.remove('hidden');
            submitBtn.classList.add('hidden');
        }
    }

    // Validation checks for a specific field
    function validateField(input) {
        const id = input.id;
        const val = input.value;
        const errorSpan = document.getElementById(`error-${id}`);
        const wrapper = input.parentElement;
        
        if (!errorSpan) return true;

        // Reset state
        errorSpan.classList.remove('visible');
        wrapper.classList.remove('error');
        errorSpan.textContent = '';

        if (!val || val.trim() === '') {
            errorSpan.textContent = "This field is required.";
            errorSpan.classList.add('visible');
            wrapper.classList.add('error');
            return false;
        }

        const floatVal = parseFloat(val);
        if (isNaN(floatVal)) {
            errorSpan.textContent = "Must be a valid number.";
            errorSpan.classList.add('visible');
            wrapper.classList.add('error');
            return false;
        }

        // Age must be a whole number (no decimal)
        if (id === 'Age' && !Number.isInteger(Number(val))) {
            errorSpan.textContent = "Age must be a whole number.";
            errorSpan.classList.add('visible');
            wrapper.classList.add('error');
            return false;
        }

        const limits = VALID_RANGES[id];
        if (limits) {
            if (floatVal < limits.min || floatVal > limits.max) {
                errorSpan.textContent = `${limits.label} must be between ${limits.min} and ${limits.max}.`;
                errorSpan.classList.add('visible');
                wrapper.classList.add('error');
                return false;
            }
        }

        return true;
    }

    // Validate all fields in the current step
    function validateCurrentStep() {
        const currentStepEl = document.querySelector(`.form-step[data-step="${currentStep}"]`);
        const inputs = currentStepEl.querySelectorAll('input');
        let isValid = true;
        inputs.forEach(input => {
            if (!validateField(input)) {
                isValid = false;
            }
        });
        return isValid;
    }

    // Form Navigation Click events
    nextBtn.addEventListener('click', () => {
        if (validateCurrentStep()) {
            if (currentStep < totalSteps) {
                currentStep++;
                updateStepUI();
            }
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            updateStepUI();
        }
    });

    // Real-time validation listeners
    form.querySelectorAll('input').forEach(input => {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => {
            // Remove error immediately on typing valid inputs
            const errorSpan = document.getElementById(`error-${input.id}`);
            const wrapper = input.parentElement;
            if (errorSpan && errorSpan.classList.contains('visible')) {
                const val = input.value;
                const floatVal = parseFloat(val);
                const limits = VALID_RANGES[input.id];
                if (val && !isNaN(floatVal) && limits && floatVal >= limits.min && floatVal <= limits.max) {
                    errorSpan.classList.remove('visible');
                    wrapper.classList.remove('error');
                    errorSpan.textContent = '';
                }
            }
        });
    });

    // Accordion Control
    const accordionHeader = document.querySelector('.accordion-header');
    const accordionItem = document.querySelector('.accordion-item');
    const accordionContent = document.querySelector('.accordion-content');

    accordionHeader.addEventListener('click', () => {
        accordionItem.classList.toggle('active');
        if (accordionItem.classList.contains('active')) {
            accordionContent.style.maxHeight = accordionContent.scrollHeight + "px";
        } else {
            accordionContent.style.maxHeight = "0px";
        }
    });

    // Client-side Logistic Regression Predictor (No backend fallback)
    function predictClientSide(data) {
        if (!modelParams) {
            modelParams = FALLBACK_PARAMS;
        }

        const featuresOrder = ['Pregnancies', 'Glucose', 'BloodPressure', 'Insulin', 'BMI', 'Age'];
        let logit = modelParams.model.intercept;

        for (let i = 0; i < featuresOrder.length; i++) {
            const key = featuresOrder[i];
            const rawVal = parseFloat(data[key]);
            
            // Standard Scale: (X - mean) / std_deviation
            const mean = modelParams.scaler.mean[i];
            const scale = modelParams.scaler.scale[i];
            const scaledVal = (rawVal - mean) / scale;

            // Logit summation
            logit += modelParams.model.coefficients[i] * scaledVal;
        }

        // Logistic sigmoid function: 1 / (1 + e^-L)
        const probability = 1 / (1 + Math.exp(-logit));
        return {
            prediction: probability >= 0.5 ? 1 : 0,
            probability: probability * 100
        };
    }

    // Dynamic UI Outcome Visualizer
    function displayResults(probability, inputs) {
        // Toggle view visibility
        placeholderView.classList.add('hidden');
        resultsView.classList.remove('hidden');

        // Set Timestamp
        const now = new Date();
        reportTime.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        // Populate Patient Details Summary Logs
        summaryName.textContent = patientName;
        summaryAge.textContent = `${inputs.Age} yrs`;
        summaryPregnancies.textContent = inputs.Pregnancies;
        summaryBmi.textContent = `${inputs.BMI} kg/m²`;
        summaryBp.textContent = `${inputs.BloodPressure} mmHg`;
        summaryGlucose.textContent = `${inputs.Glucose} mg/dL`;
        summaryInsulin.textContent = `${inputs.Insulin} μU/mL`;

        // Score animation counter
        let currentPct = 0;
        const targetPct = Math.round(probability);
        const duration = 1200; // ms
        const intervalTime = 15; // ms
        const increment = targetPct / (duration / intervalTime);

        riskPct.textContent = '0%';
        const progressTimer = setInterval(() => {
            currentPct += increment;
            if (currentPct >= targetPct) {
                currentPct = targetPct;
                clearInterval(progressTimer);
            }
            riskPct.textContent = `${Math.round(currentPct)}%`;
        }, intervalTime);

        // Circular SVG progress bar
        // Circle circumference is 502.65
        const circumference = 502.65;
        const offset = circumference - (probability / 100) * circumference;
        gaugeProgressBar.style.strokeDashoffset = offset;

        // Apply risk colors and description based on classification thresholds
        riskStatus.className = 'risk-badge'; // Reset classes
        let statusText = '';
        let interpretationText = '';
        let recs = [];

        if (probability < 30) {
            statusText = 'Low Risk';
            riskStatus.classList.add('risk-low');
            gaugeProgressBar.style.stroke = 'var(--color-low)';
            interpretationText = "The system predicts a low probability of gestational or metabolic diabetes. Your health metrics are currently aligned within normal ranges. Maintain health guidelines and routine clinical checks.";
            recs = [
                "Continue standard prenatal nutrition and metabolic health guidelines.",
                "Maintain physical activity matching stage-appropriate guidelines.",
                "Regular glucose monitor checks are recommended as per normal obstetric schedule."
            ];
        } else if (probability < 65) {
            statusText = 'Moderate Risk';
            riskStatus.classList.add('risk-mid');
            gaugeProgressBar.style.stroke = 'var(--color-mid)';
            interpretationText = "Caution advised. Your screening indicates potential metabolic adjustments or moderately elevated glucose tolerance markers. The probability of diabetes is heightened. Ongoing screening and health checks are recommended.";
            recs = [
                "Consider consulting a clinical nutritionist to manage carbohydrate glycemic loads.",
                "Schedule a follow-up 2-Hour Oral Glucose Tolerance Test (OGTT) in 2-4 weeks.",
                "Increase daily moderate cardiovascular activity (e.g., walking 30 minutes/day)."
            ];
        } else {
            statusText = 'High Risk';
            riskStatus.classList.add('risk-high');
            gaugeProgressBar.style.stroke = 'var(--color-high)';
            interpretationText = "Significant indication. The predictive model flags a high likelihood of gestational or Type-2 diabetes. Diagnostic verification and medical guidance are recommended to support your health.";
            recs = [
                "Schedule an immediate consultation with an endocrinologist or maternal-fetal specialist.",
                "Initiate detailed self-monitoring of blood glucose levels (fasting and postprandial).",
                "Review therapeutic insulin therapy options and strict nutritional counseling paths."
            ];
        }
        
        riskStatus.textContent = statusText;
        riskInterpretation.textContent = interpretationText;

        // Populate Recommendations
        recommendationsList.innerHTML = '';
        recs.forEach(rec => {
            const li = document.createElement('li');
            li.innerHTML = `<i class="fa-solid fa-circle-notch" style="color: var(--color-primary); font-size: 0.7rem; margin-right: 8px;"></i> ${rec}`;
            recommendationsList.appendChild(li);
        });

        // Set accordion height if expanded
        if (accordionItem.classList.contains('active')) {
            accordionContent.style.maxHeight = accordionContent.scrollHeight + "px";
        }

        // Mini metrics breakdown details
        // Glucose percentage relative to max
        const glucoseVal = parseFloat(inputs.Glucose);
        mGlucose.textContent = `${glucoseVal} mg/dL`;
        const glucosePct = Math.min((glucoseVal / 200) * 100, 100);
        miniGlucoseFill.style.width = `${glucosePct}%`;
        miniGlucoseFill.style.background = glucoseVal > 140 ? 'var(--color-high)' : glucoseVal > 110 ? 'var(--color-mid)' : 'var(--color-low)';

        // BMI percentage relative to max
        const bmiVal = parseFloat(inputs.BMI);
        mBmi.textContent = `${bmiVal} kg/m²`;
        const bmiPct = Math.min((bmiVal / 50) * 100, 100);
        miniBmiFill.style.width = `${bmiPct}%`;
        miniBmiFill.style.background = bmiVal > 30 ? 'var(--color-high)' : bmiVal > 25 ? 'var(--color-mid)' : 'var(--color-low)';

        // Age percentage relative to max
        const ageVal = parseFloat(inputs.Age);
        mAge.textContent = `${ageVal} yrs`;
        const agePct = Math.min((ageVal / 80) * 100, 100);
        miniAgeFill.style.width = `${agePct}%`;
        miniAgeFill.style.background = ageVal > 45 ? 'var(--color-high)' : ageVal > 35 ? 'var(--color-mid)' : 'var(--color-low)';

        // Blood pressure percentage relative to max
        const bpVal = parseFloat(inputs.BloodPressure);
        mBp.textContent = `${bpVal} mmHg`;
        const bpPct = Math.min((bpVal / 110) * 100, 100);
        miniBpFill.style.width = `${bpPct}%`;
        miniBpFill.style.background = bpVal > 90 ? 'var(--color-high)' : bpVal > 80 ? 'var(--color-mid)' : 'var(--color-low)';
    }

    // Submit handler
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Final check on all steps
        let formIsValid = true;
        for (let step = 1; step <= totalSteps; step++) {
            currentStep = step;
            if (!validateCurrentStep()) {
                formIsValid = false;
                updateStepUI();
                break;
            }
        }

        if (!formIsValid) {
            return;
        }

        // Gather data
        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });

        // Add PatientName to prediction payload for database logging
        data['PatientName'] = patientName;

        // Show a loading cursor and disable buttons
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Analyzing... <i class="fa-solid fa-spinner fa-spin"></i>';

        try {
            // Attempt 1: Call Flask predict backend API
            const response = await fetch('/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const res = await response.json();
                displayResults(res.probability, data);
            } else {
                // If API is disabled/missing, fallback to client-side logic
                const errorData = await response.json();
                if (errorData.status === 'validation_error') {
                    // Highlight validation fields
                    for (const [field, msg] of Object.entries(errorData.errors)) {
                        const input = document.getElementById(field);
                        const errorSpan = document.getElementById(`error-${field}`);
                        if (input && errorSpan) {
                            errorSpan.textContent = msg;
                            errorSpan.classList.add('visible');
                            input.parentElement.classList.add('error');
                        }
                    }
                    // Find first step with error and switch to it
                    const firstErrorField = Object.keys(errorData.errors)[0];
                    const errorStep = document.getElementById(firstErrorField).closest('.form-step');
                    currentStep = parseInt(errorStep.dataset.step);
                    updateStepUI();
                } else {
                    throw new Error("Server error, falling back to client prediction.");
                }
            }
        } catch (err) {
            console.log("⚙️ Predict API unavailable or returned error. Running local calculation path...");
            // Run prediction client side
            const result = predictClientSide(data);
            displayResults(result.probability, data);
        } finally {
            // Reset submit button state
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Predict Risk <i class="fa-solid fa-check-double"></i>';
        }
    });

    // Reset button click event
    resetBtn.addEventListener('click', () => {
        form.reset();
        
        // Remove error displays
        form.querySelectorAll('.input-wrapper').forEach(w => w.classList.remove('error'));
        form.querySelectorAll('.error-msg').forEach(s => {
            s.classList.remove('visible');
            s.textContent = '';
        });

        // Transition back to step 1
        currentStep = 1;
        updateStepUI();

        // Swap view display
        resultsView.classList.add('hidden');
        placeholderView.classList.remove('hidden');

        // Reset gauge progress stroke
        gaugeProgressBar.style.strokeDashoffset = 502.65;

        // Reset views
        assessmentView.classList.add('hidden');
        nameView.classList.add('hidden');
        landingView.classList.remove('hidden');
        
        // Reset name
        patientName = "Anonymous";
    });

    // PDF Report Generator Event
    const downloadPdfBtn = document.getElementById('download-pdf-btn');
    if (downloadPdfBtn) {
        downloadPdfBtn.addEventListener('click', () => {
            if (resultsView.classList.contains('hidden')) {
                alert("Please perform a prediction first to generate a report.");
                return;
            }

            // Use pre-entered patient name
            const currentPatientName = patientName || "Anonymous";

            // Gather parameter values
            const age = document.getElementById('Age').value;
            const pregnancies = document.getElementById('Pregnancies').value;
            const bmi = document.getElementById('BMI').value;
            const bp = document.getElementById('BloodPressure').value;
            const glucose = document.getElementById('Glucose').value;
            const insulin = document.getElementById('Insulin').value;

            const probText = riskPct.textContent;
            const statusText = riskStatus.textContent;
            const interpretationText = riskInterpretation.textContent;
            const timestampText = reportTime.textContent;

            // Generate recommendations list array
            const recommendationItems = Array.from(recommendationsList.querySelectorAll('li'))
                .map(li => li.textContent.trim());

            // Generate unique Report ID
            const randomId = Math.floor(1000 + Math.random() * 9000);
            const reportId = `DC-${new Date().getFullYear()}-${randomId}`;

            // ── Determine risk colour theme ──────────────────────────────
            let accentRGB = [13, 148, 136];   // teal  (low risk)
            if (statusText.toLowerCase().includes('moderate') || statusText.toLowerCase().includes('mid')) {
                accentRGB = [217, 119, 6];    // amber (moderate)
            } else if (statusText.toLowerCase().includes('high')) {
                accentRGB = [225, 29, 72];    // red   (high)
            }
            const [aR, aG, aB] = accentRGB;

            // ── Initialise jsPDF ─────────────────────────────────────────
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
            const PW = doc.internal.pageSize.getWidth();   // 210 mm
            const ML = 14, MR = 14;
            const CW = PW - ML - MR;                       // usable content width
            let y = 14;

            const bold   = () => doc.setFont('helvetica', 'bold');
            const normal = () => doc.setFont('helvetica', 'normal');
            const sz     = (s) => doc.setFontSize(s);

            // ── COLOURED HEADER BAR ──────────────────────────────────────
            doc.setFillColor(aR, aG, aB);
            doc.rect(ML, y, CW, 18, 'F');

            doc.setTextColor(255, 255, 255);
            bold(); sz(15);
            doc.text('DiaCare  Health Report', ML + 4, y + 10);
            normal(); sz(8);
            doc.text('Advanced Clinical Risk Screening System', ML + 4, y + 16);

            bold(); sz(8);
            doc.text('Report ID: ' + reportId, PW - MR, y + 7, { align: 'right' });
            normal(); sz(7.5);
            doc.text('Name: ' + currentPatientName, PW - MR, y + 12, { align: 'right' });
            doc.text('Date: ' + new Date().toLocaleDateString(), PW - MR, y + 17, { align: 'right' });
            y += 24;

            // ── DISCLAIMER BOX ───────────────────────────────────────────
            doc.setFillColor(254, 242, 242);
            doc.setDrawColor(252, 165, 165);
            doc.setLineWidth(0.4);
            doc.roundedRect(ML, y, CW, 16, 2, 2, 'FD');
            doc.setTextColor(153, 27, 27);
            bold(); sz(8);
            doc.text('Important Clinical Notice:', ML + 4, y + 6);
            normal(); sz(7.5);
            const notice = 'This screening report uses statistical classification models. Consult a qualified medical professional for diagnostic confirmation and complete clinical evaluations.';
            const noticeLines = doc.splitTextToSize(notice, CW - 8);
            doc.text(noticeLines, ML + 4, y + 11.5);
            y += 22;

            // ── RISK OUTCOME BADGE ───────────────────────────────────────
            doc.setFillColor(aR, aG, aB);
            doc.roundedRect(ML, y, CW, 26, 3, 3, 'F');
            doc.setTextColor(255, 255, 255);
            bold(); sz(28);
            doc.text(probText, PW / 2, y + 16, { align: 'center' });
            normal(); sz(9);
            doc.text('Calculated Risk Probability   |   ' + statusText.toUpperCase(), PW / 2, y + 23, { align: 'center' });
            y += 32;

            // ── SECTION: PATIENT PARAMETERS ──────────────────────────────
            doc.setTextColor(15, 23, 42);
            bold(); sz(11);
            doc.text('Health Parameters', ML, y);
            y += 1.5;
            doc.setDrawColor(aR, aG, aB);
            doc.setLineWidth(0.6);
            doc.line(ML, y, ML + CW, y);
            y += 3;

            doc.autoTable({
                startY: y,
                margin: { left: ML, right: MR },
                head: [['Measurement', 'Your Answer', 'Reference Range']],
                body: [
                    ['Name',                       currentPatientName,      '\u2014'],
                    ['Age',                       age + ' yrs',            'Maternal (21 \u2013 120 yrs)'],
                    ['Pregnancies',               pregnancies + ' times',  'Gestational (0 \u2013 20)'],
                    ['Body Mass Index (BMI)',      bmi + ' kg/m\u00B2',    'Healthy (18.5 \u2013 24.9)'],
                    ['Blood Pressure (Diastolic)', bp + ' mmHg',           'Normal (< 80 mmHg)'],
                    ['2-Hour Oral Glucose',        glucose + ' mg/dL',     'Normal (< 140 mg/dL)'],
                    ['2-Hour Serum Insulin',       insulin + ' \u03bcU/mL','Normal (16 \u2013 166 \u03bcU/mL)'],
                ],
                headStyles:   { fillColor: [aR, aG, aB], textColor: [255,255,255], fontStyle: 'bold', fontSize: 9 },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                bodyStyles:   { fontSize: 8.5, textColor: [51, 65, 85] },
                columnStyles: {
                    0: { fontStyle: 'bold', cellWidth: 72 },
                    1: { fontStyle: 'bold', textColor: [15, 23, 42], cellWidth: 50 },
                    2: { textColor: [100, 116, 139] },
                },
                theme: 'grid',
            });

            y = doc.lastAutoTable.finalY + 8;

            // ── SECTION: CLINICAL INTERPRETATION ─────────────────────────
            doc.setTextColor(15, 23, 42);
            bold(); sz(11);
            doc.text('Clinical Interpretation', ML, y);
            y += 1.5;
            doc.setDrawColor(aR, aG, aB);
            doc.setLineWidth(0.6);
            doc.line(ML, y, ML + CW, y);
            y += 4;

            const interLines = doc.splitTextToSize(interpretationText, CW - 10);
            const interH = interLines.length * 5 + 8;

            doc.setFillColor(aR, aG, aB);
            doc.rect(ML, y, 2, interH, 'F');
            doc.setFillColor(248, 250, 252);
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.3);
            doc.rect(ML + 2.5, y, CW - 2.5, interH, 'FD');
            doc.setTextColor(51, 65, 85);
            normal(); sz(8.5);
            doc.text(interLines, ML + 6, y + 5);
            y += interH + 6;

            // ── SECTION: ACTIONABLE GUIDANCE ─────────────────────────────
            doc.setTextColor(15, 23, 42);
            bold(); sz(11);
            doc.text('Actionable Clinical Guidance', ML, y);
            y += 1.5;
            doc.setDrawColor(aR, aG, aB);
            doc.setLineWidth(0.6);
            doc.line(ML, y, ML + CW, y);
            y += 4;

            recommendationItems.forEach((rec, i) => {
                const recLines = doc.splitTextToSize(rec, CW - 12);
                const rowH = recLines.length * 5 + 4;
                if (i % 2 === 0) {
                    doc.setFillColor(248, 250, 252);
                    doc.rect(ML, y, CW, rowH, 'F');
                }
                doc.setTextColor(aR, aG, aB);
                bold(); sz(10);
                doc.text('\u2713', ML + 3, y + 4.5);
                doc.setTextColor(51, 65, 85);
                normal(); sz(8.5);
                doc.text(recLines, ML + 9, y + 4.5);
                y += rowH + 1;
            });

            y += 6;

            // ── FOOTER ───────────────────────────────────────────────────
            doc.setDrawColor(203, 213, 225);
            doc.setLineWidth(0.3);
            doc.setLineDashPattern([2, 2], 0);
            doc.line(ML, y, ML + CW, y);
            doc.setLineDashPattern([], 0);
            y += 4;

            doc.setTextColor(100, 116, 139);
            bold(); sz(7.5);
            doc.text('System Validation Disclaimer', ML, y);
            y += 4;
            normal(); sz(7);
            const disclaimer = 'This diagnostic report is computed using a statistical Logistic Regression predictive classification algorithm. This is a clinical screening report and does not substitute a formal diagnostic verification, professional diagnosis, or medical treatment plans.';
            const discLines = doc.splitTextToSize(disclaimer, CW - 55);
            doc.text(discLines, ML, y);

            doc.setDrawColor(148, 163, 184);
            doc.setLineWidth(0.4);
            doc.line(PW - MR - 52, y + 10, PW - MR, y + 10);
            doc.setTextColor(71, 85, 105);
            bold(); sz(6.5);
            doc.text('MATERNAL HEALTH CARE REVIEW', PW - MR - 52, y + 14);

            // ── SAVE/DOWNLOAD PDF ────────────────────────────────────────
            // Mobile compatible PDF handling: mobile browsers block direct downloads of blob URLs.
            // Opening in a new tab allows user to natively view, share, or save the PDF.
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.matchMedia("(max-width: 768px)").matches;
            
            if (isMobile) {
                try {
                    const blob = doc.output('blob');
                    const blobUrl = URL.createObjectURL(blob);
                    
                    // Attempt to open in a new tab
                    const newTab = window.open(blobUrl, '_blank');
                    if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
                        // Fallback: if browser popup blocker triggers, redirect current page
                        window.location.href = blobUrl;
                    }
                } catch (e) {
                    console.error("Error generating mobile PDF preview, falling back to download: ", e);
                    doc.save('DiaCare_Report_' + reportId + '.pdf');
                }
            } else {
                // Desktop standard download
                doc.save('DiaCare_Report_' + reportId + '.pdf');
            }
        });
    }

    // Background Parallax Effect - Disabled per user request to avoid background shift on cursor movements
    const bgParallax = document.querySelector('.app-bg-parallax');
    // Background Particle & ECG System
    const canvas = document.getElementById('bg-particles');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particles = [];
        let mouse = { x: null, y: null, radius: 120 };

        // ECG Wave variables
        let points = [];
        let sweepX = 0;
        const sweepSpeed = 4; // pixels per frame
        const blankGap = 60; // gap ahead of sweep head
        let ecgCycleTime = 0;
        
        // Heartbeat timing configuration
        const heartbeatDuration = 60; // 1 second pulse at 60fps
        const restDuration = 40;      // rest period between heartbeats
        const totalCycle = heartbeatDuration + restDuration;

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            // Initialize points array with baseline (centered vertically)
            const baseline = canvas.height * 0.5;
            points = new Array(Math.ceil(canvas.width)).fill(baseline);
            
            initParticles();
        }
        window.addEventListener('resize', resizeCanvas);

        // Track mouse globally
        window.addEventListener('mousemove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        });

        window.addEventListener('mouseleave', () => {
            mouse.x = null;
            mouse.y = null;
        });

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 4.2 + 1.2; // larger particles
                this.speedX = Math.random() * 0.3 - 0.15;
                this.speedY = Math.random() * -0.4 - 0.1;
                this.color = Math.random() > 0.5 ? '#0ea5e9' : '#0d9488';
                this.alpha = Math.random() * 0.45 + 0.25; // brighter opacity
                this.baseAlpha = this.alpha;
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
                if (this.y < -10) {
                    this.y = canvas.height + 10;
                    this.x = Math.random() * canvas.width;
                }
                if (mouse.x !== null && mouse.y !== null) {
                    const dx = this.x - mouse.x;
                    const dy = this.y - mouse.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < mouse.radius) {
                        const force = (mouse.radius - distance) / mouse.radius;
                        this.x += (dx / distance) * force * 1.5;
                        this.y += (dy / distance) * force * 1.5;
                        this.alpha = Math.min(this.baseAlpha * 2.2, 0.85);
                    } else {
                        if (this.alpha > this.baseAlpha) {
                            this.alpha -= 0.01;
                        }
                    }
                }
            }

            draw() {
                ctx.save();
                ctx.globalAlpha = this.alpha;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                
                // Brighter shadows for extra glow
                ctx.shadowBlur = this.size > 2.0 ? 12 : 6;
                ctx.shadowColor = this.color;
                
                ctx.fill();
                ctx.restore();
            }
        }

        function initParticles() {
            particles = [];
            // Increased density and higher count limit
            const count = Math.min(Math.floor((canvas.width * canvas.height) / 14000), 140);
            for (let i = 0; i < count; i++) {
                particles.push(new Particle());
            }
        }

        function getECGValue(t) {
            if (t >= heartbeatDuration) return 0;
            const percent = t / heartbeatDuration;
            
            if (percent < 0.1) {
                return Math.sin((percent / 0.1) * Math.PI) * 6; // P wave
            }
            if (percent < 0.18) {
                return 0;
            }
            if (percent < 0.22) {
                return -((percent - 0.18) / 0.04) * 4; // Q wave
            }
            if (percent < 0.27) {
                const rPercent = (percent - 0.22) / 0.05;
                if (rPercent < 0.5) {
                    return -4 + (rPercent / 0.5) * 54; // R spike up
                } else {
                    return 50 - ((rPercent - 0.5) / 0.5) * 65; // R spike down
                }
            }
            if (percent < 0.31) {
                const sPercent = (percent - 0.27) / 0.04;
                return -15 + (sPercent * 15); // S wave recovery
            }
            if (percent < 0.42) {
                return 0;
            }
            if (percent < 0.6) {
                return Math.sin(((percent - 0.42) / 0.18) * Math.PI) * 10; // T wave
            }
            return 0;
        }

        function updateECG() {
            const baseline = canvas.height * 0.5;
            for (let s = 0; s < sweepSpeed; s++) {
                sweepX = (sweepX + 1) % canvas.width;
                for (let g = 0; g < blankGap; g++) {
                    const eraseIdx = (sweepX + g) % canvas.width;
                    points[eraseIdx] = null;
                }
                ecgCycleTime = (ecgCycleTime + 1) % totalCycle;
                const ecgHeight = getECGValue(ecgCycleTime);
                points[sweepX] = baseline - ecgHeight;
            }
        }

        function drawECG() {
            ctx.save();
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#0ea5e9';
            ctx.lineWidth = 2.5;
            
            const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
            const stopMain = sweepX / canvas.width;
            const stopFade = Math.max(0, (sweepX - 300) / canvas.width);
            const stopBright = Math.min(1, (sweepX + 5) / canvas.width);
            
            grad.addColorStop(0, 'rgba(14, 165, 233, 0.05)');
            if (stopFade > 0 && stopFade < 1) {
                grad.addColorStop(stopFade, 'rgba(14, 165, 233, 0.08)');
            }
            if (stopMain > 0 && stopMain < 1) {
                grad.addColorStop(stopMain, 'rgba(14, 165, 233, 0.85)');
            }
            grad.addColorStop(stopBright, 'rgba(56, 189, 248, 1)');
            if (stopBright < 1) {
                grad.addColorStop(1, 'rgba(14, 165, 233, 0.05)');
            }
            
            ctx.strokeStyle = grad;
            ctx.beginPath();
            let started = false;
            
            for (let i = 0; i < canvas.width; i++) {
                if (points[i] === null) {
                    started = false;
                    continue;
                }
                if (!started) {
                    ctx.moveTo(i, points[i]);
                    started = true;
                } else {
                    ctx.lineTo(i, points[i]);
                }
            }
            ctx.stroke();
            
            const currentY = points[sweepX];
            if (currentY !== null) {
                ctx.beginPath();
                ctx.arc(sweepX, currentY, 4.5, 0, Math.PI * 2);
                ctx.fillStyle = '#67e8f9';
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#38bdf8';
                ctx.fill();
            }
            ctx.restore();
        }

        function drawConstellation() {
            if (mouse.x === null || mouse.y === null) return;
            particles.forEach(p => {
                const dx = p.x - mouse.x;
                const dy = p.y - mouse.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < mouse.radius) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(mouse.x, mouse.y);
                    ctx.lineTo(p.x, p.y);
                    const alpha = ((mouse.radius - distance) / mouse.radius) * 0.35;
                    ctx.strokeStyle = p.color === '#0ea5e9' ? `rgba(14, 165, 233, ${alpha})` : `rgba(13, 148, 136, ${alpha})`;
                    ctx.lineWidth = 1.0;
                    ctx.shadowBlur = 4;
                    ctx.shadowColor = p.color;
                    ctx.stroke();
                    ctx.restore();
                }
            });
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            updateECG();
            drawECG();
            drawConstellation();
            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();
            }
            requestAnimationFrame(animate);
        }

        resizeCanvas();
        animate();
    }

    // ── History Modal Event Listeners & Async Loader ─────────────────
    const viewHistoryBtn = document.getElementById('view-history-btn');
    const historyModal = document.getElementById('history-modal');
    const closeHistoryBtn = document.getElementById('close-history-btn');
    const historyTableBody = document.getElementById('history-table-body');

    if (viewHistoryBtn) {
        viewHistoryBtn.addEventListener('click', async () => {
            historyModal.classList.add('visible');
            await loadHistory();
        });
    }

    if (closeHistoryBtn) {
        closeHistoryBtn.addEventListener('click', () => {
            historyModal.classList.remove('visible');
        });
    }

    if (historyModal) {
        historyModal.addEventListener('click', (e) => {
            if (e.target === historyModal) {
                historyModal.classList.remove('visible');
            }
        });
    }

    async function loadHistory() {
        if (!historyTableBody) return;
        
        historyTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;"><i class="fa-solid fa-spinner fa-spin"></i> Fetching screening history...</td></tr>';
        
        try {
            const response = await fetch('/history');
            if (response.ok) {
                const res = await response.json();
                if (res.status === 'success' && res.history && res.history.length > 0) {
                    historyTableBody.innerHTML = '';
                    res.history.forEach(item => {
                        const tr = document.createElement('tr');
                        // Localized timestamp
                        const dateStr = new Date(item.created_at + 'Z').toLocaleString([], {
                            year: 'numeric', month: 'short', day: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                        });
                        const outcomeText = item.prediction_outcome === 1 ? 'High Risk' : 'Low Risk';
                        const outcomeClass = item.prediction_outcome === 1 ? 'risk-high' : 'risk-low';
                        
                        tr.innerHTML = `
                            <td>${dateStr}</td>
                            <td style="font-weight: 600; color: var(--color-text);">${item.patient_name}</td>
                            <td>${item.age} yrs</td>
                            <td>${item.glucose} mg/dL</td>
                            <td>${item.bmi} kg/m²</td>
                            <td class="risk-col" style="color: ${item.prediction_outcome === 1 ? 'var(--color-high)' : 'var(--color-low)'}; font-weight: 700;">${item.risk_probability}%</td>
                            <td><span class="outcome-badge ${outcomeClass}">${outcomeText}</span></td>
                        `;
                        historyTableBody.appendChild(tr);
                    });
                } else {
                    historyTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--color-text-muted);">No records found in assessment history.</td></tr>';
                }
            } else {
                throw new Error("Failed to load");
            }
        } catch (e) {
            console.error("Error loading assessment history: ", e);
            historyTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--color-high);">Failed to fetch history logs.</td></tr>';
        }
    }

    // Initialize UI step on page render
    updateStepUI();
});
