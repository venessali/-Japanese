import express from "express";
import { createServer as createViteServer } from "vite";
import OpenAI from "openai";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize OpenAI client for DeepSeek
  function getOpenAI(userApiKey?: string, apiBaseUrl?: string) {
    const key = userApiKey || process.env.DEEPSEEK_API_KEY;
    if (!key) {
      throw new Error("请先在设置中绑定您的 DeepSeek API Key");
    }
    return new OpenAI({
      apiKey: key,
      baseURL: apiBaseUrl || "https://api.deepseek.com", // DeepSeek API base URL
    });
  }

  // Helper to parse AI JSON responses that might contain markdown code blocks
  function parseAIResponse(content: string) {
    if (!content) return {};
    try {
      return JSON.parse(content);
    } catch (e) {
      try {
        const match = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (match && match[1]) {
          return JSON.parse(match[1]);
        }
        const firstBrace = content.indexOf('{');
        const lastBrace = content.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          return JSON.parse(content.substring(firstBrace, lastBrace + 1));
        }
        throw new Error("Could not extract JSON from response.");
      } catch (innerError) {
        console.error("Failed to parse AI response:", content);
        throw new Error("Invalid response format from AI");
      }
    }
  }

  // API Routes
  app.post("/api/quiz", async (req, res) => {
    try {
      const { vocabList, grammarList, customPrompt, apiKey, apiBaseUrl, apiModelName } = req.body;
      const openai = getOpenAI(apiKey, apiBaseUrl);

      const systemPrompt = `你是一个活泼的日语老师。请根据用户的词汇和语法列表，生成5道单项选择题。
      【严格要求】：
      1. 必须使用简体中文作为出题、翻译和讲解的语言，严禁使用繁体中文或其他语言。
      2. 必须且只能返回一个合法的 JSON 对象，不要包含任何 Markdown 标记（如 \`\`\`json）。
      3. JSON 格式必须包含一个 'questions' 数组。
      
      每道题包含以下字段：
      - question: 题目内容（如果是填空题，请用 ___ 表示空缺）
      - options: 4个选项的字符串数组
      - correctAnswerIndex: 正确选项的索引（0-3的整数）
      - explanation: 详细的错题解析，解释为什么选这个，其他选项为什么错。
      
      示例格式：
      {
        "questions": [
          {
            "question": "「食べる」的被动语态是___？",
            "options": ["食べられる", "食べさせる", "食べる", "食べた"],
            "correctAnswerIndex": 0,
            "explanation": "「食べる」是一段动词，其被动语态是将「る」变成「られる」，即「食べられる」。其他选项分别是使役态、原形和过去式。"
          }
        ]
      }
      
      用户数据：
      词汇：${JSON.stringify(vocabList || [])}
      语法：${JSON.stringify(grammarList || [])}`;

      const finalSystemPrompt = customPrompt 
        ? `${systemPrompt}\n\n用户的特殊要求：\n${customPrompt}`
        : systemPrompt;

      const response = await openai.chat.completions.create({
        model: apiModelName || "deepseek-chat",
        messages: [
          { role: "system", content: finalSystemPrompt },
          { role: "user", content: "请生成5道选择题。" }
        ],
        temperature: 0.7,
      });

      res.json(parseAIResponse(response.choices[0].message.content || "{}"));
    } catch (error: any) {
      console.error("Quiz generation error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/dictionary", async (req, res) => {
    try {
      const { text, apiKey, apiBaseUrl, apiModelName } = req.body;
      const openai = getOpenAI(apiKey, apiBaseUrl);

      const response = await openai.chat.completions.create({
        model: apiModelName || "deepseek-chat",
        messages: [
          { 
            role: "system", 
            content: `你是一个中日词典助手。你的任务是将用户输入的日语翻译成中文，并用中文进行简短解释。
            【最高指令】：
            除了日文原词、假名读音和日文例句本身外，所有的解释、翻译、语法说明等必须100%使用简体中文。
            绝对不允许用全日语回复！`
          },
          { role: "user", content: `请用简体中文解释这个日语单词/句子，提供发音（平假名/罗马音）以及一个简单的例句（例句中的汉字用括号标明平假名）：\n\n${text}` }
        ],
        temperature: 0.3,
      });

      res.json({ text: response.choices[0].message.content });
    } catch (error: any) {
      console.error("Dictionary lookup error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/vocab-lookup", async (req, res) => {
    try {
      const { word, apiKey, apiBaseUrl, apiModelName } = req.body;
      const openai = getOpenAI(apiKey, apiBaseUrl);

      const response = await openai.chat.completions.create({
        model: apiModelName || "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `你是一个专业的日语老师。请为给定的日语单词提供详细信息。
            【严格要求】：
            1. 必须使用简体中文进行解释和翻译，严禁使用繁体中文或其他语言。
            2. 必须且只能返回一个合法的 JSON 对象，不要包含任何 Markdown 标记（如 \`\`\`json）。
            
            请以 JSON 格式返回，包含以下字段：
            - reading: 假名读音
            - pitchAccent: 声调（如 0, 1）
            - meaning: 中文含义
            - notes: 包含一个简单的日语例句及其中文翻译。例句中的汉字请用括号标注假名。`
          },
          { role: "user", content: `单词: "${word}"` }
        ],
        temperature: 0.3,
      });

      res.json(parseAIResponse(response.choices[0].message.content || "{}"));
    } catch (error: any) {
      console.error("Vocab lookup error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/grammar-lookup", async (req, res) => {
    try {
      const { pattern, apiKey, apiBaseUrl, apiModelName } = req.body;
      const openai = getOpenAI(apiKey, apiBaseUrl);

      const response = await openai.chat.completions.create({
        model: apiModelName || "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `你是一个专业的日语老师。请为给定的日语语法句型提供详细信息。
            【严格要求】：
            1. 必须使用简体中文进行解释和翻译，严禁使用繁体中文或其他语言。
            2. 必须且只能返回一个合法的 JSON 对象，不要包含任何 Markdown 标记（如 \`\`\`json）。
            
            请以 JSON 格式返回，包含以下字段：
            - meaning: 中文含义
            - example: 一个简单的日语例句及其中文翻译。例句中的汉字请用括号标注假名。
            - notes: 额外的使用提示或注意事项（中文）。`
          },
          { role: "user", content: `语法: "${pattern}"` }
        ],
        temperature: 0.3,
      });

      res.json(parseAIResponse(response.choices[0].message.content || "{}"));
    } catch (error: any) {
      console.error("Grammar lookup error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai-chat", async (req, res) => {
    try {
      const { messages, systemInstruction, apiKey, apiBaseUrl, apiModelName } = req.body;
      const openai = getOpenAI(apiKey, apiBaseUrl);

      const response = await openai.chat.completions.create({
        model: apiModelName || "deepseek-chat",
        messages: [
          { role: "system", content: `${systemInstruction}\n\n【重要指令】：\n1. 必须使用简体中文作为主要的交流、翻译和解释语言。\n2. 必须且只能返回一个合法的 JSON 对象，不要包含任何 Markdown 标记（如 \`\`\`json）。` },
          ...messages
        ],
        temperature: 0.7,
      });

      res.json(parseAIResponse(response.choices[0].message.content || "{}"));
    } catch (error: any) {
      console.error("AI Chat error:", error);
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
