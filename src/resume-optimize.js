/*
 * @Author: liweiye 2759536538@qq.com
 * @Date: 2026-06-18 16:59:22
 * @LastEditors: liweiye 2759536538@qq.com
 * @LastEditTime: 2026-06-18 17:05:09
 * @FilePath: \langchain-learning\src\resume-optimize.js
 * @Description: 程序员简历优化 Agent
 *   使用 LangGraph + DeepSeek 构建 ReAct Agent，
 *   通过 3 个 tool 分步解析简历、评估技能与项目经验、输出优化建议。
 */
import { ChatDeepSeek } from "@langchain/deepseek";
import "dotenv/config";
import { tool } from "@langchain/core/tools";
import * as z from "zod";
import {
  StateGraph,
  Annotation,
  messagesStateReducer,
  MemorySaver,
  START,
  END,
} from "@langchain/langgraph";
import {
  HumanMessage,
  ToolMessage,
  SystemMessage,
  isAIMessage,
} from "@langchain/core/messages";

// ==================== LLM 初始化 ====================

const llm = new ChatDeepSeek({
  model: "deepseek-chat",
  apiKey: process.env.DEEPSEEK_API_KEY,
});

// ==================== 工具定义 ====================

/**
 * 工具1：解析简历，提取三个核心部分
 * 由主 Agent 在第一步调用，将简历文本拆解为结构化信息
 */
const parseResumeSections = tool(
  async ({ resumeText }) => {
    const response = await llm.invoke([
      new SystemMessage(`你是一个专业的简历解析器。请解析以下程序员简历文本，提取三个部分并以 JSON 格式返回。

返回格式：
{
  "个人信息": "包含姓名、工作年限、学历、联系方式、求职意向等",
  "专业技能": "包含编程语言、框架、工具、数据库、云计算、软技能等",
  "项目经验": "包含项目名称、时间跨度、技术栈、个人职责、项目成果等"
}

注意：
- 如果简历中某些内容不明确，标注为"未提及"
- 保持原文信息，不要编造内容
- 项目经验请保留完整的项目细节`),
      new HumanMessage(resumeText),
    ]);
    return response.content;
  },
  {
    name: "parse_resume_sections",
    description:
      "【第一步必须调用】解析程序员简历文本，提取出'个人信息'、'专业技能'和'项目经验'三个部分。传入完整的简历文本字符串。",
    schema: z.object({
      resumeText: z.string().describe("需要解析的完整简历文本"),
    }),
  },
);

/**
 * 工具2：评估专业技能与工作年限的匹配度
 * 由主 Agent 在第二步调用，判断技能深度和广度是否达标
 */
const evaluateSkillMatch = tool(
  async ({ personalInfo, skills, workYears }) => {
    const response = await llm.invoke([
      new SystemMessage(`你是一个资深技术面试官和职业规划师。请根据以下信息，判断程序员的专业技能深度和广度是否与工作年限相匹配。

评估标准（按工作年限划分）：
- 0-1年（初级）：掌握 1-2 门语言基础，了解常用框架，能在指导下完成任务
- 1-3年（中级）：熟练掌握 1-2 门语言，能独立负责模块开发，理解设计模式，有数据库优化经验
- 3-5年（高级）：精通至少一门语言，有架构设计能力，能带小团队，有性能优化和问题排查经验
- 5-8年（资深）：技术栈深厚，有跨领域能力，能主导技术选型，有大型分布式项目经验
- 8年以上（专家）：行业内有影响力，能引领技术方向，有从 0 到 1 的架构经验

请从以下四个维度进行评估：
1. 技能深度：是否掌握了该年限应有的核心技术能力？是否理解底层原理？
2. 技能广度：技术栈是否足够广泛？是否有跨领域（前端/后端/运维/数据）能力？
3. 技能先进性：是否跟上了技术发展趋势？是否掌握了当前主流技术？
4. 行业对标：与同工作年限的优秀程序员相比，处于什么水平？

最后请给出：
- 综合评分（1-10分）
- 优势总结
- 不足之处
- 具体的技能提升建议（按优先级排序）`),
      new HumanMessage(
        `个人信息：${personalInfo}\n工作年限：${workYears}年\n专业技能：${skills}`,
      ),
    ]);
    return response.content;
  },
  {
    name: "evaluate_skill_match",
    description:
      "【第二步调用】评估程序员的专业技能深度和广度是否与工作年限相匹配。需要提供个人信息、技能描述和工作年限（数字）。",
    schema: z.object({
      personalInfo: z.string().describe("个人信息摘要，来自简历解析结果"),
      skills: z.string().describe("专业技能描述，来自简历解析结果"),
      workYears: z
        .number()
        .describe("工作年限，数字类型，单位为年。如：3 表示 3 年"),
    }),
  },
);

/**
 * 工具3：评估项目经验与工作年限的匹配度
 * 由主 Agent 在第三步调用，判断项目难度和承担角色是否达标
 */
const evaluateProjectMatch = tool(
  async ({ projects, workYears }) => {
    const response = await llm.invoke([
      new SystemMessage(`你是一个资深技术面试官和项目架构师。请判断程序员的项目经验内容、难度是否与工作年限相匹配。

评估标准（按工作年限划分）：
- 0-1年：参与基础功能开发，完成简单模块，代码量较小
- 1-3年：独立负责模块开发，参与中等复杂度项目，有上线经验
- 3-5年：主导子系统设计，负责核心功能模块，有高并发或高可用项目经验
- 5-8年：主导大型项目架构设计，解决关键技术难题，有跨团队协作和项目管理经验
- 8年以上：从 0 到 1 构建复杂系统，引领技术方向，有行业影响力的项目

请从以下四个维度进行评估：
1. 项目复杂度：项目的技术难度和业务复杂度是否与工作年限相符？
2. 角色定位：在项目中承担的角色（执行者/核心开发/技术负责人/架构师）是否与经验水平匹配？
3. 成果影响力：项目的业务价值和技术影响力是否达到该年限应有的水平？
4. 技术挑战：是否解决了有技术含量的难题（性能瓶颈/架构设计/疑难 bug）？

最后请给出：
- 综合评分（1-10分）
- 项目亮点
- 存在的短板（如：项目类型单一、缺乏高并发经验、没有主导经验等）
- 具体的项目优化建议（如何在简历中更好地呈现项目经验，以及未来应参与什么类型的项目）`),
      new HumanMessage(`工作年限：${workYears}年\n项目经验：${projects}`),
    ]);
    return response.content;
  },
  {
    name: "evaluate_project_match",
    description:
      "【第三步调用】评估项目经验内容、难度与工作年限的匹配度。需要提供项目描述和工作年限（数字）。",
    schema: z.object({
      projects: z.string().describe("项目经验描述，来自简历解析结果"),
      workYears: z
        .number()
        .describe("工作年限，数字类型，单位为年。如：5 表示 5 年"),
    }),
  },
);

// ==================== 工具索引 ====================

const toolsByName = {
  [parseResumeSections.name]: parseResumeSections,
  [evaluateSkillMatch.name]: evaluateSkillMatch,
  [evaluateProjectMatch.name]: evaluateProjectMatch,
};
const tools = Object.values(toolsByName);

// 绑定工具到模型
const modelWithTools = await llm.bindTools(tools);

// ==================== 状态定义 ====================

const MessagesState = Annotation.Root({
  messages: Annotation({
    reducer: messagesStateReducer,
    default: () => [],
  }),
});

// ==================== 图节点定义 ====================

/**
 * Agent 节点：调用绑定了工具的 LLM，让模型自主决策调用哪些工具
 */
const agentNode = async (state) => {
  const res = await modelWithTools.invoke([
    new SystemMessage(`你是一个专业的「程序员简历优化助手」。请严格按照以下步骤处理用户的简历：

## 执行步骤

**步骤 1 — 解析简历**
调用 parse_resume_sections 工具，传入用户提供的完整简历文本，提取"个人信息"、"专业技能"和"项目经验"三个部分。

**步骤 2 — 评估专业技能**
从步骤 1 返回的"个人信息"中提取工作年限，然后调用 evaluate_skill_match 工具，评估专业技能是否与工作年限相匹配。

**步骤 3 — 评估项目经验**
调用 evaluate_project_match 工具，评估项目经验是否与工作年限相匹配。

**步骤 4 — 整理优化建议**
综合以上三步的评估结果，整理出最终的简历优化建议报告，包括：

1. 📋 **简历格式优化建议** — 排版、结构、突出亮点的方式
2. 🛠️ **技能补充建议** — 需要学习或加强的技术方向
3. 📁 **项目经验优化建议** — 如何更好地描述项目、补充项目类型
4. 🎯 **综合提升方向** — 下一步的职业发展建议

## 重要提醒
- 必须按顺序依次调用三个工具，一个都不能跳过
- 工作年限必须从个人信息中正确提取，以数字形式传入（如 3、5、8）
- 最终的优化建议必须基于实际评估结果，不要编造`),
    ...state.messages,
  ]);

  return {
    messages: [res],
  };
};

/**
 * 工具执行节点：依次执行 Agent 请求的所有工具调用
 */
const toolNode = async (state) => {
  const lastMessage = state.messages.at(-1);

  if (!lastMessage || !isAIMessage(lastMessage)) {
    return { messages: [] };
  }

  const results = [];
  for (const toolCall of lastMessage.tool_calls) {
    const toolFn = toolsByName[toolCall.name];
    if (toolFn) {
      try {
        console.log(`🔧 调用工具: ${toolCall.name}...`);
        const result = await toolFn.invoke(toolCall.args);
        results.push(
          new ToolMessage({
            tool_call_id: toolCall.id,
            content:
              typeof result === "string" ? result : JSON.stringify(result),
          }),
        );
        console.log(`✅ 工具 ${toolCall.name} 执行完成`);
      } catch (error) {
        console.error(`❌ 工具 ${toolCall.name} 执行失败:`, error.message);
        results.push(
          new ToolMessage({
            tool_call_id: toolCall.id,
            content: `工具执行出错: ${error.message}`,
          }),
        );
      }
    }
  }

  return { messages: results };
};

/**
 * 路由节点：判断是否需要继续调用工具
 */
const shouldContinue = (state) => {
  const lastMessage = state.messages.at(-1);

  if (!lastMessage || !isAIMessage(lastMessage)) {
    return END;
  }

  if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
    return "toolNode";
  }

  return END;
};

// ==================== 构建工作流 ====================

const workflow = new StateGraph(MessagesState)
  .addNode("agentNode", agentNode)
  .addEdge(START, "agentNode")
  .addNode("toolNode", toolNode)
  .addConditionalEdges("agentNode", shouldContinue, {
    toolNode: "toolNode",
    [END]: END,
  })
  .addEdge("toolNode", "agentNode");

const checkpointer = new MemorySaver();
const graph = workflow.compile({ checkpointer });

// ==================== 导出 ====================

export { graph, parseResumeSections, evaluateSkillMatch, evaluateProjectMatch };

// ==================== 演示入口 ====================

/**
 * 运行简历优化 Agent 的演示
 * @param {string} resumeText - 简历文本
 */
export async function optimizeResume(resumeText) {
  const config = { configurable: { thread_id: `resume-${Date.now()}` } };

  console.log("🚀 开始分析简历...\n");

  const result = await graph.invoke(
    {
      messages: [new HumanMessage(resumeText)],
    },
    config,
  );

  const finalMessage = result.messages.at(-1);
  console.log("\n📝 最终优化建议：\n");
  console.log(finalMessage.content);

  return finalMessage.content;
}
