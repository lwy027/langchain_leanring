//1、解决llm不不会记忆会话内容问题
//2、解决多用户聊天记忆问题

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatDeepSeek } from "@langchain/deepseek";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import {
  END,
  MemorySaver,
  MessagesAnnotation,
  START,
  StateGraph,
} from "@langchain/langgraph";
import { log } from "console";
import { trimMessages } from "@langchain/core/messages";

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

// 配置消息裁剪器，限制对话历史长度
const trimmer = trimMessages({
  maxTokens: 10, // 最多保留10条消息
  strategy: "last", // 保留最后的消息
  tokenCounter: (msgs) => msgs.length, // 按消息数量计数
  includeSystem: true, // 包含系统消息
  allowPartial: false, // 不允许部分消息
  startOn: "human", // 从用户消息开始
});

// 使用langGraph 把聊天记录存在内存中

// Define the function that calls the model
const callModel = async (state) => {
  console.log("裁剪前消息数量: ", state.messages.length);

  // 裁剪消息历史，防止上下文过长
  const trimmedMessages = await trimmer.invoke(state.messages);
  console.log("裁剪后消息数量: ", trimmedMessages.length);

  const response = await llm.invoke(trimmedMessages);
  return { messages: response };
};

const graph = new StateGraph(MessagesAnnotation)
  .addNode("model", callModel)
  .addEdge(START, "model")
  .addEdge("model", END);

const memory = new MemorySaver();

const chatbot = graph.compile({
  checkpointer: memory,
});

// 配置用户ID，用于区分不同用户的对话
const config = { configurable: { thread_id: "user_001" } };

// 定义11条问题
const questions = [
  "你好我是lwy",
  "我是谁",
  "今天天气怎么样？",
  "你能做什么？",
  "帮我写一首关于春天的诗",
  "1+1等于多少？",
  "推荐几本好书",
  "什么是人工智能？",
  "讲一个笑话",
  "如何学习编程？",
  "再见",
];

// 循环发送问题
for (const question of questions) {
  const res = await chatbot.invoke(
    { messages: [{ role: "user", content: question }] },
    config,
  );
  console.log(`问题: ${question}`);
  console.log(`回复: ${res.messages[res.messages.length - 1].content}`);
  console.log("---");
}
