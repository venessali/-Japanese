import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: "test",
  baseURL: "https://api.deepseek.com/v1",
});

console.log(openai.baseURL);
