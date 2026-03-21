import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: "test",
  baseURL: "https://api.deepseek.com",
});

async function test() {
  try {
    await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [{role: "user", content: "hello"}]
    });
  } catch (e) {
    console.log(e.message);
  }
}

test();
