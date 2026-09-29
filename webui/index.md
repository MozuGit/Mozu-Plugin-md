# 内置管理台

Mozu-Plugin 自带一个网页管理台（页面标题 `魔族陌 - MozuAdmin`），不用进群、不用记指令，就能看修仙数据、改修仙配置、发兑换码、管玩家和宗门、做备份。

## 它是怎么起来的

插件根目录的 `index.js` 在加载业务模块之前会先尝试启动服务：

```js [index.js]
try {
  await import('./server/index.js')
} catch (err) { logger.error("[魔族陌面版] 服务器启动失败：", err) }
```

服务启动失败只会打一条日志，不影响机器人的其他功能。服务本体是 Express：`app.use(express.json())`、把 `server/router/index.js` 挂到 `/api`、用 `express.static()` 暴露 `server/static` 目录，并让 `GET /` 返回 `server/static/index.html`。

## 访问地址与端口

| 项目 | 真实取值 |
| --- | --- |
| 默认端口 | `11451`（来自 `config/panel/config/login.yaml` 的 `port`） |
| 监听地址 | `0.0.0.0`，即所有网卡都可访问 |
| 展示地址 | `login.yaml` 的 `host`；填 `auto` 时自动获取本机公网 IP（结果缓存到 Redis 键 `Mozu:remote-ip`，有效期 24 小时） |
| 本地地址 | `http://127.0.0.1:11451` |
| 端口非法时 | 端口不是 1–65535 的整数就只记一条「端口配置无效，面版未启动」，服务不启动 |

启动成功时日志里会打印两行地址：

```text
┃ 外网地址：http://<displayHost>:11451
┃ 本地地址：http://127.0.0.1:11451
```

前端路由用的是 hash 模式（`createWebHashHistory`），所以具体页面的地址形如 `http://127.0.0.1:11451/#/xiuxian/player`。

::: warning 别把端口直接暴露到公网
管理台默认不带 HTTPS，登录 token 也只是明文 HTTP 传输。对外提供访问请走反向代理，做法见 [部署与安全](/webui/security)。
:::

## 登录方式

登录页是路由 `login`（`/login`）：默认只有一个密码输入框，若启用了两步验证，第一次提交会被服务端以「TOTP 验证码错误」挡回，这时页面才展开 6 位动态验证码输入框，补填后即可登录。

| 环节 | 说明 |
| --- | --- |
| 密码 | 前端先做一次 SHA-256 再提交；服务端既接受 SHA-256 十六进制串，也接受明文，比对对象是 `config/panel/config/login.yaml` 的 `password` |
| 密码为空 | 直接返回「未设置密码」，无法登录，请先设一个 |
| 连续输错 | 错误计数达到 10 次后提示「密码连续错误，请60秒后重试」 |
| 两步验证 | `totp.enabled` 为 `true` 时，密码正确还不够，必须再填一次 6 位动态码（`lib/TwoFactorAuth.js` 用 `speakeasy` 校验，容错窗口 1）；只填密码会收到「TOTP 验证码错误」 |
| 忘记密码 | 登录页「忘记密码」→ 获取验证码（8 位数字，打印在机器人日志里，5 分钟有效，同 IP 未过期时不能重复获取）→ 用验证码 + 新密码重置；验证码连续错 5 次需重新获取 |
| 登录态 | 登录成功返回一串随机的 32 字节 token，浏览器存在 `localStorage`，服务端存在 Redis 集合 `Mozu:panel:token` |
| 退出 | 侧边栏「退出登录」调 `/api/login?action=exit`，把 token 从 Redis 集合里移除 |

如果想连动态码一起省掉，就在 `设置` 页启用或关闭两步验证；验证器丢了可以用锅巴面板的「强制关闭TOTP」按钮。

## 页面清单

路由与页面文件名取自 `src/router/index.js`：

| 路径 | 路由 name | 页面文件 | 能做什么 |
| --- | --- | --- | --- |
| `/login` | `login` | `login.vue` | 密码 + 动态码登录、忘记密码重置 |
| `/` | — | — | 重定向到 `/login` |
| `/xiuxian` | `xiuxian` | `xiuxian/home.vue` | 首页：修仙人数、宗门数量、活跃分析 |
| `/xiuxian/home` | — | — | 重定向到 `/xiuxian` |
| `/xiuxian/config` | `xiuxianConfig` | `xiuxian/config.vue` | 修仙配置：按 schema 渲染并保存、一键重置 |
| `/xiuxian/cdk` | `xiuxianCdk` | `xiuxian/cdk.vue` | 兑换码操作：增删改查与使用记录 |
| `/xiuxian/player` | `xiuxianPlayer` | `xiuxian/player.vue` | 玩家管理：检索与编辑玩家数据 |
| `/xiuxian/sect` | `xiuxianSect` | `xiuxian/sect.vue` | 宗门管理：检索与编辑宗门数据 |
| `/xiuxian/backup` | `xiuxianBackup` | `xiuxian/backup.vue` | 修仙备份：备份、还原、删除 |
| `/index` | `index` | `index.vue` | 占位页（只有一句「插件主页」），实际会被弹回 `/xiuxian` |
| `/settings` | `settings` | `settings.vue` | 插件设置：双因素认证（TOTP） |
| `/about` | `about` | `about.vue` | 关于：版本、作者、链接、联系方式 |

侧边栏只有三项：**魔族陌修仙**、**设置**、**关于**；进入「魔族陌修仙」后顶部再用一排按钮切换 首页 / 修仙配置 / 兑换码操作 / 玩家管理 / 宗门管理 / 修仙备份。

::: details 为什么访问 `#/index` 会跳走
`src/App.vue` 里维护了一份允许的路由 name 列表（`xiuxian`、`xiuxianHome`、`xiuxianConfig`、`xiuxianCdk`、`xiuxianPlayer`、`xiuxianSect`、`xiuxianBackup`、`settings`、`about`），不在列表里的页面会被 `router.push('/xiuxian')` 弹回修仙首页——`index` 就是被弹回的那个。
:::

## 各功能页说明

### 首页（`/xiuxian`）

- 「魔族陌修仙」卡片：修仙人数、宗门数量两个统计值。
- 「修仙活跃分析」卡片：今日活跃人数、近 10 天平均人数，以及 10 天活跃趋势图；点击某一天会弹窗列出当天活跃玩家（含修仙 ID 与 openid，openid 可点击复制）。
- 数据来自 `GET /api/xiuxian/getInfo` 与 `GET /api/xiuxian/get_active_players`。

### 修仙配置（`/xiuxian/config`）

- 页面直接复用锅巴面板的 schema（`guoba/schemas/xiuxian.js`）渲染表单：分组标题、分隔线、子表单、数组项的增删改都在这里完成，字段与含义见 [锅巴面板配置](/config/guoba)。
- 保存后逐项写入 `config/xiuxian/config/*.yaml`；保存前会校验丹药/功法 `id` 是否重复、灵根概率之和是否为 100。
- 「确认重置」按钮把 `config/xiuxian/default/` 整个覆盖到 `config/xiuxian/config/`，**不可撤销**。

### 兑换码操作（`/xiuxian/cdk`）

- 列表展示：兑换码、类型（通用 / 专属）、强制设置、使用状态、使用人、使用时间、修为列表、灵石列表。
- 支持添加兑换码、修改、单条删除、批量删除；「通用开关」「强制设置开关」以及逐行的修为 / 灵石数值。
- 每条兑换码可以维护使用记录（使用人 ID + 使用时间），可添加、删除。
- 数据落在 Redis（`Mozu:xiuxian:cdks` 与 `Mozu:xiuxian:cdk:<名称>`），改动即时生效。

### 玩家管理（`/xiuxian/player`）

- 顶部显示当前玩家总数；筛选条件有：修仙ID（文本）、修为（支持 `包含`、`=`、`>`、`<`、`>=`、`<=` 六种比较符）、灵石（同样的六种比较符）、境界（下拉，选项取自境界表）、灵根（下拉，选项取自灵根表）、性别（男 / 女 / 未设置），另有「重置」按钮清空条件。
- 「编辑玩家信息」可修改：修为、灵石、境界、灵根、性别、当前使用称号，以及称号列表（称号名、获得时间、到期时间）。

### 宗门管理（`/xiuxian/sect`）

- 显示当前宗门总数；列表含宗门名称、等级、简介、经验、无需审核状态。
- 「编辑宗门信息」可修改：宗门名称、宗门等级（上限为 `sect_level` 的级数）、宗门描述、宗门经验、无需审核。

### 修仙备份（`/xiuxian/backup`）

- 列出 `backup/xiuxian/` 下的 `.json` 备份文件。
- 「手动备份」可自定义文件名（留空则用时间戳生成）、还原（二次确认）、删除、批量删除。
- 还原走的是全量恢复：备份里没有的 `Mozu:xiuxian:*` 键会被清除，操作前请确认。备份文件的位置与敏感性见 [部署与安全](/webui/security)。

### 设置（`/settings`）

- 「插件设置」卡片里只有一个设置项：双因素认证（TOTP）的状态与开关。
- 启用分三步：用验证器 App（Google Authenticator、Microsoft Authenticator 等）扫二维码；扫不了就手动输入密钥；输入 App 生成的 6 位验证码完成启用。
- 关闭需要输入当前验证码；密钥随后从 `login.yaml` 的 `totp.secret` 中清空。

### 关于（`/about`）

- 显示插件版本并与远端 `package.json` 比对，提示是否有新版本；显示作者与插件链接（GitHub / Gitee / GitCode）、联系方式（QQ、QQ群、爱发电）。

## 接口一览

浏览器能做的操作都对应 `/api` 下的接口，除 `/api/login` 外都需要 `Authorization: Bearer <token>`：

| 接口 | 说明 |
| --- | --- |
| `GET/POST /api/login` | 不带 `action` 即登录；`?action=get_code` 取验证码、`get_code_ttl` 查剩余时间、`reset_password` 重置密码、`exit` 退出登录 |
| `GET/POST /api/login/tfa` | `?action=status` / `create` / `enable` / `delete`，管理两步验证 |
| `GET /api/xiuxian/getInfo` | 修仙人数、宗门数量、近 10 天活跃人数 |
| `GET /api/xiuxian/get_active_players` | 指定日期（`?date=`）的活跃玩家列表 |
| `GET/POST /api/xiuxian/config` | `get_config` / `get_config_elements` / `save_config` / `reset` / `get_groups` |
| `GET/POST /api/xiuxian/cdk` | `getlist` / `add` / `modify` / `delete` |
| `GET/POST /api/xiuxian/player` | `getlist` / `modify` / `getrealm` / `getsroot` |
| `GET/POST /api/xiuxian/sect` | `getlist` / `modify` |
| `GET/POST /api/xiuxian/backup` | `getlist` / `backup` / `restore` / `delete` |
| `GET /api/about/getInfo` | 插件版本、作者与最新版本 |

## 静态资源与源码

管理台页面**不是**运行时编译的源码，而是构建产物：Express 直接用 `express.static()` 提供 `server/static/`，里面是 `index.html` 与 `assets/`（`index.js`、`index2.js`…、`index.css`、`index.ico`、`index.png` 等）。

源码在同目录的 `src/` 下：Vue 3 + ant-design-vue + vue-router，入口 `src/main.js`，壳组件 `src/App.vue`，页面在 `src/views/`。

| 位置 | 内容 |
| --- | --- |
| `src/` | 前端源码（改这里） |
| `server/static/` | 构建产物（浏览器实际加载的文件） |
| `vite.config.js` | 构建配置：`outDir: 'server/static'`，输出文件名统一走 `assets/index.*` |
| `package.json` 的 `scripts.build` | `vite build` |

要重新构建前端，在插件目录执行：

```sh
pnpm build
```

它会按 `vite.config.js` 把产物写到 `server/static/`。构建完刷新浏览器即可看到新页面，**不需要重启机器人**（静态文件是每次请求实时读盘的）。

::: info 只改配置不用构建
管理台的页面结构是固定的，日常改数值、开关、发兑换码都不需要动前端；只有改 `src/` 下的页面代码才需要重新 `pnpm build`。
:::

## 相关链接

- [部署与安全](/webui/security)
- [配置文件说明](/config/files)
- [锅巴面板配置](/config/guoba)
