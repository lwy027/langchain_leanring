import { ChatDeepSeek } from "@langchain/deepseek";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
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
  isAIMessage,
  ToolMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import * as z from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载 .env 文件
const result = dotenv.config({ path: join(__dirname, "..", ".env") });
if (result.error) {
  console.error("加载 .env 文件失败:", result.error.message);
}

const llm = new ChatDeepSeek({
  model: "deepseek-chat",
  apiKey: process.env.DEEPSEEK_API_KEY,
});

/**
 * 1、使用 llmsCall 节点调用 llm 工具
 * 2、使用 shouldContinueNode 判断是否有工具调用，根据实际情况返回
 * 3、如果需要工具调用，调用工具节点，根据工具节点的返回结果，继续调用 llm 节点
 */

// 定义工具
const add = tool(({ a, b }) => a + b, {
  name: "add",
  description: "两个数相加",
  schema: z.object({
    a: z.number().describe("第一个数"),
    b: z.number().describe("第二个数"),
  }),
});

const multiply = tool(({ a, b }) => a * b, {
  name: "multiply",
  description: "两个数相乘",
  schema: z.object({
    a: z.number().describe("第一个数"),
    b: z.number().describe("第二个数"),
  }),
});

const divide = tool(({ a, b }) => a / b, {
  name: "divide",
  description: "两个数相除",
  schema: z.object({
    a: z.number().describe("第一个数"),
    b: z.number().describe("第二个数"),
  }),
});

// 定义状态（使用 Annotation）
const MessagesState = Annotation.Root({
  messages: Annotation({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  llmCalls: Annotation({
    reducer: (curr, next) => (curr ?? 0) + (next ?? 0),
    default: () => 0,
  }),
});

// 按名称索引工具
const toolsByName = {
  [add.name]: add,
  [multiply.name]: multiply,
  [divide.name]: divide,
};
const tools = Object.values(toolsByName);

const modelWithTool = await llm.bindTools(tools);

// llm 调用节点
const llmsCall = async (state) => {
  const res = await modelWithTool.invoke([
    new SystemMessage("你是一个有用的助手"),
    ...state.messages,
  ]);

  return {
    messages: res,
    llmCalls: (state.llmCalls ?? 0) + 1,
  };
};

// 工具调用节点
const toolsNode = async (state) => {
  const lastMessage = state.messages.at(-1);
  // 判断是否为 AI 消息，如果不是，直接返回空数组
  if (lastMessage == null || !isAIMessage(lastMessage)) {
    return { messages: [] };
  }

  const results = [];

  for (const toolCall of lastMessage.tool_calls) {
    const toolFn = toolsByName[toolCall.name];
    const result = await toolFn.invoke(toolCall.args);

    results.push(
      new ToolMessage({
        tool_call_id: toolCall.id,
        content: String(result),
      }),
    );
  }

  return { messages: results };
};

// 条件判断节点：是否需要调用工具
async function shouldContinueNode(state) {
  const lastMessage = state.messages.at(-1);
  // 判断是否为 AI 消息，如果不是，直接结束
  if (lastMessage == null || !isAIMessage(lastMessage)) {
    return END;
  }

  if (lastMessage.tool_calls?.length > 0) return "toolsNode";

  return END;
}

// 构建工作流
const workFlow = new StateGraph(MessagesState)
  .addNode("llmsCall", llmsCall)
  .addEdge(START, "llmsCall")
  .addNode("toolsNode", toolsNode)
  .addConditionalEdges("llmsCall", shouldContinueNode, {
    toolsNode: "toolsNode",
    [END]: END,
  })
  .addEdge("toolsNode", "llmsCall");

// 创建内存记忆存储器
const checkpointer = new MemorySaver();
const graph = workFlow.compile({ checkpointer });

// 会话配置（同一个 thread_id 会保留历史记录）
const config = { configurable: { thread_id: "conversation-1" } };

// 第一次调用
const res = await graph.invoke(
  { messages: [new HumanMessage("计算 1 加 2")] },
  config,
);

console.log("第一次调用 - 最后一条消息:", res.messages?.at(-1)?.content);

// 第二次调用（同一 thread_id，会包含之前的对话历史）
const res2 = await graph.invoke(
  { messages: [new HumanMessage("我刚才问的是什么？")] },
  config,
);

console.log("第二次调用 - 最后一条消息:", res2.messages?.at(-1)?.content);
console.log("总消息数:", res2.messages?.length);
console.log("LLM 累计调用次数:", res2.llmCalls);
