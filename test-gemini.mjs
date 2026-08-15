import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const customGoogle = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_KEY_2,
});

async function run() {
  try {
    const res = await generateText({
      model: customGoogle('gemini-3.5-flash'),
      system: `คุณคือ DIT ChatBot สำหรับตอบคำถามตารางสอน
ข้อมูลอ้างอิง:
{
  "teachers": [
    {
      "fileName": "ปาณวัฐ",
      "data": {
        "teacher": "นายปาณวัฐ รักรอดจิต",
        "schedule": [ { "day": "วันศุกร์", "classes": [ { "subject_code": "21910-2012" } ] } ]
      }
    }
  ]
}
ตอบด้วยตาราง (Markdown Table) เท่านั้น ห้ามพิมพ์ข้อความอื่น
`,
      messages: [
        { role: 'user', content: 'ต้องการสอบถามตารางสอนครู' },
        { role: 'assistant', content: 'ยินดีครับ ต้องการดูตารางสอนของครูท่านใดครับ? (เช่น ครูปัญญา, ครูกนกวรรณ)' },
        { role: 'user', content: 'ครูปาณวัฐ' }
      ]
    });
    console.log("Response:", res.text);
    console.log("Finish Reason:", res.finishReason);
  } catch (e) {
    console.error(e);
  }
}

run();
