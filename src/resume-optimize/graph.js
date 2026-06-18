/*
 * @Author: liweiye 2759536538@qq.com
 * @Date: 2026-06-18 17:14:26
 * @LastEditors: liweiye 2759536538@qq.com
 * @LastEditTime: 2026-06-18 17:17:35
 * @FilePath: \langchain-learning\src\resume-optimize\graph.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
/*
 * @Description: 使用 createAgent 构建简历优化 Agent
 *   createAgent 自动处理 ReAct 循环、工具调用、消息管理
 */
import { createAgent } from "langchain";
import llm from "./llm.js";
import {
  parseResumeSections,
  evaluateSkillMatch,
  evaluateProjectMatch,
} from "./tools.js";

const SYSTEM_PROMPT = `你是一个专业的「程序员简历优化助手」。请严格按照以下步骤处理用户的简历：

## 执行步骤

**步骤 1 — 解析简历**
调用 parse_resume_sections 工具，传入用户提供的完整简历文本，提取"个人信息"、"专业技能"和"项目经验"三个部分。

**步骤 2 — 评估专业技能**
从步骤 1 返回的"个人信息"中提取工作年限，然后调用 evaluate_skill_match 工具，评估专业技能是否与工作年限相匹配。

**步骤 3 — 评估项目经验**
调用 evaluate_project_match 工具，评估项目经验是否与工作年限相匹配。

**步骤 4 — 整理优化建议**
综合以上三步的评估结果，整理出最终的简历优化建议报告，包括：

1. 📋 简历格式优化建议 — 排版、结构、突出亮点的方式
2. 🛠️ 技能补充建议 — 需要学习或加强的技术方向
3. 📁 项目经验优化建议 — 如何更好地描述项目、补充项目类型
4. 🎯 综合提升方向 — 下一步的职业发展建议

## 重要提醒
- 必须按顺序依次调用三个工具，一个都不能跳过
- 工作年限必须从个人信息中正确提取，以数字形式传入（如 3、5、8）
- 最终的优化建议必须基于实际评估结果，不要编造`;

const agent = createAgent({
  model: llm,
  tools: [parseResumeSections, evaluateSkillMatch, evaluateProjectMatch],
  systemPrompt: SYSTEM_PROMPT,
});

export default agent;
