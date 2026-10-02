# 常见问题

按「现象」快速定位，每一条都能在源码里找到对应位置。

| 现象 | 先查 |
| --- | --- |
| 修仙指令发了没反应 | 适配器是不是 `QQBot`、`enable` 开关、群黑白名单 |
| 指令必须带 `#` 才生效 / 带了 `#` 反而没反应 | `forceSharp` 配置项 |
| 启动日志出现 `载入插件错误：…` | 依赖没装全 |
| 锅巴面板里找不到这个插件 | 锅巴版本、`guoba.support.js`、插件是否载入失败 |
| 管理台打不开 / 报端口占用 | 端口 `11451` 是否被占、`host` 探测、Redis 是否可用 |
| 发言榜没数据、修仙不能用 | Redis 连接配置 |
| 数据没了 | `backup/xiuxian/` 里的 JSON 快照 + 还原指令 |

## 指令与功能

::: details 修仙指令为什么没反应？

**先看适配器**：修仙的全套指令都只对 `QQBot` 适配器生效。主指令、`修仙帮助`、备份还原里都是同一句判断：

```js
if (!['QQBot'].includes(e?.bot?.adapter?.name) || !Config.xiuxian.setting.enable) return false
```

其他适配器（OneBot 等）下发修仙指令不会有任何提示，直接静默跳过。

**再逐项核对开关**（配置文件是 `config/xiuxian/config/setting.yaml`，首次启动从 `default/` 复制）：

| 检查项 | 正确取值 | 说明 |
| --- | --- | --- |
| `enable` | `true` | 修仙全局开关，为 `false` 时所有修仙指令失效 |
| `group` | `0` / `1` / `2` | 群黑白名单模式：`0` 不启用、`1` 黑名单、`2` 白名单 |
| `blackGroup` | 群号数组 | 仅 `group: 1` 时生效，命中的群不触发任何指令 |
| `whiteGroup` | 群号数组 | 仅 `group: 2` 时生效，只有列出的群能触发指令 |
| `priority` | 默认 `1000` | 越小优先级越高；被更高优先级的插件吞掉消息时也会「没反应」 |

**备份相关指令还要主人权限**：`#修仙备份` 与 `#修仙备份还原` 额外要求 `e.isMaster`。**最后确认 Redis**：修仙数据全部存在 Redis 里，连接不通时指令会走不下去，见下面「Redis 连不上怎么办」。修仙的冷却（`xiuxian.yaml` 里 `xiulian`、`kaicai` 默认 300 秒）也会让你觉得「没反应」，主人可以打开 `master_no_cd` 免疫冷却。
:::

::: details 指令前缀到底要不要加 `#`？

由 `config/xiuxian/config/setting.yaml` 的 `forceSharp` 决定：

| `forceSharp` | 正则前缀 | 效果 |
| --- | --- | --- |
| `false`（默认） | `^#?` | `修炼` 和 `#修炼` 都能触发 |
| `true` | `^#` | 必须以 `#` 开头，`修炼` 不再触发 |

这个值在 `model/xiuxian/RegExp.js` 里拼进指令正则，改完**需要重启**才生效（锅巴面板该项也标注了「修改后需要重启才能生效」）。

帮助文本和按钮回填的指令前缀拼的是 `/`（`model/xiuxian/help.js`、`lib/protocol.js` 里的 `const prefix = Config.xiuxian.setting.forceSharp ? '/' : ''`），而指令正则匹配的是 `#`。这两者并不冲突：**云崽会把以 `/` 开头的消息自动转换成 `#` 开头**，所以 `/修炼` 与 `#修炼` 都能触发，锅巴面板对该项的说明才写成「前缀必须有#或/才能触发指令」。

如果开了 `forceSharp` 之后点了帮助按钮没反应，先按前面几条排查（适配器、总开关、群名单）；要确认是不是指令本身的问题，手动发送 `#修炼` 复现一次最快。
:::

::: details 依赖装不上怎么办？

**症状**：启动日志出现 `载入插件错误：<文件路径>`，或者日志里有 `Cannot find package 'xxx'`。`index.js` 会把 `apps/` 下每个文件都 import 一遍，失败的那个会打印错误并跳过，所以表现可能是「只有部分功能可用」。

**原因与解决**：

1. 云崽不会替你装插件的依赖，必须手动装：

   ```sh
   cd ./plugins/Mozu-Plugin
   pnpm install
   ```

2. 装完必须**重启** Yunzai，模块加载只在启动时发生。
3. 确认命令用的是 `pnpm`（README 给出的就是它）。混用 npm/yarn 容易因锁文件不一致装出残缺的 `node_modules`，这时先删掉 `node_modules` 重装。
4. 网络拉不动就换包管理器镜像源（pnpm 的通用做法，插件本身没有提供任何安装脚本或镜像配置）。
5. 只想用机器人指令、不改管理台前端的话，不需要跑 `pnpm run build`；仓库里已经带了构建好的 `server/static`。

完整的依赖清单与每个包的用途见[安装](/guide/install)。
:::

::: details 锅巴面板里看不到这个插件？

插件的锅巴入口是**插件根目录**的 `guoba.support.js`，它转发到 `guoba/index.js` 的 `supportGuoba()`，返回 `{ pluginInfo, configInfo }`。其中 `guoba/pluginInfo.js` 明确写了 `isV3: true`、`isV2: false`、`showInMenu: 'true'` —— 也就是说这个插件只适配**锅巴 v3**，老版本锅巴不会正确识别。

排查顺序：

1. 确认 `plugins/Mozu-Plugin/guoba.support.js` 存在（克隆不完整时可能缺文件）。
2. 确认锅巴面板和云崽是同一个实例、同一份 `plugins/` 目录。
3. 重启云崽，让锅巴重新扫描插件目录 —— 插件在扫描之后才装好时，不重启是看不到的。
4. 看启动日志里有没有 `载入插件错误：…`。插件自身载入失败时，锅巴那边也就拿不到配置信息。

锅巴面板的安装方式以官方仓库为准：<https://github.com/guoba-yunzai/guoba-plugin>。
:::

## 内置管理台

::: details 管理台打不开 / 提示端口被占用？

管理台由 `index.js` 启动时加载 `server/index.js` 拉起，端口取 `Config.panel.login.port`，取不到时兜底 `11451`，监听地址固定 `0.0.0.0`。

**正常的启动日志**：

```text
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ [魔族陌] 启动成功喵~
┃ 外网地址：http://<公网IP>:11451
┃ 本地地址：http://127.0.0.1:11451
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**端口被占用**时会打印：

```text
[魔族陌面版] 面版启动失败：EADDRINUSE
[魔族陌面版] 端口 11451 已被占用：可能是另一个云崽实例、上次没退干净的残留进程，或插件被热重载后重复监听。…
[魔族陌面版] 面版已禁用，机器人其它功能不受影响
```

处理办法（源码提示里给的就是这两条）：

```sh
netstat -ano | findstr :11451    # Windows：找到 PID 后 taskkill /PID <pid> /F
lsof -i:11451                    # Linux
```

或者改 `config/panel/config/login.yaml` 的 `port` 再重启（`host`、`port`、`trustProxy` 改动都需要重启才生效）。

**其它打不开的情况**：

- 端口号非法时日志是 `[魔族陌面版] 端口配置无效：<值>，面版未启动`，检查 `port` 是不是 1–65535 的整数。
- `host` 为默认的 `auto` 时，外网地址靠请求 <http://v4.ip.zxinc.org/info.php?type=json> 探测本机公网 IP（结果在 Redis 缓存 24 小时），探测失败会显示成 `localhost`。先用本机地址 `http://127.0.0.1:11451` 验证服务本身是否正常，再排查防火墙 / 安全组。
- Redis 不可用时管理台**仍能启动**：读公网 IP 缓存那一步现在带 3 秒超时（探测公网 IP 带 5 秒超时），失败只打一条 `[魔族陌面版] 读取缓存外网地址失败` / `获取外网地址失败` 的警告并返回 `false`，不会再拖住启动；启动横幅里的外网地址会退化成 `localhost`。

::: warning 默认没有密码
`config/panel/default/login.yaml` 里 `password: ""`、`totp.enabled: false`、`trustProxy: false`。端口开在 `0.0.0.0` 上时，只要公网能访问就等于谁都能进；`trustProxy` 保持默认又挂了反代的话，登录限流会把所有访客算成同一个 IP。部署到公网前务必看[部署与安全](/webui/security)。
:::
:::

::: details Redis 连不上怎么办？

相关文件：

| 文件 | 作用 |
| --- | --- |
| `config/config/default/Redis.yaml` | 默认模板：`host`、`port`、`database`、`connectTimeout`、`keepAlive`、`noDelay` |
| `config/config/config/Redis.yaml` | 实际生效的用户配置（首次启动自动从模板复制，改这里） |
| `lib/Redis.js` | 创建 ioredis 客户端的地方，缺字段时用兜底值 `127.0.0.1` / `6379` / `0` / `10000` / `3000` |

**会有什么症状**：发言榜没数据或报错、修仙指令全线失效、QQBot 接口的群信息缓存取不到、管理台起不来（日志里 `[魔族陌面版] 服务器启动失败：`）。插件本身仍能载入 —— `lib/Redis.js` 在模块加载时就 `new ioredis()`，连接是异步的，所以 Redis 挂掉不会阻止启动，只会让依赖它的功能失败。

**排查步骤**：

1. 确认 Redis 进程在跑，并且端口通：

   ```sh
   redis-cli -h 127.0.0.1 -p 6379 ping
   ```

2. 确认 `host` 填的是实际地址。Redis 在容器或另一台机器上时不能写 `127.0.0.1`。
3. 确认 `database` 号（0–15）和云崽其他组件一致，否则会出现「键明明存在但读不到」。
4. 改完配置**重启**云崽（锅巴面板对该项标注了「修改后需要重启才能生效」）。

::: tip `global` 是干什么的
`Redis.yaml` 最后一行的 `global: false`（注释：「将 Redis 挂载到云崽 global 上」）控制要不要把 Redis 客户端挂到云崽的 `global.Redis` 上，`apps/interface.js` 读的就是 `Config.config.Redis.global`。需要这个能力就用锅巴面板的「全局Redis」开关打开，或直接把这一行改成 `true`，改完重启。
:::
:::

## 数据与备份

::: details 数据丢了怎么恢复？

先分清丢的是哪一类：

| 数据 | 位置 | 能不能恢复 |
| --- | --- | --- |
| 修仙玩家、宗门、背包、CDK、称号 | Redis 的 `Mozu:xiuxian:*` | 有备份文件就能还原 |
| 发言统计（日/周/月榜、昵称缓存） | Redis 的 `Mozu:msg:*`、`Mozu:username` | **不在备份范围内**，恢复不了，只能重新积累 |
| 插件配置（开关、概率、端口、密码） | `config/*/config/*.yaml` | 可以从同目录的 `default/` 复制回来，或锅巴面板的「重置修仙配置」一键恢复修仙默认值 |
| 备份文件本身 | 插件目录的 `backup/xiuxian/*.json` | 删掉插件目录就一起没了，重要的话先拷出去 |

**用备份还原**（需要主人 + `QQBot` 适配器 + 修仙开关打开 + 群黑白名单通过）：

```text
#修仙备份还原
#修仙备份还原 2026-01-01_08-00
```

不带文件名时会列出 `backup/xiuxian/` 下的可还原文件（带点击按钮）。备份是 `scripts/backup.js` 用 `Redis.scanStream` 扫 `Mozu:xiuxian:*` 写出的 JSON 数组，可以直接用文本方式核对内容。定时备份默认开启，cron 为 `0 0 * * * *`（六段式，每小时整点），文件上限由 `maxBackupFile` 控制，默认保留 10 个。

还原是**全量**的：群指令与管理台都显式调用 `restoreKeys(filePath, { purge: true, pattern: 'Mozu:xiuxian:*' })`，先删掉 `Mozu:xiuxian:*` 中不在备份文件里的键，再写回备份内容 —— 拿旧备份还原等于回滚，此后的新数据会丢。清理只作用于 `Mozu:` 前缀的键（`scripts/backup.js` 里先按 `isMozuKey()` 过滤再 `unlink`），**云崽自身或其它插件的 Redis 键不会被删**。同时 `backupKeys` / `restoreKeys` 会拒绝不以 `Mozu:` 开头的 pattern，以及备份文件里的非法 key，并在日志里打印告警。动手前建议先另存一份当前备份。
:::

还有问题？先翻一遍[更新与卸载](/guide/update)里的数据与键位说明，或者到 <https://github.com/MozuGit/Mozu-Plugin/issues> 反馈，附上启动日志与报错原文。
