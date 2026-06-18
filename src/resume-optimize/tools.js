/*
 * @Description: 简历优化 Agent 的 3 个工具定义
 *   - parseResumeSections: 解析简历 → 提取三大部分
 *   - evaluateSkillMatch: 评估技能与工作年限匹配度
 *   - evaluateProjectMatch: 评估项目与工作年限匹配度
 */
import { tool } from "@langchain/core/tools";
import * as z from "zod";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import llm from "./llm.js";

// ==================== 工具1：解析简历 ====================

export const parseResumeSections = tool(
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

// ==================== 工具2：评估专业技能 ====================

const SKILL_EVALUATION_PROMPT = `你是一个资深技术面试官和职业规划师。请根据以下信息，判断程序员的专业技能深度和广度是否与工作年限相匹配。

评估标准（按工作年限划分）：
- 0-1年（初级）：掌握 1-2 门语言基础，了解常用框架，能在指导下完成任务
- 1-3年（中级）：熟练掌握 1-2 门语言，能独立负责模块开发，理解设计模式，有数据库优化经验
- 3-5年（高级）：精通至少一门语言，有架构设计能力，能带小团队，有性能优化和问题排查经验
- 5-8年（资深）：技术栈深厚，有跨领域能力，能主导技术选型，有大型分布式项目经验
- 8年以上（专家）：行业内有影响力，能引领技术方向，有从 0 到 1 的架构经验

请从以下维度评估：
1. 技能深度：是否掌握了该年限应有的核心技术能力？是否理解底层原理？
2. 技能广度：技术栈是否足够广泛？是否有跨领域（前端/后端/运维/数据）能力？
3. 技能先进性：是否跟上了技术发展趋势？是否掌握了当前主流技术？
4. 行业对标：与同工作年限的优秀程序员相比，处于什么水平？

最后请给出：综合评分（1-10分）、优势总结、不足之处、具体的技能提升建议（按优先级排序）`;

export const evaluateSkillMatch = tool(
  async ({ personalInfo, skills, workYears }) => {
    const response = await llm.invoke([
      new SystemMessage(SKILL_EVALUATION_PROMPT),
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

// ==================== 工具3：评估项目经验 ====================

const PROJECT_EVALUATION_PROMPT = `你是一个资深技术面试官和项目架构师。请判断程序员的项目经验内容、难度是否与工作年限相匹配。

评估标准（按工作年限划分）：
- 0-1年：参与基础功能开发，完成简单模块，代码量较小
- 1-3年：独立负责模块开发，参与中等复杂度项目，有上线经验
- 3-5年：主导子系统设计，负责核心功能模块，有高并发或高可用项目经验
- 5-8年：主导大型项目架构设计，解决关键技术难题，有跨团队协作和项目管理经验
- 8年以上：从 0 到 1 构建复杂系统，引领技术方向，有行业影响力的项目

请从以下维度评估：
1. 项目复杂度：项目的技术难度和业务复杂度是否与工作年限相符？
2. 角色定位：在项目中承担的角色（执行者/核心开发/技术负责人/架构师）是否与经验水平匹配？
3. 成果影响力：项目的业务价值和技术影响力是否达到该年限应有的水平？
4. 技术挑战：是否解决了有技术含量的难题（性能瓶颈/架构设计/疑难 bug）？

最后请给出：综合评分（1-10分）、项目亮点、存在的短板（如：项目类型单一、缺乏高并发经验、没有主导经验等）、具体的项目优化建议`;

export const evaluateProjectMatch = tool(
  async ({ projects, workYears }) => {
    const response = await llm.invoke([
      new SystemMessage(PROJECT_EVALUATION_PROMPT),
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
