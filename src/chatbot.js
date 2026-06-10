/*
 * @Author: liweiye 2759536538@qq.com
 * @Date: 2026-06-10 09:18:14
 * @LastEditors: liweiye 2759536538@qq.com
 * @LastEditTime: 2026-06-10 09:39:52
 * @FilePath: \langchain-learning\src\chatbot.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
//1、解决llm不不会记忆会话内容问题
//2、解决多用户聊天记忆问题

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatDeepSeek } from "@langchain/deepseek";
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

// const prompt = ChatPromptTemplate.fromTemplate(
//   `根据传入的{topic}，请生成一个{topic}的话题。`,
// );

// const prompt = ChatPromptTemplate.fromTemplate(`你好我是 {name}`);
// const chain = prompt.pipe(llm);

// const res1 = await chain.invoke({ name: "lwy" });
// console.log(res1.content);

//不会记录记忆
// const res3 = await llm.invoke("你好我是lwy");

// console.log(res3.content);

// const res2 = await llm.invoke("我是谁");
// console.log(res2.content);

// 使用消息数组实现对话记忆
const res4 = await llm.invoke([
  { role: "user", content: "你好我是lwy" },
  { role: "assistant", content: "你好,lwy！" },
  { role: "user", content: "我是谁" },
]);

console.log(res4.content);
