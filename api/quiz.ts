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
    const { vocabList, grammarList, customPrompt, apiKey } = req.body;
    const key = apiKey || process.env.DEEPSEEK_API_KEY;
    
    if (!key) {
      return res.status(400).json({ error: "请先在设置中绑定您的 DeepSeek API Key" });
    }

    const openai = new OpenAI({
      apiKey: key,
      baseURL: "https://api.deepseek.com",
    });

    const defaultSystemPrompt = `You are a fun, energetic (genki) Japanese teacher. 
Create a short quiz based on the user's vocabulary and grammar list.
Include 3-5 questions. Use markdown. Hide answers in a <details> tag.
Be very encouraging and use emoticons like (≧◡≦) or (´• ω •\`)!`;

    const finalSystemPrompt = customPrompt 
      ? `${defaultSystemPrompt}\n\nUser Preferences/Requirements:\n${customPrompt}`
      : defaultSystemPrompt;

    const userMessage = `Vocabulary:\n${JSON.stringify(vocabList)}\n\nGrammar:\n${JSON.stringify(grammarList)}\n\nPlease generate the quiz now.`;

    const response = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: finalSystemPrompt },
        { role: "user", content: userMessage }
      ],
      temperature: 0.7,
    });

    res.status(200).json({ text: response.choices[0].message.content });
  } catch (error: any) {
    console.error("Quiz generation error:", error);
    res.status(500).json({ error: error.message });
  }
}
