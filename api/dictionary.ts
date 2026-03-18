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
    const { text, apiKey } = req.body;
    const key = apiKey || process.env.DEEPSEEK_API_KEY;
    
    if (!key) {
      return res.status(400).json({ error: "请先在设置中绑定您的 DeepSeek API Key" });
    }

    const openai = new OpenAI({
      apiKey: key,
      baseURL: "https://api.deepseek.com",
    });

    const response = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { 
          role: "system", 
          content: "You are a helpful Japanese dictionary assistant. Provide a brief explanation, pronunciation (hiragana/romaji), and one simple example sentence for the given Japanese text. Keep it concise." 
        },
        { role: "user", content: text }
      ],
      temperature: 0.3,
    });

    res.status(200).json({ text: response.choices[0].message.content });
  } catch (error: any) {
    console.error("Dictionary lookup error:", error);
    res.status(500).json({ error: error.message });
  }
}
