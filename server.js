require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const NodeCache = require('node-cache');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 5000;
const cache = new NodeCache({ stdTTL: 3600 });

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS.trim() 
    }
});

function generateTicketNumber() {
    const prefix = 'HDV';
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, ''); 
    const random = Math.floor(1000 + Math.random() * 9000); 
    return `${prefix}-${date}-${random}`;
}


app.post('/send-email', async (req, res) => {
    console.log('Received form data:', req.body);
    const { naam, email, reason, bericht } = req.body;

    const ticketNumber = generateTicketNumber();

    const adminMailOptions = {
        from: process.env.EMAIL_USER,
        replyTo: email,
        to: process.env.EMAIL_USER,
        subject: `[${ticketNumber}] Hulpdienstvoertuigenbenelux - ${reason} - ${naam}`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
                <p><strong>Ticketnummer:</strong> ${ticketNumber}</p>
                <hr>
                <p><strong>Naam:</strong><br>${naam}</p>
                <hr>
                <p><strong>Email:</strong><br><a href="mailto:${email}" style="color: #007bff; text-decoration: none;">${email}</a></p>
                <hr>
                <p><strong>Reden:</strong><br>${reason}</p>
                <hr>
                <p><strong>Bericht:</strong><br>${bericht.replace(/\n/g, '<br>')}</p>
            </div>
        `
    };

    const userMailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: `[${ticketNumber}] Bevestiging van uw contactverzoek - Hulpdienstvoertuigenbenelux`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2c3e50; text-align: center;">Bedankt voor uw contactverzoek!</h2>
                
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 16px;">
                        <strong>Uw ticketnummer:</strong><br>
                        <span style="font-size: 18px; color: #e74c3c; font-weight: bold;">${ticketNumber}</span>
                    </p>
                </div>

                <p>Beste <strong>${naam}</strong>,</p>
                
                <p>Wij hebben uw contactverzoek goed ontvangen en zullen zo spoedig mogelijk contact met u opnemen.</p>
                
                <div style="background-color: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h4 style="color: #2c3e50; margin-top: 0;">Samenvatting van uw verzoek:</h4>
                    <p><strong>Reden:</strong> ${reason}</p>
                    <p><strong>Uw bericht:</strong><br>${bericht.replace(/\n/g, '<br>')}</p>
                </div>

                <p><strong>Belangrijke informatie:</strong></p>
                <ul>
                    <li>Houd uw ticketnummer <strong>${ticketNumber}</strong> bij de hand voor referentie</li>
                    <li>Wij streven ernaar binnen 2 werkdagen te reageren</li>
                    <li>Voor spoedgevallen kunt u ons direct bellen</li>
                </ul>

                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                    <p style="font-size: 14px; color: #7f8c8d;">
                        Met vriendelijke groet,<br>
                        <strong>Team Hulpdienstvoertuigenbenelux</strong>
                    </p>
                </div>
            </div>
        `
    };

    try {
        const [adminResult, userResult] = await Promise.all([
            transporter.sendMail(adminMailOptions),
            transporter.sendMail(userMailOptions)
        ]);
        
        res.status(200).json({ 
            message: 'Email sent successfully.',
            ticketNumber: ticketNumber 
        });
    } catch (error) {
        console.error('Error sending emails:', error);
        
        if (error.message && error.message.includes('user email')) {
            try {
                await transporter.sendMail(adminMailOptions);
            } catch (fallbackError) {
                console.error('Failed to send admin email as fallback:', fallbackError);
            }
        }
        
        res.status(500).json({ 
            message: 'Failed to send email.',
            error: error.message 
        });
    }
});

// Route to fetch Google Sheets data
app.get('/fetch-sheet', async (req, res) => {
    const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
    const API_KEY = process.env.API_KEY;
    const region = req.query.region || 'NL';
    const cacheKey = `sheetData_${region}`;
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
        return res.json(cachedData);
    }

    const SheetName = region === 'NL' ? 'MegaSheetNL' : region === 'BE' ? 'MegaSheetBE' : region === 'LUX' ? 'MegaSheetLUX' : null;
    if (!SheetName) return res.status(400).json({ error: 'Invalid region specified' });

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SheetName}?key=${API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!data.values) {
            console.warn(`[${new Date().toISOString()}] Warning: No data received.`);
            return res.status(404).json({ error: 'No data found in Google Sheets' });
        }

        cache.set(cacheKey, data);
        res.json(data);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error fetching data:`, error);
        res.status(500).json({ error: 'Failed to fetch data from Google Sheets' });
    }
});

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'list.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`\n=================================`);
    console.log(` Server started at: http://localhost:${PORT} `);
    console.log(`=================================\n`);
});
