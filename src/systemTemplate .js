import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatDeepSeek } from "@langchain/deepseek";
import "dotenv/config";
const llm = new ChatDeepSeek({
  model: "deepseek-chat",
});

// 定义 template
const systemTemplate = "Translate the following from English into {language}";
const promptTemplate = ChatPromptTemplate.fromMessages([
  ["system", systemTemplate],
  ["user", "{text}"],
]);

// 根据 template 生成 prompt 值
const promptValue = await promptTemplate.invoke({
  language: "Chinese",
  text: "hi, how are you?",
});

// 使用流式输出调用 prompt 生成 AI 结果
const stream = await llm.stream(promptValue);

// 逐块输出内容
for await (const chunk of stream) {
  process.stdout.write(chunk.content);
}
console.log(); // 最后换行
