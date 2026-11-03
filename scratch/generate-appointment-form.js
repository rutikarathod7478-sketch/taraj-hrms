const fs = require('fs');
const path = require('path');

const logos = JSON.parse(fs.readFileSync(path.join(__dirname, 'logos-base64.json')));

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Taraj Appointment Letter Form</title>
  <style>
    /* CSS Variables & Global Resets */
    :root {
      --color-blue: #03A6FF;
      --color-orange: #FF7000;
      --color-green: #72D569;
      --color-navy: #14213D;
      --color-text: #1F2937;
      --color-muted: #6B7280;
      --color-border: #D9DEE5;
      --color-table-border: #CBD2DC;
      --color-bg-page: #EEF1F5;
      --font-form: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      --font-letter: 'Times New Roman', Times, serif;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: var(--font-form);
      color: var(--color-text);
      background-color: var(--color-bg-page);
      min-height: 100vh;
      display: flex;
      -webkit-font-smoothing: antialiased;
    }

    /* Layout: Desktop Two Columns */
    .app-container {
      display: flex;
      width: 100%;
      min-height: 100vh;
    }

    /* Left Sticky Form Panel */
    .form-panel {
      width: 390px;
      flex-shrink: 0;
      background: #FFFFFF;
      border-right: 1px solid var(--color-border);
      height: 100vh;
      position: sticky;
      top: 0;
      overflow-y: auto;
      padding: 24px 22px;
      display: flex;
      flex-direction: column;
      z-index: 20;
    }

    .form-panel::-webkit-scrollbar {
      width: 6px;
    }
    .form-panel::-webkit-scrollbar-thumb {
      background: #CBD5E1;
      border-radius: 4px;
    }

    .form-header {
      margin-bottom: 16px;
    }

    .form-title {
      font-size: 20px;
      font-weight: 800;
      color: var(--color-navy);
      letter-spacing: -0.3px;
    }

    .form-subtitle {
      font-size: 12px;
      color: var(--color-muted);
      margin-top: 4px;
      line-height: 1.4;
    }

    /* Progress Section */
    .progress-section {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 10px 12px;
      margin-bottom: 16px;
    }

    .progress-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11.5px;
      font-weight: 700;
      color: var(--color-navy);
      margin-bottom: 6px;
    }

    .progress-track {
      width: 100%;
      height: 7px;
      background: #E2E8F0;
      border-radius: 999px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, #FF7000 0%, #72D569 50%, #03A6FF 100%);
      border-radius: 999px;
      transition: width 0.3s ease;
    }

    /* Section Labels */
    .section-label {
      font-size: 10.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.9px;
      color: var(--color-muted);
      margin-top: 14px;
      margin-bottom: 8px;
      padding-bottom: 3px;
      border-bottom: 1px solid #F1F5F9;
    }

    .field-hint-note {
      font-size: 10.5px;
      color: var(--color-muted);
      margin-top: -4px;
      margin-bottom: 8px;
      font-style: italic;
    }

    /* Form Fields */
    .field-group {
      margin-bottom: 10px;
    }

    .field-label {
      display: block;
      font-size: 11.5px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 4px;
    }

    .input-control {
      width: 100%;
      height: 35px;
      padding: 0 10px;
      font-size: 12px;
      font-family: var(--font-form);
      color: var(--color-text);
      background-color: #FFFFFF;
      border: 1px solid var(--color-border);
      border-radius: 6px;
      outline: none;
      transition: all 0.15s ease-in-out;
    }

    .input-control:focus {
      border-color: var(--color-blue);
      box-shadow: 0 0 0 3px rgba(3, 166, 255, 0.18);
    }

    select.input-control {
      cursor: pointer;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 10px center;
      padding-right: 28px;
      appearance: none;
      -webkit-appearance: none;
    }

    .field-row {
      display: flex;
      gap: 8px;
    }
    .field-col {
      flex: 1;
    }

    /* Action Buttons */
    .actions-row {
      display: flex;
      gap: 8px;
      margin-top: 18px;
    }

    .btn {
      flex: 1;
      height: 38px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      font-family: var(--font-form);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      transition: all 0.15s ease;
      border: none;
      white-space: nowrap;
    }

    .btn-save-candidate {
      background-color: #059669;
      color: #ffffff;
      box-shadow: 0 2px 4px rgba(5, 150, 105, 0.2);
    }
    .btn-save-candidate:hover {
      background-color: #047857;
      transform: translateY(-1px);
    }
    .btn-save-candidate:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .btn-primary {
      background-color: var(--color-navy);
      color: #ffffff;
      box-shadow: 0 2px 4px rgba(20, 33, 61, 0.15);
    }
    .btn-primary:hover {
      background-color: #0d1629;
      transform: translateY(-1px);
    }

    .btn-secondary {
      background-color: #F8FAFC;
      color: #475569;
      border: 1px solid var(--color-border);
    }
    .btn-secondary:hover {
      background-color: #F1F5F9;
      color: var(--color-navy);
    }

    .save-status-box {
      margin-top: 12px;
      padding: 10px 12px;
      border-radius: 6px;
      font-size: 11.5px;
      line-height: 1.45;
    }
    .save-status-success {
      background-color: #ECFDF5;
      border: 1px solid #A7F3D0;
      color: #065F46;
    }
    .save-status-error {
      background-color: #FEF2F2;
      border: 1px solid #FECACA;
      color: #991B1B;
    }

    .print-hint {
      font-size: 10.5px;
      color: var(--color-muted);
      line-height: 1.45;
      margin-top: 12px;
      background: #F8FAFC;
      border: 1px dashed var(--color-border);
      border-radius: 6px;
      padding: 8px 10px;
    }
    .print-hint strong {
      color: var(--color-navy);
    }

    /* Right Preview Panel */
    .preview-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px 24px;
      overflow-x: auto;
      overflow-y: auto;
      min-height: 100vh;
    }

    .preview-scale-wrapper {
      transform-origin: top center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px; /* 24px gap between stacked pages */
      transition: transform 0.2s ease;
    }

    /* Live A4 Letter Page (794px x 1123px) */
    .letter-page {
      width: 794px;
      height: 1123px;
      background: #FFFFFF;
      box-shadow: 0 12px 35px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04);
      border-radius: 2px;
      position: relative;
      box-sizing: border-box;
      padding: 44px 77px 34px 77px; /* left/right page padding 77px */
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      font-family: var(--font-letter);
      font-size: 14.4px;
      line-height: 1.45;
      color: var(--color-text);
      text-align: justify;
    }

    /* Watermark TG Icon on BOTH pages */
    .watermark-img {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 440px;
      height: auto;
      opacity: 0.17;
      pointer-events: none;
      z-index: 1;
      user-select: none;
    }

    /* Content wrapper */
    .letter-inner {
      position: relative;
      z-index: 2;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    /* Thin 3-color line */
    .color-stripe {
      height: 3.5px;
      width: 100%;
      background: linear-gradient(90deg, #FF7000 0%, #FF7000 33.3%, #72D569 33.3%, #72D569 66.6%, #03A6FF 66.6%, #03A6FF 100%);
      border-radius: 1px;
    }

    /* Page 1 Header */
    .p1-header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 10px;
    }

    .p1-logo-box img {
      width: 220px;
      height: auto;
      display: block;
    }

    .p1-header-meta {
      text-align: right;
      font-size: 12px;
      line-height: 1.4;
    }

    .p1-hq-address {
      font-size: 11px;
      color: var(--color-muted);
      font-family: var(--font-form);
      margin-bottom: 4px;
    }

    /* Centered Title */
    .title-box {
      text-align: center;
      margin: 14px 0 12px;
    }

    .title-text {
      font-size: 17.5px;
      font-weight: bold;
      color: var(--color-navy);
      letter-spacing: 2.5px;
      text-transform: uppercase;
    }

    .title-underline {
      width: 80px;
      height: 4px;
      background-color: var(--color-orange);
      margin: 4px auto 0;
      border-radius: 2px;
    }

    /* Clause Headings */
    .clause-heading {
      font-weight: bold;
      color: var(--color-navy);
      margin-right: 4px;
    }

    /* Paragraph styles */
    .body-p {
      margin-bottom: 10px;
      text-align: justify;
      line-height: 1.45;
    }

    /* Compensation Table */
    .comp-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid var(--color-table-border);
      font-size: 13.5px;
      margin-top: 6px;
      margin-bottom: 8px;
    }

    .comp-table th {
      border: 1px solid var(--color-table-border);
      border-bottom: 2px solid var(--color-navy);
      background-color: rgba(20, 33, 61, 0.05); /* semi-transparent so watermark shows */
      padding: 7px 14px;
      font-weight: bold;
      color: var(--color-navy);
    }

    .comp-table td {
      border: 1px solid var(--color-table-border);
      padding: 6px 14px;
    }

    .comp-table .amt-col {
      text-align: right;
      width: 38%;
      font-weight: 500;
    }

    .comp-table tr.total-row td {
      background-color: rgba(20, 33, 61, 0.04);
      border-top: 1.5px solid var(--color-navy);
      font-weight: bold;
    }

    /* Page 2 Header */
    .p2-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .p2-logo-box img {
      width: 122px;
      height: auto;
      display: block;
    }

    .p2-ref-box {
      font-size: 12px;
      text-align: right;
    }

    /* Signatures */
    .sig-row {
      display: flex;
      justify-content: space-between;
      gap: 40px;
      margin-bottom: 12px;
    }

    .sig-col {
      flex: 1;
    }

    .sig-top-line {
      border-top: 1.2px solid var(--color-navy);
      margin-bottom: 6px;
    }

    .sig-bold {
      font-weight: bold;
      color: var(--color-navy);
      font-size: 14px;
    }

    .sig-meta {
      font-size: 13px;
      color: var(--color-muted);
      margin-top: 2px;
    }

    /* Bottom Pinned Footer */
    .footer-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10.5px;
      color: var(--color-muted);
      font-family: var(--font-form);
      margin-top: 6px;
    }

    /* Placeholders highlighting on SCREEN only */
    .placeholder-val {
      background-color: #FEF3C7;
      color: #92400E;
      padding: 0 4px;
      border-radius: 3px;
      font-weight: normal;
      transition: background 0.15s ease;
    }

    /* Mobile Responsive (under 900px) */
    @media (max-width: 900px) {
      .app-container {
        flex-direction: column;
      }

      .form-panel {
        width: 100%;
        height: auto;
        position: relative;
        border-right: none;
        border-bottom: 1px solid var(--color-border);
      }

      .preview-panel {
        padding: 20px 10px;
        min-height: auto;
      }
    }

    /* PRINT STYLES - Exact 2 Pages */
    @media print {
      @page {
        size: A4 portrait;
        margin: 0;
      }

      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #FFFFFF !important;
        width: 210mm !important;
        height: auto !important;
        overflow: visible !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      .form-panel,
      .print-hint,
      .btn {
        display: none !important;
      }

      .app-container {
        display: block !important;
        width: 210mm !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      .preview-panel {
        padding: 0 !important;
        margin: 0 !important;
        background: transparent !important;
        width: 210mm !important;
        display: block !important;
      }

      .preview-scale-wrapper {
        transform: none !important;
        width: 210mm !important;
        margin: 0 !important;
        padding: 0 !important;
        gap: 0 !important;
      }

      .letter-page {
        width: 210mm !important;
        height: 296mm !important;
        max-height: 297mm !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        margin: 0 !important;
        padding: 12mm 20mm 10mm 20mm !important; /* 77px approx 20mm */
        page-break-inside: avoid !important;
        overflow: hidden !important;
      }

      .page-1 {
        page-break-after: always !important;
      }

      .page-2 {
        page-break-after: avoid !important;
      }

      .placeholder-val {
        background: transparent !important;
        color: inherit !important;
        padding: 0 !important;
      }
    }
  </style>
</head>
<body>
  <div class="app-container">
    <!-- Left Form Panel (390px, scrollable) -->
    <aside class="form-panel">
      <div class="form-header">
        <h1 class="form-title">Appointment Letter Form</h1>
        <p class="form-subtitle">Fill in the details. The letter on the right updates as you type.</p>
      </div>

      <!-- Progress Section (X of 24 filled) -->
      <div class="progress-section">
        <div class="progress-info">
          <span>Completion</span>
          <span id="progress-text">0 of 24 filled</span>
        </div>
        <div class="progress-track">
          <div id="progress-fill" class="progress-fill"></div>
        </div>
      </div>

      <form id="appointment_form" onsubmit="return false;">
        <!-- 1. LETTER -->
        <div class="section-label">1. LETTER</div>
        <p class="field-hint-note">Ref No. prints as TGS/HR/APP/year/number.</p>
        <div class="field-group">
          <label class="field-label" for="inp_company_address">Company Address</label>
          <input type="text" id="inp_company_address" class="input-control" placeholder="e.g. Pune, Maharashtra, India" />
        </div>
        <div class="field-group">
          <label class="field-label" for="inp_date">Letter Date</label>
          <input type="date" id="inp_date" class="input-control" />
        </div>
        <div class="field-row">
          <div class="field-col field-group">
            <label class="field-label" for="inp_ref_year">Ref Year</label>
            <input type="text" id="inp_ref_year" class="input-control" placeholder="2026" />
          </div>
          <div class="field-col field-group">
            <label class="field-label" for="inp_ref_number">Ref Number</label>
            <input type="text" id="inp_ref_number" class="input-control" placeholder="001" />
          </div>
        </div>

        <!-- 2. CANDIDATE -->
        <div class="section-label">2. CANDIDATE</div>
        <p class="field-hint-note">Dear ... uses the first name from the full name automatically.</p>
        <div class="field-group">
          <label class="field-label" for="inp_name">Full Name</label>
          <input type="text" id="inp_name" class="input-control" placeholder="Candidate Full Name" />
        </div>
        <div class="field-group">
          <label class="field-label" for="inp_addr1">Address Line 1</label>
          <input type="text" id="inp_addr1" class="input-control" placeholder="House / Flat / Street" />
        </div>
        <div class="field-group">
          <label class="field-label" for="inp_addr2">Address Line 2</label>
          <input type="text" id="inp_addr2" class="input-control" placeholder="City, State, Pincode" />
        </div>

        <!-- 3. POSITION -->
        <div class="section-label">3. POSITION</div>
        <div class="field-group">
          <label class="field-label" for="inp_job_title">Job Title</label>
          <input type="text" id="inp_job_title" class="input-control" placeholder="e.g. Senior Software Specialist" />
        </div>
        <div class="field-group">
          <label class="field-label" for="inp_department">Department</label>
          <input type="text" id="inp_department" class="input-control" placeholder="e.g. Information Technology" />
        </div>
        <div class="field-group">
          <label class="field-label" for="inp_office_location">Office Location / City</label>
          <input type="text" id="inp_office_location" class="input-control" placeholder="e.g. Pune Corporate Office" />
        </div>
        <div class="field-group">
          <label class="field-label" for="inp_start_date">Start Date</label>
          <input type="date" id="inp_start_date" class="input-control" />
        </div>

        <!-- 4. COMPENSATION (per annum) -->
        <div class="section-label">4. COMPENSATION (PER ANNUM)</div>
        <div class="field-group">
          <label class="field-label" for="inp_currency">Currency</label>
          <select id="inp_currency" class="input-control">
            <option value="INR" selected>INR (₹)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="AED">AED (AED)</option>
            <option value="SGD">SGD (S$)</option>
          </select>
        </div>
        <div class="field-group">
          <label class="field-label" for="inp_basic">Basic Salary</label>
          <input type="text" id="inp_basic" class="input-control" placeholder="e.g. 3,60,000" />
        </div>
        <div class="field-group">
          <label class="field-label" for="inp_hra">House Rent Allowance (HRA)</label>
          <input type="text" id="inp_hra" class="input-control" placeholder="e.g. 1,44,000" />
        </div>
        <div class="field-group">
          <label class="field-label" for="inp_special">Special &amp; Performance Allowances</label>
          <input type="text" id="inp_special" class="input-control" placeholder="e.g. 96,000" />
        </div>
        <div class="field-group">
          <label class="field-label" for="inp_total">Total Annual CTC</label>
          <input type="text" id="inp_total" class="input-control" placeholder="Auto-calculated sum" />
        </div>

        <!-- 5. TERMS -->
        <div class="section-label">5. TERMS</div>
        <div class="field-group">
          <label class="field-label" for="inp_probation">Probation Period</label>
          <input type="text" id="inp_probation" class="input-control" placeholder="e.g. 3 to 6 months" />
        </div>
        <div class="field-row">
          <div class="field-col field-group">
            <label class="field-label" for="inp_time_from">From</label>
            <input type="time" id="inp_time_from" class="input-control" value="09:30" />
          </div>
          <div class="field-col field-group">
            <label class="field-label" for="inp_time_to">To</label>
            <input type="time" id="inp_time_to" class="input-control" value="18:30" />
          </div>
          <div class="field-col field-group">
            <label class="field-label" for="inp_days_week">Days/Wk</label>
            <select id="inp_days_week" class="input-control">
              <option value="5" selected>5</option>
              <option value="5.5">5.5</option>
              <option value="6">6</option>
            </select>
          </div>
        </div>
        <div class="field-group">
          <label class="field-label" for="inp_notice_probation">Notice in Probation</label>
          <input type="text" id="inp_notice_probation" class="input-control" placeholder="e.g. 2 weeks" />
        </div>
        <div class="field-group">
          <label class="field-label" for="inp_notice_confirmation">Notice after Confirmation</label>
          <input type="text" id="inp_notice_confirmation" class="input-control" placeholder="e.g. 2 months" />
        </div>
        <div class="field-group">
          <label class="field-label" for="inp_return_days">Sign and Return Within (Days)</label>
          <input type="text" id="inp_return_days" class="input-control" placeholder="e.g. 7" />
        </div>

        <!-- 6. SIGNATORY -->
        <div class="section-label">6. SIGNATORY</div>
        <div class="field-group">
          <label class="field-label" for="inp_signatory">Authorized Signatory Name</label>
          <input type="text" id="inp_signatory" class="input-control" placeholder="e.g. Rajesh Verma" />
        </div>

        <!-- Action Buttons -->
        <div class="actions-row">
          <button type="button" id="btn_save_server" class="btn btn-save-candidate" title="Save this Appointment Letter to candidate and attach in HRMS">
            💾 Save to Candidate
          </button>
          <button type="button" id="btn_save_pdf" class="btn btn-primary" title="Print / Save local PDF">Save as PDF</button>
          <button type="button" id="btn_clear" class="btn btn-secondary">Clear</button>
        </div>

        <div id="save_status_box" class="save-status-box" style="display: none;"></div>

        <p class="print-hint">
          💡 Hint: Choose <strong>Save as PDF</strong> as the destination, set <strong>Margins to None</strong>, and tick <strong>Background graphics</strong>.
        </p>
      </form>
    </aside>

    <!-- Right Live Preview Panel (Two A4 Pages Stacked with 24px gap) -->
    <main class="preview-panel">
      <div class="preview-scale-wrapper" id="preview_scale_wrapper">
        
        <!-- PAGE 1 -->
        <div class="letter-page page-1" id="letter_page_1">
          <!-- Watermark TG Icon centered behind text -->
          <img src="${logos.icon}" class="watermark-img" alt="Taraj Global Watermark" />

          <div class="letter-inner">
            <!-- Top Section of Page 1 -->
            <div>
              <!-- Header Row: Logo Left, Meta Right -->
              <div class="p1-header-row">
                <div class="p1-logo-box">
                  <img src="${logos.full}" alt="Taraj Global - Business Simplified" />
                </div>
                <div class="p1-header-meta">
                  <div class="p1-hq-address">Corporate Headquarters • <span id="out_company_address" class="placeholder-val">[Company Address]</span></div>
                  <div><strong>Date:</strong> <span id="out_date" class="placeholder-val">[Date, e.g., 01 November 2026]</span></div>
                  <div><strong>Ref No:</strong> TGS/HR/APP/<span id="out_ref_year" class="placeholder-val">[Year]</span>/<span id="out_ref_number" class="placeholder-val">[Number]</span></div>
                </div>
              </div>

              <!-- Thin 3-color line (3.5px) -->
              <div class="color-stripe" style="margin-bottom: 14px;"></div>

              <!-- To Candidate Block -->
              <div style="line-height: 1.45; margin-bottom: 12px;">
                <div>To,</div>
                <div><strong id="out_name_to" class="placeholder-val">[Candidate Full Name]</strong></div>
                <div id="out_addr1" class="placeholder-val">[Address Line 1]</div>
                <div id="out_addr2" class="placeholder-val">[Address Line 2]</div>
              </div>

              <!-- Centered Bold Navy Title with Short Orange Underline -->
              <div class="title-box">
                <div class="title-text">LETTER OF APPOINTMENT</div>
                <div class="title-underline"></div>
              </div>

              <!-- Salutation -->
              <p style="margin-bottom: 8px;">Dear <span id="out_first_name" class="placeholder-val">[First Name]</span>,</p>

              <!-- Intro Paragraph -->
              <p class="body-p">
                We are delighted to offer you employment with Taraj Global Solutions (hereinafter referred to as the "Company") on the terms and conditions set out below. This appointment marks the beginning of a mutually rewarding professional relationship.
              </p>

              <!-- Clause 1: Position and Location -->
              <p class="body-p">
                <strong class="clause-heading">1. Position and Location:</strong> You are appointed to the position of <strong id="out_job_title" class="placeholder-val">[Job Title]</strong> in the <strong id="out_department" class="placeholder-val">[Department]</strong> department. Your primary place of work will be at our <strong id="out_office_location" class="placeholder-val">[Office Location / City]</strong> office, though you may be required to travel or relocate as business needs dictate.
              </p>

              <!-- Clause 2: Commencement of Employment -->
              <p class="body-p">
                <strong class="clause-heading">2. Commencement of Employment:</strong> Your employment shall commence on <strong id="out_start_date" class="placeholder-val">[Start Date, e.g., 01 November 2026]</strong>. On your first day, please report to the Human Resources department for your formal induction and onboarding procedures.
              </p>

              <!-- Clause 3: Compensation and Benefits -->
              <p class="body-p" style="margin-bottom: 6px;">
                <strong class="clause-heading">3. Compensation and Benefits:</strong> Your total cost-to-company (CTC) will be <strong id="out_curr_ctc">INR</strong> <strong id="out_total_ctc" class="placeholder-val">[Total]</strong> per annum, payable in accordance with the standard payroll policies of the Company. Details of your salary breakdown and associated benefits are outlined below:
              </p>

              <!-- Compensation Breakdown Table -->
              <table class="comp-table">
                <thead>
                  <tr>
                    <th style="text-align: left;">Compensation Component</th>
                    <th style="text-align: right; width: 38%;">Amount (Per Annum)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Basic Salary</td>
                    <td class="amt-col"><span class="curr-symbol">INR</span> <span id="out_basic" class="placeholder-val">[Amount]</span></td>
                  </tr>
                  <tr>
                    <td>House Rent Allowance (HRA)</td>
                    <td class="amt-col"><span class="curr-symbol">INR</span> <span id="out_hra" class="placeholder-val">[Amount]</span></td>
                  </tr>
                  <tr>
                    <td>Special &amp; Performance Allowances</td>
                    <td class="amt-col"><span class="curr-symbol">INR</span> <span id="out_special" class="placeholder-val">[Amount]</span></td>
                  </tr>
                  <tr class="total-row">
                    <td><strong>Total Annual CTC</strong></td>
                    <td class="amt-col"><strong><span class="curr-symbol">INR</span> <span id="out_table_total" class="placeholder-val">[Total]</span></strong></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Page 1 Bottom Pinned Footer -->
            <div>
              <div class="color-stripe" style="margin-bottom: 6px;"></div>
              <div class="footer-row">
                <span>Taraj Global Solutions • Confidential Appointment Documentation</span>
                <span>Page 1 of 2</span>
              </div>
            </div>
          </div>
        </div>

        <!-- PAGE 2 -->
        <div class="letter-page page-2" id="letter_page_2">
          <!-- Watermark TG Icon centered behind text -->
          <img src="${logos.icon}" class="watermark-img" alt="Taraj Global Watermark" />

          <div class="letter-inner">
            <!-- Top Section of Page 2 -->
            <div>
              <!-- Smaller Header: Logo Left (122px), Ref Right -->
              <div class="p2-header-row">
                <div class="p2-logo-box">
                  <img src="${logos.full}" alt="Taraj Global" />
                </div>
                <div class="p2-ref-box">
                  <strong>Ref No:</strong> TGS/HR/APP/<span id="out_p2_year" class="placeholder-val">[Year]</span>/<span id="out_p2_number" class="placeholder-val">[Number]</span>
                </div>
              </div>

              <!-- Thin 3-color line -->
              <div class="color-stripe" style="margin-bottom: 14px;"></div>

              <!-- Clause 4: Probationary Period -->
              <p class="body-p">
                <strong class="clause-heading">4. Probationary Period:</strong> You will be on probation for a period of <strong id="out_probation" class="placeholder-val">[Probation]</strong> from your date of joining. Upon successful completion of your probation, your employment will be confirmed in writing by the management.
              </p>

              <!-- Clause 5: Working Hours and Leave -->
              <p class="body-p">
                <strong class="clause-heading">5. Working Hours and Leave:</strong> Your working hours will be governed by the standard policies of Taraj Global Solutions, typically operating from <strong id="out_time_from" class="placeholder-val">[Start Time]</strong> to <strong id="out_time_to" class="placeholder-val">[End Time]</strong>, <strong id="out_days_week" class="placeholder-val">[Days]</strong> days a week. You shall be entitled to paid leaves, casual leaves, and public holidays as per the corporate leave policy.
              </p>

              <!-- Clause 6: Confidentiality and Intellectual Property -->
              <p class="body-p">
                <strong class="clause-heading">6. Confidentiality and Intellectual Property:</strong> During your employment and thereafter, you shall maintain strict confidentiality regarding all proprietary information, trade secrets, client data, and business strategies belonging to Taraj Global Solutions. All intellectual property created by you during the course of employment shall remain the exclusive property of the Company.
              </p>

              <!-- Clause 7: Notice Period and Termination -->
              <p class="body-p">
                <strong class="clause-heading">7. Notice Period and Termination:</strong> During probation, your employment may be terminated by either party with a notice period of <strong id="out_notice_probation" class="placeholder-val">[Notice in probation]</strong> or payment in lieu thereof. Following confirmation, the notice period shall be <strong id="out_notice_confirmation" class="placeholder-val">[Notice after confirmation]</strong>. The Company reserves the right to terminate employment immediately for gross misconduct, breach of policy, or fraud.
              </p>

              <!-- Return Instructions -->
              <p class="body-p">
                Please sign and return the duplicate copy of this letter within <strong id="out_return_days" class="placeholder-val">[Days]</strong> days of receipt to indicate your formal acceptance of these terms.
              </p>

              <!-- Closing Remark -->
              <p class="body-p" style="margin-top: 14px; margin-bottom: 14px;">
                We welcome you to Taraj Global Solutions and look forward to a successful journey together.
              </p>

              <!-- Sign-off Block -->
              <div style="margin-top: 14px;">Sincerely,</div>
              <div style="height: 56px;"></div>

              <!-- Two Signature Blocks -->
              <div class="sig-row">
                <div class="sig-col">
                  <div class="sig-top-line"></div>
                  <div class="sig-bold">For Taraj Global Solutions</div>
                  <div id="out_sig_name" class="sig-bold" style="margin-top: 2px;">[Signatory Name]</div>
                  <div class="sig-meta">Head of Human Resources</div>
                </div>
                <div class="sig-col">
                  <div class="sig-top-line"></div>
                  <div class="sig-bold">Accepted and Acknowledged</div>
                  <div id="out_candidate_sig_name" class="sig-bold" style="margin-top: 2px;">[Candidate Full Name]</div>
                  <div style="color: #1F2937; font-size: 13.5px; margin-top: 4px;">Date: _______________</div>
                </div>
              </div>
            </div>

            <!-- Page 2 Bottom Pinned Footer -->
            <div>
              <div class="color-stripe" style="margin-bottom: 6px;"></div>
              <div class="footer-row">
                <span>Taraj Global Solutions • Confidential Appointment Documentation</span>
                <span>Page 2 of 2</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  </div>

  <script>
    (function () {
      // 24 Form Fields List
      const fields = [
        'inp_company_address',
        'inp_date',
        'inp_ref_year',
        'inp_ref_number',
        'inp_name',
        'inp_addr1',
        'inp_addr2',
        'inp_job_title',
        'inp_department',
        'inp_office_location',
        'inp_start_date',
        'inp_currency',
        'inp_basic',
        'inp_hra',
        'inp_special',
        'inp_total',
        'inp_probation',
        'inp_time_from',
        'inp_time_to',
        'inp_days_week',
        'inp_notice_probation',
        'inp_notice_confirmation',
        'inp_return_days',
        'inp_signatory'
      ];

      const STORAGE_KEY = 'taraj_appointment_letter_form_data';
      let isTotalManual = false;

      const MONTH_NAMES = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];

      // Format ISO Date YYYY-MM-DD -> "01 November 2026"
      function formatFormalDate(isoStr) {
        if (!isoStr) return '';
        const parts = isoStr.split('-');
        if (parts.length === 3) {
          const day = parts[2].padStart(2, '0');
          const monthIdx = parseInt(parts[1], 10) - 1;
          const month = MONTH_NAMES[monthIdx] || parts[1];
          const year = parts[0];
          return day + ' ' + month + ' ' + year;
        }
        return isoStr;
      }

      // Format ISO Date for input[type=date]
      function toIsoDate(d) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return year + '-' + month + '-' + day;
      }

      // Format 24-hr time HH:MM -> "9:30 AM"
      function formatTime12(timeStr) {
        if (!timeStr) return '';
        const parts = timeStr.split(':');
        if (parts.length < 2) return timeStr;
        let h = parseInt(parts[0], 10);
        const m = parts[1];
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        if (h === 0) h = 12;
        return h + ':' + m + ' ' + ampm;
      }

      // First name from full name
      function getFirstName(fullName) {
        if (!fullName) return '';
        const trimmed = fullName.trim();
        return trimmed.split(/\\s+/)[0];
      }

      // Format currency number with Indian or International groupings
      function formatAmount(val, currency) {
        if (!val || val.trim() === '') return '';
        const clean = val.replace(/,/g, '').trim();
        const num = parseFloat(clean);
        if (isNaN(num)) return val; // If not a number, show as typed
        if (currency === 'INR') {
          const parts = num.toString().split('.');
          let lastThree = parts[0].substring(parts[0].length - 3);
          const otherNumbers = parts[0].substring(0, parts[0].length - 3);
          if (otherNumbers !== '') {
            lastThree = ',' + lastThree;
          }
          const res = otherNumbers.replace(/\\B(?=(\\d{2})+(?!\\d))/g, ',') + lastThree;
          return parts.length > 1 ? res + '.' + parts[1] : res;
        } else {
          return num.toLocaleString('en-US');
        }
      }

      // Auto-sum calculation
      function recalculateTotal() {
        if (isTotalManual) return;
        const basicStr = document.getElementById('inp_basic').value.replace(/,/g, '').trim();
        const hraStr = document.getElementById('inp_hra').value.replace(/,/g, '').trim();
        const specialStr = document.getElementById('inp_special').value.replace(/,/g, '').trim();

        const b = parseFloat(basicStr) || 0;
        const h = parseFloat(hraStr) || 0;
        const s = parseFloat(specialStr) || 0;

        const sum = b + h + s;
        const currency = document.getElementById('inp_currency').value;
        if (b > 0 || h > 0 || s > 0) {
          document.getElementById('inp_total').value = formatAmount(String(sum), currency);
        } else {
          document.getElementById('inp_total').value = '';
        }
      }

      // Helper to update DOM element text or placeholder
      function updateField(elemId, val, placeholderText) {
        const el = document.getElementById(elemId);
        if (!el) return;
        if (val && val.trim() !== '') {
          el.textContent = val.trim();
          el.classList.remove('placeholder-val');
        } else {
          el.textContent = placeholderText;
          el.classList.add('placeholder-val');
        }
      }

      // Update progress bar "X of 24 filled"
      function updateProgressBar() {
        let filledCount = 0;
        fields.forEach(function (id) {
          const el = document.getElementById(id);
          if (el && el.value && el.value.trim() !== '') {
            filledCount++;
          }
        });

        const progressPercent = Math.round((filledCount / fields.length) * 100);
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');

        if (progressFill) progressFill.style.width = progressPercent + '%';
        if (progressText) progressText.textContent = filledCount + ' of ' + fields.length + ' filled';
      }

      // Save to localStorage
      function saveToStorage() {
        try {
          const data = { isTotalManual };
          fields.forEach(function (id) {
            const el = document.getElementById(id);
            if (el) data[id] = el.value;
          });
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
          console.warn('Could not save to localStorage:', e);
        }
      }

      // Load from localStorage
      function loadFromStorage() {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (!raw) return false;
          const data = JSON.parse(raw);
          if (!data) return false;

          let hasAny = false;
          fields.forEach(function (id) {
            if (data[id] !== undefined) {
              const el = document.getElementById(id);
              if (el) {
                el.value = data[id];
                if (data[id]) hasAny = true;
              }
            }
          });
          if (data.isTotalManual !== undefined) isTotalManual = data.isTotalManual;
          return hasAny;
        } catch (e) {
          console.warn('Could not read from localStorage:', e);
          return false;
        }
      }

      // Query String Prefill helper
      function checkUrlParams() {
        try {
          const params = new URLSearchParams(window.location.search);
          let loadedParam = false;

          const paramMapping = {
            inp_name: ['name', 'candidate_name', 'candidateName'],
            inp_job_title: ['designation', 'position', 'role', 'job_title', 'jobTitle', 'positionTitle'],
            inp_department: ['department', 'department_name', 'departmentName'],
            inp_office_location: ['location', 'work_location', 'workLocation', 'city'],
            inp_start_date: ['start_date', 'startDate', 'joining_date', 'joiningDate'],
            inp_basic: ['basic', 'basic_salary'],
            inp_hra: ['hra'],
            inp_special: ['special', 'allowances'],
            inp_total: ['total', 'ctc', 'salary', 'offered_salary', 'annualCtc'],
            inp_ref_number: ['ref', 'ref_no', 'ref_number', 'refNo'],
            inp_addr1: ['addr1', 'address', 'address1'],
            inp_addr2: ['addr2', 'address2'],
            inp_probation: ['probation'],
            inp_signatory: ['signatory']
          };

          for (const fieldId in paramMapping) {
            const keys = paramMapping[fieldId];
            for (let i = 0; i < keys.length; i++) {
              const key = keys[i];
              if (params.has(key)) {
                const el = document.getElementById(fieldId);
                let val = params.get(key);
                if (el && val) {
                  if (el.type === 'date') {
                    if (val.includes('/')) {
                      const p = val.split('/');
                      if (p.length === 3) val = p[2] + '-' + p[1].padStart(2, '0') + '-' + p[0].padStart(2, '0');
                    }
                  }
                  el.value = val;
                  loadedParam = true;
                  break;
                }
              }
            }
          }
          return loadedParam;
        } catch (e) {
          console.warn('Error reading query params:', e);
          return false;
        }
      }

      // Main Render Function for Live Preview
      function renderLetter() {
        const compAddress = document.getElementById('inp_company_address').value;
        const letterDate = document.getElementById('inp_date').value;
        const refYear = document.getElementById('inp_ref_year').value;
        const refNumber = document.getElementById('inp_ref_number').value;

        const fullName = document.getElementById('inp_name').value;
        const addr1 = document.getElementById('inp_addr1').value;
        const addr2 = document.getElementById('inp_addr2').value;

        const jobTitle = document.getElementById('inp_job_title').value;
        const department = document.getElementById('inp_department').value;
        const officeLoc = document.getElementById('inp_office_location').value;
        const startDate = document.getElementById('inp_start_date').value;

        const currency = document.getElementById('inp_currency').value;
        const basic = document.getElementById('inp_basic').value;
        const hra = document.getElementById('inp_hra').value;
        const special = document.getElementById('inp_special').value;
        const total = document.getElementById('inp_total').value;

        const probation = document.getElementById('inp_probation').value;
        const timeFrom = document.getElementById('inp_time_from').value;
        const timeTo = document.getElementById('inp_time_to').value;
        const daysWeek = document.getElementById('inp_days_week').value;
        const noticeProb = document.getElementById('inp_notice_probation').value;
        const noticeConf = document.getElementById('inp_notice_confirmation').value;
        const returnDays = document.getElementById('inp_return_days').value;

        const signatory = document.getElementById('inp_signatory').value;

        // Formatted Values
        const formattedDate = letterDate ? formatFormalDate(letterDate) : '';
        const formattedStartDate = startDate ? formatFormalDate(startDate) : '';
        const firstName = getFirstName(fullName);
        const formattedTimeFrom = formatTime12(timeFrom);
        const formattedTimeTo = formatTime12(timeTo);

        const formattedBasic = formatAmount(basic, currency);
        const formattedHra = formatAmount(hra, currency);
        const formattedSpecial = formatAmount(special, currency);
        const formattedTotal = formatAmount(total, currency);

        // Update Currency Symbols across preview
        document.querySelectorAll('.curr-symbol').forEach(function (el) {
          el.textContent = currency;
        });
        const outCurrCtc = document.getElementById('out_curr_ctc');
        if (outCurrCtc) outCurrCtc.textContent = currency;

        // Page 1 Updates
        updateField('out_company_address', compAddress, '[Company Address]');
        updateField('out_date', formattedDate, '[Date, e.g., 01 November 2026]');
        updateField('out_ref_year', refYear, '[Year]');
        updateField('out_ref_number', refNumber, '[Number]');

        updateField('out_name_to', fullName, '[Candidate Full Name]');
        updateField('out_addr1', addr1, '[Address Line 1]');
        updateField('out_addr2', addr2, '[Address Line 2]');

        updateField('out_first_name', firstName, '[First Name]');

        updateField('out_job_title', jobTitle, '[Job Title]');
        updateField('out_department', department, '[Department]');
        updateField('out_office_location', officeLoc, '[Office Location / City]');
        updateField('out_start_date', formattedStartDate, '[Start Date, e.g., 01 November 2026]');

        updateField('out_total_ctc', formattedTotal, '[Total]');
        updateField('out_basic', formattedBasic, '[Amount]');
        updateField('out_hra', formattedHra, '[Amount]');
        updateField('out_special', formattedSpecial, '[Amount]');
        updateField('out_table_total', formattedTotal, '[Total]');

        // Page 2 Updates
        updateField('out_p2_year', refYear, '[Year]');
        updateField('out_p2_number', refNumber, '[Number]');

        updateField('out_probation', probation, '[Probation]');
        updateField('out_time_from', formattedTimeFrom, '[Start Time]');
        updateField('out_time_to', formattedTimeTo, '[End Time]');
        updateField('out_days_week', daysWeek, '[Days]');
        updateField('out_notice_probation', noticeProb, '[Notice in probation]');
        updateField('out_notice_confirmation', noticeConf, '[Notice after confirmation]');
        updateField('out_return_days', returnDays, '[Days]');

        updateField('out_sig_name', signatory, '[Signatory Name]');
        updateField('out_candidate_sig_name', fullName, '[Candidate Full Name]');

        // Dynamic Document Title for PDF printing
        const cleanName = fullName ? fullName.trim() : '';
        if (cleanName) {
          document.title = 'Appointment Letter - ' + cleanName + ' - Taraj Global Solutions';
        } else {
          document.title = 'Taraj Appointment Letter Form';
        }

        updateProgressBar();
        saveToStorage();
      }

      // Responsive preview scale so two A4 pages fit right column nicely
      function adjustPreviewScale() {
        const previewPanel = document.querySelector('.preview-panel');
        const wrapper = document.getElementById('preview_scale_wrapper');
        if (!previewPanel || !wrapper) return;

        const availableWidth = previewPanel.clientWidth - 48; // padding
        const letterWidth = 794;

        if (availableWidth < letterWidth && availableWidth > 200) {
          const scale = availableWidth / letterWidth;
          wrapper.style.transform = 'scale(' + scale + ')';
          // Negative margin bottom for the 2 pages (2 * 1123 + 24 gap)
          const totalHeight = 1123 * 2 + 24;
          wrapper.style.marginBottom = '-' + (totalHeight * (1 - scale)) + 'px';
        } else {
          wrapper.style.transform = 'none';
          wrapper.style.marginBottom = '0px';
        }
      }

      // Initialize form defaults and events
      function init() {
        const now = new Date();
        const todayStr = toIsoDate(now);
        const currentYear = String(now.getFullYear());

        const dateInput = document.getElementById('inp_date');
        if (dateInput && !dateInput.value) dateInput.value = todayStr;

        const refYearInput = document.getElementById('inp_ref_year');
        if (refYearInput && !refYearInput.value) refYearInput.value = currentYear;

        const refNumInput = document.getElementById('inp_ref_number');
        if (refNumInput && !refNumInput.value) refNumInput.value = '001';

        const compAddressInput = document.getElementById('inp_company_address');
        if (compAddressInput && !compAddressInput.value) {
          compAddressInput.value = 'Corporate Office, Pune, Maharashtra, India';
        }

        const returnDaysInput = document.getElementById('inp_return_days');
        if (returnDaysInput && !returnDaysInput.value) returnDaysInput.value = '7';

        const probationInput = document.getElementById('inp_probation');
        if (probationInput && !probationInput.value) probationInput.value = '6 months';

        const noticeProbInput = document.getElementById('inp_notice_probation');
        if (noticeProbInput && !noticeProbInput.value) noticeProbInput.value = '2 weeks';

        const noticeConfInput = document.getElementById('inp_notice_confirmation');
        if (noticeConfInput && !noticeConfInput.value) noticeConfInput.value = '2 months';

        const signatoryInput = document.getElementById('inp_signatory');
        if (signatoryInput && !signatoryInput.value) signatoryInput.value = 'Authorized Signatory';

        // Load storage or URL params
        loadFromStorage();
        checkUrlParams();

        if (!dateInput.value) dateInput.value = todayStr;
        if (!refYearInput.value) refYearInput.value = currentYear;

        // Auto sum listeners
        ['inp_basic', 'inp_hra', 'inp_special'].forEach(function (id) {
          const el = document.getElementById(id);
          if (el) {
            el.addEventListener('input', function () {
              recalculateTotal();
              renderLetter();
            });
          }
        });

        // Manual edit of Total CTC listener
        const totalInput = document.getElementById('inp_total');
        if (totalInput) {
          totalInput.addEventListener('input', function () {
            if (this.value.trim() === '') {
              isTotalManual = false;
              recalculateTotal();
            } else {
              isTotalManual = true;
            }
            renderLetter();
          });
        }

        // Currency change listener
        const currSelect = document.getElementById('inp_currency');
        if (currSelect) {
          currSelect.addEventListener('change', function () {
            if (!isTotalManual) recalculateTotal();
            renderLetter();
          });
        }

        // Bind all field changes
        fields.forEach(function (id) {
          const el = document.getElementById(id);
          if (el) {
            el.addEventListener('input', renderLetter);
            el.addEventListener('change', renderLetter);
          }
        });

        // Save to Candidate Profile Button (Server Attachment)
        const btnSaveServer = document.getElementById('btn_save_server');
        const statusBox = document.getElementById('save_status_box');

        function showStatus(type, html) {
          if (!statusBox) return;
          statusBox.style.display = 'block';
          statusBox.className = 'save-status-box ' + (type === 'success' ? 'save-status-success' : 'save-status-error');
          statusBox.innerHTML = html;
        }

        if (btnSaveServer) {
          btnSaveServer.addEventListener('click', async function () {
            const urlParams = new URLSearchParams(window.location.search);
            let candidateId = urlParams.get('candidate_id') || urlParams.get('candidateId') || urlParams.get('id');

            if (!candidateId) {
              candidateId = prompt('Please enter the Candidate ID (e.g. 1) to attach this Appointment Letter to:');
              if (!candidateId) return;
            }

            btnSaveServer.disabled = true;
            const originalText = btnSaveServer.innerHTML;
            btnSaveServer.innerHTML = '<span>⏳ Saving...</span>';
            if (statusBox) statusBox.style.display = 'none';

            const payload = {
              action: 'save_appointment_letter',
              candidateId: Number(candidateId),
              companyAddress: document.getElementById('inp_company_address').value.trim(),
              letterDate: document.getElementById('inp_date').value,
              refYear: document.getElementById('inp_ref_year').value.trim(),
              refNumber: document.getElementById('inp_ref_number').value.trim(),
              candidateName: document.getElementById('inp_name').value.trim(),
              addressLine1: document.getElementById('inp_addr1').value.trim(),
              addressLine2: document.getElementById('inp_addr2').value.trim(),
              jobTitle: document.getElementById('inp_job_title').value.trim(),
              department: document.getElementById('inp_department').value.trim(),
              officeLocation: document.getElementById('inp_office_location').value.trim(),
              startDate: document.getElementById('inp_start_date').value,
              currency: document.getElementById('inp_currency').value,
              basicSalary: document.getElementById('inp_basic').value.trim(),
              hra: document.getElementById('inp_hra').value.trim(),
              specialAllowances: document.getElementById('inp_special').value.trim(),
              totalCtc: document.getElementById('inp_total').value.trim(),
              probationPeriod: document.getElementById('inp_probation').value.trim(),
              workingHoursFrom: document.getElementById('inp_time_from').value,
              workingHoursTo: document.getElementById('inp_time_to').value,
              workingDaysWeek: document.getElementById('inp_days_week').value,
              noticeProbation: document.getElementById('inp_notice_probation').value.trim(),
              noticeConfirmation: document.getElementById('inp_notice_confirmation').value.trim(),
              returnWithinDays: document.getElementById('inp_return_days').value.trim(),
              signatoryName: document.getElementById('inp_signatory').value.trim(),
            };

            try {
              const res = await fetch('/api/onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              });
              const data = await res.json();
              if (res.ok && data.success) {
                showStatus(
                  'success',
                  '<div><strong>✅ Appointment Letter Saved Successfully!</strong></div>' +
                  '<div style="margin-top: 4px; font-size: 11px;">This appointment documentation is now saved to the candidate and visible on the HR Joining page.</div>' +
                  '<div style="margin-top: 8px; display: flex; gap: 8px; flex-wrap: wrap;">' +
                    '<a href="/api/onboarding?action=view_appointment&candidateId=' + candidateId + '" target="_blank" style="padding: 5px 10px; background: #059669; color: white; border-radius: 5px; text-decoration: none; font-weight: bold; font-size: 11px; display: inline-flex; align-items: center; gap: 4px;">👁️ View Saved PDF</a>' +
                    '<a href="/hr/joining" target="_blank" style="padding: 5px 10px; background: #14213D; color: white; border-radius: 5px; text-decoration: none; font-weight: bold; font-size: 11px;">Back to HR Joining</a>' +
                  '</div>'
                );
              } else {
                showStatus('error', '❌ Failed to save: ' + (data.error || data.message || 'Server error'));
              }
            } catch (err) {
              showStatus('error', '❌ Could not reach server. If offline, use "Save as PDF": ' + err.message);
            } finally {
              btnSaveServer.disabled = false;
              btnSaveServer.innerHTML = originalText;
            }
          });
        }

        // Save as PDF Button
        const btnSave = document.getElementById('btn_save_pdf');
        if (btnSave) {
          btnSave.addEventListener('click', function () {
            const nameVal = document.getElementById('inp_name').value.trim();
            document.title = 'Appointment Letter - ' + (nameVal || 'Candidate') + ' - Taraj Global Solutions';
            window.print();
          });
        }

        // Before & After Print Events for PDF filename
        window.addEventListener('beforeprint', function () {
          const nameVal = document.getElementById('inp_name').value.trim();
          document.title = 'Appointment Letter - ' + (nameVal || 'Candidate') + ' - Taraj Global Solutions';
        });

        window.addEventListener('afterprint', function () {
          document.title = 'Taraj Appointment Letter Form';
        });

        // Clear Button
        const btnClear = document.getElementById('btn_clear');
        if (btnClear) {
          btnClear.addEventListener('click', function () {
            if (confirm('Are you sure you want to clear all form fields?')) {
              fields.forEach(function (id) {
                const el = document.getElementById(id);
                if (el) el.value = '';
              });
              document.getElementById('inp_currency').value = 'INR';
              document.getElementById('inp_date').value = todayStr;
              document.getElementById('inp_ref_year').value = currentYear;
              document.getElementById('inp_ref_number').value = '001';
              document.getElementById('inp_days_week').value = '5';
              document.getElementById('inp_time_from').value = '09:30';
              document.getElementById('inp_time_to').value = '18:30';
              document.getElementById('inp_return_days').value = '7';
              document.getElementById('inp_probation').value = '6 months';
              document.getElementById('inp_notice_probation').value = '2 weeks';
              document.getElementById('inp_notice_confirmation').value = '2 months';
              document.getElementById('inp_company_address').value = 'Corporate Office, Pune, Maharashtra, India';
              document.getElementById('inp_signatory').value = 'Authorized Signatory';
              isTotalManual = false;
              try {
                localStorage.removeItem(STORAGE_KEY);
              } catch (e) {}
              renderLetter();
            }
          });
        }

        renderLetter();
        adjustPreviewScale();
        window.addEventListener('resize', adjustPreviewScale);
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
      } else {
        init();
      }
    })();
  </script>
</body>
</html>`;

const publicPath = path.join(__dirname, '..', 'public', 'appointment-letter-form.html');
const rootPath = path.join(__dirname, '..', 'taraj-appointment-letter-form.html');

fs.writeFileSync(publicPath, htmlContent, 'utf8');
console.log('Successfully wrote', publicPath);

fs.writeFileSync(rootPath, htmlContent, 'utf8');
console.log('Successfully wrote', rootPath);
