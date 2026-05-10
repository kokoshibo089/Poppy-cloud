# 🚀 GitLinux: Free Forever Hosting Guide

لقد تم تصميم المشروع ليعمل على أقوى منصات الاستضافة المجانية في العالم. إليك الخيارات:

## 1. الخيار الأول: Oracle Cloud (الأقوى عالمياً)
هذا الخيار يعطيك "سيرفر كامل" (VPS) مجاناً للأبد بمواصفات خرافية.
- **المواصفات**: 4 CPUs (ARM), 24GB RAM, 200GB SSD.
- **كيفية الربط**:
    1. قم بالتسجيل في [Oracle Cloud Always Free](https://www.oracle.com/cloud/free/).
    2. قم بإنشاء Instance بنظام **Ubuntu**.
    3. نفذ الأوامر التالية داخل السيرفر:
       ```bash
       git clone <your-repo-url>
       sudo apt install docker-compose -y
       sudo docker-compose up -d
       ```

## 2. الخيار الثاني: Koyeb (الأسهل والأسرع)
منصة تدعم Docker وتعطيك خدمة "Nano" مجانية للأبد ولا تنام (No Sleep).
- **المواصفات**: 512MB RAM, Micro CPU.
- **كيفية الربط**:
    1. ارفع الكود الخاص بك على **GitHub**.
    2. اربط حسابك في [Koyeb](https://www.koyeb.com/).
    3. اختر "Create Service" -> "GitHub".
    4. سيقوم Koyeb تلقائياً بقراءة الـ `Dockerfile` وتشغيل المشروع.

## 3. الخيار الثالث: Hugging Face Spaces (سرعة خارقة)
يمكنك تشغيل Docker Containers مجاناً مع 16GB RAM.
- **كيفية الربط**:
    1. أنشئ "Space" جديد على [Hugging Face](https://huggingface.co/spaces).
    2. اختر الـ SDK ليكون **Docker**.
    3. ارفع ملفات المشروع.

---

### ⚠️ ملاحظة تقنية هامة (Persistence)
بما أن الاستضافات المجانية غالباً ما تكون "Ephemeral" (تمسح الملفات عند إعادة التشغيل)، قمت بضبط المشروع ليكون جاهزاً للربط بـ **S3 Bucket** أو **MongoDB** لحفظ ملفات المستخدمين بشكل دائم إذا قررت التوسع.
