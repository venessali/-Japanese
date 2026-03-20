import express from "express";
import { createServer as createViteServer } from "vite";
import OpenAI from "openai";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize OpenAI client for DeepSeek
  function getOpenAI(userApiKey?: string) {
    const key = userApiKey || process.env.DEEPSEEK_API_KEY;
    if (!key) {
      throw new Error("请先在设置中绑定您的 DeepSeek API Key");
    }
    return new OpenAI({
      apiKey: key,
      baseURL: "https://api.deepseek.com", // DeepSeek API base URL
    });
  }

  // API Routes
  app.post("/api/ai", async (req, res) => {
    try {
      const { contents, systemInstruction, responseMimeType, responseSchema, apiKey } = req.body;
      const openai = getOpenAI(apiKey);
      
      // Map Gemini-style contents to OpenAI-style messages
      const messages: any[] = [];
      if (systemInstruction) {
        messages.push({ role: "system", content: systemInstruction });
      }

      if (contents) {
        contents.forEach((content: any) => {
          messages.push({
            role: content.role === 'model' ? 'assistant' : content.role,
            content: content.parts[0].text
          });
        });
      }

      const response = await openai.chat.completions.create({
        model: "deepseek-chat",
        messages,
        response_format: responseMimeType === 'application/json' ? { type: 'json_object' } : undefined,
        temperature: 0.7,
      });

      res.json({ text: response.choices[0].message.content });
    } catch (error: any) {
      console.error("DeepSeek API error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/quiz", async (req, res) => {
    try {
      const { vocabList, grammarList, customPrompt, apiKey, messages, action } = req.body;
      const openai = getOpenAI(apiKey);

      const systemPrompt = `You are a fun, energetic (genki) Japanese teacher.
You are conducting a multi-turn interactive quiz.
Rules:
1. 使用简体中文作为出题和讲解语言。
2. 语言风格简练准确。
3. If the user asks to start a quiz, generate 3-5 questions based on their vocabulary and grammar list. DO NOT provide the answers yet. Ask the user to reply with their answers.
4. When the user replies with their answers, evaluate them carefully. Point out any mistakes, explain the corrections gently, and give a final score. Use emoticons like (≧◡≦) or (´• ω •\`)!
5. Keep the formatting clean using Markdown.

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

      res.json({ text: response.choices[0].message.content });
    } catch (error: any) {
      console.error("Quiz generation error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/dictionary", async (req, res) => {
    try {
      const { text, apiKey } = req.body;
      const openai = getOpenAI(apiKey);

      const response = await openai.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          { 
            role: "system", 
            content: "你是一个有用的日语词典助手。请必须使用简体中文进行回答，提供简练准确的翻译和讲解。请提供给定日语文本的简短解释、发音（平假名/罗马音）以及一个简单的例句。例句中的汉字必须用括号标明平假名（例如：私（わたし））。保持回答简明扼要。" 
          },
          { role: "user", content: text }
        ],
        temperature: 0.3,
      });

      res.json({ text: response.choices[0].message.content });
    } catch (error: any) {
      console.error("Dictionary lookup error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
