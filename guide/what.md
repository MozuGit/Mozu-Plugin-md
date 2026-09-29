# 魔族陌插件

魔族陌插件（Mozu-Plugin） 是一个适用于 [TRSS-Yunzai](https://github.com/TimeRainStarSky/Yunzai) 的**自用**机器人娱乐插件，作者 [@MozuGit](https://github.com/MozuGit)

## 当前版本

| 项目 | 值 | 来源 |
| --- | --- | --- |
| 包名 | `Mozu-Plugin` | `package.json` 的 `name` |
| 版本 | `1.3.0` | `package.json` 的 `version`，由 `model/Config/Version.js` 的 `Plugin_Version` 读取 |
| 作者 | `@MozuGit` | `package.json` 的 `author` |
| 许可 | `GPL-3.0-only` | `package.json` 的 `license` |
| 主页 | <https://mozumiao.com> | `package.json` 的 `homepage` |
| 仓库 | <https://github.com/MozuGit/Mozu-Plugin> | `package.json` 的 `repository` |
| 插件名（运行时） | 插件根目录的文件夹名 | `Version.Plugin_Name`，取插件根目录 basename |

::: tip 插件名就是目录名
`Version.Plugin_Name` 取自插件根目录的文件夹名，更新指令、日志前缀都用它。
所以按文档放进 `./plugins/Mozu-Plugin` 时，指令是 `#Mozu-Plugin更新`；如果把目录改名成别的，指令里的名字要跟着改。
:::

## 功能模块

| 模块 | 入口文件 | 能做什么 | 生效条件 |
| --- | --- | --- | --- |
| 魔族陌修仙 | `apps/xiuxian/xiuxian.js`（主指令）、`help.js`（帮助）、`title.js`（称号）、`backup.js`（备份还原） | 修炼、开采、突破、闭关、宗门、妖兽、秘境、丹药、功法、灵根、兑换码等，指令表发 `修仙帮助` 获取 | 只对 `QQBot` 适配器生效，且 `Config.xiuxian.setting.enable` 为真、群黑白名单通过；数据全部存在 Redis |
| 伪造聊天 | `apps/example/makeMessage.js` | `#伪造聊天…` 生成合并转发的聊天记录、`#伪造复读 <文本> <次数>` 随机成员复读 | `Config.example.makeMessage.enable`；私聊不支持；`onlyMaster` 可限制为仅主人；在 `QQBot` 适配器下会被直接跳过 |
| 发言统计 | `apps/example/fayan.js` | `#发言榜` 查日/周/月榜，`#清除发言 @某人`、`#清除本群发言` 清记录 | 需要 Redis；两个清除指令限主人；非 QQBot 走纯文本，QQBot 下可发 Markdown + 按钮 |
| 定时点赞 | `apps/example/like.js` | 按 cron 定时给 `targets` 里的 QQ 点赞（调用 OneBot 的 `send_like` 类接口），可配批次、单批次数与批次间隔 | `Config.example.like.enable` 默认 **false**，且 `targets` 不能为空；需要适配器提供 `sendApi` / `sendLike` / `like` 之一；**没有群指令**，纯定时任务 |
| QQBot 接口 | `apps/interface.js` | 给 QQBot 适配器补群信息、群内机器人状态、禁言、入群申请列表等接口，并把 `mqqapi`/`laTex`/`qagent` 挂到 `global.Mozu` | `Config.config.interface.enable` 默认 **false**，要去锅巴面板手动打开；仅 QQBot |
| 更新 | `apps/update.js` | `#魔族陌更新`（含强制变体）、`#魔族陌更新日志` | 更新要主人权限；底层依赖云崽自带的更新模块 |

各功能的具体指令、参数与限制见[功能](/feature/xiuxian)栏目；`#伪造聊天` 的语法细节见 [伪造聊天](/feature/make-message)。

## 整体架构分层

| 目录 / 文件 | 层级 | 职责 | 代表文件 |
| --- | --- | --- | --- |
| `apps/` | 指令层 | 每个 `.js` 就是一个 `plugin` 子类，声明 `reg` 正则与 `fnc` 处理函数；`index.js` 会递归加载该目录下所有 `.js` | `apps/xiuxian/xiuxian.js`、`apps/example/fayan.js` |
| `model/` | 业务层 | 玩法逻辑、配置读写与版本信息 | `model/xiuxian/xiuxian.js`（玩法核心）、`model/Config/Config.js`（YAML 配置）、`model/Config/Version.js`、`model/ai/openai.js` |
| `lib/` | 工具层 | 与业务无关的基础设施 | `lib/Redis.js`（ioredis 客户端）、`lib/protocol.js`（mqqapi / laTex / qagent）、`lib/TwoFactorAuth.js`（TOTP） |
| `config/` | 配置层 | 三组配置目录 `config/`、`xiuxian/`、`panel/`，每组下 `default/` 是模板、`config/` 是用户实际生效的配置 | `config/xiuxian/default/setting.yaml`、`config/panel/default/login.yaml` |
| `guoba/` | 面板层 | 锅巴面板的接入与表单定义，根目录的 `guoba.support.js` 是对外入口 | `guoba/index.js`、`guoba/pluginInfo.js`、`guoba/schemas/` |
| `server/` + `src/` | 内置管理台 | `src/` 是 Vue3 + Ant Design Vue 源码，`server/` 是 Express 服务与构建产物（`server/static`） | `server/index.js`、`server/router/`、`src/views/` |
| `scripts/` | 脚本层 | 可复用的脚本工具 | `scripts/backup.js`（Redis 键备份 / 还原） |

加载流程也很直白：`index.js` 先尝试 `import('./server/index.js')` 启动内置管理台（失败只记一条日志），再递归读取 `apps/` 下所有 `.js` 逐个 `import`，最后打印载入横幅并导出 `{ apps }`。单个文件载入失败会打印 `载入插件错误：<文件路径>` 并跳过，不影响其他指令。

## 它和云崽怎么对接

- **指令**：`apps/` 下每个文件导出一个继承 `plugin` 的类，用 `name`、`dsc`、`event`、`priority` 和 `rule` 声明自己；`rule` 里的 `reg` 是匹配消息的正则，`fnc` 是对应的处理函数。
- **配置**：`model/Config/Config.js` 在启动时把 `config/<组>/default/*.yaml` 复制成 `config/<组>/config/*.yaml`，读取时把两者合并（用户值优先），并用 chokidar 监听文件变化。
- **定时任务**：用 `task` 字段声明 cron，例如修仙定时备份的 `0 0 * * * *`。
- **HTTP 服务**：`server/index.js` 用 express 起管理台，接口挂在 `/api` 下（`/api/login`、`/api/xiuxian`、`/api/about`），静态页面由 `server/static` 提供。
- **锅巴面板**：根目录的 `guoba.support.js` 转发到 `guoba/index.js` 的 `supportGuoba()`，返回 `pluginInfo` 与 `configInfo`。
- **更新**：不在插件内实现，而是复用云崽的更新模块（详见 [更新与卸载](/guide/update)）。

## 运行前提

| 前提 | 说明 |
| --- | --- |
| 已部署的 TRSS-Yunzai | 插件放进云崽根目录的 `plugins/` 下，进入插件目录执行 `pnpm install` |
| pnpm | README 给出的依赖安装方式就是 `pnpm install` |
| Redis | `lib/Redis.js` 在模块加载时创建 ioredis 客户端，默认连 `127.0.0.1:6379` 的 0 号库。发言统计、修仙数据、QQBot 接口缓存、内置管理台都依赖 Redis |
| QQBot 适配器 | 修仙全套指令、`修仙帮助`、备份还原、QQBot 接口都限定了 `['QQBot'].includes(e.bot.adapter.name)`，其他适配器下这些功能不会响应 |
| 现代 Node | 插件是纯 ESM（`"type": "module"`），`index.js` 里用了顶层 `await import(...)`；`package.json` 未声明 `engines` |
| 锅巴面板（可选） | 想用图形界面改配置才需要，安装方式见<https://github.com/guoba-yunzai/guoba-plugin> |

## 许可与免责

::: warning 用之前请读这段
- **未经深度测试**：由于作者精力有限，代码未经过深度测试，玩法数值、指令行为都可能随版本变动。
- **仅供学习交流**：这是一个**自用**插件，不是面向生产的项目；把它用在正式业务上出了问题只能自己承担。
- **数据在 Redis**：玩家、宗门、发言统计、兑换码等数据都在 Redis 里，插件目录本身只放配置和备份文件。删插件目录前先看[更新与卸载](/guide/update)。
- **反馈渠道**：有问题请提交到 <https://github.com/MozuGit/Mozu-Plugin/issues>。
:::

项目以 **GPL-3.0**（`GPL-3.0-only`）许可发布，二次分发或修改请遵守该许可。

## 接下来

- 想装起来：[安装](/guide/install)
- 想看有什么玩法：[魔族陌修仙](/feature/xiuxian)、[伪造聊天](/feature/make-message)、[发言统计](/feature/fayan)、[QQBot 接口](/feature/qqbot-api)
- 想改配置：[锅巴面板配置](/config/guoba)、[配置文件说明](/config/files)
- 想改代码：[项目结构](/develop/structure)
