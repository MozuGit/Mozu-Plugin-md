# 更新与卸载

更新有两种方式：在群里发指令（走云崽自带的更新模块），或者进插件目录手动 `git pull`。卸载更简单，删目录 + 清理 Redis 数据即可 —— 但要先看清楚哪些东西在 Redis 里。

## 用指令更新

`apps/update.js` 注册了两条规则，事件都是 `message`，优先级 `1145`：

| 指令 | 作用 | 权限 |
| --- | --- | --- |
| `#魔族陌更新`、`#魔族陌插件更新`、`#Mozu-Plugin更新`、`#Mozu-Plugin插件更新` | 拉取最新代码并更新插件 | 仅主人（非主人静默返回，没有任何提示） |
| `#更新Mozu-Plugin`、`#更新推送`、`#更新Mozu-Plugin插件` | 同上，另一种写法 | 仅主人 |
| `#强制更新Mozu-Plugin`、`#强制更新推送` | 带 `强制` 字样的变体 | 仅主人 |
| `#魔族陌更新日志`、`#魔族陌插件更新日志`、`#Mozu-Plugin更新日志` | 查看更新日志 | 无主人校验，任何人都能触发 |

细节说明：

- 两条更新规则的正则分别是
  `^#*(魔族陌|插件名)(插件)?(强制)?更新$` 与 `^#*(强制)?更新(推送|插件名)(插件)?$`，
  其中「插件名」是 `Version.Plugin_Name`，也就是**插件根目录的文件夹名**。目录叫 `Mozu-Plugin` 时上面这些写法才成立；改了目录名，指令里的名字要一起改。`^#*` 表示开头的 `#` 可以有任意多个，也可以一个都没有。
- `强制` 只是被拼进改写后的消息里（例如 `#强制更新Mozu-Plugin`），具体行为由云崽的更新模块决定。
- 更新逻辑本身不是本插件实现的：它会尝试加载云崽根目录的 `other/update.js`，失败再退到 `system/apps/update.ts`。两个都拿不到时，启动日志会打印
  `[Mozu-Plugin]未获取到更新js 更新功能 将无法使用`，这时只能用下面的手动方式更新。
- 更新日志那条规则没有主人校验，但它同样依赖云崽的更新模块能识别到这个插件，否则不会有回复。

更新完成后通常还要做两件事：**重新装依赖**（版本更新可能引入新依赖）和**重启云崽**。

## 手动更新

```sh
cd ./plugins/Mozu-Plugin
git pull
pnpm install
```

然后重启 Yunzai，看到新的载入横幅即完成。

::: tip 换不了源的机器
GitHub 拉不动就先换 `origin` 再拉，具体命令见[安装](/guide/install#换源安装)。
:::

::: warning 哪些改动需要重启
配置文件的**数值**改动是热生效的（`model/Config/Config.js` 用 chokidar 监听 YAML 文件变化）。
但下面这几项在锅巴面板的说明里都标了「修改后需要重启才能生效」：Redis 连接配置、管理台 `host`/`port`、修仙指令优先级、修仙定时备份 cron、修仙 `forceSharp`。
插件代码本身（`apps/`、`model/`）更新后也必须重启。
:::

::: tip 升级不会覆盖你的配置和备份
`.gitignore` 忽略了 `/config/*/config` 和 `/backup/xiuxian/*`，`git pull` 不会动这两处。
版本升级新增的配置项也不用手动补：读取配置时会把 `default/` 的值和 `config/` 的用户值合并，用户值优先，新字段直接取 `default/` 里的默认值。
:::

## 卸载

按顺序做三步：**先备份、再删目录、最后清 Redis**。

1. **备份数据**（可选但强烈建议）：在群里发 `#修仙备份` 生成一份 JSON 快照，文件落在 `backup/xiuxian/` 下。
2. **删除插件目录**：

   ```sh
   rm -rf ./plugins/Mozu-Plugin
   ```

3. **清理 Redis 数据**：插件所有键都以 `Mozu:` 开头，先看一眼再删：

   ```sh
   # 先列出键，确认没有别的东西在用同一前缀
   redis-cli --scan --pattern "Mozu:*"

   # 确认无误后再删
   redis-cli --scan --pattern "Mozu:*" | xargs -r redis-cli del
   ```

4. **重启 Yunzai**。管理台监听的端口（默认 `11451`）会随进程一起释放，锅巴面板里的插件条目也会消失。

各键的归属，方便你有选择地删：

| 键 / 前缀 | 内容 |
| --- | --- |
| `Mozu:xiuxian:*` | 修仙玩家信息、背包、宗门、CDK、称号、OpenID 映射等 |
| `Mozu:msg:*`、`Mozu:username` | 发言统计的日/周/月榜数据与昵称缓存 |
| `Mozu:groupinfo:*`、`Mozu:groupbotstate:*` | QQBot 接口缓存的群信息与机器人状态（带 1 小时过期） |
| `Mozu:remote-ip` | 管理台探测到的公网 IP 缓存（24 小时过期） |
| `Mozu:panel:*` | 管理台登录令牌、改密码用的验证码、TOTP 临时密钥等（验证码是打印在云崽日志里的，不走短信/邮件） |

配置文件（`config/config/config/`、`config/xiuxian/config/`、`config/panel/config/`）和备份文件都在插件目录内，跟着第 2 步一起删除。

## 备份与还原

备份逻辑在 `scripts/backup.js`，机器人指令和管理台都调用它。

| 指令 | 说明 | 权限 |
| --- | --- | --- |
| `#修仙备份` / `#修仙备份 <文件名>` | 把 `Mozu:xiuxian:*` 全部键导出成 `backup/xiuxian/<文件名或时间戳>.json`，不写文件名就用 `年-月-日_时:分` | 主人 + `QQBot` 适配器 + 修仙开关打开 + 群黑白名单通过 |
| `#修仙备份还原` | 不带文件名时列出可还原的备份（带点击按钮） | 同上 |
| `#修仙备份还原 <文件名>` | 用指定文件还原，走全量还原：`Mozu:xiuxian:*` 中不在备份里的键会被清理 | 同上 |

其它要点：

- **定时备份**：`apps/xiuxian/backup.js` 注册了一条 task，cron 取自 `Config.xiuxian.setting.cronBackup`，默认值 `0 0 * * * *`（六段式：秒 分 时 日 月 周，即每小时整点）。执行成功会打印 `[魔族陌修仙] 定时备份成功`。
- **文件上限**：`Config.xiuxian.setting.maxBackupFile` 默认 `10`，超出的旧备份会被自动删除。
- **备份格式**：`Redis.scanStream` 扫描匹配的键，把 `key / type / ttl / value` 逐条写成 JSON 数组，所以可以直接文本查看。
- **管理台里也能操作**：管理台的修仙备份页走 `/api/xiuxian/backup?action=getlist|backup|restore|delete`，效果与指令一致。
- **只处理 `Mozu:` 前缀的键**：`scripts/backup.js` 顶部定义了 `const MOZU_PREFIX = 'Mozu:'` 与 `isMozuKey()` / `isMozuPattern()` 两个校验函数。`backupKeys(pattern, outputFile)` 在 `pattern` 不以 `Mozu:` 开头时打印
  `backupKeys: 非法 pattern "…"，必须以 "Mozu:" 开头` 并返回 `null`；扫描结果与写出的每条记录还会再过滤一次前缀。
- **还原的默认值与前缀校验**：`restoreKeys(backupFile, options)` 的默认参数是 `{ purge = true, pattern = 'Mozu:*' }`，同样拒绝不以 `Mozu:` 开头的 `pattern`（告警后返回 `null`）；备份文件里只要有一条 key 不是 `Mozu:` 开头，整个还原会被拒绝并打印
  `restoreKeys: 备份文件中存在非法 key "…"，必须以 "Mozu:" 开头`。
- **清理范围限定在 Mozu 自己**：`purge` 阶段先扫出 `pattern` 匹配的既有键，再用 `isMozuKey(k) && !backupKeySet.has(k)` 过滤后才 `unlink` —— 只有 `Mozu:` 开头的键可能被删，**云崽自身和其它插件的 Redis 键不在处理范围内**。（`pattern` 用默认值 `Mozu:*` 时，清理范围会覆盖整个 Mozu 命名空间；插件内的两个调用方都显式传了 `Mozu:xiuxian:*`。）
- **修仙还原会清理 `Mozu:xiuxian:*`（这是预期行为）**：`apps/xiuxian/backup.js` 与管理台的 `server/controllers/xiuxianController.js` 都显式调用 `restoreKeys(filePath, { purge: true, pattern: 'Mozu:xiuxian:*' })`，所以备份文件里没有的 `Mozu:xiuxian:*` 键会被删掉，相当于用这份快照整体覆盖当前的修仙数据。

::: warning 还原依然会覆盖 Mozu 命名空间内的数据
前缀校验只是把影响范围限制在 `Mozu:` 之内，不代表还原是「合并」：修仙备份的还原会清理 `Mozu:xiuxian:*` 里不在备份文件中的键，用旧快照还原 = 回滚并丢弃此后的新数据。动手前先另存一份当前备份（`#修仙备份`，或在管理台备份页新建一个文件）。
:::

相关页面：[常见问题](/guide/faq)、[内置管理台](/webui/)、[配置文件说明](/config/files)。
