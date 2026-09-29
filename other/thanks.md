# 鸣谢

Mozu-Plugin 能跑起来、能配得舒服、能被你看到这份文档，靠的不只是作者一个人的代码。下面这些项目和它们的维护者值得被点名。

## 依赖与参考项目

| 项目 | 它帮了什么 |
| --- | --- |
| [Guoba-Plugin（锅巴面板）](https://github.com/guoba-yunzai/guoba-plugin) | 插件的配置面板建立在锅巴的 schema 机制上：`guoba.support.js` 暴露 `supportGuoba()`，`guoba/schemas/` 下每个功能一个表单定义，修仙开关、秘境、丹药、灵根概率都能在面板里点几下改完。 |
| [TRSS-Yunzai](https://github.com/TimeRainStarSky/Yunzai) | 本插件的运行框架。插件按 Yunzai 的 `plugin` 规范编写（`apps/` 下继承 `plugin`、声明 `rule` 与 `task`），消息收发、消息段、定时任务、主人权限都来自框架；更新功能也直接复用框架的更新模块（`apps/update.js` 会动态载入 `other/update.js` / `system/apps/update.ts`）。 |
| [QQBot-Plugin](https://github.com/taohyc/QQBot-Plugin) | 本插件依赖的 **QQBot 适配器**由它提供（仓库自述：云崽 QQ 机器人适配器）。修仙、备份等指令的准入判断 `['QQBot'].includes(e?.bot?.adapter?.name)` 里的适配器名 `QQBot` 即来自这个插件；`lib/protocol.js` 里的 `mqqapi`（行内指令）、`laTex`（彩色文本）、`qagent`（用户卡片）三种文本协议，也都是在 QQ 开放平台机器人的 Markdown 能力上拼出来的，只有在这个适配器下才有效。 |
| meme-plugin | **原链接已失效**，因此这里只能致谢、无法给出链接。如果你知道它的现址，欢迎提 Issue 补充。 |

## 插件用到的开源库

插件的依赖都在 `package.json` 里，下面是实际在源码中发挥作用的部分：

| 库 | 在插件里做什么 |
| --- | --- |
| `express` | `server/` 下的管理台 HTTP 服务与 `/api` 路由 |
| `ioredis` | `lib/Redis.js` 建立的 Redis 连接，玩家数据、发言统计、面板 token 都存 Redis |
| `yaml` | `model/Config/YamlReader.js` 解析与回写各类配置文件 |
| `chokidar` | `Config.js` / `YamlReader.js` 监听 yaml 变更，实现配置热加载 |
| `lodash` | 配置差异比较等工具函数 |
| `flat` | 锅巴面板提交的扁平字段用 `unflatten` 还原成嵌套结构 |
| `mathjs` | 用 `evaluate` 计算修仙战力公式 `powerFormula` |
| `openai` | AI 文本审核（`model/ai/openai.js`） |
| `speakeasy` | 管理台 TOTP 双因素认证（`lib/TwoFactorAuth.js`） |
| `vue` + `vue-router` | 管理台前端框架与哈希路由 |
| `ant-design-vue` + `@ant-design/icons-vue` | 管理台的 UI 组件与图标 |
| `echarts` | 管理台修仙首页的图表 |
| `dayjs` | 管理台的时间格式化 |
| `qrcode` | 设置页生成 TOTP 二维码 |
| `vite` + `@vitejs/plugin-vue` | 管理台的构建工具链 |

## 参考资料

- [QQ 机器人官方文档](https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_groups_group_openid_info.get.html) —— `apps/interface.js` 里补充的群信息、禁言、入群申请等接口，字段与调用方式都对着这份文档写。

## 怎么回馈这些项目

- 给 [Guoba-Plugin](https://github.com/guoba-yunzai/guoba-plugin)、[TRSS-Yunzai](https://github.com/TimeRainStarSky/Yunzai)、[QQBot-Plugin](https://github.com/taohyc/QQBot-Plugin) 点个 Star，这是最省力的支持。
- 遇到是框架或面板的问题，请提到对应项目的 Issue，而不是本插件的 Issue——这样更容易被正确的人看到。
- 发现文档写错了（尤其是路径、指令、字段名），可以直接改 <https://github.com/MozuGit/Mozu-Plugin-md> 并提 PR；每页底部的「在 GitHub 上编辑此页面」会直接跳到对应的 Markdown 文件。

## 文档站

本站的版式、信息密度与写作风格参考了 **NapCatQQ 文档站**：

- 站点：<https://napneko.github.io/>
- 仓库：<https://github.com/NapNeko/NapCatDocs>

从导航结构、侧栏分组到「快速开始 / 功能 / 配置 / 关于」的编排，都受益于那份文档的示范。本站本身用 [VitePress](https://vitepress.dev/) 构建，启用了本地全文搜索。

::: info 这里的致谢只针对「文档站版式」
NapCatQQ 是 NTQQ 的协议端实现，**与本插件的代码依赖无关**：本插件的 QQBot 适配器、`mqqapi` / `laTex` / `qagent` 文本协议都来自上表的 **QQBot-Plugin**，两者不是同一个项目，请不要混淆。
:::

## 还有你

如果你提过 Issue、报过 bug、在群里帮忙回过问题，或者只是把插件装在自己群里——谢谢，这些都算数。

想参与的话：[提交 Issue](https://github.com/MozuGit/Mozu-Plugin/issues) 或来 QQ 群「陌陌の小窝」`976719017`，联系方式见 [关于与联系](/other/about)。
