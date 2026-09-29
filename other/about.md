# 关于与联系

## 项目信息

| 项目 | 内容 |
| --- | --- |
| 名称 | Mozu-Plugin（魔族陌插件） |
| 作者 | [@MozuGit](https://github.com/MozuGit) |
| 当前版本 | `v1.3.0`（`package.json` 的 `version` 字段，`model/Config/Version.js` 直接读取它） |
| 许可 | [GPL-3.0-only](https://www.gnu.org/licenses/gpl-3.0.html) |
| 仓库 | <https://github.com/MozuGit/Mozu-Plugin> |
| 主页 | <https://mozumiao.com> |
| QQ 群 | [陌陌の小窝 · 976719017](https://qun.qq.com/universal-share/share?ac=1&authKey=13%2FWEfX0G3PO77HgYt3w8yg8K%2BCSE3fYXzuA%2FOH0Vnzv5HDrENZctaRM1qkC07eD&busi_data=eyJncm91cENvZGUiOiI5NzY3MTkwMTciLCJ0b2tlbiI6Inl0NHY2b01BRTlMeHR4MXBYbWJqYWxpbmU5Wk9kT3VqZE1nM0dNYVZET1pBcjVPTVZ5WDVLMnVCaFpHNTFWVUgiLCJ1aW4iOiIzMzQzNzEyNTg5In0%3D&data=uDBsYAg-ZA2RbnkK_3yJFYKmiPRZg-XmEhn6iJ1tWmOfRPEeEIiA6N1o1e5p9-dqSJDSxCk44qnx92h62ZlrmQ&svctype=4&tempid=h5_group_info) |
| 简介 | 适用于 TRSS-Yunzai 的插件，主要功能有修仙、伪造聊天、发言统计等 |
| 依赖框架 | [TRSS-Yunzai](https://github.com/TimeRainStarSky/Yunzai)，锅巴面板配置依赖 [Guoba-Plugin](https://github.com/guoba-yunzai/guoba-plugin) |

版本号只有一个来源：仓库根目录 `package.json` 的 `version`。启动日志横幅里的「版本：v…」、管理台「关于」页显示的版本，都是读取同一个字段，所以想确认版本永远以 `package.json` 为准（见 [更新日志](/other/changelog)）。

::: tip 换源安装
GitHub 打不开时可以用镜像仓库，代码与 GitHub 同步：

- Gitee：<https://gitee.com/MozuGit/Mozu-Plugin>
- GitCode：<https://gitcode.com/MozuGit/Mozu-Plugin>
:::

## 它能做什么

| 能力 | 入口 |
| --- | --- |
| 魔族陌修仙（境界、宗门、妖兽、秘境、灵根、称号、兑换码、排行榜） | [魔族陌修仙](/feature/xiuxian) |
| 伪造聊天与伪造复读 | [伪造聊天](/feature/make-message) |
| 群发言统计与日 / 周 / 月榜 | [发言统计](/feature/fayan) |
| QQBot 接口补充（群信息缓存、禁言、入群申请等） | [QQBot 接口](/feature/qqbot-api) |
| 锅巴面板可视化配置 | [锅巴面板配置](/config/guoba) |
| 内置 Vue3 管理台（玩家、宗门、CDK、备份、图表） | [内置管理台](/webui/) |

## 运行环境与安装位置

- 运行在 **TRSS-Yunzai** 上；插件通过 `apps/` 目录被框架扫描加载，不修改框架本体。
- 需要 **Redis**：`lib/Redis.js` 用 ioredis 连接，玩家数据、发言统计、面板登录 token 都存放在 Redis 中。
- 安装目录建议保持 `plugins/Mozu-Plugin`。`model/Config/Version.js` 里的 `Version.Plugin_Name` 取的是插件**目录名**，而更新指令的正则是用这个名字拼出来的，改成别的名字后 `#Mozu-Plugin更新` 一类的指令会失效（`#魔族陌更新` 仍然可用）。
- 依赖安装方式见 [安装](/guide/install)。

## 联系方式

| 渠道 | 地址 | 适合 |
| --- | --- | --- |
| 作者 QQ | <https://qm.qq.com/q/5fKlztbHHG> | 直接找作者（修仙里的「联系主人」也是指向作者） |
| QQ 群「陌陌の小窝」 | 群号 `976719017` | 使用交流、问配置、反馈 bug |
| GitHub | <https://github.com/MozuGit> | 关注作者其它项目 |
| Issue | <https://github.com/MozuGit/Mozu-Plugin/issues> | 提交 bug 与功能建议（推荐，便于追踪） |
| 爱发电 | <https://www.ifdian.net/a/Mozumo> | 赞助开发者 |

::: tip 反馈问题的正确姿势
带上这些信息能大幅提高处理效率：插件版本（`package.json` 的 `version`）、Yunzai 类型与版本、适配器（是否 QQBot）、完整的报错日志、复现步骤。
:::

## 免责声明

::: danger 请先读完再使用
- 这是一个**自用**插件：功能以满足作者自己的群聊需求为主，不承诺覆盖所有人的使用场景。
- 由于作者精力有限，**代码未经过深度测试**，可能存在未知 bug 或数据风险，请在测试环境验证后再决定是否长期使用。
- 使用本插件所产生的后果由使用者自行承担，请自行评估风险。
- 请遵守 QQ 及相关平台的服务条款，不要用于任何违规用途。
- 本项目仅供学习与交流使用。

**最重要的一条**：使用「伪造聊天」等功能前，请确认不会给群友造成困扰——工具是拿来娱乐的，别用来搞人。
:::

## 名称说明

- **Mozu-Plugin** 是仓库名与插件目录名，也是日志里显示的插件名。
- **魔族陌** 是作者昵称，因此指令都带这个前缀：`#魔族陌更新`、`#魔族陌更新日志`，修仙里「联系主人」跳转的也是作者。
- **陌陌の小窝** 是交流群名称（群号 `976719017`），插件载入横幅里也会打印这个群号。

## 文档站

本站以 `mozumiao.com` 对外提供服务，源文件放在 <https://github.com/MozuGit/Mozu-Plugin-md>，基于 [VitePress](https://vitepress.dev/) 构建——每页底部的「在 GitHub 上编辑此页面」会直接跳到对应的 Markdown 文件，发现文档与代码不一致时欢迎直接改并提 PR，也可以到[插件仓库的 Issues](https://github.com/MozuGit/Mozu-Plugin/issues) 指出。版式上的致谢见 [鸣谢](/other/thanks)。

## 相关页面

- 想了解能做什么：[什么是 Mozu-Plugin](/guide/what)、[魔族陌修仙](/feature/xiuxian)
- 想装起来：[安装](/guide/install)、[更新与卸载](/guide/update)
- 想改代码：[项目结构](/develop/structure)
- 想看看谁帮过忙：[鸣谢](/other/thanks)
