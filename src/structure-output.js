import { ChatDeepSeek } from "@langchain/deepseek";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import "dotenv/config";

// 定义结构化输出的 zod schema
const PersonInfoSchema = z.object({
  name: z.string().describe("个人姓名"),
  age: z.number().describe("年龄，数字类型"),
  gender: z.enum(["男", "女", "其他"]).describe("性别，可选值：男 / 女 / 其他"),
  skills: z.array(z.string()).describe("技能列表，字符串数组"),
});

// 初始化 LLM
const llm = new ChatDeepSeek({
  model: "deepseek-chat",
});

// 使用 withStructuredOutput 绑定 zod schema，强制模型输出结构化 JSON
const structuredLlm = llm.withStructuredOutput(PersonInfoSchema);

// 用户输入的个人介绍（变量，可替换为任意内容）
const introText = `我叫张三，今年 28 岁，男性。精通 JavaScript、TypeScript、React 和 Node.js，熟悉 Docker 和 Kubernetes 部署，最近也在学习 Rust。`;

// 构造消息：系统提示 + 用户输入
const messages = [
  new SystemMessage(
    "请从以下个人介绍文本中提取关键信息，并以 JSON 格式输出，字段为：name（姓名）、age（年龄）、gender（性别）、skills（技能列表）。"
  ),
  new HumanMessage(introText),
];

// 调用 LLM 获取结构化输出
const result = await structuredLlm.invoke(messages);

console.log("=== 原始个人介绍 ===");
console.log(introText);
console.log("\n=== AI 结构化输出 ===");
console.log(JSON.stringify(result, null, 2));
