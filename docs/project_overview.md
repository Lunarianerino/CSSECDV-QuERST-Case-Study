# QuERST Matchmaking System Overview

## Project Description
The QuERST Matchmaking System (QuERST-SyMM) is a comprehensive platform designed to connect students with tutors for educational support. The system facilitates the pairing process, manages schedules, and handles educational assessments through exams.

## System Architecture

### Frontend
- Built with Next.js (App Router)
- React components with TypeScript
- TailwindCSS for styling with shadcn/ui component library
- Client and server components architecture

### Backend
- MongoDB database with Mongoose schemas
- NextAuth.js for authentication
- Server actions for backend operations
- REST API endpoints

## User Roles
The system supports three primary user roles:
1. **Students** - Users seeking tutoring services
2. **Tutors** - Users providing tutoring services
3. **Admins** - System administrators managing the platform

## Core Features

### Authentication System
- User registration with email and password
- Secure login with session management
- Role-based authorization
- Onboarding flow for new users

### User Profile Management
- Completion of profile during onboarding
- User type selection (student or tutor)
- Profile information management

### Dashboard Experience
- Role-specific dashboards for students, tutors, and admins
- Overview of matches, schedules, and pending actions
- Quick access to primary functions

### Matching System
- Admin-managed pairing between students and tutors
- Subject-based matching
- Match status tracking (pending, accepted, rejected, ongoing, completed, cancelled)
- Approval/rejection workflow

### Scheduling System
- Weekly availability management for tutors
- Time slot selection for appointments
- Schedule visualization
- Common availability detection between students and tutors

### Exam System
- Creation and management of assessments
- Multiple question types (single choice, multiple choice, text)
- Exam taking interface
- Grading capabilities
- Required exams functionality

### Admin Tools
- User management
- Pairing management interface
- System statistics dashboard
- Exam creation and management

## Data Models

### Account
- User profile information (name, email, etc.)
- Authentication details
- User type and onboarding status

### Schedule
- Weekly availability patterns
- Time intervals by day
- Assignment tracking

### Match
- Student-tutor pairing information
- Status tracking
- Subject information
- Reason field for rejections or cancellations

### Exam System
- Exams with questions and choices
- User exam status tracking
- Answer recording and scoring

## Technical Implementation

### Authentication
- NextAuth for session management
- Middleware for route protection
- JWT token handling

### State Management
- React Query for server state
- Context API for shared state
- Form state management with React Hook Form

### Data Validation
- Zod schema validation for forms and API requests
- Type safety with TypeScript

### UI/UX
- Responsive design for all device sizes
- Accessible components
- Toast notifications for user feedback
- Modal dialogs for focused interactions

## Workflows

### Matching Process
1. Admin creates a pairing between student and tutor
2. System checks for common availability
3. Admin assigns specific time slots
4. Pairing status is managed through its lifecycle

### Scheduling Process
1. Users set their weekly availability
2. System identifies common available times
3. Sessions are scheduled in these common slots
4. Appointments are tracked in the calendar

### Exam Process
1. Admin creates exams with questions
2. Users take assigned exams
3. System records and potentially grades responses
4. Results are stored for review

## Future Development Opportunities
- Real-time messaging between students and tutors
- Payment processing for tutoring services
- Advanced analytics on tutoring effectiveness
- Integration with external learning management systems
- Mobile application development

This overview provides a foundation for understanding the QuERST Matchmaking System's architecture, features, and workflows.
