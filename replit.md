# LawHelper - AI-Powered Legal Research Platform

## Overview

LawHelper is a modern legal research platform that leverages artificial intelligence to provide legal professionals with comprehensive research tools. The application features AI-powered legal search, document analysis, risk assessment, and brief summarization capabilities. Built as a full-stack web application, it combines a React frontend with an Express backend, using PostgreSQL for data persistence and OpenAI's GPT models for legal analysis.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript for type safety and better developer experience
- **UI Library**: Shadcn/ui components built on Radix UI primitives for accessible, customizable interface components
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for consistent theming
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript for the REST API server
- **Authentication**: Passport.js with local strategy using session-based authentication
- **Session Management**: Express sessions with configurable storage (memory store for development)
- **File Handling**: Multer middleware for document upload processing
- **API Design**: RESTful endpoints with consistent error handling and logging middleware

### Database and ORM
- **Database**: PostgreSQL for reliable data persistence
- **ORM**: Drizzle ORM for type-safe database operations and schema management
- **Connection**: Neon serverless PostgreSQL adapter for scalable cloud database connectivity
- **Schema**: User management and search history tracking with proper foreign key relationships
- **Migrations**: Drizzle Kit for database schema migrations and version control

### AI Integration
- **Service**: OpenAI GPT-5 for legal research, document analysis, and risk assessment
- **Functions**: Dedicated modules for legal database search, document summarization, and risk analysis
- **Response Format**: Structured JSON responses for consistent data handling
- **Search History**: Persistent storage of AI-generated results for user reference

### Authentication and Security
- **Strategy**: Session-based authentication with secure password hashing using Node.js crypto scrypt
- **Password Security**: Salt-based hashing with timing-safe comparison to prevent timing attacks
- **Session Security**: Configurable session settings with secure cookie handling
- **Route Protection**: Middleware-based authentication guards for protected endpoints

### Development and Build Process
- **Development**: Hot module replacement with Vite for fast development iteration
- **TypeScript**: Strict type checking across client, server, and shared code
- **Code Organization**: Monorepo structure with shared schema definitions
- **Path Aliases**: Configured import aliases for clean, maintainable code structure
- **Error Handling**: Comprehensive error boundaries and API error handling

## External Dependencies

### Core Technologies
- **Database**: Neon PostgreSQL serverless database for cloud-native data storage
- **AI Service**: OpenAI API for GPT-5 language model integration
- **Authentication**: Passport.js ecosystem for flexible authentication strategies

### UI and Styling
- **Component Library**: Radix UI primitives for accessible, unstyled components
- **Styling Framework**: Tailwind CSS for utility-first styling approach
- **Icons**: Lucide React for consistent iconography
- **Fonts**: Google Fonts integration for typography

### Development Tools
- **Build System**: Vite with React plugin for optimized development and production builds
- **Replit Integration**: Specialized Replit plugins for development environment enhancement
- **Type Validation**: Zod for runtime type validation and schema definition
- **Date Handling**: date-fns for robust date manipulation and formatting

### Backend Services
- **File Upload**: Multer for handling multipart form data and file uploads
- **Session Storage**: Connect-pg-simple for PostgreSQL-backed session storage in production
- **WebSocket**: ws library for Neon database WebSocket connections
- **Security**: Built-in Node.js crypto module for secure password handling