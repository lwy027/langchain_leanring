/*
 * @Description: 简历优化 Agent 入口
 *   组装各模块，导出 optimizeResume 供外部调用
 */
import "dotenv/config";
import agent from "./graph.js";

/**
 * 运行简历优化 Agent
 * @param {string} resumeText - 简历文本
 * @returns {Promise<string>} 优化建议报告
 */
export async function optimizeResume(resumeText) {
  console.log("🚀 开始分析简历...\n");

  const result = await agent.invoke({
    messages: [{ role: "user", content: resumeText }],
  });

  const finalMessage = result.messages.at(-1);
  console.log("\n📝 最终优化建议：\n");
  console.log(finalMessage.content);

  return finalMessage.content;
}
