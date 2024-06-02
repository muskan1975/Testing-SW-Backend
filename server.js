const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Connect to MongoDB
const MONGODB_URL = process.env.MONGODB_URL || "mongodb+srv://salim:testing-data@testing-sw.sf4i6je.mongodb.net/?retryWrites=true&w=majority&appName=testing-sw";
mongoose.connect(MONGODB_URL, {})
  .then(() => {
    console.log('Connected to MongoDB');
  }).catch(err => {
    console.error('Error connecting to MongoDB', err);
  });

// Define the Link schema and model
const linkSchema = new mongoose.Schema({
  original: { type: String, required: true },
  offerId: { type: String, required: true },
  domain: { type: String, required: true },
  randomText: { type: String, required: true },
  duplicate: { type: String, required: true },
  clickCount: { type: Number, default: 0 }
});

const Link = mongoose.model('Link', linkSchema);

// Define Visitor schema and model
const visitorSchema = new mongoose.Schema({
  linkId: { type: mongoose.Schema.Types.ObjectId, ref: 'Link', required: true },
  ipAddress: { type: String },
  timestamp: { type: Date, default: Date.now }
});

const Visitor = mongoose.model('Visitor', visitorSchema);

// Routes
app.get('/links', async (req, res) => {
  try {
    const links = await Link.find();
    res.json(links);
  } catch (err) {
    console.error('Error fetching links:', err);
    res.status(500).json({ message: err.message });
  }
});

app.post('/links', async (req, res) => {
  const { original, offerId, domain, randomText, duplicate } = req.body;

  if (!original || !offerId || !domain || !randomText || !duplicate) {
    console.error('Validation Error: All fields are required');
    return res.status(400).json({ message: 'All fields are required' });
  }

  const link = new Link({ original, offerId, domain, randomText, duplicate });

  try {
    const newLink = await link.save();
    res.status(201).json(newLink);
  } catch (err) {
    console.error('Error saving link:', err);
    res.status(400).json({ message: err.message });
  }
});

app.get('/r/:domain/:randomText', async (req, res) => {
  const { domain, randomText } = req.params;

  try {
    const link = await Link.findOne({ domain, randomText });

    if (link) {
      // Increment click count
      link.clickCount++;
      await link.save();

      // Save visitor information
      const visitor = new Visitor({ linkId: link._id, ipAddress: req.ip });
      await visitor.save();

      // Redirect to the original link
      res.redirect(link.original);
    } else {
      res.status(404).send('Link not found');
    }
  } catch (err) {
    console.error('Error redirecting link:', err);
    res.status(500).send('Error redirecting link');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
