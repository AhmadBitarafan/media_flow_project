@echo off
REM اسکریپت برای فعال‌سازی .env و اجرای سرور جنگو در پوشه core

if not exist "venv\Scripts\activate.bat" (
    echo خطا: محیط مجازی .env یافت نشد.
    exit /b 1
)

call venv\Scripts\activate.bat

if not exist "manage.py" (
    echo خطا: فایل manage.py در پوشه core وجود ندارد.
    exit /b 1
)


python manage.py runserver