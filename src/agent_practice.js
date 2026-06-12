import { ChatDeepSeek } from "@langchain/deepseek";
import { createAgent, tool } from "langchain";
import { TavilySearch } from "@langchain/tavily";
import { z } from "zod";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { MemorySaver } from "@langchain/langgraph";

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

const tavilyTool = new TavilySearch({
  maxResults: 5,
  topic: "general",
});
const checkpointer = new MemorySaver();

// 自定义工具：获取用户位置
const getUserLocationTool = tool(
  async () => {
    const result = await tavilyTool.invoke({ query: "获取当前用户的位置信息" });
    return JSON.stringify(result);
  },
  {
    name: "getUserLocationTool",
    description: "获取当前用户的地理位置信息",
    schema: z.object({}),
  },
);

// 自定义工具：根据城市获取天气
const getUserWeatherTool = tool(
  async ({ city }) => {
    const result = await tavilyTool.invoke({ query: `${city}今天的天气` });
    return JSON.stringify(result);
  },
  {
    name: "getUserWeatherTool",
    description: "根据城市名称获取该城市的天气信息",
    schema: z.object({
      city: z.string().describe("城市名称，例如：杭州、北京"),
    }),
  },
);

const agent = createAgent({
  model: llm,
  tools: [getUserLocationTool, getUserWeatherTool],
  checkpointer,
  systemPrompt:
    "你是一个考研信息搜索助手，请根据用户的搜索返回结构化的学校专业信息。",
});

const config = {
  configurable: { thread_id: "1" },
};

const res = await agent.invoke(
  { messages: [{ role: "user", content: "获取今天的天气" }] },
  config,
);

// 展示 Agent 调用 tool 的完整过程
console.log("\n========== Agent 执行过程 ==========\n");
res.messages.forEach((msg, i) => {
  const type = msg.getType?.() || msg._getType?.() || "unknown";
  console.log(`--- 第 ${i + 1} 条消息 (${type}) ---`);

  if (type === "human") {
    console.log(`用户: ${msg.content}`);
  } else if (type === "ai") {
    // AI 消息可能包含 tool_calls
    if (msg.tool_calls?.length > 0) {
      console.log("AI 决定调用以下工具:");
      msg.tool_calls.forEach((tc) => {
        console.log(`  工具名: ${tc.name}`);
        console.log(`  参数: ${JSON.stringify(tc.args, null, 2)}`);
      });
    } else {
      console.log(`AI 回复: ${msg.content}`);
    }
  } else if (type === "tool") {
    console.log(`工具返回 (${msg.name}):`);
    // 截取前 300 字符预览
    const preview =
      typeof msg.content === "string" ? msg.content.slice(0, 300) : msg.content;
    console.log(`  ${preview}...`);
  } else {
    console.log(msg);
  }
  console.log();
});
console.log("========== 最终回答 ==========");
console.log(res.messages[res.messages.length - 1].content);

// const res2 = await agent.invoke(
//   { messages: [{ role: "user", content: "美国都有什么大学" }] },
//   config,
// );

// console.log(config, "拿到的配置信息2");

// console.log(res2.messages[res2.messages.length - 1].content);
