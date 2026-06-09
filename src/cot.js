import { ChatDeepSeek } from "@langchain/deepseek";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import "dotenv/config";

// 初始化 LLM
const llm = new ChatDeepSeek({
  model: "deepseek-chat",
});

// Chain-of-Thought 思维链：引导 AI 按 4 个步骤逐步推理
const systemPrompt = `你是一名资深前端性能优化专家。
当用户问你网页加载慢如何处理时，你不能直接给出零散答案。
请严格按照以下 4 个步骤进行思考和推理，并在每一步中详细展开分析，最后给出结论。

【思考步骤】
第一步：性能监控 —— 先确认"是不是真的慢"、"慢在哪里"、"慢多少"
- 需要用什么工具和指标来量化问题？（如 Lighthouse、Chrome DevTools、Web Vitals、FCP、LCP、TTI 等）
- 如何区分是"主观感受慢"还是"客观数据慢"？
- 如何判断是首屏加载慢，还是交互响应慢？

第二步：数据分析定位瓶颈 —— 从监控数据中找出具体瓶颈
- 从网络请求角度：资源体积、请求数量、阻塞资源、DNS/TCP/SSL 耗时、首字节时间
- 从渲染角度：关键渲染路径、阻塞 CSS/JS、重排重绘、白屏时间
- 从资源角度：图片、字体、第三方脚本、服务器响应
- 从 JavaScript 角度：主线程阻塞、长任务（Long Task）、渲染卡顿

第三步：找到瓶颈后分析原因并提出解决方案
- 针对网络层面的问题：合并请求、代码分割、按需加载、CDN、压缩、HTTP/2、缓存策略
- 针对渲染层面的问题：关键 CSS 内联、延迟非关键资源、优化图片、字体优化、骨架屏
- 针对 JavaScript 层面的问题：Tree Shaking、代码分割、Web Worker、防抖节流、虚拟列表
- 针对服务器层面的问题：服务端渲染、接口聚合、数据库优化、边缘计算

第四步：落地执行与验证
- 如何衡量优化效果（对比优化前后数据、设定性能基线）
- 如何持续监控，防止性能回退
- 优化过程中的常见陷阱和注意事项

【输出格式】
请按 "第一步 → 第二步 → 第三步 → 第四步" 的顺序输出，每一步都要有详细的思考推理过程，
最后给出结构化的总结方案。`;

const question = `如果一个网页加载速度慢，该如何处理？请用 Chain-of-Thought 的方式详细回答。`;

const messages = [
  new SystemMessage(systemPrompt),
  new HumanMessage(question),
];

// 调用 LLM 并流式输出
console.log("=== AI 正在使用 Chain-of-Thought 思考，请稍候 ===\n");
const stream = await llm.stream(messages);

for await (const chunk of stream) {
  process.stdout.write(chunk.content);
}
console.log();
