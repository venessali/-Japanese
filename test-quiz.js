import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: "test",
  baseURL: "https://api.deepseek.com/v1",
});

async function test() {
  try {
    const response = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: "你是一个活泼的日语老师。请生成5道选择题。必须返回JSON对象。" },
        { role: "user", content: "请生成5道选择题。" }
      ],
      temperature: 0.7,
    });
    console.log(response.choices[0].message.content);
  } catch (e) {
    console.log(e.message);
  }
}

test();
