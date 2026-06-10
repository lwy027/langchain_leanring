import { ChatDeepSeek } from "@langchain/deepseek";
import { createAgent } from "langchain";
import { TavilySearch } from "@langchain/tavily";
import { z } from "zod";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载 .env 文件
const result = dotenv.config({ path: join(__dirname, "..", ".env") });
if (result.error) {
  console.error("加载 .env 文件失败:", result.error.message);
}

const llm = new ChatDeepSeek({
  model: "deepseek-chat",
  apiKey: process.env.DEEPSEEK_API_KEY,
});

const tool = new TavilySearch({
  maxResults: 5,
  topic: "general",
});

// 定义结构化输出的 zod schema
const PersonInfoSchema = z.object({
  name: z.string().describe("学校名称"),
  subject: z.string().describe("专业"),
  yeay: z.string().describe("年制"),
  minScore: z.array(z.string()).describe("复试最低分"),
  maxScore: z.array(z.string()).describe("复试最高分"),
  avergeScore: z.array(z.string()).describe("复试平均分"),
});

const agent = createAgent({
  model: llm,
  tools: [tool],
  // 注意：DeepSeek 的 createAgent 中 responseFormat 会导致递归循环，
  // 如需结构化输出，建议另用 llm.withStructuredOutput() 单独调用
  systemPrompt:
    "你是一个考研信息搜索助手，请根据用户的搜索返回结构化的学校专业信息。",
});

const res = await agent.invoke({
  messages: [
    {
      role: "user",
      content: "帮我搜索26年最近关于计算机专业考研2年制的专业信息",
    },
  ],
});

console.log(res.messages);

console.log("消息输出:", res.messages[res.messages.length - 1].content);
console.log("结构化输出:", res.structuredResponse);
