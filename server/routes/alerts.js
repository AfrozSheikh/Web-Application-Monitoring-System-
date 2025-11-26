const express = require('express');
const auth = require('../middleware/auth');
const Alert = require('../models/Alert');

const router = express.Router();

// Get all alerts for user
router.get('/', auth, async (req, res) => {
  try {
    const alerts = await Alert.find({ userId: req.user._id }).sort({ createdAt: -1 });
    
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new alert
router.post('/', auth, async (req, res) => {
  try {
    const { name, condition, threshold, timeframe, email } = req.body;

    console.log(`name is ${name}`);
    
    
    const alert = new Alert({
      userId: req.user._id,
      name,
      condition,
      threshold,
      timeframe,
      email: email || req.user.email
    });
    
    await alert.save();
    res.status(201).json(alert);
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update alert
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, condition, threshold, timeframe, email, active } = req.body;
    
    const alert = await Alert.findOne({ _id: req.params.id, userId: req.user._id });
    
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    
    if (name) alert.name = name;
    if (condition) alert.condition = condition;
    if (threshold) alert.threshold = threshold;
    if (timeframe) alert.timeframe = timeframe;
    if (email) alert.email = email;
    if (typeof active !== 'undefined') alert.active = active;
    
    await alert.save();
    res.json(alert);
  } catch (error) {
    console.error('Error updating alert:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete alert
router.delete('/:id', auth, async (req, res) => {
  try {
    const alert = await Alert.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    
    res.json({ message: 'Alert deleted' });
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;