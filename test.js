import "dotenv/config";
import OpenAI from "openai";
const open_ai_token = process.env.openai_token;

const openai = new OpenAI({apiKey : open_ai_token});
console.log(open_ai_token);

const completion = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [
    { role: "developer", content: "You are a helpful assistant." },
    {
      role: "user",
      content: "Write a haiku about recursion in programming.",
    },
  ],
  store: true,
});

console.log(completion.choices[0].message);
