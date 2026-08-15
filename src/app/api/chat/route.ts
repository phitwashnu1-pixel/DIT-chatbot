import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import fs from 'fs';
import path from 'path';

// Note: In Next.js, importing JSON statically is safe, but since it's generated, we'll read it dynamically to avoid build-time issues if not ready, or we can just import it statically since we have a predev/prebuild step.
const dataPath = path.join(process.cwd(), 'src', 'data.json');
const allData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

// Build a global dictionary of subject_code -> subject_name
const subjectDictionary: Record<string, string> = {};
if (allData.teachers) {
  allData.teachers.forEach((t: any) => {
    if (t.data.subjects && Array.isArray(t.data.subjects)) {
      t.data.subjects.forEach((subj: any) => {
        if (subj.subject_code && subj.subject_name) {
          subjectDictionary[subj.subject_code] = subj.subject_name;
        }
      });
    }
  });
}

export const maxDuration = 30; // 30 seconds limit for Vercel

function extractRelevantData(query: string) {
  // Short-circuit for Quick Actions to maximize speed and save tokens
  const exactQuickActions = [
    "ต้องการสอบถามตารางเรียน",
    "ต้องการสอบถามตารางสอนครู",
    "ต้องการสอบถามตารางการใช้ห้อง",
    "ต้องการสอบถามวิธีการใช้งาน"
  ];
  if (exactQuickActions.includes(query.trim())) {
    return { status: "quick_action_clarification" };
  }

  // Normalize query: remove spaces and convert slashes/dashes to be uniform
  const normalizedQuery = query.toLowerCase().replace(/\s+/g, '').replace(/\//g, '-');
  
  // RAG Logic: Check if filename, actual name, or aliases (text in parentheses) match the query
  const matchedClassrooms = allData.classrooms.filter((c: any) => {
    const roomName = (c.data.room || "").toLowerCase().replace(/\s+/g, '').replace(/\//g, '-');
    const fileName = c.fileName.toLowerCase().replace(/\s+/g, '').replace(/\//g, '-');
    const aliasMatch = roomName.match(/\((.*?)\)/);
    const alias = aliasMatch ? aliasMatch[1] : null;
    
    return normalizedQuery.includes(fileName) || 
           normalizedQuery.includes(roomName) || 
           (alias && normalizedQuery.includes(alias));
  });

  const matchedTeachers = allData.teachers.filter((t: any) => {
    const teacherName = (t.data.teacher || "").toLowerCase().replace(/\s+/g, '').replace(/\//g, '-');
    const fileName = t.fileName.toLowerCase().replace(/\s+/g, '').replace(/\//g, '-');
    return normalizedQuery.includes(fileName) || normalizedQuery.includes(teacherName);
  });

  const matchedTimetables = allData.timetables.filter((t: any) => {
    const className = (t.data.class || "").toLowerCase().replace(/\s+/g, '').replace(/\//g, '-');
    let fileName = t.fileName.toLowerCase().replace(/\s+/g, '').replace(/\//g, '-');
    fileName = fileName.replace('.json', '');
    
    const matchTerms = [fileName, className];
    
    // Add Synonyms for Majors
    if (fileName.includes('ธดท')) matchTerms.push(fileName.replace('ธดท', 'ธุรกิจดิจิทัล'));
    if (fileName.includes('it')) {
       matchTerms.push(fileName.replace('it', 'เทคโนโลยีสารสนเทศ'));
       matchTerms.push(fileName.replace('it', 'ไอที'));
    }
    if (fileName.includes('เว็บ')) {
       matchTerms.push(fileName.replace('เว็บ', 'เทคโนโลยีสารสนเทศ'));
       matchTerms.push(fileName.replace('เว็บ', 'ไอที'));
    }
    if (fileName.includes('เกม')) {
       matchTerms.push(fileName.replace('เกม', 'คอมพิวเตอร์เกมและแอนิเมชัน'));
       matchTerms.push(fileName.replace('เกม', 'คอมพิวเตอร์เกม'));
    }
    
    const cleanStr = (s: string) => s.replace(/\./g, '');
    // Remove "ปวช" because filenames don't include it (e.g., 1-1ธดท instead of ปวช1-1ธดท), but keep ปวส because files do use it.
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
  
  // Fallback: Do NOT send allData (250kb). This causes massive latency (slow response).
  // Instead, return list of available classes and teachers so the AI can guide the user.
  const availableClasses = allData.timetables.map((t: any) => t.data.class || t.fileName.replace('.json', ''));
  const availableTeachers = allData.teachers.map((t: any) => t.data.teacher || t.fileName.replace('.json', ''));
  return {
    status: "not_found",
    message: "ไม่พบข้อมูลที่ตรงกับคำถามเป๊ะๆ โปรดใช้ available_classes และ available_teachers เพื่อช่วยแนะนำตัวเลือกให้ผู้ใช้",
    available_classes: availableClasses,
    available_teachers: availableTeachers
  };
}

export async function POST(req: Request) {
  const { messages } = await req.json();
  const latestMessage = messages[messages.length - 1];
  
  const relevantData = extractRelevantData(latestMessage.content);

  let contextString = "";
  if (relevantData) {
    contextString = `\n\nข้อมูลอ้างอิงสำหรับตอบคำถาม (JSON):\n${JSON.stringify(relevantData, null, 2)}`;
  } else {
    contextString = `\n\nข้อมูลอ้างอิงสำหรับตอบคำถาม (JSON):\nไม่มีข้อมูลที่เกี่ยวข้องในระบบ`;
  }

  // Get real-time date and time
  const now = new Date();
  const thaiDateFormatter = new Intl.DateTimeFormat('th-TH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Bangkok',
  });
  const thaiTimeFormatter = new Intl.DateTimeFormat('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Bangkok',
  });
  const currentDateStr = thaiDateFormatter.format(now);
  const currentTimeStr = thaiTimeFormatter.format(now) + " น.";

  const systemPrompt = `คุณคือ "DIT ChatBot" ผู้ช่วยอัจฉริยะอย่างเป็นทางการสำหรับให้บริการ ข้อมูลตารางเรียน ตารางสอน และตารางการใช้ห้อง ของแผนกธุรกิจดิจิทัลและเทคโนโลยีสารสนเทศ วิทยาลัยอาชีวศึกษาสุราษฎร์ธานี
  
ข้อมูลเวลาปัจจุบัน (Real-time):
- วันนี้คือ: ${currentDateStr}
- เวลาปัจจุบัน: ${currentTimeStr}
(หากผู้ใช้ถามคำถามที่เกี่ยวกับ "วันนี้", "พรุ่งนี้" หรือเวลาปัจจุบัน ให้ใช้อ้างอิงจากข้อมูลด้านบนนี้)

บริบทและหน้าที่ของคุณ:
1. การแนะนำตัว: หากเป็นการทักทายครั้งแรก หรือผู้ใช้ส่งคำทักทายทั่วไป ให้คุณตอบกลับด้วยข้อความนี้เท่านั้น ห้ามแก้ไขดัดแปลง:
"สวัสดีครับ ยินดีที่ได้รู้จักนะครับ! 😊 

ผมคือ DIT ChatBot ผู้ช่วยอัจฉริยะอย่างเป็นทางการ สำหรับให้บริการข้อมูลตารางเรียน ตารางสอน และตารางการใช้ห้อง ของแผนกธุรกิจดิจิทัลและเทคโนโลยีสารสนเทศ วิทยาลัยอาชีวศึกษาสุราษฎร์ธานีครับ 💻✨

วันนี้คุณต้องการให้ผมช่วยเหลือหรือสอบถามข้อมูลตารางเรียน ตารางสอนของครูท่านใด หรือตารางการใช้ห้องเรียนห้องไหน สามารถพิมพ์บอกมาได้เลยนะครับ! ยินดีให้บริการครับ 👇💬"

2. การตอบคำถาม: ตอบคำถามเกี่ยวกับตารางเรียน ตารางสอน และการใช้งานห้องเรียน โดยอ้างอิงข้อมูลจาก JSON context ด้านล่างอย่างเคร่งครัด ห้ามคิดข้อมูลขึ้นมาเองเด็ดขาด
   - **สำคัญมาก:** ให้แสดง "ชื่อวิชา" เสมอ โดยดูชื่อวิชาจาก \`subject_dictionary\` ที่แนบไปให้ใน Context เทียบกับรหัสวิชา (subject_code)
3. รูปแบบการตอบ (Response Format): 
   - จัดรูปแบบการตอบกลับให้สวยงาม อ่านง่าย และเป็นระเบียบ
   - **คำศัพท์ที่ใช้:** ห้ามใช้คำว่า "อาจารย์" โดยเด็ดขาด ให้ใช้คำว่า "ครู" แทนในทุกกรณี (เช่น ครู, ครูผู้สอน, ห้องพักครู)
   - **สรรพนาม:** ให้ใช้คำว่า "ผม" แทนตัวเอง และลงท้ายด้วย "ครับ" หรือ "นะครับ" เสมอ
   - **ข้อห้ามเด็ดขาด:** ห้ามพิมพ์เครื่องหมายดอกจันทร์ (*) หรือทำตัวหนาด้วยดอกจันทร์ (เช่น **ข้อความ**) มาในคำตอบอย่างเด็ดขาด
   - ใส่อีโมจิ (Emoji) เพื่อเพิ่มความน่าสนใจและเป็นมิตรได้
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
   - หากผู้ใช้พิมพ์ว่า "ต้องการสอบถามวิธีการใช้งาน" ให้คุณตอบแนะนำเบื้องต้นว่า "ระบบนี้สามารถช่วยดูตารางเรียน ตารางสอนของครู และตารางการใช้ห้องได้ครับ ลองพิมพ์สอบถามมาได้เลย เช่น 'ขอตารางเรียน ปวช.1 IT', 'ครูสมจิตรสอนห้องไหนบ้าง' เป็นต้นครับ"
   - หากผู้ใช้ถามคลุมเครือในเรื่องอื่นๆ เช่น "ห้อง 3/2 มีเรียนไหม" (โดยไม่ระบุสาขา) ให้คุณถามกลับสั้นๆ ทันทีว่า "อยู่สาขาธุรกิจดิจิทัล, เทคโนโลยีสารสนเทศ หรือ คอมพิวเตอร์เกมและแอนิเมชัน ครับ?" เพื่อความแม่นยำ ห้ามเดาหรืออนุมานข้อมูลเอาเองเด็ดขาด
${contextString}`;

  // Randomly select an API key to avoid rate limits
  // SECURITY NOTE: Hardcoded keys should be moved to Vercel Environment Variables in production!
  const apiKeys = [
    process.env.GEMINI_KEY_1,
    process.env.GEMINI_KEY_2,
    process.env.GEMINI_KEY_3,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY
  ].filter(Boolean); // Remove any undefined keys

  // Shuffle keys to distribute load and prepare for retry loop
  const shuffledKeys = apiKeys.sort(() => Math.random() - 0.5);
  
  let lastError: any = null;

  // Retry logic: If one API key is rate-limited, try the next one automatically
  for (const apiKey of shuffledKeys) {
    try {
      const customGoogle = createGoogleGenerativeAI({
        apiKey: apiKey as string,
      });

      const result = await streamText({
        model: customGoogle('gemini-3.5-flash', {
          safetySettings: [
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' }
          ]
        }),
        system: systemPrompt,
        messages: messages.slice(-6),
        onFinish: ({ usage }) => {
          // Token Usage Backend Logger
          console.log(`[TOKEN LOG] Model: gemini-3.5-flash | Key: ***${(apiKey as string).slice(-4)} | Prompt: ${usage.promptTokens} | Completion: ${usage.completionTokens} | Total: ${usage.totalTokens}`);
        }
      });
      return result.toDataStreamResponse();
    } catch (error: any) {
      console.error(`Gemini API Error with key (ending in ${(apiKey as string).slice(-4)}):`, error.message);
      lastError = error;
      // Continue to the next key if rate limited or failed
      continue;
    }
  }

  // If ALL keys fail, return a friendly error message to the user as a normal message
  console.error("All API keys failed. Last error:", lastError);
  return new Response("🚨 **ระบบขัดข้องชั่วคราว:** ขณะนี้มีผู้ใช้งานระบบจำนวนมาก (API Limit Reached) หรือโควต้าการใช้งานเต็ม กรุณาลองใหม่อีกครั้งในอีกสักครู่ครับ 🙏", { 
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}
