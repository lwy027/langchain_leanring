# Instructions

这是一个 Nodejs 调用 langchain API 的学习项目。

## 要求

使用 Nodejs v22+ 版本，使用 ES Module 语法。

DeepSeek API key 使用 `process.env.DEEPSEEK_API_KEY`

DeepSeek API 文档：https://api-docs.deepseek.com/zh-cn/

langchain API 文档：https://docs.langchain.com/oss/javascript/langchain/overview

使用中文回答所有问题，包括代码注释。

## 注意事项

遇到不确定的问题，请先询问我，而不是直接编写代码。

## 🎯 Git Commit 规范指南

> 为了让提交历史清晰、可读、易于追溯，请遵循以下规范。

### 📌 提交信息格式

- **类型**：必填，表明本次提交的性质（见下表）。
- **范围**：可选，说明影响的模块、文件或功能区域（如 `auth`, `api`, `README`）。
- **简短描述**：必填，动词开头，首字母小写，不超过 50 字符，**不加句号**。

---

### 🏷️ 类型说明与示例

| 类型               | 说明                                                    | 示例                                      |
| :----------------- | :------------------------------------------------------ | :---------------------------------------- |
| ✨ **feat**        | 新增功能 (feature)                                      | `feat(user): 添加用户登录接口`            |
| 🐛 **fix**         | 修补 bug                                                | `fix(cart): 修复数量增减时总价未刷新`     |
| 📚 **docs**        | 仅文档变更 (documentation)                              | `docs(readme): 更新安装说明`              |
| 💎 **style**       | 代码样式调整（空格、格式化、缺少分号等，不影响逻辑）    | `style: 统一缩进为2个空格`                |
| ♻️ **refactor**    | 代码重构（既非新功能也非修 bug）                        | `refactor(utils): 抽离公共日期格式化函数` |
| 🔧 **chore**       | 构建过程或辅助工具变动（修改构建脚本、依赖等）          | `chore: 升级webpack到5.0`                 |
| ⏪ **revert**      | 撤销之前的提交                                          | `revert: 回滚 "feat(user): 添加登录接口"` |
| ✅ **test**        | 增加或修改测试代码                                      | `test(api): 补充订单模块单元测试`         |
| 📈 **improvement** | 对现有功能的改进（提升性能、体验等）                    | `improvement(list): 懒加载优化滚动性能`   |
| 📦 **build**       | 与打包构建相关的变动（如 webpack、gradle、npm scripts） | `build: 配置生产环境压缩参数`             |
| 🔁 **ci**          | 持续集成流程变动（如 GitHub Actions、Jenkins、Travis）  | `ci: 添加自动部署到 staging 环境`         |

---

### ✍️ 编写要点

1. **简短描述** 使用**祈使句**、现在时。例如：`fix: 修复超时异常` ✅ 而不是 `fixed: 修复了超时异常` ❌。
2. **正文**（可选）用于详细解释 **为什么** 做此改动，以及 **与之前行为的差异**。每行不超过72字符。
3. **脚注**（可选）用于关联 **Issue**、**Breaking Change** 或 **关闭工单**。例如：`Closes #123, #456`。

---
