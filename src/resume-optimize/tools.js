/*
 * @Description: 简历优化 Agent 的 3 个工具定义
 *   每个工具都有清晰的输入 schema 和返回 schema，
 *   使用 llm.withStructuredOutput() 保证返回值类型安全。
 */
import { tool } from "@langchain/core/tools";
import * as z from "zod";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import llm from "./llm.js";

// ==================== 工具1：解析简历 ====================

const ParseResumeOutput = z.object({
  personalInfo: z
    .string()
    .describe("个人信息：姓名、工作年限、学历、联系方式、求职意向等"),
  skills: z
    .string()
    .describe("专业技能：编程语言、框架、工具、数据库、云计算等"),
  projects: z.string().describe("项目经验：项目名称、时间、技术栈、职责、成果"),
});

export const parseResumeSections = tool(
  async ({ resumeText }) => {
    const structuredLlm = llm.withStructuredOutput(ParseResumeOutput);
    const result = await structuredLlm.invoke([
      new SystemMessage(`你是一个专业的简历解析器。请解析以下程序员简历文本，提取三个部分。

注意：
- 如果简历中某些内容不明确，标注为"未提及"
- 保持原文信息，不要编造内容
- 项目经验请保留完整的项目细节`),
      new HumanMessage(resumeText),
    ]);
    return JSON.stringify(result, null, 2);
  },
  {
    name: "parse_resume_sections",
    description:
      "【第一步必须调用】解析程序员简历文本，提取出'个人信息'、'专业技能'和'项目经验'三个部分。返回 structured JSON。",
    schema: z.object({
      resumeText: z.string().describe("需要解析的完整简历文本"),
    }),
  },
);

// ==================== 工具2：评估专业技能 ====================

const SkillEvaluationOutput = z.object({
  score: z.number().min(1).max(10).describe("综合评分 1-10 分"),
  strengths: z.array(z.string()).describe("优势列表"),
  weaknesses: z.array(z.string()).describe("不足之处列表"),
  suggestions: z.array(z.string()).describe("技能提升建议，按优先级排序"),
  level: z
    .enum(["初级", "中级", "高级", "资深", "专家"])
    .describe("当前能力层级"),
});

const SKILL_EVALUATION_PROMPT = `你是一个资深技术面试官和职业规划师。请根据以下信息，判断程序员的专业技能与工作年限的匹配度。

评估标准（按工作年限）：
- 0-1年（初级）：掌握 1-2 门语言基础，能在指导下完成任务
- 1-3年（中级）：能独立负责模块开发，理解设计模式，有数据库优化经验
- 3-5年（高级）：精通至少一门语言，有架构设计能力，能带小团队
- 5-8年（资深）：技术栈深厚，能主导技术选型，有大型分布式项目经验
- 8年以上（专家）：有行业影响力，能从 0 到 1 构建复杂系统

评估维度：技能深度、技能广度、技能先进性、行业对标`;

export const evaluateSkillMatch = tool(
  async ({ personalInfo, skills, workYears }) => {
    const structuredLlm = llm.withStructuredOutput(SkillEvaluationOutput);
    const result = await structuredLlm.invoke([
      new SystemMessage(SKILL_EVALUATION_PROMPT),
      new HumanMessage(
        `个人信息：${personalInfo}\n工作年限：${workYears}年\n专业技能：${skills}`,
      ),
    ]);
    return JSON.stringify(result, null, 2);
  },
  {
    name: "evaluate_skill_match",
    description:
      "【第二步调用】评估专业技能与工作年限的匹配度，返回评分、优势、不足和建议。",
    schema: z.object({
      personalInfo: z.string().describe("个人信息摘要"),
      skills: z.string().describe("专业技能描述"),
      workYears: z.number().describe("工作年限，如 3"),
    }),
  },
);

// ==================== 工具3：评估项目经验 ====================

const ProjectEvaluationOutput = z.object({
  score: z.number().min(1).max(10).describe("综合评分 1-10 分"),
  highlights: z.array(z.string()).describe("项目亮点列表"),
  shortcomings: z.array(z.string()).describe("存在短板列表"),
  suggestions: z.array(z.string()).describe("项目优化建议，按优先级排序"),
  level: z
    .enum(["初级", "中级", "高级", "资深", "专家"])
    .describe("当前项目能力层级"),
});

const PROJECT_EVALUATION_PROMPT = `你是一个资深技术面试官和项目架构师。请判断程序员的项目经验与工作年限的匹配度。

评估标准（按工作年限）：
- 0-1年：参与基础功能开发，完成简单模块
- 1-3年：独立负责模块开发，有上线经验
- 3-5年：主导子系统设计，有高并发或高可用项目经验
- 5-8年：主导大型项目架构设计，有跨团队协作经验
- 8年以上：从 0 到 1 构建复杂系统，有行业影响力的项目

评估维度：项目复杂度、角色定位、成果影响力、技术挑战`;

export const evaluateProjectMatch = tool(
  async ({ projects, workYears }) => {
    const structuredLlm = llm.withStructuredOutput(ProjectEvaluationOutput);
    const result = await structuredLlm.invoke([
      new SystemMessage(PROJECT_EVALUATION_PROMPT),
      new HumanMessage(`工作年限：${workYears}年\n项目经验：${projects}`),
    ]);
    return JSON.stringify(result, null, 2);
  },
  {
    name: "evaluate_project_match",
    description:
      "【第三步调用】评估项目经验与工作年限的匹配度，返回评分、亮点、短板和建议。",
    schema: z.object({
      projects: z.string().describe("项目经验描述"),
      workYears: z.number().describe("工作年限，如 5"),
    }),
  },
);
