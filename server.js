const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch((error) => console.error('MongoDB connection error:', error));

// User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  }
}, {
  timestamps: true
});

// Meeting Schema
const meetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    trim: true
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attendees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Models
const User = mongoose.model('User', userSchema);
const Meeting = mongoose.model('Meeting', meetingSchema);

// Validation middleware
const validateMeeting = [
  body('title').notEmpty().withMessage('Title is required'),
  body('startDate').isISO8601().withMessage('Start date must be a valid date'),
  body('endDate').isISO8601().withMessage('End date must be a valid date'),
  body('organizer').isMongoId().withMessage('Organizer must be a valid user ID'),
  body('attendees').optional().isArray().withMessage('Attendees must be an array')
];

const validateUser = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required')
];

// Error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Routes

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Meetings API Service is running!' });
});

// User Routes
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', validateUser, handleValidationErrors, async (req, res) => {
  try {
    const user = new User(req.body);
    const savedUser = await user.save();
    res.status(201).json(savedUser);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Meeting Routes
app.get('/api/meetings', async (req, res) => {
  try {
    const meetings = await Meeting.find()
      .populate('organizer', 'name email')
      .populate('attendees', 'name email')
      .sort({ startDate: 1 });
    res.json(meetings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/meetings/:id', async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('organizer', 'name email')
      .populate('attendees', 'name email');
    
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    res.json(meeting);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/meetings', validateMeeting, handleValidationErrors, async (req, res) => {
  try {
    // Validate that start date is before end date
    if (new Date(req.body.startDate) >= new Date(req.body.endDate)) {
      return res.status(400).json({ error: 'Start date must be before end date' });
    }

    // Validate organizer exists
    const organizer = await User.findById(req.body.organizer);
    if (!organizer) {
      return res.status(400).json({ error: 'Organizer not found' });
    }

    // Validate attendees exist (if provided)
    if (req.body.attendees && req.body.attendees.length > 0) {
      const attendeeCount = await User.countDocuments({ _id: { $in: req.body.attendees } });
      if (attendeeCount !== req.body.attendees.length) {
        return res.status(400).json({ error: 'One or more attendees not found' });
      }
    }

    const meeting = new Meeting(req.body);
    const savedMeeting = await meeting.save();
    
    // Populate the saved meeting before returning
    const populatedMeeting = await Meeting.findById(savedMeeting._id)
      .populate('organizer', 'name email')
      .populate('attendees', 'name email');
    
    res.status(201).json(populatedMeeting);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/meetings/:id', validateMeeting, handleValidationErrors, async (req, res) => {
  try {
    // Validate that start date is before end date
    if (new Date(req.body.startDate) >= new Date(req.body.endDate)) {
      return res.status(400).json({ error: 'Start date must be before end date' });
    }

    // Validate organizer exists
    const organizer = await User.findById(req.body.organizer);
    if (!organizer) {
      return res.status(400).json({ error: 'Organizer not found' });
    }

    // Validate attendees exist (if provided)
    if (req.body.attendees && req.body.attendees.length > 0) {
      const attendeeCount = await User.countDocuments({ _id: { $in: req.body.attendees } });
      if (attendeeCount !== req.body.attendees.length) {
        return res.status(400).json({ error: 'One or more attendees not found' });
      }
    }

    const meeting = await Meeting.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('organizer', 'name email')
    .populate('attendees', 'name email');

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    
    res.json(meeting);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/meetings/:id', async (req, res) => {
  try {
    const meeting = await Meeting.findByIdAndDelete(req.params.id);
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    res.json({ message: 'Meeting deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get meetings by user (as organizer or attendee)
app.get('/api/users/:userId/meetings', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const meetings = await Meeting.find({
      $or: [
        { organizer: userId },
        { attendees: userId }
      ]
    })
    .populate('organizer', 'name email')
    .populate('attendees', 'name email')
    .sort({ startDate: 1 });

    res.json(meetings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get upcoming meetings
app.get('/api/meetings/upcoming', async (req, res) => {
  try {
    const now = new Date();
    const meetings = await Meeting.find({
      startDate: { $gte: now }
    })
    .populate('organizer', 'name email')
    .populate('attendees', 'name email')
    .sort({ startDate: 1 })
    .limit(10);

    res.json(meetings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});