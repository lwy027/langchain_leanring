/*
 * @Author: liweiye 2759536538@qq.com
 * @Date: 2026-06-18 17:09:35
 * @LastEditors: liweiye 2759536538@qq.com
 * @LastEditTime: 2026-06-18 17:19:54
 * @FilePath: \langchain-learning\src\test-resume.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
/*
 * @Description: 测试用程序员简历文本，用于验证 resume-optimize 模块
 * @Usage: node src/test-resume.js
 */
import { optimizeResume } from "./resume-optimize/index.js";

// ==================== 测试简历 ====================
const resumeText = `个人信息
--------------------------------------------------
姓名：张三
性别：男
年龄：27
学历：本科（计算机科学与技术）
工作年限：4年
联系电话：138-xxxx-xxxx
电子邮箱：zhangsan@example.com
求职意向：高级前端开发工程师
所在城市：上海

专业技能
--------------------------------------------------
- 熟练掌握 HTML5、CSS3、JavaScript（ES6+）、TypeScript
- 熟练掌握 React 框架，了解 Vue3 基础用法
- 熟悉 Webpack、Vite 等构建工具，能独立配置项目脚手架
- 熟悉 Ant Design、Element Plus 等 UI 组件库
- 了解 Node.js + Express 基础开发，能编写简单的后端接口
- 了解 Git 版本管理、CI/CD 流程
- 了解 MySQL、Redis 基础使用
- 了解 Docker 基础使用

项目经验
--------------------------------------------------
项目一：企业内部 OA 管理系统（2022.06 - 2023.12）
- 技术栈：React + TypeScript + Ant Design + Webpack
- 职责描述：作为前端核心开发，负责请假审批、考勤统计、公告管理三个核心模块的开发
- 项目成果：系统上线后覆盖公司 2000+ 员工，日均审批单据 500+，页面首屏加载时间优化至 1.5s

项目二：电商后台管理平台（2023.03 - 2024.06）
- 技术栈：React + TypeScript + Vite + ECharts
- 职责描述：独立负责数据看板模块，包括订单统计图表、用户增长趋势图、商品销量排行等功能
- 项目成果：实现了可拖拽自定义布局的看板，支持图表数据实时刷新，获得团队年度优秀项目奖

项目三：公司官网改版（2021.09 - 2022.03）
- 技术栈：HTML + CSS + JavaScript + jQuery
- 职责描述：参与页面布局实现和兼容性处理，负责新闻中心和产品展示两个子页面的前端开发
- 项目成果：完成 PC 端和移动端适配，兼容 IE10+ 及主流浏览器`;

// ==================== 执行测试 ====================
console.log("=".repeat(60));
console.log("📄 输入简历：\n");
console.log(resumeText);
console.log("=".repeat(60));

await optimizeResume(resumeText);
