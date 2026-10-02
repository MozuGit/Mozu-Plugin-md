# 配置文件说明

Mozu-Plugin 的所有配置都是 YAML 文件，按用途分三层存放：插件通用配置、修仙数据、管理台登录；`config/` 下则按功能拆成四组目录。这页说明每组每个文件管什么、关键字段有哪些，以及手改 YAML 时要注意什么。

## 三层目录结构

`config/` 下按用途分成四组目录：`config/config/`（通用配置）、`config/example/`（示例功能配置）、`config/xiuxian/`（修仙数据）、`config/panel/`（管理台登录）。每组目录里都是 `default/`（模板）+ `config/`（实际生效）两个子目录。

```text [目录结构]
Mozu-Plugin/
└── config/
    ├── config/               # 一、通用配置
    │   ├── default/          # 随仓库发布的默认值
    │   │   ├── Redis.yaml
    │   │   ├── interface.yaml
    │   │   └── openai.yaml
    │   └── config/           # 实际生效的用户配置
    ├── example/              # 二、示例功能配置
    │   ├── default/
    │   │   ├── fayan.yaml
    │   │   ├── like.yaml
    │   │   └── makeMessage.yaml
    │   └── config/
    ├── xiuxian/              # 三、修仙数据
    │   ├── default/
    │   │   ├── xiuxian.yaml  setting.yaml  Realm.yaml  beast.yaml
    │   │   └── drop.yaml  sect.yaml  title.yaml  sroot.yaml
    │   └── config/
    └── panel/                # 四、管理台
        ├── default/login.yaml
        └── config/login.yaml
```

::: warning 1.3.0 起 `fayan.yaml` / `makeMessage.yaml` 换了目录
这两个文件原先放在 `config/config/default/`，1.3.0 起迁移到 **`config/example/`**，并新增了 `like.yaml`（定时点赞，模板在 `config/example/default/like.yaml`）；`config/config/` 现在只剩 `Redis.yaml`、`interface.yaml`、`openai.yaml`。对应代码里读的是 `Config.example.fayan` / `Config.example.makeMessage` / `Config.example.like`。升级后从旧版本带过来的 `config/config/config/fayan.yaml`、`config/config/config/makeMessage.yaml` 不再被读取——插件会在 `config/example/` 下重新生成一份默认配置，需要把旧文件里的自定义值手动搬过去，再删掉旧文件。
:::

::: tip `default` 与 `config` 的关系
仓库里只带 `default` 目录（`/config/*/config` 已在 `.gitignore` 中忽略）。插件加载时如果缺少 `config/<层>/config/*.yaml`，会自动从 `default/` 复制一份；读取时以 `default` 为基底、用 `config` 覆盖同名键。所以：**改配置改 `config` 目录，不要改 `default`**；删掉某个键会回落成默认值，删掉整个文件则下次加载会重新复制一份默认文件。
:::

## 一、通用配置 `config/config/`

### Redis.yaml

| 字段 | 默认值 | 说明 |
| --- | --- | --- |
| `host` | `127.0.0.1` | Redis 服务器地址 |
| `port` | `6379` | Redis 端口号 |
| `database` | `0` | 数据库编号（0–15） |
| `connectTimeout` | `10000` | 连接超时时间（毫秒） |
| `keepAlive` | `3000` | 心跳间隔（毫秒） |
| `noDelay` | `true` | 禁用 Nagle 算法，降低延迟 |
| `global` | `false` | 是否把 Redis 客户端挂到云崽的 `global.Redis` 上（`apps/interface.js` 读取此键） |

::: warning 改这一层要重启
Redis 连接在插件加载时就建立，`Redis.yaml` 的任何改动都需要重启机器人才生效。
:::

### interface.yaml

| 字段 | 默认值 | 说明 |
| --- | --- | --- |
| `enable` | `false` | 接口全局开关（测试中），开启后给 QQBot 适配器补充 API 接口 |

### openai.yaml

| 字段 | 默认值 | 说明 |
| --- | --- | --- |
| `baseURL` | `"https://api.deepseek.com"` | OpenAI 协议接口地址 |
| `model` | `"deepseek-v4-flash"` | 用于审核的模型名 |
| `apiKey` | `"sk-***"` | 占位值，必须换成自己的密钥 |

这一层里的 `openai.yaml` 用于修仙宗门名称/简介的 AI 审核，详见 [AI 自动审核](/config/openai)。

## 二、示例功能配置 `config/example/`

这一组管的是伪造聊天、发言统计与定时点赞三个功能，它们的配置文件名与代码里的读取路径都是 `Config.example.*`。

### fayan.yaml

| 字段 | 默认值 | 说明 |
| --- | --- | --- |
| `enable` | `true` | 发言统计开关 |
| `sendMarkdown` | `true` | 使用 Markdown 发送（仅 QQBot 使用） |
| `count` | `10` | 排行榜最多显示条数 |

### makeMessage.yaml

| 字段 | 默认值 | 说明 |
| --- | --- | --- |
| `enable` | `true` | 伪造聊天开关 |
| `onlyMaster` | `false` | 是否仅主人使用 |
| `whiteQQList` | `[]` | 伪造白名单 QQ，防止这些 QQ 被伪造（主人无效） |
| `repeatCount` | `10` | 伪造复读时随机成员人数（未填参数时的默认次数） |

### like.yaml（定时点赞）

定时给指定 QQ 点赞，靠 `cron` 触发；`enable` 关闭或 `targets` 为空时整个任务直接跳过。

```yaml [config/example/default/like.yaml]
# 定时点赞开关
enable: false

# 定时点赞cron
cron: 0 0 8 * * ?

# 点赞目标
targets: []

# 点赞批次
batchCount: 5

# 单批点赞次数
times: 10

# 批次间隔（ms）
interval: 200
```

| 字段 | 默认值 | 说明 |
| --- | --- | --- |
| `enable` | `false` | 定时点赞开关 |
| `cron` | `0 0 8 * * ?` | 定时点赞cron |
| `targets` | `[]` | 点赞目标 |
| `batchCount` | `5` | 点赞批次 |
| `times` | `10` | 单批点赞次数 |
| `interval` | `200` | 批次间隔（ms） |

::: tip 关于 `cron`
默认 `0 0 8 * * ?` 表示每天早上 8 点执行一次。填写时注意月和星期是互斥的：`*` 表示任意，`?` 表示不指定。`enable` 为 `false` 或 `targets` 为空数组时，任务会在运行时直接跳过、不做任何点赞。
:::

功能用法见 [定时点赞](/feature/like)。

## 三、修仙数据 `config/xiuxian/`

### xiuxian.yaml（玩法数值）

| 字段 | 默认值 | 说明 |
| --- | --- | --- |
| `xiulian` | `300` | 修炼冷却（秒） |
| `kaicai` | `300` | 开采冷却（秒） |
| `maxcult` / `mincult` | `3000` / `1000` | 修炼单次随机修为的上限 / 下限 |
| `maxls` / `minls` | `3000` / `1000` | 开采单次随机灵石的上限 / 下限 |
| `retreat.cult` / `retreat.max` | `5000` / `24` | 每小时闭关修为 / 闭关上限（小时，`0` 为无上限） |
| `sign.cult` / `sign.ls` | `18888` / `18888` | 签到奖励的修为 / 灵石 |
| `pvp.atk_cd` / `def_cd` | `60` / `120` | 发起方 / 接受方切磋冷却（秒） |
| `powerFormula` | `"realm / 10 * cult / 100"` | 战力计算公式，变量：修为 `cult`、境界 `realm` |

### setting.yaml（功能开关）

| 字段 | 默认值 | 说明 |
| --- | --- | --- |
| `enable` | `true` | 修仙全局开关 |
| `master_no_cd` | `false` | 主人不受冷却限制 |
| `forceSharp` | `false` | 是否强制用 `#` 触发（**改后需重启**） |
| `group` | `0` | 群黑白名单：`0` 无 / `1` 黑名单 / `2` 白名单 |
| `blackGroup` / `whiteGroup` | `[]` / `[]` | 黑名单群 / 白名单群 |
| `TextStyle` | `1` | 输出文本样式：`0` 普通文本 / `1` Markdown |
| `priority` | `1000` | 指令优先级（数字越小优先级越大，**改后需重启**） |
| `cronBackup` | `0 0 * * * *` | 修仙定时备份 cron（**改后需重启**） |
| `maxBackupFile` | `10` | 修仙备份文件上限，超出后自动删除最旧的 |
| `contact.peerUid` | `u_KX6qPA4vv-EbmUhf0enyNg` | 联系主人的 QQUid（不是 QQ 号） |
| `contact.peerName` | `魔族陌` | 联系主人的外显文本 |

### Realm.yaml（境界表）

顶层只有一个 `Realms` 数组，共 147 级，从「练气初期」到「永恒•仙境」，**必须按境界从低到高排列**。

| 字段 | 示例值 | 说明 |
| --- | --- | --- |
| `name` | `"练气初期"` | 境界名称 |
| `value` | `500` | 突破境界所需的修为 |
| `success` | `100` | 突破成功概率（%） |
| `failed` | `0` | 突破失败损失的修为 |

### beast.yaml（妖兽表）

| 字段 | 示例值 | 说明 |
| --- | --- | --- |
| `huntBeastCD` | `600` | 猎杀妖兽 CD（秒） |
| `beasts[].name` | `"暗影狼"` | 妖兽名称 |
| `beasts[].power` | `5000` | 妖兽战力 |
| `beasts[].reward.cult` / `reward.ls` | `200` / `2000` | 猎杀成功的修为 / 灵石奖励 |
| `beasts[].punishment.cult` | `250` | 猎杀失败扣除的修为 |

### drop.yaml（秘境 / 丹药 / 功法）

| 字段 | 示例值 | 说明 |
| --- | --- | --- |
| `secretRealm_limit.easy` / `medium` / `hard` | `1` / `45` / `81` | 进入三档秘境的最低境界 |
| `secretRealms[].name` | `翠风林地` | 秘境名称 |
| `secretRealms[].level` | `easy` | 秘境难度等级（`easy` / `medium` / `hard`） |
| `secretRealms[].cost_ls` / `drop_rate` | `200` / `20` | 消耗灵石 / 掉落概率（%） |
| `pills[].id` / `name` | `1` / `翠风露` | 丹药 ID（必须唯一）/ 名称 |
| `pills[].cult` / `sell_ls` / `fromSecretRealmID` | `100` / `120` / `1` | 使用获得的修为 / 出售灵石 / 来源秘境 ID |
| `arts[].id` / `name` | `10001` / 功法名 | 功法 ID（必须唯一）/ 名称 |
| `arts[].rate` / `deduct_cult` / `addition` | `50` / `3000` / `6` | 学习成功率 / 反噬扣除修为 / 战力加成（%） |
| `arts[].sell_ls` / `fromSecretRealmID` | `3600` / `6` | 出售灵石 / 来源秘境 ID |

### sect.yaml（宗门）

| 字段 | 默认值 | 说明 |
| --- | --- | --- |
| `sect_level[].up_exp` / `memberMax` | `0` / `10` | 宗门升级需要的宗门经验 / 人数上限，一行一级，共 10 级 |
| `sect_level[].sign.cult` / `sign.ls` / `sign.sectExp` | `10888` / `10888` / `100` | 每日签到奖励：修为 / 灵石 / 宗门经验 |
| `sect_validation.audit.mode` | `0` | 审核模式：`0` 手动 / `1` AI / `2` 关键词 / `3` 无需审核 |
| `sect_validation.audit.keywords` | `[]` | 黑名单词，仅关键词审核模式触发 |
| `sect_validation.name.max` / `min` / `newline` | `8` / `1` / `false` | 宗门名称长度上限（`-1` 无上限）/ 下限 / 是否允许换行 |
| `sect_validation.desc.max` / `min` / `newline` | `100` / `0` / `true` | 宗门简介长度上限 / 下限 / 是否允许换行 |
| `sect_up_reset` | `false` | 宗门升级后经验是否重置为 0 |
| `create_sect_ls` | `200000` | 创建宗门需要的灵石 |

### title.yaml（排行榜称号）

| 字段 | 默认值 | 说明 |
| --- | --- | --- |
| `rankTitle.validDays` | `7` | 称号有效期（天），`0` 表示永久 |
| `rankTitle.cron` | `0 0 0 ? * 1` | 定时发放称号的 cron |
| `rankTitle.cult` / `ls` / `power` / `retreat` | 各 3 个称号 | 修为榜 / 灵石榜 / 战力榜 / 闭关榜的称号名列表 |
| `cleanTitle.cron` | `0 0 0 * * *` | 定时清理过期称号的 cron |

### sroot.yaml（灵根）

| 字段 | 默认值 | 说明 |
| --- | --- | --- |
| `root_drop.five_elements` / `advanced` / `supreme` / `mozumo` | `79` / `15` / `5` / `1` | 各档灵根掉落概率（%），**四项之和必须等于 100** |
| `sroot[].id` / `name` | `1` / `金灵根` | 灵根 ID（唯一，不与物品 ID 冲突）/ 名称 |
| `sroot[].addition` | `1.0` | 灵根提供的战力加成 |
| `sroot[].level` | `five_elements` | 该灵根所属概率档 |
| `obtain_sroot_ls` / `wash_sroot_ls` | `100000` / `50000` | 获取灵根 / 洗灵根需要的灵石 |

## 四、管理台登录 `config/panel/`

### login.yaml

| 字段 | 默认值 | 说明 |
| --- | --- | --- |
| `host` | `auto` | 管理台对外展示的服务器地址，`auto` 表示自动获取本机 IP |
| `port` | `11451` | 管理台监听端口 |
| `password` | `""` | 管理台登录密码，默认是空值（空值无法登录，必须先设一个）。明文或 SHA-256 十六进制串都可以，面板保存时会自动摘要后再写入 |
| `totp.enabled` | `false` | 是否启用两步验证 |
| `totp.secret` | `""` | TOTP 密钥（Base32），不会回显到锅巴面板与任何前端接口 |
| `trustProxy` | `false` | 反向代理 / CDN 信任设置，决定 `req.ip` 怎么解析、登录限流按哪个 IP 记账：`false` 直连暴露 / `1` 一层反代 / `2` CDN+反代 / `true` 完全信任头（**改后需重启**，详见 [部署与安全](/webui/security)） |

账号密码与两步验证的做法见 [部署与安全](/webui/security)。

## 手改 YAML 的注意事项

1. **缩进只用空格**：一级 2 个空格，不要用 Tab；层级错了插件会读到 `{}` 或直接报「读取配置文件失败」。
2. **编码固定 UTF-8**：Windows 记事本另存时选 UTF-8（无 BOM），不要存成 GBK，否则中文境界名、妖兽名会变乱码。
3. **含特殊字符的值要加引号**：例如 `powerFormula: "realm / 10 * cult / 100"`、含 `#` 或 `:` 的文本，不加引号会被当作注释或键值分隔符。
4. **改完重启**：`Redis.yaml`、`setting.yaml` 的 `priority` / `forceSharp` / `cronBackup`、`login.yaml` 的 `host` / `port` / `trustProxy` 都属于「修改后需要重启才能生效」；其余数值与数据类改动保存后即时生效。这次 `fayan.yaml` / `makeMessage.yaml` 换了目录（`config/config/` → `config/example/`）属于文件搬迁，插件本身不需要重启，但旧路径下的文件不会被读取，自定义值要手动搬到新目录。
5. **别改坏数据结构**：数组项必须有 `-`；`Realms` 必须按境界从低到高；`pills` / `arts` 的 `id` 必须唯一；`root_drop` 四项之和必须为 100；`sect_level` 一行一级，删行会改变宗门等级总数。
6. **先备份**：直接把 `config/xiuxian/config/` 整个复制一份再改。注意指令与管理台里的「修仙备份」备份的是 Redis 里的 `Mozu:xiuxian:*` 数据（玩家、宗门、兑换码等），**不包含这些 YAML 文件**。
7. **能用面板就别手写**：锅巴面板与管理台的修仙配置页在保存前会做 ID 重复、概率总和等校验，手写则没有任何校验。
8. **面板会重写文件**：从面板保存时插件会用 YAML 库重新序列化整个文件，你手写的排版（空行、对齐、注释位置）可能被重排，数据不会丢。

## 相关链接

- [锅巴面板配置](/config/guoba)
- [AI 自动审核](/config/openai)
- [内置管理台](/webui/)
- [修仙数据扩展](/develop/xiuxian-data)
