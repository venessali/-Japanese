import express from "express";
import { createServer as createViteServer } from "vite";
import OpenAI from "openai";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize OpenAI client for DeepSeek
  let openaiClient: OpenAI | null = null;
  function getOpenAI() {
    if (!openaiClient) {
      const key = process.env.DEEPSEEK_API_KEY;
      if (!key) {
        throw new Error("DEEPSEEK_API_KEY environment variable is required");
      }
      openaiClient = new OpenAI({
        apiKey: key,
        baseURL: "https://api.deepseek.com", // DeepSeek API base URL
      });
    }
    return openaiClient;
  }

  // API Routes
  app.post("/api/quiz", async (req, res) => {
    try {
      const { vocabList, grammarList, customPrompt } = req.body;
      const openai = getOpenAI();

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

      res.json({ text: response.choices[0].message.content });
    } catch (error: any) {
      console.error("Quiz generation error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/dictionary", async (req, res) => {
    try {
      const { text } = req.body;
      const openai = getOpenAI();

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
