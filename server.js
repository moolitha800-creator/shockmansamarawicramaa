const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'auction_db.json');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Set up Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Initialize database
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([]));
}

// Read database
const readDB = () => JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));

// Write to database
const writeDB = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

// API Endpoints

// GET all applicants
app.get('/api/applicant', (req, res) => {
    const data = readDB();
    const id = req.query.id;
    
    if (id) {
        const applicant = data.find(app => app.applicant_id === id);
        if (applicant) {
            res.json({ success: true, data: applicant });
        } else {
            res.status(404).json({ success: false, error: 'Applicant not found' });
        }
    } else {
        res.json({ success: true, data });
    }
});

// POST (Create/Update) applicant
app.post('/api/applicant', upload.single('vehicle_image_file'), (req, res) => {
    try {
        const data = readDB();
        const applicant_id = req.body.applicant_id;
        
        if (!applicant_id) {
            return res.status(400).json({ success: false, error: 'Applicant ID is required' });
        }

        let vehicle_image = req.body.vehicle_image || '';
        
        // If file uploaded, update the URL path
        if (req.file) {
            vehicle_image = '/uploads/' + req.file.filename;
        }

        const newApplicant = {
            id: Date.now().toString(),
            applicant_id,
            name: req.body.name || '',
            address: req.body.address || '',
            refundable_deposit: req.body.refundable_deposit || '',
            vehicle_category: req.body.vehicle_category || '',
            vehicle_registration_number: req.body.vehicle_registration_number || '',
            mileage: req.body.mileage || '',
            vehicle_image: vehicle_image,
            auction_date: req.body.auction_date || '',
            auction_category_start_date: req.body.auction_category_start_date || '',
            starting_bid: req.body.starting_bid || '',
            created_at: new Date().toISOString()
        };

        const existingIndex = data.findIndex(app => app.applicant_id === applicant_id);
        let action = 'created';
        
        if (existingIndex !== -1) {
            // Keep old image if no new one provided
            if (!req.file && !req.body.vehicle_image) {
                newApplicant.vehicle_image = data[existingIndex].vehicle_image;
            }
            newApplicant.id = data[existingIndex].id; // Keep original primary key
            newApplicant.created_at = data[existingIndex].created_at; // Keep original date
            data[existingIndex] = newApplicant;
            action = 'updated';
        } else {
            data.unshift(newApplicant); // Add to beginning
        }

        writeDB(data);
        res.status(201).json({ success: true, id: applicant_id, action });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE applicant
app.delete('/api/applicant', (req, res) => {
    try {
        const data = readDB();
        const id = req.query.id;
        
        if (!id) {
            return res.status(400).json({ success: false, error: 'ID is required' });
        }

        const newData = data.filter(app => app.applicant_id !== id);
        
        if (newData.length !== data.length) {
            writeDB(newData);
            res.json({ success: true, message: 'Deleted successfully' });
        } else {
            res.status(404).json({ success: false, error: 'Applicant not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Catch-all route to serve index.html for undefined frontend routes (if needed)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
