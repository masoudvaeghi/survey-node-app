const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

const CSV_FILE = path.join(__dirname, 'survey_responses.csv');

// ایجاد فایل CSV اگر وجود نداشته باشد
function initializeCsvFile() {
    if (!fs.existsSync(CSV_FILE)) {
        const header = 'firstName,lastName,nationalCode,age,grade,academicStatus,' +
                      'q1,q2,q3,q4,q5,q6,q7,q8,q9,q10,q11,q12,q13,q14,q15,timestamp\n';
        fs.writeFileSync(CSV_FILE, header);
    }
}

initializeCsvFile();

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
            `"${formData.firstName}"`, // استفاده از quotes برای مقادیر متنی
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

// Route برای دانلود فایل CSV
app.get('/download', (req, res) => {
    try {
        // بررسی وجود فایل
        if (!fs.existsSync(CSV_FILE)) {
            return res.status(404).send('فایلی برای دانلود وجود ندارد');
        }

        // تنظیم هدرهای پاسخ برای دانلود
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=survey_responses.csv');
        
        // ایجاد read stream و ارسال فایل
        const fileStream = fs.createReadStream(CSV_FILE);
        fileStream.pipe(res);
    } catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).send('خطا در دانلود فایل');
    }
});

// Route اصلی
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// مدیریت خطاهای 404
app.use((req, res) => {
    res.status(404).send('صفحه مورد نظر یافت نشد');
});

// شروع سرور
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`سرور در حال اجرا روی پورت ${PORT}`);
});
