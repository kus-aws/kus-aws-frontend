# Overview

This is a Korean AI-powered study platform called "StudyAI" (스터디AI) built as a full-stack web application. The platform provides subject-specific Q&A functionality where students can ask questions about various academic subjects and receive AI-generated responses. The application features a modern landing page showcasing different academic categories (Computer Science, Mathematics, Economics, Physics, Chemistry, Biology, Literature, etc.) with statistics and user interaction flows.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React with TypeScript**: Modern React application using functional components and hooks
- **Vite Build Tool**: Fast development server and optimized production builds
- **Wouter Router**: Lightweight client-side routing solution
- **Styling Framework**: Tailwind CSS with custom design system and CSS variables
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **State Management**: TanStack Query (React Query) for server state management
- **Form Handling**: React Hook Form with Zod validation schemas

## Backend Architecture
- **Express.js Server**: RESTful API server with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Session Management**: Express sessions with PostgreSQL session store (connect-pg-simple)
- **Development Setup**: Hot module replacement with Vite integration
- **API Structure**: Modular route registration with centralized error handling
- **Storage Layer**: Abstracted storage interface with in-memory implementation for development

## Data Storage Solutions
- **Database**: PostgreSQL with Neon serverless database
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Current Schema**: User table with id, username, and password fields
- **Development Storage**: In-memory storage implementation for local development
- **Session Storage**: PostgreSQL-backed session management

## Authentication and Authorization
- **Session-based Authentication**: Express sessions with secure configuration
- **User Management**: Basic user creation and retrieval functionality
- **Password Storage**: Plain text storage (requires hashing implementation)
- **Development Mode**: In-memory user storage for testing

## Design System
- **Color Scheme**: Custom HSL-based color variables with light theme
- **Typography**: Inter font family with multiple weights
- **Component Library**: Comprehensive UI components (buttons, cards, forms, modals, etc.)
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints
- **Accessibility**: Built on Radix UI primitives for ARIA compliance

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting
- **connect-pg-simple**: PostgreSQL session store for Express

## UI and Styling Libraries
- **Radix UI**: Headless UI primitives for accessibility
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **class-variance-authority**: Component variant management
- **clsx/tailwind-merge**: Conditional CSS class utilities

## Development Tools
- **Replit Integration**: Cartographer plugin and runtime error overlay
- **ESBuild**: Fast JavaScript bundler for production builds
- **TypeScript**: Type safety across the entire application
- **Drizzle Kit**: Database migration and introspection tools

## Form and Validation
- **React Hook Form**: Form state management
- **Zod**: Schema validation library
- **@hookform/resolvers**: Form validation resolvers

## Additional Libraries
- **TanStack React Query**: Server state management and caching
- **date-fns**: Date manipulation utilities
- **embla-carousel-react**: Carousel component
- **cmdk**: Command palette component
- **nanoid**: Unique ID generation