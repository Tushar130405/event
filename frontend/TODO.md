# TODO: Convert College Events Website to Worldwide Events

## Completed Tasks
- [x] Analyze codebase and identify college-specific branding
- [x] Brainstorm plan for rebranding to global events
- [x] Get user approval for the plan

## Pending Tasks
- [x] Update package.json name and description
- [x] Update index.html branding and content
- [x] Update about.html branding and content
- [x] Update student-signup.html branding and content
- [x] Update user-dashboard.html branding and content
- [ ] Update register.html branding and content
- [x] Update User model to make collegeName and department optional
- [ ] Update routes/auth.js for any college-specific logic
- [x] Search and update any remaining college references
- [ ] Test the website after changes

## E-Pass & Payment Integration Tasks
- [x] Add EPass model and DB fields (eventId, participantId, token, qrCode, status, createdAt)
- [x] Install npm packages: `qrcode`, `pdfkit`, `nodemailer` (if not already installed)
- [x] Generate QR code on registration success
- [x] Create e-pass PDF/HTML template with QR code
- [x] Send e-pass via email (nodemailer) on successful registration
- [x] Add API endpoint `POST /api/epasses` to generate/resend e-pass
- [x] Add API endpoint `GET /api/epasses/:id` to fetch e-pass details
- [x] Add API endpoint `POST /api/epasses/:id/verify` for QR validation at check-in
- [x] Store e-pass records in database with status tracking (generated, sent, used)
- [x] Frontend: Add "My Tickets" section in user-dashboard.html
- [x] Frontend: Create e-pass modal/view component to display/download e-pass
- [ ] Admin UI: Add resend e-pass button in event participants list
- [ ] Admin UI: Add QR code scanner/verification feature for check-in
- [x] Add payment fields to Event model (price, requiresPayment, earlyBirdPrice)
- [ ] Integrate Stripe payment provider for paid events
- [ ] Create payment flow in registration modal (redirect to Stripe Checkout)
- [ ] Hook e-pass generation to payment success webhook
- [ ] Display payment status in dashboard (pending, paid, refunded)
- [ ] Hold e-pass sending until payment/approval completed
- [ ] Update registration endpoint to handle payment requirement checks
- [x] Documentation: Add e-pass and payment setup guide
- [ ] Testing: Test e-pass generation, email sending, QR verification
- [ ] Testing: Test payment flow (Stripe sandbox)
      