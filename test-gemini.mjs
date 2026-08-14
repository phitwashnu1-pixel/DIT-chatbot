import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const customGoogle = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "dummy-key",
});

async function testModel(modelName) {
  try {
    const result = await generateText({
      model: customGoogle(modelName),
      prompt: "Hello",
    });
    console.log(modelName + " SUCCEEDED: " + result.text);
  } catch (e) {
    console.log(modelName + " FAILED: " + e.message);
  }
}

await testModel('gemini-1.5-flash');
await testModel('gemini-1.5-pro');
await testModel('gemini-pro');
