# 安装

安装本身只有两步：**把仓库克隆到云崽的 `plugins/Mozu-Plugin`**，然后 **`pnpm install`**。麻烦的地方都在前置条件上，先对一遍表。

## 前置条件

| 项目 | 要求 | 为什么 |
| --- | --- | --- |
| TRSS-Yunzai | 已经部署好并能正常启动 | 插件靠云崽扫描 `plugins/` 目录加载，不能单独运行 |
| pnpm | 可用 | README 给出的依赖安装命令是 `pnpm install` |
| Redis | 可连接，默认 `127.0.0.1:6379` 的 0 号库 | `lib/Redis.js` 在模块加载时就会创建 ioredis 客户端；发言统计、修仙数据、QQBot 接口缓存、内置管理台都读写 Redis |
| QQBot 适配器 | 想用修仙、QQBot 接口功能时必需 | 修仙主指令、`修仙帮助`、备份还原、QQBot 接口在代码里都限定了 `['QQBot'].includes(e.bot.adapter.name)`，其他适配器下这些功能直接不响应 |
| Node.js | 支持 ESM 与顶层 `await` | 插件是 `"type": "module"`，`index.js` 里用了顶层 `await import(...)`；`package.json` 未声明 `engines`，跟随云崽的运行环境即可 |
| 锅巴面板 | 可选 | 只有想用图形界面改配置才需要，见文末 |

## 安装步骤

进云崽根目录（就是有 `plugins/` 目录的那一层）执行克隆。三个源任选一个，内容一致，GitHub 打不开就换下面两个：

::: code-group

```sh [GitHub]
git clone https://github.com/MozuGit/Mozu-Plugin ./plugins/Mozu-Plugin
```

```sh [Gitee 换源]
git clone https://gitee.com/MozuGit/Mozu-Plugin ./plugins/Mozu-Plugin
```

```sh [GitCode 换源]
git clone https://gitcode.com/MozuGit/Mozu-Plugin ./plugins/Mozu-Plugin
```

:::

然后安装依赖：

```sh
cd ./plugins/Mozu-Plugin
pnpm install
```

装完重启 Yunzai。首次启动时插件会自动把 `config/*/default/*.yaml` 复制一份到 `config/*/config/*.yaml`，后者才是你实际生效的配置。

## 验证是否安装成功

### 1. 看启动日志

`index.js` 会用 `logger.rgb` 逐字上色打印一段横幅，看到它就说明插件本体载入成功：

```text
━━━━━━━━━━━━━━━━━━━━━━
┃ Mozu-Plugin 载入成功
┃ 版本：v1.x.x
┃ 陌陌の小窝：976719017
━━━━━━━━━━━━━━━━━━━━━━
```

其中版本号取自 `package.json`，所以升级后这里的 `v` 后面会跟着变。

内置管理台起得来时，还会有额外一段：

```text
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ [魔族陌] 启动成功喵~
┃ 外网地址：http://<你的公网IP>:11451
┃ 本地地址：http://127.0.0.1:11451
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

::: warning 两种「看起来像失败」的日志
- `载入插件错误：<文件路径>`：`apps/` 下某个文件 import 失败，插件会跳过它继续加载其余指令。多数情况是依赖没装全。
- `[魔族陌面版] 服务器启动失败：`：只是内置管理台没起来，机器人指令不受影响。端口、密码等排错见[常见问题](/guide/faq)。
:::

### 2. 发一条指令

`apps/` 下的所有 `.js` 都会被递归加载，横幅出现即代表指令已注册。可以按下面的顺序试：

| 试什么 | 需要 QQBot 适配器 | 备注 |
| --- | --- | --- |
| `#发言榜` | 否 | 群里发即可，需要 Redis；没数据会回「暂无数据」 |
| `#伪造聊天123456789,你好` | 否 | 群里发，会回一条合并转发消息 |
| `#修仙帮助` | **是** | 还要修仙开关为真、群黑白名单通过，否则不会有任何反应 |
| `#魔族陌更新日志` | 否 | 用于确认更新模块可用，任何人可发 |

## 换源安装

已经装好了，只是 GitHub 拉不动，就换掉 `origin` 再拉一次（标准 git 操作，插件里没有换源脚本）：

```sh
cd ./plugins/Mozu-Plugin

# 看当前源
git remote -v

# 换成 Gitee（换 GitCode 就把地址替换成 https://gitcode.com/MozuGit/Mozu-Plugin）
git remote set-url origin https://gitee.com/MozuGit/Mozu-Plugin
git pull
```

换源之后记得 `pnpm install` 再重启。三种源地址对照：

| 源 | 克隆地址 | 仓库页 |
| --- | --- | --- |
| GitHub | `https://github.com/MozuGit/Mozu-Plugin` | <https://github.com/MozuGit/Mozu-Plugin> |
| Gitee | `https://gitee.com/MozuGit/Mozu-Plugin` | <https://gitee.com/MozuGit/Mozu-Plugin> |
| GitCode | `https://gitcode.com/MozuGit/Mozu-Plugin` | <https://gitcode.com/MozuGit/Mozu-Plugin> |

::: danger 别用「删掉重装」来换源
配置文件 `config/*/config/*.yaml` 和备份文件 `backup/xiuxian/*.json` 都在插件目录里，且被 `.gitignore` 忽略。
删目录重装等于把它们一起删掉，修仙玩家数据虽然还在 Redis，但群黑白名单、端口、密码这些配置要重新填。
:::

::: tip 依赖拉不下来
`pnpm install` 卡住或者报网络错误时，先确认用的是 pnpm，再考虑给包管理器换 registry 镜像（这是 pnpm 的通用用法，插件源码里没有任何安装脚本或镜像配置）。
`package.json` 的 `scripts` 里只有一条 `build`，跑 `pnpm run build` 是给管理台前端源码用的，普通用户不需要。
:::

## 依赖说明

`package.json` 的 `dependencies` 里每个包都在插件里有明确用途，装不全就会出现对应的功能报错：

| 依赖 | 用途 | 证据 |
| --- | --- | --- |
| `ioredis` | Redis 客户端，发言统计、修仙、接口缓存、管理台全靠它 | `lib/Redis.js` |
| `express` | 内置管理台的 HTTP 服务 | `server/index.js`、`server/router/` |
| `yaml`、`chokidar`、`lodash` | 读取 YAML 配置并监听文件改动 | `model/Config/YamlReader.js`、`model/Config/Config.js` |
| `openai` | 修仙宗门名称/简介的 AI 审核 | `model/ai/openai.js` |
| `speakeasy` | 管理台的 TOTP 双因素认证 | `lib/TwoFactorAuth.js` |
| `mathjs` | 计算战力公式 | `model/xiuxian/xiuxian.js` |
| `flat` | 锅巴面板配置的扁平化读写 | `guoba/schemas/index.js` |
| `vue`、`vue-router`、`ant-design-vue`、`@ant-design/icons-vue`、`echarts`、`dayjs` | 管理台前端（`src/`），以及被包含进 `server/static` 的已构建产物 | `src/main.js`、`src/views/` |

管理台前端只有在你要改 `src/` 源码时才需要 `pnpm run build`（也就是 `vite build`），仓库里已经带了构建好的 `server/static`，直接用即可。

Redis 相关配置在 `config/config/default/Redis.yaml`：`host`、`port`、`database`、`connectTimeout`、`keepAlive`、`noDelay`，改完要重启。连不上会同时影响发言统计、修仙和管理台，排查方法见[常见问题](/guide/faq)。

## 锅巴面板（可选）

想在图形界面里改上面这些配置，需要额外安装锅巴面板，安装方式以它的官方仓库为准：<https://github.com/guoba-yunzai/guoba-plugin>。插件侧的接入入口是根目录的 `guoba.support.js`，面板里能看到哪些配置项见[锅巴面板配置](/config/guoba)。

装好插件后接下来建议读：[更新与卸载](/guide/update)（怎么升级、怎么备份）→ [常见问题](/guide/faq)（踩坑速查）。
