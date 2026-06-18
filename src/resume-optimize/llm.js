/*
 * @Description: LLM 实例初始化
 */
import { ChatDeepSeek } from "@langchain/deepseek";
import "dotenv/config";

const llm = new ChatDeepSeek({
  model: "deepseek-chat",
  apiKey: process.env.DEEPSEEK_API_KEY,
});

export default llm;
