/*
 * @Author: liweiye 2759536538@qq.com
 * @Date: 2026-06-09 20:39:41
 * @LastEditors: liweiye 2759536538@qq.com
 * @LastEditTime: 2026-06-09 20:40:45
 * @FilePath: \langchain-learning\src\tavily-demo.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { ChatDeepSeek } from "@langchain/deepseek";
import {
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import "dotenv/config";
import { TavilySearch } from "@langchain/tavily";

const llm = new ChatDeepSeek({
  model: "deepseek-chat",
});

const tool = new TavilySearch({
  maxResults: 5,
  topic: "general",
});

// 1. 将 Tavily 搜索工具绑定到 LLM，让 LLM 可以决定是否调用搜索
const llmWithTools = llm.bindTools([tool]);

// 2. 构造需要网络搜索的用户问题
const messages = [
  new SystemMessage(
    "你是一个知识渊博的助手。当用户询问近期事件、实时数据或你不确定的内容时，请使用提供的搜索工具进行网络搜索，然后基于搜索结果给出准确回答。",
  ),
  new HumanMessage("最近有什么关于 AI 的重大新闻？请列举 3 条最新进展。"),
];

// 3. 循环执行：LLM 调用 → 检查工具调用 → 执行工具 → 回填结果
//    直到 LLM 不再发起 tool_calls 或达到最大轮数（防止死循环）
const MAX_ROUNDS = 5;

for (let round = 1; round <= MAX_ROUNDS; round++) {
  console.log(`\n=== 第 ${round} 轮：调用 LLM ===`);
  const aiResponse = await llmWithTools.invoke(messages);
  messages.push(aiResponse);

  // 检查本轮是否有工具调用
  const toolCalls = aiResponse.tool_calls || [];
  if (toolCalls.length === 0) {
    // LLM 不再需要工具，输出最终回答并结束循环
    console.log("\n=== 最终回答 ===");
    console.log(aiResponse.content);
    break;
  }

  console.log(
    `\nAI 发起 ${toolCalls.length} 个工具调用，正在执行...`,
  );

  // 依次执行所有工具调用，并把结果回填
  for (const toolCall of toolCalls) {
    console.log(`\n--- 执行工具：${toolCall.name} ---`);
    console.log("参数：", JSON.stringify(toolCall.args, null, 2));

    const toolResult = await tool.invoke(toolCall.args);
    const resultStr = JSON.stringify(toolResult);
    console.log("搜索结果预览：", resultStr.slice(0, 300) + "...");

    messages.push(
      new ToolMessage({
        tool_call_id: toolCall.id,
        content: resultStr,
      }),
    );
  }

  // 达到最大轮数仍在调用工具，给出提示
  if (round === MAX_ROUNDS) {
    console.log(
      `\n⚠️  已达到最大工具调用轮数（${MAX_ROUNDS}），结束循环。`,
    );
  }
}
