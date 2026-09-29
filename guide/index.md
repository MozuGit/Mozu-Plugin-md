# 目录导航

这一页是整站地图：按栏目列全所有页面，并给出一条「装好就能玩」的最短路径。如果你刚接触这个插件，从下面的**第一次使用的最短路径**开始看就行。

Mozu-Plugin 是适用于 [TRSS-Yunzai](https://github.com/TimeRainStarSky/Yunzai) 的**自用**机器人娱乐插件，作者 [@MozuGit](https://github.com/MozuGit)，当前版本 `1.3.0`，以 GPL-3.0 许可发布。

## 全部页面

| 栏目 | 页面 | 一句话说明 |
| ---- | ---- | --- |
| 快速开始 | [目录导航](/guide/) | 本页：整站地图与最短上手路径 |
| 快速开始 | [魔族陌插件](/guide/what) | 插件定位、功能模块、目录分层、运行前提与免责说明 |
| 快速开始 | [安装](/guide/install) | 克隆到 `./plugins/Mozu-Plugin`、安装依赖、重启后怎么确认载入成功 |
| 快速开始 | [更新与卸载](/guide/update) | 指令更新与手动更新、卸载步骤、数据清理与备份还原 |
| 快速开始 | [常见问题](/guide/faq) | 指令没反应、依赖装不上、面板看不到插件、管理台与 Redis 排错 |
| 功能 | [魔族陌修仙](/feature/xiuxian) | 修炼、突破、闭关、宗门、妖兽、秘境、灵根、兑换码等玩法与指令表 |
| 功能 | [伪造聊天](/feature/make-message) | `#伪造聊天` 与 `#伪造复读` 的语法、图片与时间戳写法 |
| 功能 | [发言统计](/feature/fayan) | `#发言榜` 日/周/月榜、发言记录清除与统计口径 |
| 功能 | [定时点赞](/feature/like) | 定时给指定 QQ 点赞，只有定时任务、没有群指令，默认关闭 |
| 功能 | [QQBot 接口](/feature/qqbot-api) | 插件补的 QQBot 适配器接口（群信息、禁言、入群申请等），默认关闭 |
| 配置 | [锅巴面板配置](/config/guoba) | 在锅巴面板里改 Redis、管理台、修仙、伪造聊天、发言统计、定时点赞、AI 审核、接口开关 |
| 配置 | [配置文件说明](/config/files) | `config/*/default/*.yaml` 与 `config/*/config/*.yaml` 的关系和每个字段 |
| 配置 | [AI 自动审核](/config/openai) | 修仙宗门名称/简介的 AI 审核配置：`baseURL`、`model`、`apiKey` |
| 管理台 | [内置管理台](/webui/) | 插件自带的 Vue3 + Ant Design Vue 管理台，端口、登录与功能范围 |
| 管理台 | [部署与安全](/webui/security) | 管理台密码、双因素认证（TOTP）与公网暴露风险 |
| 开发 | [项目结构](/develop/structure) | `apps/`、`model/`、`lib/`、`config/`、`guoba/`、`server/`+`src/` 的分层职责 |
| 开发 | [新增功能模块](/develop/module) | 按现有约定加一条指令：写 `apps/` 文件、挂配置、接锅巴面板 |
| 开发 | [修仙数据扩展](/develop/xiuxian-data) | 境界、妖兽、秘境、丹药、功法、灵根等 YAML 数据的扩展方式 |
| 关于 | [关于与联系](/other/about) | 作者、交流群、反馈渠道与赞助方式 |
| 关于 | [鸣谢](/other/thanks) | 参考与致谢的开源项目 |
| 关于 | [更新日志](/other/changelog) | 各版本的变化记录 |

## 第一次使用的最短路径

1. **安装**：把仓库克隆到云崽根目录的 `plugins/Mozu-Plugin`，进目录执行 `pnpm install`，然后重启 Yunzai。
   完整步骤与三种克隆源见 [安装](/guide/install)。
2. **配置**：重启后插件会自动把 `config/*/default/*.yaml` 复制成 `config/*/config/*.yaml`，改配置请改后者。
   用锅巴面板点选最省事，字段含义见 [锅巴面板配置](/config/guoba) 与 [配置文件说明](/config/files)。
3. **试指令**：先在普通适配器下试 `#发言榜`（不需要 QQBot）；确认机器人通了，再进 QQBot 群试 `#修仙帮助`。

::: tip 为什么建议先试 `#发言榜`
发言统计对适配器没有要求，只要 Redis 能连、在群里发就能出结果。
修仙相关的所有指令（含 `修仙帮助`）在源码里限定了只对 `QQBot` 适配器生效，用它做第一次验证容易误判成「装失败了」。
:::

## 读文档前先认识几个词

| 说法 | 指的是什么 |
| --- | --- |
| 云崽 / Yunzai | TRSS-Yunzai 框架本体。插件必须放在它的 `plugins/` 目录里，不能单独运行 |
| 插件目录 / 插件根目录 | 克隆下来的 `plugins/Mozu-Plugin`。运行时的插件名就是它的文件夹名 |
| 适配器 | 机器人连接的协议实现（QQBot、OneBot 等）。修仙相关指令只对 `QQBot` 生效 |
| 锅巴面板 | 云崽的图形化配置面板，本插件通过根目录的 `guoba.support.js` 接入 |
| 管理台 / 魔族陌面版 | 插件自带的一个 Express + Vue 管理界面，默认端口 `11451` |
| Redis | 插件的数据仓库，所有键都以 `Mozu:` 开头。发言统计、修仙、管理台都要用它 |
| `config/*/default` 与 `config/*/config` | 前者是配置模板，后者是实际生效的用户配置，首次启动自动生成 |