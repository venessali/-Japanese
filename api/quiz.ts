import OpenAI from "openai";

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { vocabList, grammarList, customPrompt, apiKey, messages, action } = req.body;
    const key = apiKey || process.env.DEEPSEEK_API_KEY;
    
    if (!key) {
      return res.status(400).json({ error: "请先在设置中绑定您的 DeepSeek API Key" });
    }

    const openai = new OpenAI({
      apiKey: key,
      baseURL: "https://api.deepseek.com",
    });

    const systemPrompt = `You are a fun, energetic (genki) Japanese teacher.
You are conducting a multi-turn interactive quiz.
Rules:
1. If the user asks to start a quiz, generate 3-5 questions based on their vocabulary and grammar list. DO NOT provide the answers yet. Ask the user to reply with their answers.
2. When the user replies with their answers, evaluate them carefully. Point out any mistakes, explain the corrections gently, and give a final score. Use emoticons like (≧◡≦) or (´• ω •\`)!
3. Keep the formatting clean using Markdown.

User's Data Context:
Vocabulary: ${JSON.stringify(vocabList || [])}
Grammar: ${JSON.stringify(grammarList || [])}`;

    const finalSystemPrompt = customPrompt 
      ? `${systemPrompt}\n\nUser Preferences/Requirements:\n${customPrompt}`
      : systemPrompt;

    let apiMessages: any[] = [{ role: "system", content: finalSystemPrompt }];

    if (action === 'start') {
      const userMessage = `Please generate the quiz questions now based on my data. Remember, DO NOT show the answers yet. Wait for my reply.`;
      apiMessages.push({ role: "user", content: userMessage });
    } else if (action === 'chat') {
      apiMessages = apiMessages.concat(messages);
    }

    const response = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: apiMessages,
      temperature: 0.7,
    });

    res.status(200).json({ text: response.choices[0].message.content });
  } catch (error: any) {
    console.error("Quiz generation error:", error);
    res.status(500).json({ error: error.message });
  }
}
