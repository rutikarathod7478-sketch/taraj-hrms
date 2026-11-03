const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function testGeneratePdf() {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await doc.embedFont(StandardFonts.Helvetica);
  const { width, height } = page.getSize();

  // Colors
  const blue = rgb(0.012, 0.651, 1.0); // #03A6FF
  const orange = rgb(1.0, 0.439, 0.0); // #FF7000
  const green = rgb(0.447, 0.835, 0.412); // #72D569
  const navy = rgb(0.078, 0.129, 0.239); // #14213D
  const textDark = rgb(0.122, 0.161, 0.216); // #1F2937
  const muted = rgb(0.42, 0.447, 0.502); // #6B7280
  const borderCol = rgb(0.851, 0.871, 0.898); // #D9DEE5

  // 1. Watermark TG Icon
  const iconPath = path.join(__dirname, '..', 'public', 'logos', 'tg-icon.png');
  if (fs.existsSync(iconPath)) {
    const iconBytes = fs.readFileSync(iconPath);
    const iconImg = await doc.embedPng(iconBytes);
    const wmWidth = 320;
    const wmHeight = (iconImg.height / iconImg.width) * wmWidth;
    page.drawImage(iconImg, {
      x: (width - wmWidth) / 2,
      y: (height - wmHeight) / 2,
      width: wmWidth,
      height: wmHeight,
      opacity: 0.12,
    });
  }

  // 2. Top Logo Centered
  const logoPath = path.join(__dirname, '..', 'public', 'logos', 'tgs-logo-full.png');
  let topY = height - 42;
  if (fs.existsSync(logoPath)) {
    const logoBytes = fs.readFileSync(logoPath);
    const logoImg = await doc.embedPng(logoBytes);
    const logoW = 165;
    const logoH = (logoImg.height / logoImg.width) * logoW;
    page.drawImage(logoImg, {
      x: (width - logoW) / 2,
      y: topY - logoH,
      width: logoW,
      height: logoH,
    });
    topY = topY - logoH - 12;
  }

  // 3-color stripe helper
  function drawStripe(y) {
    const segW = (width - 80) / 3;
    page.drawRectangle({ x: 40, y, width: segW, height: 2.5, color: orange });
    page.drawRectangle({ x: 40 + segW, y, width: segW, height: 2.5, color: green });
    page.drawRectangle({ x: 40 + segW * 2, y, width: segW, height: 2.5, color: blue });
  }

  drawStripe(topY);
  topY -= 16;

  // Meta row: Date and Ref No
  page.drawText('Date: 28/10/2026', { x: 40, y: topY, size: 9.5, font: boldFont, color: textDark });
  const refText = 'Ref No.: TGS/OL/2026/001';
  const refW = boldFont.widthOfTextAtSize(refText, 9.5);
  page.drawText(refText, { x: width - 40 - refW, y: topY, size: 9.5, font: boldFont, color: textDark });
  topY -= 18;

  // Title: OFFER LETTER
  const titleText = 'OFFER LETTER';
  const titleW = boldFont.widthOfTextAtSize(titleText, 14);
  page.drawText(titleText, { x: (width - titleW) / 2, y: topY, size: 14, font: boldFont, color: navy });
  page.drawRectangle({ x: (width - 36) / 2, y: topY - 5, width: 36, height: 2.5, color: orange });
  topY -= 20;

  // Candidate Box (blue left border)
  page.drawRectangle({ x: 40, y: topY - 28, width: width - 80, height: 28, color: rgb(0.97, 0.98, 0.99) });
  page.drawRectangle({ x: 40, y: topY - 28, width: 3.5, height: 28, color: blue });
  page.drawText('To: Alice Smith', { x: 50, y: topY - 12, size: 9.5, font: boldFont, color: textDark });
  page.drawText('Email: alice123@gmail.com', { x: 50, y: topY - 24, size: 9.5, font: regularFont, color: textDark });
  topY -= 36;

  // Subject Bar (orange left border)
  page.drawRectangle({ x: 40, y: topY - 18, width: width - 80, height: 18, color: rgb(1.0, 0.99, 0.96) });
  page.drawRectangle({ x: 40, y: topY - 18, width: 3.5, height: 18, color: orange });
  page.drawText('Subject: Offer of Employment - Operations Coordinator', { x: 50, y: topY - 13, size: 9.5, font: boldFont, color: navy });
  topY -= 26;

  // Salutation & Intro
  page.drawText('Dear Alice Smith,', { x: 40, y: topY, size: 9.5, font: regularFont, color: textDark });
  topY -= 14;

  const intro = 'We are pleased to offer you the position of Operations Coordinator in the Operations Department at Taraj Global Solutions. We were deeply impressed by your credentials and look forward to your contributions.';
  page.drawText(intro, { x: 40, y: topY, size: 9.5, font: regularFont, color: textDark, maxWidth: width - 80, lineHeight: 13.5 });
  topY -= 34;

  // Section 1: Employment Details
  page.drawCircle({ x: 46, y: topY + 3.5, size: 7, color: blue });
  page.drawText('1', { x: 44, y: topY + 0.5, size: 8, font: boldFont, color: rgb(1, 1, 1) });
  page.drawText('EMPLOYMENT DETAILS', { x: 58, y: topY, size: 9.5, font: boldFont, color: navy });
  page.drawRectangle({ x: 190, y: topY + 3, width: width - 230, height: 0.8, color: borderCol });
  topY -= 12;

  // Table (2 columns x 3 rows)
  const tblX = 40;
  const tblW = width - 80;
  const rowH = 17;
  const c1W = tblW * 0.22;
  const c2W = tblW * 0.28;
  const c3W = tblW * 0.22;
  const c4W = tblW * 0.28;

  const tableData = [
    [['Designation', 'Operations Coordinator'], ['Department', 'Operations']],
    [['Employment Type', 'Full-time'], ['Work Location', 'Corporate Center']],
    [['Joining Date', '30/10/2026'], ['Probation Period', '6 months']],
  ];

  for (let r = 0; r < 3; r++) {
    const rowY = topY - (r + 1) * rowH;
    page.drawRectangle({ x: tblX, y: rowY, width: tblW, height: rowH, borderColor: borderCol, borderWidth: 0.8 });
    // vertical separators
    page.drawLine({ start: { x: tblX + c1W, y: rowY }, end: { x: tblX + c1W, y: rowY + rowH }, color: borderCol, thickness: 0.8 });
    page.drawLine({ start: { x: tblX + c1W + c2W, y: rowY }, end: { x: tblX + c1W + c2W, y: rowY + rowH }, color: borderCol, thickness: 0.8 });
    page.drawLine({ start: { x: tblX + c1W + c2W + c3W, y: rowY }, end: { x: tblX + c1W + c2W + c3W, y: rowY + rowH }, color: borderCol, thickness: 0.8 });

    // left cell
    page.drawText(tableData[r][0][0], { x: tblX + 6, y: rowY + 5, size: 8.5, font: regularFont, color: muted });
    const val1 = tableData[r][0][1];
    const val1W = boldFont.widthOfTextAtSize(val1, 8.5);
    page.drawText(val1, { x: tblX + c1W + c2W - val1W - 6, y: rowY + 5, size: 8.5, font: boldFont, color: textDark });

    // right cell
    page.drawText(tableData[r][1][0], { x: tblX + c1W + c2W + 6, y: rowY + 5, size: 8.5, font: regularFont, color: muted });
    const val2 = tableData[r][1][1];
    const val2W = boldFont.widthOfTextAtSize(val2, 8.5);
    page.drawText(val2, { x: tblX + tblW - val2W - 6, y: rowY + 5, size: 8.5, font: boldFont, color: textDark });
  }

  topY -= (3 * rowH + 16);

  // Section 2: Compensation
  page.drawCircle({ x: 46, y: topY + 3.5, size: 7, color: blue });
  page.drawText('2', { x: 44, y: topY + 0.5, size: 8, font: boldFont, color: rgb(1, 1, 1) });
  page.drawText('COMPENSATION & BENEFITS', { x: 58, y: topY, size: 9.5, font: boldFont, color: navy });
  page.drawRectangle({ x: 220, y: topY + 3, width: width - 260, height: 0.8, color: borderCol });
  topY -= 14;

  page.drawText('Your annual CTC will be INR 6,00,000 per annum, with the detailed salary structure provided separately in Annexure A.', {
    x: 40,
    y: topY,
    size: 9.5,
    font: regularFont,
    color: textDark,
    maxWidth: width - 80,
    lineHeight: 13.5
  });
  topY -= 26;

  // Section 3: Terms
  page.drawCircle({ x: 46, y: topY + 3.5, size: 7, color: blue });
  page.drawText('3', { x: 44, y: topY + 0.5, size: 8, font: boldFont, color: rgb(1, 1, 1) });
  page.drawText('TERMS & ONBOARDING', { x: 58, y: topY, size: 9.5, font: boldFont, color: navy });
  page.drawRectangle({ x: 190, y: topY + 3, width: width - 230, height: 0.8, color: borderCol });
  topY -= 14;

  page.drawText('1.', { x: 40, y: topY, size: 9.5, font: boldFont, color: orange });
  page.drawText('Required Documents: Please submit your updated resume, identity proof, educational certificates, and other applicable joining documents upon acceptance.', {
    x: 54,
    y: topY,
    size: 9.5,
    font: regularFont,
    color: textDark,
    maxWidth: width - 94,
    lineHeight: 13.5
  });
  topY -= 28;

  page.drawText('2.', { x: 40, y: topY, size: 9.5, font: boldFont, color: orange });
  page.drawText('Offer Acceptance: Please confirm your acceptance by 04/11/2026 by signing below or through the designated electronic acceptance process.', {
    x: 54,
    y: topY,
    size: 9.5,
    font: regularFont,
    color: textDark,
    maxWidth: width - 94,
    lineHeight: 13.5
  });
  topY -= 32;

  // Closing
  page.drawText('We look forward to welcoming you to Taraj Global Solutions and wish you success in your new role.', {
    x: 40,
    y: topY,
    size: 9.5,
    font: regularFont,
    color: textDark,
  });
  topY -= 14;
  page.drawText('Sincerely,', { x: 40, y: topY, size: 9.5, font: regularFont, color: textDark });
  topY -= 12;
  page.drawText('Authorized Signatory', { x: 40, y: topY, size: 9.5, font: boldFont, color: navy });
  topY -= 11;
  page.drawText('Human Resources Department, Taraj Global Solutions', { x: 40, y: topY, size: 8.5, font: regularFont, color: muted });
  topY -= 36;

  // Signatures
  const sigW = (width - 120) / 2;
  // Left:
  page.drawLine({ start: { x: 40, y: topY }, end: { x: 40 + sigW, y: topY }, color: navy, thickness: 1 });
  page.drawText('Authorized Signatory', { x: 40, y: topY - 12, size: 9.5, font: boldFont, color: navy });
  page.drawText('Taraj Global Solutions', { x: 40, y: topY - 23, size: 8.5, font: regularFont, color: muted });

  // Right:
  const sigRightX = width - 40 - sigW;
  page.drawLine({ start: { x: sigRightX, y: topY }, end: { x: width - 40, y: topY }, color: navy, thickness: 1 });
  page.drawText('Candidate Acceptance', { x: sigRightX, y: topY - 12, size: 9.5, font: boldFont, color: navy });
  page.drawText('I accept the employment offer stated above.', { x: sigRightX, y: topY - 22, size: 8.5, font: regularFont, color: muted });
  page.drawText('Name: Alice Smith', { x: sigRightX, y: topY - 33, size: 9.0, font: boldFont, color: textDark });
  page.drawText('Date: ______________', { x: sigRightX, y: topY - 44, size: 9.0, font: regularFont, color: textDark });

  // Footer Pinned at bottom
  drawStripe(36);
  page.drawText('Taraj Global Solutions | Confidential Offer Document', { x: 40, y: 24, size: 8, font: regularFont, color: muted });
  page.drawText('Page 1 of 1', { x: width - 40 - regularFont.widthOfTextAtSize('Page 1 of 1', 8), y: 24, size: 8, font: regularFont, color: muted });

  const bytes = await doc.save();
  fs.writeFileSync('public/uploads/offer_letters/test_offer.pdf', bytes);
  console.log('Saved test_offer.pdf:', bytes.length, 'bytes');
}

testGeneratePdf().catch(console.error);
