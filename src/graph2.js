import { ChatDeepSeek } from "@langchain/deepseek";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import {
  entrypoint,
  task,
  MemorySaver,
  getPreviousState,
} from "@langchain/langgraph";
import {
  HumanMessage,
  SystemMessage,
  mapStoredMessagesToChatMessages,
  mapChatMessagesToStoredMessages,
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

// 按名称索引工具
const toolsByName = {
  [add.name]: add,
  [multiply.name]: multiply,
  [divide.name]: divide,
};
const tools = Object.values(toolsByName);

const modelWithTool = await llm.bindTools(tools);

// llm 调用节点
// const llmsCall = async (state) => {
//   const res = await modelWithTool.invoke([
//     new SystemMessage("你是一个有用的助手"),
//     ...state.messages,
//   ]);

//   return {
//     messages: res,
//     llmCalls: (state.llmCalls ?? 0) + 1,
//   };
// };

const callModel = task({ name: "llmsCall" }, async (messages) => {
  // 确保展开为扁平的消息列表，避免嵌套数组
  const messageList = Array.isArray(messages) ? messages : [messages];
  const res = await modelWithTool.invoke([
    new SystemMessage("你是一个有用的助手"),
    ...messageList,
  ]);

  return res;
});
// 工具调用节点
// const toolsNode = async (state) => {
//   const lastMessage = state.messages.at(-1);
//   // 判断是否为 AI 消息，如果不是，直接返回空数组
//   if (lastMessage == null || !isAIMessage(lastMessage)) {
//     return { messages: [] };
//   }

//   const results = [];

//   for (const toolCall of lastMessage.tool_calls) {
//     const toolFn = toolsByName[toolCall.name];
//     const result = await toolFn.invoke(toolCall.args);

//     results.push(
//       new ToolMessage({
//         tool_call_id: toolCall.id,
//         content: String(result),
//       }),
//     );
//   }

//   return { messages: results };
// };

const callTool = task({ name: "callTool" }, async (toolCall) => {
  const tool = toolsByName[toolCall.name];
  return tool.invoke(toolCall);
});

const agent = entrypoint(
  {
    name: "agent",
    checkpointer: new MemorySaver(),
  },
  async (messages) => {
    // 获取之前的对话历史，与当前输入合并，实现记忆功能
    const previousMessages = getPreviousState() ?? [];
    // 将存储格式的消息还原为 BaseMessage 实例（启用 checkpointer 后消息会被序列化）
    const restoredPrevious = mapStoredMessagesToChatMessages(previousMessages);
    const restoredInput = mapStoredMessagesToChatMessages(messages);
    let allMessages = [...restoredPrevious, ...restoredInput];

    // 先调用 llm
    let modelResponse = await callModel(allMessages);

    // 一个无限循环
    while (true) {
      // 看是否需要 tool call
      if (!modelResponse.tool_calls?.length) {
        // 不需要则退出循环
        break;
      }

      // 执行 tool
      const toolResults = await Promise.all(
        modelResponse.tool_calls.map((toolCall) => callTool(toolCall)),
      );
      // 将 tool 执行结果再调用 llm
      allMessages = [...allMessages, modelResponse, ...toolResults];
      modelResponse = await callModel(allMessages);
    }

    // 把最终的 modelResponse 加入结果
    const finalMessages = [...allMessages, modelResponse];
    // 返回给调用方的是 BaseMessage 实例，保存到 checkpoint 的是存储格式
    return entrypoint.final({
      value: finalMessages,
      save: mapChatMessagesToStoredMessages(finalMessages),
    });
  },
);

const config = {
  configurable: {
    thread_id: "conversation-1",
  },
};

// 第一轮对话：计算
console.log("=== 第一轮对话 ===");
const results1 = await agent.invoke([new HumanMessage("Add 3 and 4.")], config);

for (const message of results1) {
  console.log(`[${message.getType()}]: ${message.text}`);
}

// 第二轮对话：测试记忆功能，询问上一轮的结果
console.log("\n=== 第二轮对话 ===");
const results2 = await agent.invoke(
  [new HumanMessage("刚才的计算结果是什么？")],
  config,
);

for (const message of results2) {
  console.log(`[${message.getType()}]: ${message.text}`);
}
