require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const mongoose = require('mongoose');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
const PORT = process.env.PORT || 3000;

// Environment Variables
const MONGODB_URI = process.env.MONGODB_URI;
const IMGBB_API_KEY = process.env.IMGBB_API_KEY;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define Mongoose Schema
const applicantSchema = new mongoose.Schema({
    applicant_id: { type: String, required: true, unique: true },
    name: String,
    address: String,
    refundable_deposit: Number,
    vehicle_category: String,
    vehicle_registration_number: String,
    mileage: Number,
    vehicle_image: String, // URL from ImgBB
    auction_date: String,
    auction_category_start_date: String,
    starting_bid: Number,
    created_at: { type: Date, default: Date.now }
});

const Applicant = mongoose.model('Applicant', applicantSchema);

// Set up Multer using Memory Storage (does not save to disk)
const upload = multer({ storage: multer.memoryStorage() });

// Helper function to upload image to ImgBB
async function uploadToImgBB(fileBuffer, originalName) {
    try {
        const formData = new FormData();
        formData.append('image', fileBuffer.toString('base64'));
        
        const response = await axios.post(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, formData, {
            headers: formData.getHeaders()
        });
        
        if (response.data && response.data.success) {
            return response.data.data.url; // Returns the permanent URL
        }
        throw new Error('ImgBB upload failed');
    } catch (error) {
        console.error("ImgBB Error:", error.response ? error.response.data : error.message);
        throw error;
    }
}

// API Endpoints

// GET all applicants
app.get('/api/applicant', async (req, res) => {
    try {
        const id = req.query.id;
        
        if (id) {
            const applicant = await Applicant.findOne({ applicant_id: id });
            if (applicant) {
                res.json({ success: true, data: applicant });
            } else {
                res.status(404).json({ success: false, error: 'Applicant not found' });
            }
        } else {
            const applicants = await Applicant.find().sort({ created_at: -1 });
            res.json({ success: true, data: applicants });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST (Create/Update) applicant
app.post('/api/applicant', upload.single('vehicle_image_file'), async (req, res) => {
    try {
        const applicant_id = req.body.applicant_id;
        
        if (!applicant_id) {
            return res.status(400).json({ success: false, error: 'Applicant ID is required' });
        }

        let vehicle_image_url = req.body.vehicle_image || '';
        
        // If a new file is uploaded, send it to ImgBB
        if (req.file) {
            vehicle_image_url = await uploadToImgBB(req.file.buffer, req.file.originalname);
        }

        const dataToSave = {
            applicant_id,
            name: req.body.name || '',
            address: req.body.address || '',
            refundable_deposit: req.body.refundable_deposit || 0,
            vehicle_category: req.body.vehicle_category || '',
            vehicle_registration_number: req.body.vehicle_registration_number || '',
            mileage: req.body.mileage || 0,
            auction_date: req.body.auction_date || '',
            auction_category_start_date: req.body.auction_category_start_date || '',
            starting_bid: req.body.starting_bid || 0
        };

        if (vehicle_image_url) {
            dataToSave.vehicle_image = vehicle_image_url;
        }

        const existing = await Applicant.findOne({ applicant_id });
        let action = 'created';
        
        if (existing) {
            // Update existing
            await Applicant.findOneAndUpdate({ applicant_id }, dataToSave);
            action = 'updated';
        } else {
            // Create new
            const newApp = new Applicant(dataToSave);
            await newApp.save();
        }

        res.status(201).json({ success: true, id: applicant_id, action });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE applicant
app.delete('/api/applicant', async (req, res) => {
    try {
        const id = req.query.id;
        
        if (!id) {
            return res.status(400).json({ success: false, error: 'ID is required' });
        }

        const deleted = await Applicant.findOneAndDelete({ applicant_id: id });
        
        if (deleted) {
            res.json({ success: true, message: 'Deleted successfully' });
        } else {
            res.status(404).json({ success: false, error: 'Applicant not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Catch-all route to serve index.html for undefined frontend routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
