import fs from 'fs';
import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const allData = JSON.parse(fs.readFileSync('src/data.json', 'utf-8'));

const subjectDictionary = {};
if (allData.teachers) {
  allData.teachers.forEach((t) => {
    if (t.data.subjects && Array.isArray(t.data.subjects)) {
      t.data.subjects.forEach((subj) => {
        if (subj.subject_code && subj.subject_name) {
          subjectDictionary[subj.subject_code] = subj.subject_name;
        }
      });
    }
  });
}

function extractRelevantData(query) {
  const normalizedQuery = query.toLowerCase().replace(/\s+/g, '').replace(/\//g, '-');
  
  const matchedClassrooms = allData.classrooms.filter((c) => {
    const roomName = (c.data.room || "").toLowerCase().replace(/\s+/g, '').replace(/\//g, '-');
    const fileName = c.fileName.toLowerCase().replace(/\s+/g, '').replace(/\//g, '-');
    const aliasMatch = roomName.match(/\((.*?)\)/);
    const alias = aliasMatch ? aliasMatch[1] : null;
    return normalizedQuery.includes(fileName) || 
           normalizedQuery.includes(roomName) || 
           (alias && normalizedQuery.includes(alias));
  });

  const matchedTeachers = allData.teachers.filter((t) => {
    const teacherName = (t.data.teacher || "").toLowerCase().replace(/\s+/g, '').replace(/\//g, '-');
    const fileName = t.fileName.toLowerCase().replace(/\s+/g, '').replace(/\//g, '-');
    return normalizedQuery.includes(fileName) || normalizedQuery.includes(teacherName);
  });

  const matchedTimetables = allData.timetables.filter((t) => {
    const className = (t.data.class || "").toLowerCase().replace(/\s+/g, '').replace(/\//g, '-');
    let fileName = t.fileName.toLowerCase().replace(/\s+/g, '').replace(/\//g, '-');
    fileName = fileName.replace('.json', '');
    
    const matchTerms = [fileName, className];
    if (fileName.includes('ธดท')) matchTerms.push(fileName.replace('ธดท', 'ธุรกิจดิจิทัล'));
    
    const cleanStr = (s) => s.replace(/\./g, '');
    const cleanQuery = cleanStr(normalizedQuery.replace(/ปวช\.?/g, '')); 
    const cleanNormQuery = cleanStr(normalizedQuery);
    
    return matchTerms.some(term => cleanQuery.includes(cleanStr(term)) || cleanNormQuery.includes(cleanStr(term)));
  });
  
  const hasMatches = matchedClassrooms.length > 0 || matchedTeachers.length > 0 || matchedTimetables.length > 0;
  
  if (hasMatches) {
    return {
      classrooms: matchedClassrooms,
      teachers: matchedTeachers,
      timetables: matchedTimetables,
      subject_dictionary: subjectDictionary,
    };
  }
  return null;
}

const relevantData = extractRelevantData("ครูปาณวัฐ");
const contextString = `\n\nข้อมูลอ้างอิงสำหรับตอบคำถาม (JSON):\n${JSON.stringify(relevantData, null, 2)}`;

const systemPrompt = `คุณคือ "DIT ChatBot" ผู้ช่วยอัจฉริยะอย่างเป็นทางการสำหรับให้บริการ ข้อมูลตารางเรียน ตารางสอน และตารางการใช้ห้อง ของแผนกธุรกิจดิจิทัลและเทคโนโลยีสารสนเทศ วิทยาลัยอาชีวศึกษาสุราษฎร์ธานี

**กฎเหล็กที่คุณต้องทำตามอย่างเคร่งครัดที่สุด (Strict Rules):**
1. การแนะนำตัว: หากเป็นการทักทายครั้งแรก หรือผู้ใช้ส่งคำทักทายทั่วไป ให้คุณตอบกลับด้วยข้อความนี้เท่านั้น ห้ามแก้ไขดัดแปลง:
"สวัสดีครับ ยินดีที่ได้รู้จักนะครับ! 😊 \n\nผมคือ DIT ChatBot ผู้ช่วยอัจฉริยะอย่างเป็นทางการ สำหรับให้บริการข้อมูลตารางเรียน ตารางสอน และตารางการใช้ห้อง ของแผนกธุรกิจดิจิทัลและเทคโนโลยีสารสนเทศ วิทยาลัยอาชีวศึกษาสุราษฎร์ธานีครับ 💻✨\n\nวันนี้คุณต้องการให้ผมช่วยเหลือหรือสอบถามข้อมูลตารางเรียน ตารางสอนของครูท่านใด หรือตารางการใช้ห้องเรียนห้องไหน สามารถพิมพ์บอกมาได้เลยนะครับ! ยินดีให้บริการครับ 👇💬"
2. การตอบคำถาม: ตอบคำถามเกี่ยวกับตารางเรียน ตารางสอน และการใช้งานห้องเรียน โดยอ้างอิงข้อมูลจาก JSON context ด้านล่างอย่างเคร่งครัด ห้ามคิดข้อมูลขึ้นมาเองเด็ดขาด
   - **สำคัญมาก:** ให้แสดง "ชื่อวิชา" เสมอ โดยดูชื่อวิชาจาก \`subject_dictionary\` ที่แนบไปให้ใน Context เทียบกับรหัสวิชา (subject_code)
3. รูปแบบการตอบ (Response Format): 
   - ให้ตอบด้วยข้อความที่อ่านง่าย เป็นมิตร มีการเว้นบรรทัดและใช้ Emoji อย่างเหมาะสม
   - **ข้อห้ามเด็ดขาด:** ห้ามพิมพ์เครื่องหมายดอกจันทร์ (*) หรือทำตัวหนาด้วยดอกจันทร์ (เช่น **ข้อความ**) มาในคำตอบอย่างเด็ดขาด
   - **สำคัญมาก:** เมื่อต้องแสดงข้อมูลตารางเรียน ตารางสอน หรือการใช้งานห้องเรียน **ให้สร้างเป็นตาราง (Markdown Table) เสมอ** ไม่ว่าจะมีกี่วิชาก็ตาม (ห้ามใช้แค่ Bullet points เพื่อให้ข้อมูลดูเป็นระเบียบและสวยงามที่สุด)
   - รูปแบบตารางที่แนะนำ:
     | วัน/เวลา | วิชา (รหัสวิชา) | ครูผู้สอน | กลุ่มเรียน |
     |---|---|---|---|
     | (ข้อมูล) | (ข้อมูล) | (ข้อมูล) | (ข้อมูล) |
   - หากมีหลายรายการ ให้ใช้ตารางเดียวแล้วเพิ่มบรรทัดเอา
4. กรณีไม่พบข้อมูล หรือสะกดผิด: 
   - หากใน context ระบุว่า "status: not_found" พร้อมกับ \`available_classes\` ให้คุณพิจารณาคำถามของผู้ใช้ หากผู้ใช้ถามกว้างๆ (เช่น "ปวช 2 ธุรกิจ") ให้คุณตอบกลับโดย **ดึงรายชื่อกลุ่มเรียนจาก available_classes ที่ใกล้เคียงมาแนะนำให้ผู้ใช้เลือก** เช่น "ระบบมีข้อมูลของ 682190101 IT 2/1 และ 682191001 ธดท. ครับ ต้องการดูตารางของห้องไหนครับ?"
   - หากไม่มีข้อมูลใกล้เคียงในระบบจริงๆ ให้ตอบว่า "ขออภัยครับ ไม่พบข้อมูลในระบบ กรุณาติดต่อสอบถามที่ห้องพักครูแผนกธุรกิจดิจิทัลฯ นะครับ"
5. ทัศนคติ (Tone): สุภาพ เป็นกันเอง เป็นมิตร (เป็นผู้ชาย) และให้ความช่วยเหลืออย่างเต็มที่
6. ความกระชับ (Conciseness): ให้ตอบคำถามแบบสั้น กระชับ ตรงประเด็นที่สุด เพื่อประหยัด Token ห้ามยกตัวอย่างหรืออธิบายเยิ่นเย้อ หากตอบเป็นตารางได้ ให้ตอบแค่ตารางและคำอธิบายสั้นๆ 1-2 ประโยคเท่านั้น
7. การสอบถามข้อมูลเพิ่มเติม (Clarification): 
   - หากผู้ใช้พิมพ์ว่า "ต้องการสอบถามตารางเรียน" ให้คุณถามกลับสั้นๆ ว่า "ยินดีครับ ต้องการดูตารางเรียนของกลุ่มเรียนไหน หรือสาขาอะไรครับ? (เช่น ปวช.1/1 ธุรกิจดิจิทัล, ปวส.2 IT)"
   - หากผู้ใช้พิมพ์ว่า "ต้องการสอบถามตารางการใช้ห้อง" ให้คุณถามกลับสั้นๆ ว่า "ยินดีครับ ต้องการตรวจสอบตารางการใช้ห้องของห้องไหนครับ? (เช่น ห้อง 442, ห้อง 443)"
   - หากผู้ใช้พิมพ์ว่า "ต้องการสอบถามตารางสอนครู" ให้คุณถามกลับสั้นๆ ว่า "ยินดีครับ ต้องการดูตารางสอนของครูท่านใดครับ? (เช่น ครูปัญญา, ครูกนกวรรณ)"
   - หากผู้ใช้พิมพ์ว่า "ต้องการสอบถามวิธีการใช้งาน" ให้คุณแนะนำวิธีการพิมพ์ถามสั้นๆ เช่น "คุณสามารถพิมพ์ถามผมได้เลยครับ เช่น 'ตารางเรียน ปวช 2 IT', 'ครูปัญญา สอนวันไหน', หรือ 'ห้อง 442 ว่างตอนไหน'"${contextString}`;

const customGoogle = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_KEY_2,
});

async function run() {
  try {
    const res = await generateText({
      model: customGoogle('gemini-3.5-flash'),
      system: systemPrompt,
      messages: [
        { role: 'user', content: 'ต้องการสอบถามตารางสอนครู' },
        { role: 'assistant', content: 'ยินดีครับ ต้องการดูตารางสอนของครูท่านใดครับ? (เช่น ครูปัญญา, ครูกนกวรรณ)' },
        { role: 'user', content: 'ครูปาณวัฐ' }
      ]
    });
    console.log("Response length:", res.text.length);
    console.log("Response text:", res.text);
    console.log("Finish Reason:", res.finishReason);
  } catch (e) {
    console.error(e);
  }
}

run();
