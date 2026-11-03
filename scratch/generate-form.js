const fs = require('fs');
const path = require('path');

const logos = JSON.parse(fs.readFileSync(path.join(__dirname, 'logos-base64.json')));

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Taraj Offer Letter Form</title>
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
      --color-bg-page: #EEF1F5;
      --font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: var(--font-family);
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

    /* Left Form Panel */
    .form-panel {
      width: 380px;
      flex-shrink: 0;
      background: #ffffff;
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

    /* Progress Bar */
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

    /* Form Section Labels */
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
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* Form Fields */
    .field-group {
      margin-bottom: 11px;
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
      font-family: inherit;
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

    /* Buttons */
    .actions-row {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }

    .btn {
      flex: 1;
      height: 38px;
      border-radius: 6px;
      font-size: 12.5px;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.15s ease;
      border: none;
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
      justify-content: center;
      align-items: flex-start;
      padding: 32px 24px;
      overflow-x: auto;
      overflow-y: auto;
      min-height: 100vh;
    }

    .preview-scale-wrapper {
      transform-origin: top center;
      transition: transform 0.2s ease;
    }

    /* Live A4 Letter: Exactly 794px x 1123px */
    .letter-page {
      width: 794px;
      height: 1123px;
      background: #FFFFFF;
      box-shadow: 0 12px 35px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04);
      border-radius: 2px;
      position: relative;
      box-sizing: border-box;
      padding: 34px 44px 28px 44px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      font-size: 12.3px;
      line-height: 1.45;
      color: var(--color-text);
    }

    /* Watermark TG Icon centered behind whole page */
    .watermark-img {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 455px;
      height: auto;
      opacity: 0.14;
      pointer-events: none;
      z-index: 1;
      user-select: none;
    }

    /* Content layers above watermark */
    .letter-inner {
      position: relative;
      z-index: 2;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    /* Top Logo & Stripe */
    .letter-top-logo {
      text-align: center;
      margin-bottom: 5px;
    }

    .letter-top-logo img {
      width: 205px;
      height: auto;
      display: inline-block;
    }

    .color-stripe {
      height: 3px;
      width: 100%;
      background: linear-gradient(90deg, #FF7000 0%, #FF7000 33.3%, #72D569 33.3%, #72D569 66.6%, #03A6FF 66.6%, #03A6FF 100%);
      border-radius: 1px;
    }

    /* Date and Ref No Row */
    .meta-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;
      margin-bottom: 4px;
      font-size: 11.5px;
      color: var(--color-text);
    }

    .meta-row .val {
      font-weight: 600;
    }

    /* Offer Letter Title */
    .title-container {
      text-align: center;
      margin: 5px 0 9px;
    }

    .offer-letter-title {
      font-size: 16.5px;
      font-weight: 800;
      color: var(--color-navy);
      letter-spacing: 3.5px;
      text-transform: uppercase;
    }

    .title-orange-underline {
      width: 44px;
      height: 3px;
      background-color: var(--color-orange);
      margin: 4px auto 0;
      border-radius: 2px;
    }

    /* Candidate Box: Blue left border */
    .candidate-info-box {
      border-left: 3.5px solid var(--color-blue);
      background-color: #F8FAFC;
      padding: 6px 12px;
      margin-bottom: 7px;
      border-radius: 0 4px 4px 0;
      font-size: 11.8px;
      line-height: 1.45;
    }

    /* Subject Bar: Orange left border */
    .subject-bar {
      border-left: 3.5px solid var(--color-orange);
      background-color: #FFFDF7;
      padding: 5.5px 12px;
      margin-bottom: 9px;
      border-radius: 0 4px 4px 0;
      font-size: 11.8px;
      line-height: 1.4;
    }

    .subject-bar strong {
      color: var(--color-navy);
    }

    /* Letter Body Paragraphs */
    .letter-body-p {
      margin-bottom: 8px;
      text-align: justify;
      font-size: 12.3px;
      line-height: 1.45;
    }

    /* Section Headings */
    .sec-header {
      display: flex;
      align-items: center;
      margin-top: 9px;
      margin-bottom: 5px;
    }

    .sec-badge {
      width: 17px;
      height: 17px;
      border-radius: 50%;
      background-color: var(--color-blue);
      color: #ffffff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 800;
      margin-right: 6px;
      flex-shrink: 0;
    }

    .sec-title {
      font-size: 11.5px;
      font-weight: 800;
      color: var(--color-navy);
      letter-spacing: 0.6px;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .sec-line {
      flex: 1;
      height: 1px;
      background-color: var(--color-border);
      margin-left: 10px;
    }

    /* Section 1 Table: 2 columns x 3 rows */
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 7px;
      background: #FFFFFF;
    }

    .details-table td {
      border: 1px solid var(--color-border);
      padding: 4px 9px;
      font-size: 11.6px;
      vertical-align: middle;
    }

    .details-table .lbl {
      color: var(--color-muted);
      font-weight: 500;
      width: 22%;
      background-color: #FBFDFE;
    }

    .details-table .val {
      color: var(--color-text);
      font-weight: 700;
      width: 28%;
      text-align: right;
    }

    /* Section 3 Terms List */
    .terms-ol {
      list-style: none;
      padding: 0;
      margin: 4px 0 7px;
    }

    .terms-ol li {
      margin-bottom: 5px;
      padding-left: 18px;
      position: relative;
      font-size: 11.6px;
      line-height: 1.4;
    }

    .terms-ol li .num {
      position: absolute;
      left: 0;
      top: 0;
      color: var(--color-orange);
      font-weight: 800;
    }

    /* Closing Block */
    .closing-block {
      margin-top: 5px;
      margin-bottom: 7px;
      font-size: 11.6px;
      line-height: 1.35;
    }

    .closing-signatory {
      font-weight: 700;
      color: var(--color-navy);
      margin-top: 2px;
    }

    .closing-dept {
      color: var(--color-muted);
      font-size: 10.5px;
    }

    /* Signature Rows */
    .signatures-row {
      display: flex;
      justify-content: space-between;
      gap: 36px;
      margin-top: auto;
      padding-top: 6px;
      margin-bottom: 7px;
    }

    .sig-block {
      flex: 1;
    }

    .sig-line {
      border-top: 1.2px solid var(--color-navy);
      margin-bottom: 5px;
    }

    .sig-title {
      font-weight: 700;
      color: var(--color-navy);
      font-size: 11.5px;
    }

    .sig-company {
      color: var(--color-muted);
      font-size: 10.5px;
    }

    .sig-acceptance-text {
      font-size: 10.5px;
      font-style: italic;
      color: #4B5563;
      margin-bottom: 3px;
    }

    .sig-meta-line {
      font-size: 11px;
      color: var(--color-text);
      margin-top: 2px;
    }

    /* Bottom Pinned Footer */
    .letter-footer-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 9.5px;
      color: var(--color-muted);
      margin-top: 4px;
    }

    /* Placeholders highlighting on SCREEN only */
    .placeholder-val {
      background-color: #FEF3C7;
      color: #92400E;
      padding: 0 4px;
      border-radius: 3px;
      font-weight: 500;
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

    /* PRINT STYLES - Exact A4 One Page */
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
        height: 297mm !important;
        overflow: hidden !important;
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
        height: 297mm !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      .preview-panel {
        padding: 0 !important;
        margin: 0 !important;
        background: transparent !important;
        width: 210mm !important;
        height: 297mm !important;
        display: block !important;
      }

      .preview-scale-wrapper {
        transform: none !important;
        width: 210mm !important;
        height: 297mm !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      .letter-page {
        width: 210mm !important;
        height: 296mm !important;
        max-height: 297mm !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        margin: 0 !important;
        padding: 10mm 14mm 8mm 14mm !important;
        page-break-after: avoid !important;
        page-break-inside: avoid !important;
        overflow: hidden !important;
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
    <!-- Left Form Panel -->
    <aside class="form-panel">
      <div class="form-header">
        <h1 class="form-title">Offer Letter Form</h1>
        <p class="form-subtitle">Fill in the details. The letter on the right updates as you type.</p>
      </div>

      <!-- Progress Section -->
      <div class="progress-section">
        <div class="progress-info">
          <span>Completion</span>
          <span id="progress-text">0 of 12 filled</span>
        </div>
        <div class="progress-track">
          <div id="progress-fill" class="progress-fill"></div>
        </div>
      </div>

      <!-- Form Inputs -->
      <form id="offer_form" onsubmit="return false;">
        <!-- 1. LETTER -->
        <div class="section-label">1. LETTER</div>
        <div class="field-group">
          <label class="field-label" for="inp_date">Date</label>
          <input type="date" id="inp_date" class="input-control" />
        </div>
        <div class="field-group">
          <label class="field-label" for="inp_ref">Ref No.</label>
          <input type="text" id="inp_ref" class="input-control" placeholder="TGS/OL/2026/001" />
        </div>

        <!-- 2. CANDIDATE -->
        <div class="section-label">2. CANDIDATE</div>
        <div class="field-group">
          <label class="field-label" for="inp_name">Candidate Name</label>
          <input type="text" id="inp_name" class="input-control" placeholder="Candidate Full Name" />
        </div>
        <div class="field-group">
          <label class="field-label" for="inp_email">Candidate Email</label>
          <input type="email" id="inp_email" class="input-control" placeholder="candidate@example.com" />
        </div>

        <!-- 3. POSITION -->
        <div class="section-label">3. POSITION</div>
        <div class="field-group">
          <label class="field-label" for="inp_designation">Designation</label>
          <input type="text" id="inp_designation" class="input-control" placeholder="e.g. Senior Software Specialist" />
        </div>
        <div class="field-group">
          <label class="field-label" for="inp_department">Department</label>
          <input type="text" id="inp_department" class="input-control" placeholder="e.g. Information Technology" />
        </div>
        <div class="field-group">
          <label class="field-label" for="inp_employment_type">Employment Type</label>
          <select id="inp_employment_type" class="input-control">
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
          </select>
        </div>
        <div class="field-group">
          <label class="field-label" for="inp_location">Work Location</label>
          <input type="text" id="inp_location" class="input-control" placeholder="e.g. Pune, Maharashtra, India" />
        </div>
        <div class="field-group">
          <label class="field-label" for="inp_joining_date">Joining Date</label>
          <input type="date" id="inp_joining_date" class="input-control" />
        </div>
        <div class="field-group">
          <label class="field-label" for="inp_probation">Probation Period</label>
          <input type="text" id="inp_probation" class="input-control" placeholder="e.g. 6 months" />
        </div>

        <!-- 4. COMPENSATION -->
        <div class="section-label">4. COMPENSATION</div>
        <div class="field-group">
          <label class="field-label" for="inp_ctc">Annual CTC</label>
          <input type="text" id="inp_ctc" class="input-control" placeholder="e.g. INR 6,00,000 per annum" />
        </div>

        <!-- 5. ACCEPTANCE -->
        <div class="section-label">5. ACCEPTANCE</div>
        <div class="field-group">
          <label class="field-label" for="inp_accept_by">Accept By</label>
          <input type="date" id="inp_accept_by" class="input-control" />
        </div>

        <!-- Action Buttons -->
        <div class="actions-row">
          <button type="button" id="btn_save_server" class="btn btn-save-candidate" title="Save this PDF to candidate and make it visible on HR Joining page">
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

    <!-- Right Live A4 Letter Preview -->
    <main class="preview-panel">
      <div class="preview-scale-wrapper" id="preview_scale_wrapper">
        <div class="letter-page" id="letter_page">
          <!-- Watermark: TG icon centered behind the whole page -->
          <img src="${logos.icon}" class="watermark-img" alt="Taraj Global Watermark" />

          <!-- Letter Inner Content -->
          <div class="letter-inner">
            <!-- Top Section -->
            <div>
              <!-- Full Logo Centered -->
              <div class="letter-top-logo">
                <img src="${logos.full}" alt="Taraj Global - Business Simplified" />
              </div>

              <!-- Thin 3-color line -->
              <div class="color-stripe"></div>

              <!-- Date & Ref No. -->
              <div class="meta-row">
                <div>Date: <span id="out_date" class="val placeholder-val">[Date]</span></div>
                <div>Ref No.: <span id="out_ref" class="val placeholder-val">[Ref No.]</span></div>
              </div>

              <!-- Centered Title -->
              <div class="title-container">
                <div class="offer-letter-title">OFFER LETTER</div>
                <div class="title-orange-underline"></div>
              </div>

              <!-- Candidate Box: Blue left border -->
              <div class="candidate-info-box">
                <div><strong>To:</strong> <span id="out_name_to" class="placeholder-val">[Candidate Name]</span></div>
                <div style="margin-top: 2px;"><strong>Email:</strong> <span id="out_email" class="placeholder-val">[Candidate Email]</span></div>
              </div>

              <!-- Subject Bar: Orange left border -->
              <div class="subject-bar">
                <strong>Subject:</strong> Offer of Employment - <span id="out_subject_designation" class="placeholder-val">[Designation]</span>
              </div>

              <!-- Salutation and Intro -->
              <p class="letter-body-p">
                Dear <span id="out_name_dear" class="placeholder-val">[Candidate Name]</span>,
              </p>
              <p class="letter-body-p">
                We are pleased to offer you the position of <strong id="out_body_designation" class="placeholder-val">[Designation]</strong> in the <strong id="out_body_department" class="placeholder-val">[Department]</strong> Department at Taraj Global Solutions. We were deeply impressed by your credentials and look forward to your contributions.
              </p>

              <!-- Section 1: Employment Details -->
              <div class="sec-header">
                <span class="sec-badge">1</span>
                <span class="sec-title">EMPLOYMENT DETAILS</span>
                <span class="sec-line"></span>
              </div>
              <table class="details-table">
                <tr>
                  <td class="lbl">Designation</td>
                  <td class="val" id="out_tbl_designation"><span class="placeholder-val">[Designation]</span></td>
                  <td class="lbl">Department</td>
                  <td class="val" id="out_tbl_department"><span class="placeholder-val">[Department]</span></td>
                </tr>
                <tr>
                  <td class="lbl">Employment Type</td>
                  <td class="val" id="out_tbl_type"><span class="placeholder-val">[Employment Type]</span></td>
                  <td class="lbl">Work Location</td>
                  <td class="val" id="out_tbl_location"><span class="placeholder-val">[Work Location]</span></td>
                </tr>
                <tr>
                  <td class="lbl">Joining Date</td>
                  <td class="val" id="out_tbl_joining"><span class="placeholder-val">[Joining Date]</span></td>
                  <td class="lbl">Probation Period</td>
                  <td class="val" id="out_tbl_probation"><span class="placeholder-val">[Probation Period]</span></td>
                </tr>
              </table>

              <!-- Section 2: Compensation & Benefits -->
              <div class="sec-header">
                <span class="sec-badge">2</span>
                <span class="sec-title">COMPENSATION &amp; BENEFITS</span>
                <span class="sec-line"></span>
              </div>
              <p class="letter-body-p" style="margin-top: 4px; margin-bottom: 7px;">
                Your annual CTC will be <strong id="out_ctc" class="placeholder-val">[Annual CTC]</strong>, with the detailed salary structure provided separately in Annexure A.
              </p>

              <!-- Section 3: Terms & Onboarding -->
              <div class="sec-header">
                <span class="sec-badge">3</span>
                <span class="sec-title">TERMS &amp; ONBOARDING</span>
                <span class="sec-line"></span>
              </div>
              <ol class="terms-ol">
                <li>
                  <span class="num">1.</span>
                  <strong>Required Documents:</strong> Please submit your updated resume, identity proof, educational certificates, and other applicable joining documents upon acceptance.
                </li>
                <li>
                  <span class="num">2.</span>
                  <strong>Offer Acceptance:</strong> Please confirm your acceptance by <strong id="out_accept_by" class="placeholder-val">[Accept by date]</strong> by signing below or through the designated electronic acceptance process.
                </li>
              </ol>

              <!-- Closing -->
              <div class="closing-block">
                <p>We look forward to welcoming you to Taraj Global Solutions and wish you success in your new role.</p>
                <div style="margin-top: 5px;">Sincerely,</div>
                <div class="closing-signatory">Authorized Signatory</div>
                <div class="closing-dept">Human Resources Department, Taraj Global Solutions</div>
              </div>
            </div>

            <!-- Bottom Pinned Section: Signatures & Footer -->
            <div>
              <!-- Two Signature Blocks -->
              <div class="signatures-row">
                <div class="sig-block">
                  <div class="sig-line"></div>
                  <div class="sig-title">Authorized Signatory</div>
                  <div class="sig-company">Taraj Global Solutions</div>
                </div>
                <div class="sig-block">
                  <div class="sig-line"></div>
                  <div class="sig-title">Candidate Acceptance</div>
                  <div class="sig-acceptance-text">I accept the employment offer stated above.</div>
                  <div class="sig-meta-line">Name: <strong id="out_sig_name" class="placeholder-val">[Candidate Name]</strong></div>
                  <div class="sig-meta-line">Date: ______________</div>
                </div>
              </div>

              <!-- Pinned Footer -->
              <div class="color-stripe" style="margin-bottom: 4px;"></div>
              <div class="letter-footer-row">
                <span>Taraj Global Solutions | Confidential Offer Document</span>
                <span>Page 1 of 1</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>

  <script>
    (function () {
      // Elements dictionary
      const fields = [
        'inp_date',
        'inp_ref',
        'inp_name',
        'inp_email',
        'inp_designation',
        'inp_department',
        'inp_employment_type',
        'inp_location',
        'inp_joining_date',
        'inp_probation',
        'inp_ctc',
        'inp_accept_by'
      ];

      const STORAGE_KEY = 'taraj_offer_letter_form_data';

      // Date formatting helper: YYYY-MM-DD -> DD/MM/YYYY
      function formatDate(isoStr) {
        if (!isoStr) return '';
        const parts = isoStr.split('-');
        if (parts.length === 3) {
          return parts[2] + '/' + parts[1] + '/' + parts[0];
        }
        return isoStr;
      }

      // Format date to ISO YYYY-MM-DD for input[type=date]
      function toIsoDate(d) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return year + '-' + month + '-' + day;
      }

      // Helper to set element text or placeholder
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

      // Calculate filled count and update progress bar
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

      // Save form data to localStorage
      function saveToStorage() {
        try {
          const data = {};
          fields.forEach(function (id) {
            const el = document.getElementById(id);
            if (el) data[id] = el.value;
          });
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
          console.warn('Could not save to localStorage:', e);
        }
      }

      // Load form data from localStorage
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
            inp_email: ['email', 'candidate_email', 'candidateEmail'],
            inp_designation: ['designation', 'position', 'role', 'positionTitle'],
            inp_department: ['department', 'department_name', 'departmentName'],
            inp_employment_type: ['type', 'employment_type'],
            inp_location: ['location', 'work_location', 'workLocation'],
            inp_joining_date: ['joining_date', 'joiningDate', 'joining'],
            inp_probation: ['probation'],
            inp_ctc: ['ctc', 'salary', 'offered_salary', 'expected_ctc'],
            inp_ref: ['ref', 'ref_no', 'refNo'],
            inp_date: ['date', 'offer_date'],
            inp_accept_by: ['accept_by', 'acceptBy']
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

      // Update the live preview letter
      function renderLetter() {
        const dateVal = document.getElementById('inp_date').value;
        const refVal = document.getElementById('inp_ref').value;
        const nameVal = document.getElementById('inp_name').value;
        const emailVal = document.getElementById('inp_email').value;
        const desigVal = document.getElementById('inp_designation').value;
        const deptVal = document.getElementById('inp_department').value;
        const empTypeVal = document.getElementById('inp_employment_type').value;
        const locVal = document.getElementById('inp_location').value;
        const joiningVal = document.getElementById('inp_joining_date').value;
        const probationVal = document.getElementById('inp_probation').value;
        const ctcVal = document.getElementById('inp_ctc').value;
        const acceptByVal = document.getElementById('inp_accept_by').value;

        // Formatted dates
        const dateFormatted = dateVal ? formatDate(dateVal) : '';
        const joiningFormatted = joiningVal ? formatDate(joiningVal) : '';
        const acceptByFormatted = acceptByVal ? formatDate(acceptByVal) : '';

        // 1. Header Date & Ref
        updateField('out_date', dateFormatted, '[Date]');
        updateField('out_ref', refVal, '[Ref No.]');

        // 2. Candidate Info Box
        updateField('out_name_to', nameVal, '[Candidate Name]');
        updateField('out_email', emailVal, '[Candidate Email]');

        // 3. Subject Bar
        updateField('out_subject_designation', desigVal, '[Designation]');

        // 4. Salutation & Opening Paragraph
        updateField('out_name_dear', nameVal, '[Candidate Name]');
        updateField('out_body_designation', desigVal, '[Designation]');
        updateField('out_body_department', deptVal, '[Department]');

        // 5. Section 1: Employment Details Table
        updateField('out_tbl_designation', desigVal, '[Designation]');
        updateField('out_tbl_department', deptVal, '[Department]');
        updateField('out_tbl_type', empTypeVal, '[Employment Type]');
        updateField('out_tbl_location', locVal, '[Work Location]');
        updateField('out_tbl_joining', joiningFormatted, '[Joining Date]');
        updateField('out_tbl_probation', probationVal, '[Probation Period]');

        // 6. Section 2: Compensation CTC
        updateField('out_ctc', ctcVal, '[Annual CTC]');

        // 7. Section 3: Terms & Acceptance
        updateField('out_accept_by', acceptByFormatted, '[Accept by date]');

        // 8. Signatures
        updateField('out_sig_name', nameVal, '[Candidate Name]');

        // Dynamic Document Title for PDF printing
        const cleanName = nameVal ? nameVal.trim() : '';
        if (cleanName) {
          document.title = 'Offer Letter - ' + cleanName + ' - Taraj Global Solutions';
        } else {
          document.title = 'Taraj Offer Letter Form';
        }

        updateProgressBar();
        saveToStorage();
      }

      // Responsive preview scale so A4 preview fits right column without horizontal overflow
      function adjustPreviewScale() {
        const previewPanel = document.querySelector('.preview-panel');
        const wrapper = document.getElementById('preview_scale_wrapper');
        if (!previewPanel || !wrapper) return;

        const availableWidth = previewPanel.clientWidth - 48; // padding
        const letterWidth = 794;

        if (availableWidth < letterWidth && availableWidth > 200) {
          const scale = availableWidth / letterWidth;
          wrapper.style.transform = 'scale(' + scale + ')';
          wrapper.style.marginBottom = '-' + (1123 * (1 - scale)) + 'px';
        } else {
          wrapper.style.transform = 'none';
          wrapper.style.marginBottom = '0px';
        }
      }

      // Initialize defaults
      function init() {
        const todayStr = toIsoDate(new Date());

        // Default Date to today
        const dateInput = document.getElementById('inp_date');
        if (dateInput && !dateInput.value) {
          dateInput.value = todayStr;
        }

        // Default accept by to +7 days
        const acceptByInput = document.getElementById('inp_accept_by');
        if (acceptByInput && !acceptByInput.value) {
          const in7Days = new Date();
          in7Days.setDate(in7Days.getDate() + 7);
          acceptByInput.value = toIsoDate(in7Days);
        }

        // Try restoring from storage or URL params
        const hadStorage = loadFromStorage();
        const hadUrlParams = checkUrlParams();

        // If neither provided date, re-ensure today
        if (!dateInput.value) dateInput.value = todayStr;

        // Bind input events
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
              candidateId = prompt('Please enter the Candidate ID (e.g. 1) to attach this Offer Letter to:');
              if (!candidateId) return;
            }

            btnSaveServer.disabled = true;
            const originalText = btnSaveServer.innerHTML;
            btnSaveServer.innerHTML = '<span>⏳ Saving...</span>';
            if (statusBox) statusBox.style.display = 'none';

            const payload = {
              action: 'save_offer_letter',
              candidateId: Number(candidateId),
              refNo: document.getElementById('inp_ref').value.trim(),
              offerDate: document.getElementById('inp_date').value,
              candidateName: document.getElementById('inp_name').value.trim(),
              candidateEmail: document.getElementById('inp_email').value.trim(),
              designation: document.getElementById('inp_designation').value.trim(),
              department: document.getElementById('inp_department').value.trim(),
              employmentType: document.getElementById('inp_employment_type').value,
              workLocation: document.getElementById('inp_location').value.trim(),
              joiningDate: document.getElementById('inp_joining_date').value,
              probationPeriod: document.getElementById('inp_probation').value.trim(),
              annualCtc: document.getElementById('inp_ctc').value.trim(),
              acceptByDate: document.getElementById('inp_accept_by').value,
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
                  '<div><strong>✅ Offer Letter Saved Successfully!</strong></div>' +
                  '<div style=\"margin-top: 4px; font-size: 11px;\">This PDF is now saved to the candidate and visible on the HR Joining page.</div>' +
                  '<div style=\"margin-top: 8px; display: flex; gap: 8px; flex-wrap: wrap;\">' +
                    '<a href=\"/api/onboarding?action=view_offer&candidateId=' + candidateId + '\" target=\"_blank\" style=\"padding: 5px 10px; background: #059669; color: white; border-radius: 5px; text-decoration: none; font-weight: bold; font-size: 11px; display: inline-flex; align-items: center; gap: 4px;\">👁️ View Saved PDF</a>' +
                    '<a href=\"/hr/joining\" target=\"_blank\" style=\"padding: 5px 10px; background: #14213D; color: white; border-radius: 5px; text-decoration: none; font-weight: bold; font-size: 11px;\">Back to HR Joining</a>' +
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
            document.title = 'Offer Letter - ' + (nameVal || 'Candidate') + ' - Taraj Global Solutions';
            window.print();
          });
        }

        // Clear Button
        const btnClear = document.getElementById('btn_clear');
        if (btnClear) {
          btnClear.addEventListener('click', function () {
            if (confirm('Are you sure you want to clear all form fields?')) {
              fields.forEach(function (id) {
                const el = document.getElementById(id);
                if (el) el.value = '';
              });
              // Reset date to today
              dateInput.value = todayStr;
              try {
                localStorage.removeItem(STORAGE_KEY);
              } catch (e) {}
              renderLetter();
            }
          });
        }

        // Initial render & scale
        renderLetter();
        adjustPreviewScale();
        window.addEventListener('resize', adjustPreviewScale);
      }

      // Run on DOM loaded
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
      } else {
        init();
      }
    })();
  </script>
</body>
</html>`;

const publicPath = path.join(__dirname, '..', 'public', 'offer-letter-form.html');
const rootPath = path.join(__dirname, '..', 'taraj-offer-letter-form.html');

fs.writeFileSync(publicPath, htmlContent, 'utf8');
console.log('Successfully wrote', publicPath);

fs.writeFileSync(rootPath, htmlContent, 'utf8');
console.log('Successfully wrote', rootPath);
