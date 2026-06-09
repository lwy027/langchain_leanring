/*
 * @Author: liweiye 2759536538@qq.com
 * @Date: 2026-06-09 21:29:25
 * @LastEditors: liweiye 2759536538@qq.com
 * @LastEditTime: 2026-06-09 21:34:22
 * @FilePath: \langchain-learning\src\并行回答.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// 使用 RunnableMap 并行执行多条链：同一个 topic 同时触发"结构化问答"和"冷笑话"
import { ChatDeepSeek } from "@langchain/deepseek";
import "dotenv/config";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableMap } from "@langchain/core/runnables";
import { z } from "zod";

const llm = new ChatDeepSeek({
  model: "deepseek-chat",
});

// 结构化输出 schema
const questionAnswerSchema = z.object({
  question: z.string().describe("针对主题提出的一个明确问题"),
  answer: z.string().describe("对该问题的简短回答（不超过 100 字）"),
  difficulty: z.enum(["easy", "medium", "hard"]).describe("问题的难度等级"),
  keywords: z.array(z.string()).describe("从问题中提取的 3~5 个关键词"),
});

// 两条提示模板
const promptQA = ChatPromptTemplate.fromTemplate(
  "请围绕主题「{topic}」生成一个结构化的问答条目，包含问题、简短回答、难度等级和关键词。",
);
const promptJoke = ChatPromptTemplate.fromTemplate(
  "请围绕主题「{topic}」讲一个冷笑话。",
);

// 两条子链：都接收同一个输入对象 { topic }
const chainQA = promptQA.pipe(llm.withStructuredOutput(questionAnswerSchema));
const chainJoke = promptJoke.pipe(llm).pipe(new StringOutputParser());

// RunnableMap：并行执行两条子链，结果合并为 { qa, joke }
// 两条子链会同时向 LLM 发起请求，不再串行等待
const parallelChain = RunnableMap.from({
  qa: chainQA,
  joke: chainJoke,
});

const TOPIC = "狗熊";
console.log(`=== 并行执行：主题「${TOPIC}」===\n`);

const start = Date.now();
const result = await parallelChain.invoke({ topic: TOPIC });
const elapsed = (Date.now() - start) / 1000;

console.log(`✅ 两条链并行完成，耗时 ${elapsed.toFixed(1)} 秒\n`);

console.log("--- 子链 1：结构化问答 ---\n");
console.log(JSON.stringify(result.qa, null, 2));

console.log("\n--- 子链 2：冷笑话 ---\n");
console.log(result.joke);
