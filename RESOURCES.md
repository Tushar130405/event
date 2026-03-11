# Chapter 7: Resources

This chapter provides a comprehensive collection of resources needed for understanding, setting up, and maintaining the College Event Management System (EventSphere).

---

## 7.1 System Requirements

### Hardware Requirements
| Component | Minimum | Recommended |
|-----------|---------|-------------|
| Processor | Intel Core i3 | Intel Core i5+ |
| RAM | 4 GB | 8 GB+ |
| Storage | 10 GB free | 20 GB+ SSD |
| Display | 1024x768 | 1920x1080 |

### Software Requirements
| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | v14.0.0+ (v18+) | Runtime environment |
| MongoDB | 4.4+ | Database |
| npm | 6.0.0+ | Package manager |
| Git | 2.30+ | Version control |

### Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

---

## 7.2 Project Directory Structure

```
Event Website/
├── server.js                 # Main Express server entry point
├── package.json              # npm dependencies and scripts
├── package-lock.json          # Locked dependency versions
├── .env                      # Environment variables (not committed)
├── .env.example              # Template for environment variables
├── .gitignore                # Git ignore rules
│
├── middleware/               # Express middleware
│   └── auth.js               # JWT authentication middleware
│
├── models/                   # Mongoose database models
│   ├── User.js               # User schema
│   ├── Event.js              # Event schema
│   ├── Participant.js        # Participant schema
│   ├── EPass.js              # E-Pass schema
│   └── Feedback.js           # Feedback schema
│
├── routes/                   # API route handlers
│   ├── auth.js               # Authentication routes
│   ├── events.js             # Event management routes
│   ├── epasses.js            # E-Pass routes
│   └── feedback.js           # Feedback routes
│
├── utils/                    # Utility functions
│   ├── emailService.js       # Email sending functionality
│   └── epassGenerator.js     # E-Pass generation
│
├── frontend/                 # Frontend files
│   ├── index.html            # Homepage
│   ├── login.html            # Login page
│   ├── user-signup.html      # User registration
│   ├── admin-signup.html     # Admin registration
│   ├── admin-login.html      # Admin login
│   ├── user-dashboard.html   # User dashboard
│   ├── event-management.html # Admin event management
│   ├── contacts.html         # Contact page
│   ├── about.html            # About page
│   ├── register.html         # Registration page
│   ├── request-epass.html    # Request E-Pass page
│   │
│   ├── css/                  # Stylesheets
│   │   ├── style.css         # Main styles
│   │   ├── login.css        # Login styles
│   │   ├── user-dashboard.css
│   │   ├── event-management.css
│   │   ├── scanner.css       # Scanner styles
│   │   ├── toast.css         # Notification styles
│   │   └── ...
│   │
│   ├── js/                   # JavaScript files
│   │   ├── auth.js          # Authentication logic
│   │   ├── login.js         # Login functionality
│   │   ├── events.js        # Event display
│   │   ├── user-dashboard.js # Dashboard logic
│   │   ├── event-management.js
│   │   ├── epass-dashboard.js
│   │   ├── epass-scanner.js # Scanner functionality
│   │   ├── toast.js         # Toast notifications
│   │   └── ...
│   │
│   └── Images/              # Image assets
│       ├── background.jpg
│       └── ...
│
└── Documentation/            # Project documentation
    ├── TIMELINE.md          # This file
    ├── TOOLS_AND_TECHNOLOGIES.md
    ├── EPASS_IMPLEMENTATION.md
    └── ...
```

---

## 7.3 API Endpoints Reference

### Authentication Routes (/api/auth)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/send-otp | Send OTP to email | No |
| POST | /api/auth/verify-otp | Verify OTP code | No |
| POST | /api/auth/register | Complete registration | No |
| POST | /api/auth/login | User login | No |
| GET | /api/auth/profile | Get user profile | Yes |
| PUT | /api/auth/profile | Update profile | Yes |
| POST | /api/auth/favorites/:eventId | Add to favorites | Yes |
| DELETE | /api/auth/favorites/:eventId | Remove favorite | Yes |

### Event Routes (/api/events)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/events | Get all events | No |
| GET | /api/events/my-events | Get organizer's events | Yes |
| GET | /api/events/registered | Get registered events | Yes |
| GET | /api/events/:id | Get event details | No |
| POST | /api/events | Create event | Yes |
| PUT | /api/events/:id | Update event | Yes |
| DELETE | /api/events/:id | Delete event | Yes |
| POST | /api/events/:id/register | Register for event | Yes |
| POST | /api/events/:id/feedback | Submit feedback | Yes |
| GET | /api/events/:id/export-participants | Export to Excel | Yes |

### E-Pass Routes (/api/epasses)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/epasses | Generate new E-Pass | Yes |
| GET | /api/epasses | Get E-Passes by event | Yes |
| GET | /api/epasses/user/my-tickets | Get user's tickets | Yes |
| GET | /api/epasses/:id | Get E-Pass details | Yes |
| POST | /api/epasses/:id/verify | Verify E-Pass | Yes |
| POST | /api/epasses/:id/resend | Resend E-Pass email | Yes |
| GET | /api/epasses/event/:eventId | Get event E-Passes | Yes |

---

## 7.4 Environment Configuration

### Required Environment Variables

Create a .env file in the project root:

```env
# ============================
# Server Configuration
# ============================
PORT=3000
NODE_ENV=development

# ============================
# Database Configuration
# ============================
MONGODB_URI=mongodb://localhost:27017/eventsphere

# ============================
# Authentication
# ============================
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=7d

# ============================
# Email Configuration (SMTP)
# ============================
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# ============================
# Application URL
# ============================
APP_URL=http://localhost:3000
```

### Getting Gmail App Password
1. Go to Google Account -> Security
2. Enable 2-Factor Authentication
3. Go to App Passwords
4. Generate new app password for "Mail"
5. Use this password in EMAIL_PASSWORD

---

## 7.5 Installation & Setup Commands

### Initial Setup
```bash
# Clone the repository
git clone <repository-url>
cd Event-Website

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Configure .env file with your values

# Start development server
npm run dev
```

### Production Setup
```bash
# Build for production
npm run build

# Start production server
npm start
```

### Useful npm Scripts
| Command | Description |
|---------|-------------|
| npm install | Install all dependencies |
| npm run dev | Start development server with Nodemon |
| npm start | Start production server |
| npm test | Run tests |

---

## 7.6 Database Collections

### Users Collection
```json
{
  "_id": "ObjectId",
  "username": "string",
  "email": "string (unique)",
  "password": "string (hashed)",
  "role": "admin|student|teacher|staff|volunteer",
  "collegeName": "string",
  "department": "string",
  "mobileNo": "string",
  "organizationType": "string",
  "emailVerified": "boolean",
  "favorites": ["ObjectId"],
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Events Collection
```json
{
  "_id": "ObjectId",
  "title": "string",
  "date": "Date",
  "location": "string",
  "description": "string",
  "category": "string",
  "maxAttendees": "number",
  "participants": ["ObjectId"],
  "createdBy": "ObjectId (ref: User)",
  "tenantId": "string",
  "enableEPass": "boolean",
  "requiresPayment": "boolean",
  "price": "number",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### EPasses Collection
```json
{
  "_id": "ObjectId",
  "eventId": "ObjectId (ref: Event)",
  "participantId": "ObjectId (ref: Participant)",
  "userId": "ObjectId (ref: User)",
  "token": "string (unique)",
  "qrCode": "string (data URI)",
  "status": "generated|sent|verified|used|cancelled",
  "sentAt": "Date",
  "verifiedAt": "Date",
  "tenantId": "string",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

---

## 7.7 Troubleshooting Guide

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| MongoDB connection failed | Wrong URI | Check MONGODB_URI in .env |
| Email not sending | Wrong credentials | Verify Gmail app password |
| JWT errors | Expired/missing token | Login again to get new token |
| E-Pass not generating | QRCode library issue | Run npm install qrcode |
| CORS errors | Wrong origin | Check CORS configuration in server.js |

### Getting Help
1. Check server logs in console
2. Verify all environment variables
3. Ensure MongoDB is running
4. Check network connectivity
5. Review API responses in browser DevTools

---

## 7.8 Quick Reference Card

### Start Development Server
```bash
npm run dev
```

### Access Application
- Frontend: http://localhost:3000
- API: http://localhost:3000/api

### Default Test Account
```
Admin:
Email: admin@example.com
Password: admin123

Student:
Email: student@example.com
Password: student123
```

### Key Files to Modify
| Purpose | File |
|---------|------|
| Add new route | routes/*.js |
| Add new model | models/*.js |
| Add utility | utils/*.js |
| Add middleware | middleware/*.js |
| Frontend changes | frontend/js/*.js |

---

**Document Information:**
- Version: 1.0.0
- Created: April 2026
- Project: College Event Management System (EventSphere)
- Topic: Chapter 7 - Resources

