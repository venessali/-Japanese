import OpenAI from "openai";

async function test() {
  const openai = new OpenAI({
    apiKey: "test",
    baseURL: "https://api.deepseek.com",
  });
  try {
    await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "user", content: "hi" }]
    });
  } catch (e) {
    console.log(e.message);
    console.log(e.url);
  }
}
test();
