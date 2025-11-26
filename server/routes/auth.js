// const express = require('express');
// const jwt = require('jsonwebtoken');
// const crypto = require('crypto');
// const User = require('../models/User');
// const auth = require('../middleware/auth');

// const router = express.Router();

// // Generate API Key
// const generateApiKey = () => {
//   return crypto.randomBytes(32).toString('hex');
// };


const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Alert = require('../models/Alert'); // ✅ ADD THIS
const auth = require('../middleware/auth');

const router = express.Router();

// Generate API Key
const generateApiKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Register user
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user with API key
    const apiKey = generateApiKey();
    user = new User({ email, password, apiKey });

    await user.save();

    // ✅ Create a default alert for this user
    try {
      await Alert.create({
        userId: user._id,
        name: 'Default error alert',
        condition: 'errorCount',
        threshold: 3,      // 3 errors
        timeframe: 5,      // in last 5 minutes
        email: user.email, // send to user email
        active: true
      });
      console.log('Default alert created for user:', user.email);
    } catch (err) {
      console.error('Error creating default alert:', err.message);
      // but don't block registration if alert creation fails
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: { id: user._id, email: user.email, apiKey: user.apiKey }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Register user
// router.post('/register', async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // Check if user exists
//     let user = await User.findOne({ email });
//     if (user) {
//       return res.status(400).json({ message: 'User already exists' });
//     }

//     // Create new user with API key
//     const apiKey = generateApiKey();
//     user = new User({ email, password, apiKey });

//     await user.save();

//     // Create JWT token
//     const token = jwt.sign(
//       { id: user._id },
//       process.env.JWT_SECRET,
//       { expiresIn: '7d' }
//     );

//     res.status(201).json({
//       token,
//       user: { id: user._id, email: user.email, apiKey: user.apiKey }
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.correctPassword(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user._id, email: user.email, apiKey: user.apiKey }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  res.json({
    user: { id: req.user._id, email: req.user.email, apiKey: req.user.apiKey }
  });
});

// Regenerate API Key
router.post('/regenerate-api-key', auth, async (req, res) => {
  try {
    const newApiKey = generateApiKey();
    req.user.apiKey = newApiKey;
    await req.user.save();
    
    res.json({ apiKey: newApiKey });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;