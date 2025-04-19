const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('public'));

const CSV_FILE = path.join(__dirname, 'survey_responses.csv');

// ایجاد فایل CSV اگر وجود نداشته باشد
if (!fs.existsSync(CSV_FILE)) {
    const header = 'firstName,lastName,nationalCode,age,grade,academicStatus,' +
                  'q1,q2,q3,q4,q5,q6,q7,q8,q9,q10,q11,q12,q13,q14,q15,timestamp\n';
    fs.writeFileSync(CSV_FILE, header);
}

// Route برای ذخیره پرسشنامه
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

// Route برای صفحه دانلود
app.get('/download', (req, res) => {
    // ارسال صفحه HTML زیبا برای دانلود
    const html = `
    <!DOCTYPE html>
    <html lang="fa" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>دانلود نتایج پرسشنامه</title>
        <style>
            body {
                font-family: 'Arial', sans-serif;
                background-color: #f5f7fa;
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                text-align: center;
            }
            .download-container {
                background-color: white;
                padding: 40px;
                border-radius: 10px;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                max-width: 500px;
                width: 90%;
            }
            h1 {
                color: #2c3e50;
                margin-bottom: 20px;
            }
            p {
                color: #7f8c8d;
                margin-bottom: 30px;
            }
            .download-btn {
                background-color: #3498db;
                color: white;
                border: none;
                padding: 12px 30px;
                font-size: 16px;
                border-radius: 5px;
                cursor: pointer;
                transition: background-color 0.3s;
                text-decoration: none;
                display: inline-block;
            }
            .download-btn:hover {
                background-color: #2980b9;
            }
            .icon {
                font-size: 50px;
                color: #3498db;
                margin-bottom: 20px;
            }
        </style>
    </head>
    <body>
        <div class="download-container">
            <div class="icon">📊</div>
            <h1>دانلود نتایج پرسشنامه</h1>
            <p>برای دریافت فایل CSV حاوی تمام پاسخ‌ها، دکمه زیر را کلیک کنید</p>
            <a href="/download-csv" class="download-btn">دانلود فایل CSV</a>
        </div>
    </body>
    </html>
    `;
    res.send(html);
});

// Route برای دانلود واقعی فایل CSV
app.get('/download-csv', (req, res) => {
    if (!fs.existsSync(CSV_FILE)) {
        return res.status(404).send('فایل یافت نشد');
    }
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=survey_results.csv');
    
    const fileStream = fs.createReadStream(CSV_FILE);
    fileStream.pipe(res);
});

// Route اصلی
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`سرور در حال اجرا روی پورت ${PORT}`);
    console.log(`برای دانلود به آدرس http://localhost:${PORT}/download مراجعه کنید`);
});
