# 部署与安全

管理台能改修仙数值、发兑换码、改玩家数据、还原备份，等于机器人数据的总开关。它默认监听 `0.0.0.0`、默认没有 HTTPS，所以**怎么放出去**比装什么插件更重要。

## 第一件事：设置强密码

| 项目 | 说明 |
| --- | --- |
| 改哪个文件 | `config/panel/config/login.yaml` 的 `password` 字段 |
| 默认值 | 随仓库发布的默认值是空字符串，空密码无法登录（会提示「未设置密码」） |
| 怎么改 | 推荐走锅巴面板 → `魔族陌面版` → 「面版密码」；也可以手改 YAML，再或者用登录页的「忘记密码」重置 |
| 存的是什么 | 明文或 SHA-256 十六进制串都能被识别；锅巴面板与「忘记密码」流程写入的都是 SHA-256 摘要 |
| 建议 | 用一段独立的随机长密码，不要与其他站点复用 |

::: danger 不要沿用默认端口 + 空密码
默认端口是公开写在源码里的，任何人扫到你的端口就能打开登录页。先把密码设好，再做后面的网络隔离。
:::

## 开启两步验证（TOTP）

开启后，仅有密码不足以登录：必须再输入验证器 App 生成的 6 位动态码。

| 项目 | 说明 |
| --- | --- |
| 开关字段 | `config/panel/config/login.yaml` 的 `totp.enabled` |
| 密钥字段 | 同文件的 `totp.secret`（Base32） |
| 实现 | `lib/TwoFactorAuth.js` 用 `speakeasy` 生成/校验，签发方 `Mozu-Plugin`，账号名 `魔族陌`，校验容错窗口 1 个时间片 |
| 开启方式 | 登录管理台 → 侧边栏 `设置` → 「双因素认证（TOTP）」→ 用验证器 App 扫码（扫不了就手动输入密钥）→ 输入 App 生成的 6 位码完成启用 |
| 关闭方式 | 同一个页面点关闭，需要输入当前动态码 |
| 验证器丢了 | 用锅巴面板 `魔族陌面版` 分组的「强制关闭TOTP」按钮，它会关闭 `totp.enabled` 并清空 `totp.secret` |
| 忘记密码 | 开启后「忘记密码」重置流程**也要填动态码**：验证码校验通过后服务端还会校验 `totp.secret`，缺码或错码时返回 `needTotp`，页面上的动态码输入框会被展开 |
| 密钥不回显 | `totp.secret` 和面版密码一样不会发到前端（`guoba/schemas/index.js` 的 `getConfigData()` 把它置空），保存时该字段留空则沿用原密钥 |
| 生产建议 | 关闭两步验证需要输入当时的动态码，所以开启前先确认验证器能正常生成验证码（丢了只能用锅巴面板的强制关闭按钮） |

## 不要把管理台端口暴露到公网

- 服务本身写法固定：`app.listen(PORT, '0.0.0.0')`，没有只监听 `127.0.0.1` 的配置项，所以「不暴露」要靠防火墙或安全组：只允许反向代理所在的本机访问该端口，公网只放行 80/443。
- 管理台没有 HTTPS，登录 token 走 HTTP 明文传输（见下文「会话」）。
- 同一端口同时提供整套管理 API（`/api/xiuxian/*` 能改玩家数据、还原备份），暴露出去等于把数据库交出去。
- 云服务器上顺手检查安全组与系统防火墙，确认 `port` 只对代理所在的本机放行，没有对 `0.0.0.0/0` 开放。

## 反向代理示例

::: warning 以下只是示例
把域名换成你自己的、把端口换成 `login.yaml` 里实际的 `port`。改完记得 `nginx -t` 检查语法后再 reload。
:::

### Nginx

```nginx
# /etc/nginx/conf.d/mozu-panel.conf
server {
    listen 80;
    server_name panel.example.com;      # ← 改成你自己的域名

    location / {
        proxy_pass http://127.0.0.1:11451;   # ← 与 login.yaml 的 port 一致
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

前端用 hash 路由、接口请求的都是同源的 `/api`，所以不需要额外的 rewrite 规则。保留 `X-Real-IP` / `X-Forwarded-For` 这两行是有意义的：管理台的登录限流按客户端 IP 记账，而客户端 IP 现在由 Express 依据 `login.yaml` 的 `trustProxy` 从这些转发头里解析（见下一节）。**配了代理却没配 `trustProxy`，所有访客会被算成同一个 IP。**

### Caddy

```caddyfile
# Caddyfile
panel.example.com {          # ← 改成你自己的域名
    reverse_proxy 127.0.0.1:11451
}
```

Caddy 默认就会为该域名申请并续期 HTTPS 证书；用 Nginx 的话可以用 certbot 之类的工具补上证书。

## 反向代理与 trustProxy

`config/panel/config/login.yaml` 的 `trustProxy` 决定 Express 有多信任转发头，直接对应 `server/index.js` 里的 `app.set('trust proxy', ...)`。新版**不再自己无条件读 `x-forwarded-for`**：客户端 IP 统一取自 `req.ip`，由这一项决定该怎么解析——填错只会让限流按错误的 IP 记账。

| 取值 | 面板按钮 | 含义 |
| --- | --- | --- |
| `false`（默认） | 直连暴露 | 不信任任何转发头，`req.ip` 取 TCP 连接来源地址（挂代理时就是代理自己的 IP） |
| `1` | 一层反代 | 信任最后一跳代理，nginx / Caddy 直接反代时选它 |
| `2` | CDN+反代 | 信任最后两跳，CDN 回源到 nginx 这类两层结构选它 |
| `true` | 完全信任头 | 信任全部转发头，**只有确定没人能绕过代理直连端口时才能用** |

`server/index.js` 的 `parseTrustProxy()` 还接受数字、IP / 网段字符串与数组（如 `['loopback', '10.0.0.0/8']`），写成无法识别的值时按「未配置」处理。面板上它是必填的单选组，标注「修改后需要重启才能生效」。

::: warning 默认值不会替你判断
随仓库发布的 `default/login.yaml` 里写的是 `trustProxy: false`，读取配置时 `default` 会与你的用户配置合并，所以**升级后它多半就是 `false`，插件不会拦你**——挂了 nginx / CDN 却不对着实际层数改成 `1` / `2`，登录限流就会把所有访客算成同一个 IP。这一项没有「自动猜」的余地。

只有把它删掉、留空、或填了一个识别不了的值（此时内部按 `'unset'` 处理），插件才会主动提醒两次：

- **启动时**：`host` 为 `auto` 时，会在打印外网地址的同时警告「未配置 trustProxy……登录限流会把所有访客算作同一个 IP」。
- **运行时**：第一次收到「来源是内网地址、却带着转发头」的请求时再警告一次，之后不再重复刷屏。
:::

::: danger 反向代理不等于安全边界
`trustProxy` 设为 `true` 时转发头是可以伪造的。如果端口既对公网开放、又挂了代理，攻击者能直接伪造 `x-forwarded-for` 绕过按 IP 的限流。正确做法是：防火墙只允许代理访问 `port`，公网只开 80/443，并把 `trustProxy` 设成与实际层数一致的 `1` 或 `2`。
:::

## 建议启用 HTTPS

- 登录密码在前端会先做一次 SHA-256 再提交，但服务端**同时接受这个摘要串**作为凭证。也就是说，HTTP 明文信道里泄露的摘要可以直接拿去重放登录——这就是必须上 HTTPS 的原因。
- 登录成功后返回的 token 通过 `Authorization: Bearer` 头传输，同样需要加密信道保护。
- 用域名 + 证书（Caddy 自动签发，或 Nginx + certbot），不要用自签证书长期对外服务。

## 会话相关的真实实现

管理台**没有使用 Cookie/Session**：`server/index.js` 没有挂载任何 session 中间件，`package.json` 里也没有相关依赖。真实机制是自建 token，常量与读写都集中在 `lib/panelAuth.js`：

| 环节 | 真实实现 |
| --- | --- |
| 签发 | 登录成功后 `crypto.randomBytes(32).toString('hex')` 生成 token |
| 存储 | 服务端以 Redis 字符串键 `Mozu:panel:token:<token>` 保存（值为 `1`）；浏览器存在 `localStorage` |
| 校验 | 每个受保护接口用 `isTokenValid()` → `Redis.exists()` 判断，键存在即有效 |
| 有效期 | **7 天**：`lib/panelAuth.js` 的 `TOKEN_TTL = 60 * 60 * 24 * 7`，写入时带 `EX`，到期由 Redis 自动清除 |
| 退出登录 | `/api/login?action=exit` 删掉该 token 键，并**总是**返回成功（token 本就无效时回「已退出登录」） |
| 升级影响 | 服务启动时会执行一次 `Redis.del('Mozu:panel:token')` 清掉旧版本遗留的集合键——升级后**所有旧登录态都会失效**，需要重新登录 |
| 副作用 | 改密码不会让已签发的 token 失效；token 不再集中在一个集合里，想统计登录态要按 `Mozu:panel:token:*` 前缀扫 |

也就是说，会话安全既依赖「别让人拿到 token」，也别忘了 token 会在 7 天后自然过期。建议：

::: tip 主动清理登录态
现在每个 token 是一个独立键（旧版本的集合键已不再写入），要让所有已登录的浏览器失效，按前缀扫出来删掉：

```sh
redis-cli --scan --pattern "Mozu:panel:token:*" | xargs -r redis-cli DEL
```

换了密码、怀疑泄露、或者借给别人用过管理台之后，都建议清一次。
:::

另外几条与安全相关的真实限制（限流现在**全部按 IP 记账**）：

- **密码错误锁**：计数键是 `Mozu:panel:password:error:<IP>`，达到 `MAX_PASSWORD_ATTEMPTS`（10 次）后提示「密码连续错误，请60秒后重试」，首次计数时给该键设 60 秒过期。旧版本用的是全局键，被刷时所有人一起被挡；现在只挡刷的那一个 IP。
- **重置密码用的验证码**：8 位随机数字（旧版本 `randomInt(0, 1000000)` 实际只会产生 7 位，现已修正为 `randomInt(0, 100000000)`），写入 `Mozu:panel:code:<IP>`，有效期 300 秒；尝试次数记在 `Mozu:panel:code:<IP>:count`（首次设 300 秒过期），累计超过 `MAX_CODE_ATTEMPTS`（5 次）就删掉验证码并提示重新获取，重置成功后会清零。
- **密码比对是恒定时间的**：`safeEqual()` 用 `crypto.timingSafeEqual` 比较，不会因为比较提前返回而泄露长度或内容信息。
- **Redis 连接错误会打日志**：`lib/Redis.js` 挂了 `error` 事件监听，输出 `[Mozu-Plugin][Redis] <原因>`，不会再静默吞掉连接问题。
- 验证码本身仍然**明文打印在机器人的日志里**。

## 备份文件与敏感性

| 项目 | 说明 |
| --- | --- |
| 位置 | 插件目录下的 `backup/xiuxian/`，文件名形如 `2026-01-01_12-00.json`（时间戳里的 `:` 已改为 `-`，因为冒号在 Windows 文件名里非法） |
| 文件名清洗 | 自定义文件名会先过 `safeBackupName()`：剥掉路径分隔符与 `: * ? " < > \|`、控制字符，去掉结尾的 `.` 与空格，再补上 `.json` 后缀，避免写出 `backup/xiuxian/` 之外 |
| 目录 | `scripts/backup.js` 备份前会 `mkdirSync(..., { recursive: true })` 自动创建目录，删掉 `backup/` 后不用手动重建 |
| 产生方式 | 管理台「修仙备份」页手动备份、群里的修仙备份指令、以及 `setting.yaml` 的 `cronBackup` 定时任务（默认 `0 0 * * * *`，每小时一次） |
| 内容 | `scripts/backup.js` 的 `backupKeys('Mozu:xiuxian:*', filePath)` 把匹配的 Redis 键整批导出（只导出 `Mozu:` 前缀的键），包含玩家（修为、灵石、境界、性别、称号列表、灵根）、宗门、兑换码及使用记录等 |
| 保留数量 | 由 `setting.yaml` 的 `maxBackupFile` 控制（默认 10），超出后自动删除最旧的 |
| 敏感性 | 它是一份完整的修仙数据快照，等同于玩家数据本身：里面可能有 QQ/openid 与领奖记录，**不要放进公开仓库、网盘公共目录或随插件包一起发给别人**（`.gitignore` 里的 `/backup/xiuxian/*` 只能防止误提交，防不了你手动压缩上传） |
| 还原的范围 | 还原走 `restoreKeys(filePath, { purge: true, pattern: 'Mozu:xiuxian:*' })`（群指令与管理台都是显式传参）：先把 `Mozu:xiuxian:*` 中不在备份文件里的键删掉，再写回备份内容。用旧备份还原 = 回滚并丢弃此后的新数据，操作前先备份当前状态 |
| 影响边界 | 清理阶段只删 `isMozuKey(k) && !backupKeySet.has(k)` 的键，也就是**只有 `Mozu:` 开头的键可能被删，不会波及其他插件或云崽自身的 Redis 键**；`scripts/backup.js` 里的 `isMozuPattern()` 还会拒绝不以 `Mozu:` 开头的 `pattern`，备份文件中存在非法 key 时同样拒绝执行并打印告警 |

## 日志里可能出现的敏感信息

机器人的控制台日志是排查问题的第一现场，也是泄露的常见入口：

- **管理台验证码**：格式为 `[魔族陌面版][验证码][来自IP：x.x.x.x] <8位数字>`，明文可见。谁拿到这条日志，谁就能重置管理台密码。不要把它贴到群里或提交到 Issue。
- **启动横幅**：会打印管理台的外网地址与本地地址（含 IP 与端口）；`host` 不是 `auto` 时不再打印外网地址那一行。截图前先打码。
- **反代提示**：`trustProxy` 未配置时会打印一条黄色警告，内容里含配置路径与建议取值，不涉及隐私。
- **AI 审核报错**：以 `[魔族陌修仙][OpenAI]` 开头，内容是整个错误对象，请确认没有密钥片段后再对外分享。
- **备份日志**：会打印备份文件的完整路径与键数量。
- **反向代理日志**：会记录访问者的 IP 与请求路径，同样属于隐私数据。

::: warning 一条通用准则
发日志求助前，先搜一遍 `验证码`、`sk-`、`password`、`token`、`ip`，把这些内容替换掉再发。
:::

## 安全检查清单

| 检查项 | 要求 |
| --- | --- |
| 面版密码 | 已设置，且不复用其他站点 |
| 两步验证 | 已启用并验证过可用 |
| 端口暴露 | 公网只开 80/443，`port` 仅代理可访问 |
| 反向代理 | 已改域名，已保留 `X-Real-IP` / `X-Forwarded-For` |
| trustProxy | 与实际层数一致（直连填「直连暴露」，一层反代填 `1`，CDN+反代填 `2`），改完已重启 |
| HTTPS | 已用正式证书 |
| 登录态 | 怀疑泄露时已按前缀清理 `Mozu:panel:token:*`（token 最长 7 天自动过期） |
| 备份目录 | 不在公开仓库、不在共享网盘 |
| 日志 | 分享前已清理验证码、密钥、IP |

## 相关链接

- [内置管理台](/webui/)
- [配置文件说明](/config/files)
- [AI 自动审核](/config/openai)
- [常见问题](/guide/faq)
