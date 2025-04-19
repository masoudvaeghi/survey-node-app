const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());

// ایجاد پوشه public اگر وجود نداشته باشد
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
}

// سرویس دهی فایل‌های استاتیک از پوشه public
app.use(express.static(publicDir));

// مسیر فایل CSV در پوشه public
const CSV_FILE = path.join(publicDir, 'survey_responses.csv');

// ایجاد فایل CSV اگر وجود نداشته باشد
if (!fs.existsSync(CSV_FILE)) {
    const header = 'firstName,lastName,nationalCode,age,grade,academicStatus,' +
                  'q1,q2,q3,q4,q5,q6,q7,q8,q9,q10,q11,q12,q13,q14,q15,timestamp\n';
    fs.writeFileSync(CSV_FILE, header);
}

// Route برای ذخیره پرسشنامه
app.post('/save-survey', (req, res) => {
    try {
        const formData = req.body;
        
        // اعتبارسنجی داده‌های ورودی
        if (!formData.nationalCode || !formData.firstName || !formData.lastName) {
            return res.status(400).json({ error: 'اطلاعات ضروری ارسال نشده است' });
        }

        // خواندن فایل CSV موجود
        const csvData = fs.readFileSync(CSV_FILE, 'utf8');
        const rows = csvData.trim().split('\n');
        
        // بررسی وجود کد ملی در فایل
        const duplicate = rows.some((row, index) => {
            if (index === 0) return false; // Skip header
            const columns = row.split(',');
            return columns[2] === formData.nationalCode;
        });
        
        if (duplicate) {
            return res.json({ duplicate: true });
        }
        
        // اضافه کردن داده جدید به فایل CSV
        const timestamp = new Date().toISOString();
        const newRow = [
            `"${formData.firstName}"`,
            `"${formData.lastName}"`,
            `"${formData.nationalCode}"`,
            formData.age,
            `"${formData.grade}"`,
            `"${formData.academicStatus}"`,
            ...Object.values(formData.answers).map(answer => `"${answer}"`),
            `"${timestamp}"`
        ].join(',') + '\n';
        
        fs.appendFileSync(CSV_FILE, newRow);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving survey:', error);
        res.status(500).json({ error: 'خطای سرور در پردازش درخواست' });
    }
});

// Route برای صفحه دانلود
app.get('/download', (req, res) => {
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
            <a href="/survey_responses.csv" class="download-btn">دانلود فایل CSV</a>
        </div>
    </body>
    </html>
    `;
    res.send(html);
});

// Route اصلی
app.get('/', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`سرور در حال اجرا روی پورت ${PORT}`);
    console.log(`برای دانلود به آدرس http://localhost:${PORT}/download مراجعه کنید`);
    console.log(`دسترسی مستقیم به فایل CSV: http://localhost:${PORT}/survey_responses.csv`);
});
