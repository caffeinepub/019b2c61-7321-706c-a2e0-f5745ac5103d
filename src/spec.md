# Calendar Application

## Overview
A calendar application that allows users to create, manage, and share events with email invitations.

## Authentication
- Users authenticate using Internet Identity
- Only authenticated users can access the application features

## Core Features

### Event Management
- Create new events with the following fields:
  - Title (required)
  - Description
  - Date (required)
  - Time (required)
  - List of invited recipients' email addresses

- View all events in a calendar interface
- Edit existing events
- Delete events
- Events are displayed in a monthly calendar view

### Email Invitations
- Users can manually trigger email invitations when creating or updating events
- Email invitations include:
  - Event title in the subject line
  - Event details (date, time, description)
  - Sent to all email addresses in the recipients list

### Integration Information Display
- Display the integration canister ID prominently in the main UI (header or footer)
- Label clearly as "Integration Canister ID"
- Use React Query to fetch and display this information

### User Interface
- Clean, intuitive React-based frontend
- Calendar view showing all events for the logged-in user
- Forms for creating and editing events
- Interface for selecting and managing email recipients
- Manual trigger for sending email invitations
- Integration canister ID display in header or footer area

## Backend Data Storage
- User events with all event details
- Association between users and their events
- Event recipient email lists

## Backend Operations
- CRUD operations for events
- User authentication verification
- Email sending functionality using the activated email feature
- Retrieve user-specific events for calendar display
- Query endpoint to retrieve integration canister ID from EmailClient

## Language
- Application content in English
