# Slide 1: College Event Website Project
- A comprehensive platform for managing and discovering college events
- Facilitates event planning, registration, and feedback

# Slide 2: Introduction
- Full-stack web application for college event management
- Central hub for students and admins to interact with campus events
- Enhances campus engagement and event participation

# Slide 3: Technology Stack
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js with Express.js
- Database: MongoDB with Mongoose
- Authentication: JWT and bcrypt
- Additional Libraries: CORS, dotenv, xlsx, nodemon

# Slide 4: Key Features - User Management
- Separate signup/login for students and admins
- Role-based access control
- Secure authentication with JWT and password hashing

# Slide 5: Key Features - Event Management
- Admins can create, edit, delete events
- Event details: title, date, location, description, category, max attendees, tags
- Custom registration questions (text, select, checkbox, radio)
- Participant tracking and management

# Slide 6: Key Features - Dashboards
- Student Dashboard: View and register for events, manage attendance, provide feedback
- Admin Dashboard: Manage events, view participants and feedback, export data

# Slide 7: Architecture Overview
- Frontend: Static pages with dynamic JS for interactivity
- Backend: RESTful API with Express routes for auth, events, feedback
- Database: MongoDB schemas for users, events, participants, feedback
- Middleware for authentication and authorization

# Slide 8: Project Structure
- Root: HTML pages, server.js, package.json
- css/: Stylesheets for pages and components
- js/: Client-side scripts for functionality
- models/: Mongoose schemas
- routes/: API route handlers
- middleware/: Authentication middleware

# Slide 9: Conclusion and Future Enhancements
- Complete event management system for colleges
- User-friendly and responsive design
- Potential enhancements:
  - Real-time notifications
  - Advanced event search and filtering
  - Calendar API integration
  - Mobile app support
