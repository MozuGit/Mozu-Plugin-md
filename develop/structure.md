# 项目结构

这一页说明 Mozu-Plugin 仓库里每个目录、每个文件分别负责什么。看懂结构之后再动手改代码，会比直接翻文件快很多。

如果你还没装插件，先看 [安装](/guide/install)。

## 目录总览

```text
Mozu-Plugin/
├── apps/                  # 指令层：按功能分文件，启动时被递归扫描加载
│   ├── example/           # 官方示例模块（同样会被加载）
│   │   ├── fayan.js       # 魔族陌:发言统计
│   │   ├── like.js        # 魔族陌:定时点赞（只有 task，没有 rule）
│   │   └── makeMessage.js # 魔族陌:伪造聊天
│   ├── xiuxian/
│   │   ├── backup.js      # 魔族陌:修仙备份（含定时备份 task）
│   │   ├── help.js        # 魔族陌:修仙帮助
│   │   ├── title.js       # 魔族陌:修仙称号（定时发放 / 清理）
│   │   └── xiuxian.js     # 魔族陌:修仙主入口
│   ├── interface.js       # MozuInterface：QQBot 接口扩展
│   └── update.js          # 魔族陌:更新插件
├── config/                # 四个配置组：config / example / panel / xiuxian
│   ├── config/default/    # 通用配置默认值（Redis / interface / openai）
│   ├── example/default/   # 示例模块默认值（fayan / like / makeMessage）
│   ├── panel/default/     # 管理台配置（login.yaml：地址、端口、密码、TOTP、trustProxy）
│   └── xiuxian/default/   # 修仙数据 8 个 yaml
├── guoba/
│   ├── schemas/           # 锅巴面板表单 schema，一个功能一个文件
│   ├── configInfo.js      # 汇总 schemas / actions / 读写配置
│   ├── index.js           # 导出 supportGuoba()
│   └── pluginInfo.js      # 锅巴面板里的插件名片
├── lib/
│   ├── protocol.js        # mqqapi / laTex / qagent 协议文本工具
│   ├── Redis.js           # ioredis 单例
│   ├── panelAuth.js       # 管理台登录令牌：TTL、限流阈值、Bearer 解析
│   └── TwoFactorAuth.js   # TOTP 双因素认证
├── model/
│   ├── Config/
│   │   ├── Config.js      # 配置读取/写入 + 文件监听
│   │   ├── Version.js     # 路径、插件名、版本号
│   │   └── YamlReader.js  # yaml 解析与回写
│   ├── ai/openai.js       # AI 文本审核
│   └── xiuxian/
│       ├── xiuxian.js     # 修仙核心逻辑
│       ├── button.js      # 按钮生成
│       ├── help.js        # 指令清单
│       ├── RegExp.js      # 修仙指令正则
│       ├── index.js       # 统一出口
│       └── tools/
│           ├── notify.js       # 宗门名称/简介审核通知（私聊主人）
│           └── xiuxianText.js  # 指令文案与回复拼装
├── scripts/backup.js      # 离线 Redis 备份 / 还原脚本
├── server/
│   ├── index.js           # Express 入口（监听 0.0.0.0，端口取自 login.yaml）
│   ├── router/            # /api 路由（index / auth / about / xiuxian）
│   ├── controllers/       # 路由对应的业务实现
│   └── static/            # 【构建产物目录】Vue3 管理台打包输出
├── src/                   # Vue3 管理台源码（App.vue / main.js / router / views）
├── guoba.support.js       # 锅巴面板对接入口
├── index.html             # 管理台 HTML 模板
├── index.js               # 插件入口
├── package.json           # 依赖、版本号、#Config/#Redis 别名
└── vite.config.js         # 管理台构建配置（outDir: server/static）
```

## 根目录文件

| 文件 | 作用 |
| --- | --- |
| `index.js` | 插件入口。先启动内置服务器，再递归扫描 `apps/**/*.js` 注册全部指令模块 |
| `guoba.support.js` | 只做一件事：`export { supportGuoba } from "./guoba/index.js"`，供锅巴面板调用 |
| `index.html` | 管理台的 HTML 模板，标题为「魔族陌 - MozuAdmin」 |
| `vite.config.js` | 管理台构建配置，产物固定输出到 `server/static` |
| `package.json` | 依赖清单、`version` 版本号、`imports` 别名 |
| `.prettierrc` / `.prettierignore` | 代码格式化配置：无分号、单引号、`printWidth: 120`，提交前可跑 `npx prettier --write .` |
| `Mo.png` / `LICENSE` / `README.md` | 图标、GPL-3.0-only 许可、项目说明 |

### 入口 index.js 做了什么

读源码可以分成四步：

1. `await import('./server/index.js')`：启动内置 Express 服务器。这一步包在 `try/catch` 里，失败只会打印「服务器启动失败」，插件其它功能不受影响。
2. 递归读取 `apps` 目录，过滤出所有 `.js` 文件。
3. 用 `Promise.allSettled` 并行 `import` 每个文件；某个文件报错时打印「载入插件错误：<文件路径>」并附上原始错误，然后继续加载其它文件。
4. 按文件名匹配导出（`key.toLowerCase() === appName.toLowerCase()`，匹配不到就取第一个导出），最后打印带版本号的载入横幅并 `export { apps }`。

版本号来自 `model/Config/Version.js` 的 `Version.Plugin_Version`，它直接读取 `package.json` 的 `version` 字段；`Version.Plugin_Name` 则取插件目录名，所以把仓库克隆成别的目录名，更新指令里的插件名也会跟着变。

### #Config 与 #Redis 别名

`package.json` 里声明了两个 subpath imports，源码里到处都在用：

```json
"imports": {
  "#Config": "./model/Config/Config.js",
  "#Redis": "./lib/Redis.js"
}
```

| 别名 | 真实路径 | 用途 |
| --- | --- | --- |
| `#Config` | `./model/Config/Config.js` | 读写 `config/` 下的 yaml 配置 |
| `#Redis` | `./lib/Redis.js` | 共用一个 ioredis 连接 |

因此新增模块时，推荐统一写 `import Config from "#Config"`，而不是写一长串相对路径。

## apps/ —— 指令层

每个文件导出若干继承 `plugin` 的类，`super()` 里声明名字、事件、优先级和 `rule` 正则，命中后调用对应的 `fnc`。当前目录：

| 路径 | 类 / 功能 |
| --- | --- |
| `apps/xiuxian/xiuxian.js` | 修仙总入口，只做适配器与黑白名单校验，正文案交给 `model/xiuxian/tools/xiuxianText.js` |
| `apps/xiuxian/help.js` | `#修仙帮助` |
| `apps/xiuxian/backup.js` | 修仙备份 / 还原 + 一个 cron 定时备份 task |
| `apps/xiuxian/title.js` | 排行榜称号定时发放与过期清理 |
| `apps/interface.js` | QQBot 接口补充（群信息缓存、禁言、入群申请等） |
| `apps/update.js` | 更新插件与查看更新日志 |
| `apps/example/fayan.js` | 发言统计 |
| `apps/example/like.js` | 定时点赞：只有 `task`（按 cron 给目标 QQ 点赞），没有 `rule` |
| `apps/example/makeMessage.js` | 伪造聊天 |

::: tip 怎么加新模块
完整流程见 [新增功能模块](/develop/module)。
:::

## lib/ —— 基础能力

| 文件 | 说明 |
| --- | --- |
| `protocol.js` | 导出 `mqqapi`（生成 `mqqapi://aio/inlinecmd` 点击指令文本）、`laTex`（彩色文本）、`qagent`（@ 某人）。`forceSharp` 开启时会给按钮与帮助文本里的指令加 `/` 前缀（云崽会把 `/` 自动转换成 `#`） |
| `Redis.js` | 用 `config/config/*/Redis.yaml` 里的 host / port / database 等参数创建 ioredis 实例并默认导出，并挂了一个 `error` 事件监听，把连接错误打成 `[Mozu-Plugin][Redis] <原因>` |
| `panelAuth.js` | 管理台登录令牌的唯一出处：`TOKEN_TTL`（7 天）、`MAX_PASSWORD_ATTEMPTS`（10）、`MAX_CODE_ATTEMPTS`（5）、`tokenKey()`（Redis 键 `Mozu:panel:token:<token>`）、`getBearerToken()`、`isTokenValid()`、`revokeToken()` |
| `TwoFactorAuth.js` | 基于 speakeasy 的 TOTP：`generateSecret()` 生成密钥与 otpauth 链接，`verifyToken()` 校验验证码 |

## model/ —— 业务逻辑

| 路径 | 说明 |
| --- | --- |
| `Config/Config.js` | 配置中心。启动时把 `config/<目录>/default/*.yaml` 复制到同级的 `config/` 目录，并用 chokidar 监听改动。`dirCfgNames` 目前是 `config`、`xiuxian`、`example`、`panel` 四个目录，可用 `Config.example.fayan`、`Config.xiuxian.setting` 这种「`Config.<组名>.<文件名>`」代理方式直接读某个 yaml |
| `Config/YamlReader.js` | 基于 `yaml` 包的读写封装，提供 `get / set / delete / addIn / jsonData` |
| `Config/Version.js` | 导出 `Plugin_Path`、`Plugin_Name`、`Plugin_Version`、`Plugin_pkg` |
| `ai/openai.js` | `aiAuditText()`：把用户文本丢给 OpenAI 兼容接口判断是否违规 |
| `xiuxian/xiuxian.js` | 修仙核心：境界突破、修炼开采、闭关、切磋、妖兽、秘境、储物袋、宗门、排行榜等 |
| `xiuxian/tools/xiuxianText.js` | 指令文案层，按 `commandHandlers` 与 `prefixHandlers` 分发并拼装 Markdown |
| `xiuxian/button.js` | 拼装各种按钮组 |
| `xiuxian/help.js` / `RegExp.js` | 指令清单与指令正则 |

## config/ —— 配置与数据

四个子目录结构完全一致：`default/` 是随仓库发布的默认值，`config/` 是运行时自动生成、被 `.gitignore` 忽略的用户配置。读取路径就是 `<组名>.<文件名>`，例如 `Config.example.fayan`。

| 目录 | 内容 |
| --- | --- |
| `config/config/default/` | `Redis.yaml`、`interface.yaml`、`openai.yaml` |
| `config/example/default/` | `fayan.yaml`、`like.yaml`、`makeMessage.yaml` |
| `config/panel/default/` | `login.yaml`：管理台 `host`、`port`、`password`、`totp`、`trustProxy` |
| `config/xiuxian/default/` | 修仙 8 个数据文件，详见 [修仙数据扩展](/develop/xiuxian-data) |

::: warning 不要直接改 default
`default/` 里改了不会立刻覆盖已有的用户配置，两边容易不一致。要改默认值就同时改 `default/` 和 `config/`，或者删掉 `config/` 下的对应文件让它重新复制。
:::

## guoba/ —— 锅巴面板

| 文件 | 说明 |
| --- | --- |
| `guoba/index.js` | `supportGuoba()` 返回 `{ pluginInfo, configInfo }` |
| `guoba/pluginInfo.js` | 面板名片：插件名、标题「魔族陌插件（Mozu-Plugin）」、作者、仓库地址、图标 |
| `guoba/configInfo.js` | 汇总 `schemas`、`actions`、`getConfigData`、`setConfigData` |
| `guoba/schemas/*.js` | 每个功能一个 schema 文件，字段名形如 `example.fayan.enable`、`example.like.cron`、`xiuxian.setting.enable` |

配置面板的用法见 [锅巴面板配置](/config/guoba)。

## scripts/ —— 离线脚本

`scripts/backup.js` 是通用的 Redis 备份 / 还原工具，**只认 `Mozu:` 前缀的键**：`backupKeys(pattern, file)` 用 `scanStream` 遍历匹配的键，按 string / hash / list / set / zset 分别取值，写出一个 JSON 数组文件（pattern 不以 `Mozu:` 开头会告警并返回 `null`，扫描到的非 `Mozu:` 键也会被过滤掉）；`restoreKeys(file, options)` 反向写回，`pattern` 默认是 `Mozu:*`，非法 pattern 与备份文件里带非 `Mozu:` 前缀的 key 都会被拒绝，开启 `purge` 时清理的是「匹配 pattern、带 `Mozu:` 前缀、又不在备份里」的键——**云崽自身的 Redis 键不会被删**。修仙备份模块就是调它来处理 `Mozu:xiuxian:*` 的，还原时显式传 `{ purge: true, pattern: 'Mozu:xiuxian:*' }`。

## server/ —— Express 后端

| 路径 | 说明 |
| --- | --- |
| `server/index.js` | 创建 Express 实例，挂载 `/api` 路由与静态目录，读取 `login.yaml` 的 `port`（默认 `11451`）后监听 `0.0.0.0`。端口被占用、权限不足等错误会打印排查提示 |
| `server/router/` | `index.js` 汇总，另有 `auth.js`、`about.js`、`xiuxian.js` |
| `server/controllers/` | `authController`、`aboutController`、`xiuxianController`，真正的业务实现 |
| `server/static/` | **构建产物目录**，由 `pnpm build` 生成，不用手改 |

管理台相关说明见 [内置管理台](/webui/) 与 [部署与安全](/webui/security)。

## src/ —— Vue3 管理台源码

`main.js` 挂载应用，`App.vue` 是外壳，`router/index.js` 用 hash 路由组织页面，并有一个 `beforeEach` 守卫：没有 `localStorage.token` 就跳登录页。页面都在 `views/`：

| 页面 | 路径 |
| --- | --- |
| 登录 | `views/login.vue` |
| 首页 | `views/index.vue` |
| 修仙 | `views/xiuxian.vue`，子页 `home` / `backup` / `config` / `cdk` / `player` / `sect` |
| 设置 | `views/settings.vue` |
| 关于 | `views/about.vue` |

改完前端需要重新执行 `pnpm build`，产物会覆盖 `server/static`，刷新页面即可看到效果。
