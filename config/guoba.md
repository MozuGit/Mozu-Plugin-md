# 锅巴面板配置

锅巴面板（guoba-plugin）是 Yunzai 生态里的可视化配置面板。装上它之后，Mozu-Plugin 的配置项会以分组表单的形式出现在面板里，改完点保存即可，不需要手写 YAML。

::: tip 面板本体不在本插件里
Mozu-Plugin 只提供「接入面板」所需的几个文件，不包含锅巴面板本身。面板的安装与启动请看官方仓库：<https://github.com/guoba-yunzai/guoba-plugin>。
:::

## 插件是怎么接入面板的

| 文件 | 作用 |
| --- | --- |
| `guoba.support.js` | 插件根目录的入口，只有一行：`export { supportGuoba } from "./guoba/index.js"`，锅巴靠它识别本插件 |
| `guoba/index.js` | `supportGuoba()` 返回 `{ pluginInfo, configInfo }` 两个对象 |
| `guoba/pluginInfo.js` | 面板卡片信息：`name`、`title`（魔族陌插件（Mozu-Plugin））、`author`、`authorLink`、`link`、`description`、`iconPath`（插件目录下的 `Mo.png`）、`isV3: true` |
| `guoba/configInfo.js` | 向面板暴露 `schemas`、`actions`、`getConfigData`、`setConfigData` |
| `guoba/schemas/index.js` | 汇总 8 个分组 schema，并实现配置的读取、保存与校验 |

读取：`getConfigData()` 返回插件的全量配置，但会把 `panel.login.password` 与 `panel.login.totp.secret` 一起置空——**面版密码与 TOTP 密钥都不会回显到前端**（`config.openai.apiKey` 之类的字段仍会回显，见 [AI 自动审核](/config/openai)）。

保存：`setConfigData()` 把表单数据还原成嵌套结构后逐项写回 YAML；如果这次填了新密码，会先用 SHA-256 摘要再写进 `login.yaml`；`totp.secret` 留空则沿用原密钥（前端拿不到它，不能指望回填）。修仙配置的校验现在**在写入之前**执行，校验不过时整次保存被拒绝，不会留下写了一半的文件。

## 面板分组一览

| 面板分组 | 对应文件 | 主要配置项 |
| --- | --- | --- |
| `Redis配置` | `guoba/schemas/Redis.js` | `config.Redis.global` / `host` / `port` / `database` / `connectTimeout` / `keepAlive` / `noDelay` |
| `魔族陌面版` | `guoba/schemas/panel.js` | `panel.login.host` / `panel.login.port` / `panel.login.password` / `panel.login.trustProxy`，以及「强制关闭 TOTP」按钮 |
| `修仙设置` | `guoba/schemas/xiuxian.js` | `xiuxian.setting.*`、`xiuxian.xiuxian.*`、`xiuxian.Realm.Realms`、`xiuxian.beast.*`、`xiuxian.sect.*`、`xiuxian.title.*`、`xiuxian.drop.*`、`xiuxian.sroot.*` |
| `伪造聊天` | `guoba/schemas/makeMessage.js` | `example.makeMessage.enable` / `onlyMaster` / `whiteQQList` / `repeatCount` |
| `发言统计` | `guoba/schemas/fayan.js` | `example.fayan.enable` / `sendMarkdown` / `count` |
| `定时点赞` | `guoba/schemas/like.js` | `example.like.enable` / `cron` / `targets` / `batchCount` / `times` / `interval` |
| `OpenAI` | `guoba/schemas/openai.js` | `config.openai.baseURL` / `model` / `apiKey` |
| `Interface` | `guoba/schemas/interface.js` | `config.interface.enable` |

## Redis配置

| 字段 | 面板名称 | 含义与默认值 |
| --- | --- | --- |
| `config.Redis.global` | 全局Redis | 把 Redis 实例挂到云崽的 `global` 上，不与 `global.redis` 冲突（由 `apps/interface.js` 读取），默认 `false` |
| `config.Redis.host` | 服务器地址 | Redis 服务器 IP，默认 `127.0.0.1` |
| `config.Redis.port` | 端口号 | Redis 端口，默认 `6379` |
| `config.Redis.database` | 数据库编号 | 0–15，默认 `0` |
| `config.Redis.connectTimeout` | 连接超时时间 | 毫秒，连接超时后重连，默认 `10000` |
| `config.Redis.keepAlive` | 心跳间隔 | 毫秒，默认 `3000` |
| `config.Redis.noDelay` | 禁用Nagle算法 | 降低延迟，默认开启 |

这 7 项面板上都标着「修改后需要重启才能生效」：Redis 连接是在插件加载时建立的。

::: tip `global` 这一项
`config/config/default/Redis.yaml` 最后一行的 `global`（注释：「将Redis挂载到云崽global上」）控制要不要把 Redis 客户端挂到云崽的 `global.Redis` 上，面板上的「全局Redis」开关写的就是这个键。
:::

## 魔族陌面版

| 字段 / 按钮 | 面板名称 | 含义与默认值 |
| --- | --- | --- |
| `panel.login.host` | 服务器地址 | `auto` 表示自动获取本机 IP；只有 `host` 为 `auto` 时，启动日志才会打印「外网地址」那一行 |
| `panel.login.port` | 监听端口号 | 管理台端口，默认 `11451`，可填 0–65535 |
| `panel.login.password` | 面版密码 | 组件由 `Input` 换成 `InputPassword`（默认隐藏、可切换明文）；留空则保持原密码不变 |
| `panel.login.trustProxy` | 反代/CDN 信任 | 必填单选组，决定真实客户端 IP 怎么解析、登录限流按哪个 IP 记账：直连暴露（`false`，默认）/ 一层反代（`1`）/ CDN+反代（`2`）/ 完全信任头（`true`），**改后需重启**，详见 [部署与安全](/webui/security) |
| `actions` → `forceClose` | 强制关闭TOTP | 验证器丢失时使用，会把 `totp.enabled` 置 `false` 并清空 `totp.secret` |

## 修仙设置

`guoba/schemas/xiuxian.js` 是最大的一组，内部用 9 个 Divider 分区。

| 分区 | 字段 | 面板名称与含义 |
| --- | --- | --- |
| 修仙重置 | `actions` → `resetxxConfig` | 「重置修仙配置」按钮，用 `config/xiuxian/default/` 覆盖 `config/xiuxian/config/`，不可撤销 |
| 修仙基础设置 | `xiuxian.setting.enable` | 修仙全局开关 |
| 修仙基础设置 | `xiuxian.setting.priority` | 指令优先级，数字越小优先级越大（改后需重启） |
| 修仙基础设置 | `xiuxian.setting.cronBackup` | 定时备份 cron，默认 `0 0 * * * *`（改后需重启） |
| 修仙基础设置 | `xiuxian.setting.maxBackupFile` | 修仙备份文件上限，超出自动删除旧文件 |
| 修仙基础设置 | `xiuxian.setting.contact.peerUid` | QQUid（注意：是 QQUid，不是 QQ 号） |
| 修仙基础设置 | `xiuxian.setting.contact.peerName` | 外显文本 |
| 修仙基础设置 | `xiuxian.setting.master_no_cd` | 主人不受冷却限制 |
| 修仙基础设置 | `xiuxian.setting.forceSharp` | 强制用 `#` 触发，前缀必须有 `#` 或 `/`（改后需重启） |
| 修仙基础设置 | `xiuxian.setting.group` | 是否启用群黑白名单：`0` 不启用 / `1` 黑名单 / `2` 白名单 |
| 修仙基础设置 | `xiuxian.setting.blackGroup` | 黑名单群，名单内的群不触发任何指令 |
| 修仙基础设置 | `xiuxian.setting.whiteGroup` | 白名单群，仅名单内的群能触发指令 |
| 修仙基础设置 | `xiuxian.setting.TextStyle` | 输出文本样式：`0` 普通文本 / `1` Markdown |
| 修仙玩法设置 | `xiuxian.xiuxian.xiulian` | 修炼 CD（秒） |
| 修仙玩法设置 | `xiuxian.xiuxian.kaicai` | 开采 CD（秒） |
| 修仙玩法设置 | `xiuxian.xiuxian.powerFormula` | 战力计算公式，可用变量：修为 `cult`、境界 `realm` |
| 修仙玩法设置 | `xiuxian.xiuxian.maxcult` / `mincult` | 修炼单次随机修为的上限 / 下限 |
| 修仙玩法设置 | `xiuxian.xiuxian.maxls` / `minls` | 开采单次随机灵石的上限 / 下限 |
| 修仙玩法设置 | `xiuxian.xiuxian.retreat.cult` / `retreat.max` | 每小时闭关修为 / 单次闭关时间上限（小时，`0` 为无上限） |
| 修仙玩法设置 | `xiuxian.xiuxian.sign.cult` / `sign.ls` | 每日签到获得的修为 / 灵石 |
| 修仙玩法设置 | `xiuxian.xiuxian.pvp.atk_cd` / `def_cd` | 发起方 CD / 被动方 CD（秒） |
| 修仙境界设置 | `xiuxian.Realm.Realms` | 境界表，每项含 `name` 境界名称、`value` 突破所需修为、`success` 成功概率（0–100）、`failed` 失败扣除修为 |
| 修仙妖兽设置 | `xiuxian.beast.huntBeastCD` | 猎杀妖兽 CD（秒） |
| 修仙妖兽设置 | `xiuxian.beast.beasts` | 妖兽表，每项含 `name`、`power` 战力、`reward.cult` / `reward.ls` 成功奖励、`punishment.cult` 失败惩罚 |
| 修仙宗门设置 | `xiuxian.sect.sect_up_reset` | 宗门升级后经验是否重置为 0 |
| 修仙宗门设置 | `xiuxian.sect.create_sect_ls` | 创建宗门需要的灵石 |
| 修仙宗门设置 | `xiuxian.sect.sect_validation.audit.mode` | 审核模式：`0` 手动 / `1` AI / `2` 关键词 / `3` 无需审核 |
| 修仙宗门设置 | `xiuxian.sect.sect_validation.audit.keywords` | 关键词黑名单，仅关键词审核模式有效 |
| 修仙宗门设置 | `xiuxian.sect.sect_validation.name.max` / `min` / `newline` | 宗门名称长度上限（`-1` 无上限）/ 下限 / 是否允许换行 |
| 修仙宗门设置 | `xiuxian.sect.sect_validation.desc.max` / `min` / `newline` | 宗门简介长度上限（`-1` 无上限）/ 下限 / 是否允许换行 |
| 修仙宗门设置 | `xiuxian.sect.sect_level` | 宗门等级配置，一行一级，含 `up_exp` 升级经验、`memberMax` 人数上限、`sign.cult` / `sign.ls` / `sign.sectExp` 签到奖励 |
| 修仙称号设置 | `xiuxian.title.rankTitle.validDays` / `cron` | 称号有效天数（`0` 永久）/ 定时发放 cron |
| 修仙称号设置 | `xiuxian.title.rankTitle.cult` / `ls` / `power` / `retreat` | 修为榜 / 灵石榜 / 战力榜 / 闭关榜的称号列表 |
| 修仙称号设置 | `xiuxian.title.cleanTitle.cron` | 定时清理过期称号 cron |
| 修仙秘境设置 | `xiuxian.drop.secretRealm_limit.easy` / `medium` / `hard` | 进入初级 / 进阶 / 高级秘境的最低境界 |
| 修仙秘境设置 | `xiuxian.drop.secretRealms` | 秘境表，每项含 `name`、`level`（`easy` / `medium` / `hard`）、`cost_ls` 消耗灵石、`drop_rate` 掉落概率 |
| 修仙秘境设置 | `xiuxian.drop.pills` | 丹药表，每项含 `id`（必须唯一）、`name`、`cult` 获得修为、`sell_ls` 出售灵石、`fromSecretRealmID` 来源秘境 |
| 修仙秘境设置 | `xiuxian.drop.arts` | 功法表，每项含 `id`（必须唯一）、`name`、`rate` 学习成功率、`deduct_cult` 反噬扣除修为、`addition` 战力加成（%）、`sell_ls`、`fromSecretRealmID` |
| 修仙灵根设置 | `xiuxian.sroot.obtain_sroot_ls` / `wash_sroot_ls` | 获取灵根 / 洗灵根需要的灵石 |
| 修仙灵根设置 | `xiuxian.sroot.root_drop` | 各档灵根掉落概率，`five_elements` / `advanced` / `supreme` / `mozumo` 四档之和必须等于 100 |
| 修仙灵根设置 | `xiuxian.sroot.sroot` | 灵根表，每项含 `id`（唯一，不与物品 ID 冲突）、`name`、`addition` 战力加成（%）、`level` 所属概率档 |

::: warning 保存时的校验
面板保存修仙配置前会检查三件事，任一不过就整次拒绝保存：`pills` 与 `arts` 的 `id` 是否重复（报「物品ID重复」）、`sroot` 的灵根 `id` 是否重复（报「灵根ID重复」）、`root_drop` 四档之和是否等于 100（报「灵根概率总和不等于100」）。校验函数 `validateXiuxianConfig()` 在写文件**之前**调用，所以失败时不会留下写了一半的配置。
:::

## 伪造聊天

| 字段 | 面板名称 | 含义 |
| --- | --- | --- |
| `example.makeMessage.enable` | 伪造聊天开关 | 是否启用伪造聊天与伪造复读 |
| `example.makeMessage.onlyMaster` | 仅主人使用 | 开启后只有主人能触发 |
| `example.makeMessage.whiteQQList` | 白名单QQ | 防止白名单里的 QQ 被伪造 |
| `example.makeMessage.repeatCount` | 默认复读次数 | 伪造复读未填参数时的默认次数 |

## 发言统计

| 字段 | 面板名称 | 含义 |
| --- | --- | --- |
| `example.fayan.enable` | 发言统计开关 | 是否统计群发言 |
| `example.fayan.sendMarkdown` | 使用Markdown发送 | 仅 QQBot 适配器生效 |
| `example.fayan.count` | 排行榜最多显示数 | 排行榜最多显示的排名数，避免刷屏 |

## 定时点赞

| 字段 | 面板名称 | 含义 |
| --- | --- | --- |
| `example.like.enable` | 定时点赞开关 | 是否按 cron 定时给目标 QQ 点赞 |
| `example.like.cron` | 定时点赞cron | 定时触发时间，默认 `0 0 8 * * ?`（每天 8 点）；占位提示「\*表示任意，?表示不指定（月日和星期互斥）」 |
| `example.like.targets` | 点赞目标 | 机器人定时点赞的目标QQ |
| `example.like.batchCount` | 点赞批次 | 发起点赞的次数，默认 `5`，最小 `0` |
| `example.like.times` | 点赞次数 | 单次点赞的次数，默认 `10`，最小 `1` |
| `example.like.interval` | 批次间隔 | 批次间隔，避免请求频率过高（单位：ms），默认 `200`，最小 `0`、步进 `100` |

字段默认值见 [配置文件说明](/config/files)，功能用法见 [定时点赞](/feature/like)。

## OpenAI

| 字段 | 面板名称 | 含义 |
| --- | --- | --- |
| `config.openai.baseURL` | API链接 | 兼容 OpenAI 协议的接口地址 |
| `config.openai.model` | 模型名称 | 用于审核的模型 |
| `config.openai.apiKey` | API密钥 | 占位提示为 `sk-***` |

这一组是给修仙的宗门名称/简介 AI 审核用的，取值与风险详见 [AI 自动审核](/config/openai)。

## Interface

| 字段 | 面板名称 | 含义 |
| --- | --- | --- |
| `config.interface.enable` | 测试接口开关 | 给 QQBot 适配器补充 API 接口，默认关闭 |

## 保存后落在哪个文件

面板保存不是存进数据库，而是直接改写 YAML 文件：

| 面板字段前缀 | 写入文件 |
| --- | --- |
| `config.Redis.*` | `config/config/config/Redis.yaml` |
| `example.makeMessage.*` | `config/example/config/makeMessage.yaml` |
| `example.fayan.*` | `config/example/config/fayan.yaml` |
| `example.like.*` | `config/example/config/like.yaml` |
| `config.openai.*` | `config/config/config/openai.yaml` |
| `config.interface.*` | `config/config/config/interface.yaml` |
| `panel.login.*` | `config/panel/config/login.yaml` |
| `xiuxian.setting.*` | `config/xiuxian/config/setting.yaml` |
| `xiuxian.xiuxian.*` | `config/xiuxian/config/xiuxian.yaml` |
| `xiuxian.Realm.Realms` | `config/xiuxian/config/Realm.yaml` |
| `xiuxian.beast.*` | `config/xiuxian/config/beast.yaml` |
| `xiuxian.sect.*` | `config/xiuxian/config/sect.yaml` |
| `xiuxian.title.*` | `config/xiuxian/config/title.yaml` |
| `xiuxian.drop.*` | `config/xiuxian/config/drop.yaml` |
| `xiuxian.sroot.*` | `config/xiuxian/config/sroot.yaml` |

::: tip `config` 目录会自动生成
仓库里只有 `default` 目录。插件首次加载时会把 `config/<层>/default/*.yaml` 复制一份到 `config/<层>/config/`，之后面板保存与手改都作用于 `config` 目录下的文件（该目录已在 `.gitignore` 中忽略）。
:::

## 改完要不要重启

| 情况 | 是否需要重启 |
| --- | --- |
| 面板上标着「修改后需要重启才能生效」的项：`config.Redis.*`、`panel.login.host`、`panel.login.port`、`panel.login.trustProxy`、`xiuxian.setting.priority`、`xiuxian.setting.cronBackup`、`xiuxian.setting.forceSharp` | 需要 |
| 其余配置项 | 不需要：保存即写入 YAML 并刷新缓存，下次触发指令就生效 |
| 面版密码 | 不需要，立即生效；已经登录的 token 不会被踢下线，但它最长 7 天后会自动过期 |

## 相关链接

- [配置文件说明](/config/files)
- [AI 自动审核](/config/openai)
- [内置管理台](/webui/)
- [部署与安全](/webui/security)
