# 🤖 DIT ChatBot

DIT ChatBot เป็นระบบผู้ช่วยอัจฉริยะ (AI Chatbot) ที่พัฒนาขึ้นเพื่อช่วยเหลือนักศึกษาและบุคลากรของ **แผนกวิชาธุรกิจดิจิทัลและเทคโนโลยีสารสนเทศ (DIT)** ในการสอบถามข้อมูลต่างๆ ภายในแผนก เช่น ตารางเรียน, ข้อมูลอาจารย์, ข้อมูลวิทยาลัย และอื่นๆ ได้อย่างสะดวกรวดเร็ว โดยใช้เทคโนโลยี AI (Google Gemini) ร่วมกับระบบฐานข้อมูล RAG (Retrieval-Augmented Generation)

## ✨ ฟีเจอร์เด่น (Features)

- **ตอบคำถามอัตโนมัติด้วย AI**: ใช้ Google Gemini 1.5 Flash ในการประมวลผลภาษาธรรมชาติ (NLP) เพื่อตอบคำถามอย่างเป็นธรรมชาติ
- **ระบบดึงข้อมูลแบบ Real-time (RAG)**: ดึงข้อมูลจากไฟล์ JSON ที่อัปเดตล่าสุด (ตารางเรียน, ข้อมูลอาจารย์, ห้องเรียน) มาประกอบการตอบคำถาม ทำให้ข้อมูลถูกต้องแม่นยำ 100%
- **ระบบวิเคราะห์คำพ้องความหมาย (Synonyms)**: เข้าใจคำเรียกย่อต่างๆ เช่น "สท.", "ธด.", "คอมเกม", "3/2" แล้วจับคู่กับสาขาและห้องที่ถูกต้องโดยอัตโนมัติ
- **ระบบสลับ API Key อัตโนมัติ**: รองรับการใส่ API Key หลายตัว และสลับใช้งานแบบสุ่ม (Rotation) เพื่อป้องกันปัญหา API Limit
- **UI/UX ทันสมัย**: ออกแบบหน้าจอให้สวยงาม ใช้งานง่าย รองรับทั้งบนมือถือและคอมพิวเตอร์

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

- **Frontend**: Next.js 14, React, CSS
- **Backend/API**: Next.js App Router (Serverless Functions)
- **AI Engine**: Vercel AI SDK, Google Generative AI (Gemini)
- **Deployment**: Vercel (รองรับ CI/CD อัตโนมัติ)

## 🚀 วิธีการติดตั้งและรันโปรเจกต์ (Installation & Setup)

1. **โคลนโปรเจกต์ (Clone Repository)**
   ```bash
   git clone https://github.com/phitwashnu1-pixel/DIT-chatbot.git
   cd DIT-chatbot
   ```

2. **ติดตั้ง Dependencies**
   ```bash
   npm install
   ```

3. **ตั้งค่า Environment Variables**
   สร้างไฟล์ `.env.local` ในโฟลเดอร์หลักของโปรเจกต์ และใส่ API Key ของ Google Gemini ดังนี้:
   ```env
   GEMINI_KEY_1=your_api_key_here
   GEMINI_KEY_2=your_api_key_here
   GEMINI_KEY_3=your_api_key_here
   GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
   ```

4. **รันเซิร์ฟเวอร์จำลอง (Development Server)**
   ```bash
   npm run dev
   ```
   เปิดเว็บเบราว์เซอร์ไปที่ `http://localhost:3000` เพื่อเริ่มใช้งาน

## 📁 โครงสร้างโฟลเดอร์ (Folder Structure)

- `/src/app`: หน้าจอหลัก (Frontend) และ API Backend (Route)
- `/Data`: แหล่งเก็บข้อมูลฐานข้อมูล JSON (ตารางเรียน, ข้อมูลอาจารย์, ฯลฯ)
- `/scripts`: สคริปต์เสริมสำหรับรวบรวมข้อมูล JSON ก่อน Build ขึ้น Server
- `/public`: ไฟล์รูปภาพ ไอคอน โลโก้

## 📝 คู่มือการใช้งานเชิงลึก

สำหรับผู้ดูแลระบบหรือนักพัฒนาที่ต้องการแก้ไขข้อมูลฐานข้อมูล (เพิ่ม/ลดตารางเรียน หรือข้อมูลอาจารย์) สามารถอ่านคู่มือการตั้งค่าแบบละเอียดได้ที่ไฟล์ `DIT_ChatBot_Manual.md` ภายในโปรเจกต์นี้ครับ

---
พัฒนาและดูแลระบบโดย: **DIT Department**
