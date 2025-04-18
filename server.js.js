const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());
app.use(express.static('public'));

const CSV_FILE = path.join(__dirname, 'survey_responses.csv');

// ایجاد فایل CSV اگر وجود نداشته باشد
if (!fs.existsSync(CSV_FILE)) {
    const header = 'firstName,lastName,nationalCode,age,grade,academicStatus,' +
                   'q1,q2,q3,q4,q5,q6,q7,q8,q9,q10,q11,q12,q13,q14,q15,timestamp\n';
    fs.writeFileSync(CSV_FILE, header);
}

app.post('/save-survey', (req, res) => {
    const formData = req.body;
    
    // خواندن فایل CSV موجود
    const csvData = fs.readFileSync(CSV_FILE, 'utf8');
    const rows = csvData.trim().split('\n');
    
    // بررسی وجود کد ملی در فایل
    let duplicate = false;
    for (let i = 1; i < rows.length; i++) {
        const columns = rows[i].split(',');
        if (columns[2] === formData.nationalCode) {
            duplicate = true;
            break;
        }
    }
    
    if (duplicate) {
        return res.json({ duplicate: true });
    }
    
    // اضافه کردن داده جدید به فایل CSV
    const timestamp = new Date().toISOString();
    const newRow = [
        formData.firstName,
        formData.lastName,
        formData.nationalCode,
        formData.age,
        formData.grade,
        formData.academicStatus,
        ...Object.values(formData.answers),
        timestamp
    ].join(',') + '\n';
    
    fs.appendFileSync(CSV_FILE, newRow);
    
    res.json({ success: true });
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});