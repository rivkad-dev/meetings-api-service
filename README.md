# Meetings API Service

## Description
A Node.js Express API service for managing meetings with MongoDB Atlas integration. This service provides RESTful endpoints for creating, reading, updating, and deleting meetings with user relationships.

## Features
- Full CRUD operations for meetings
- User relationship management
- Input validation
- Error handling
- CORS support
- MongoDB Atlas integration

## Installation

1. Clone the repository:
```bash
git clone https://github.com/rivkad-dev/meetings-api-service.git
cd meetings-api-service
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your MongoDB connection string:
```env
MONGODB_URI=mongodb+srv://rivkadinin:f41TzBND5wrua36T@cluster0.ju7ya.mongodb.net/mernapp?retryWrites=true&w=majority
PORT=5000
```

4. Start the server:
```bash
# Development mode with nodemon
npm run dev

# Production mode
npm start
```

## API Endpoints

### Meetings

#### GET /api/meetings
Get all meetings
- **Response**: Array of meeting objects

#### GET /api/meetings/:id
Get a specific meeting by ID
- **Parameters**: `id` - Meeting ID
- **Response**: Meeting object

#### POST /api/meetings
Create a new meeting
- **Body**:
```json
{
  "title": "Team Standup",
  "description": "Daily team standup meeting",
  "startDate": "2024-02-01T09:00:00.000Z",
  "endDate": "2024-02-01T09:30:00.000Z",
  "location": "Conference Room A",
  "organizer": "USER_ID_HERE",
  "attendees": ["USER_ID_1", "USER_ID_2"]
}
```

#### PUT /api/meetings/:id
Update an existing meeting
- **Parameters**: `id` - Meeting ID
- **Body**: Meeting object with fields to update

#### DELETE /api/meetings/:id
Delete a meeting
- **Parameters**: `id` - Meeting ID

### Users (Helper endpoints)

#### GET /api/users
Get all users

#### POST /api/users
Create a new user
- **Body**:
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com"
}
```

### Additional Endpoints

#### GET /api/users/:userId/meetings
Get all meetings for a specific user (as organizer or attendee)

#### GET /api/meetings/upcoming
Get upcoming meetings (next 10)

## Data Models

### Meeting Schema
```javascript
{
  title: String (required),
  description: String,
  startDate: Date (required),
  endDate: Date (required),
  location: String,
  organizer: ObjectId (ref: 'User', required),
  attendees: [ObjectId] (ref: 'User'),
  createdAt: Date,
  updatedAt: Date
}
```

### User Schema
```javascript
{
  name: String (required),
  email: String (required, unique),
  createdAt: Date,
  updatedAt: Date
}
```

## Error Handling
The API returns appropriate HTTP status codes and error messages:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `500` - Internal Server Error

## CORS
CORS is enabled for all origins in development. For production, configure specific origins in the CORS middleware.

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License
MIT