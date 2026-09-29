# 修仙数据扩展

修仙的静态数据全部放在 `config/xiuxian/default/` 下的 8 个 yaml 里，改这些文件就能调整境界、妖兽、秘境掉落、宗门与灵根，不必动代码。

::: warning 先分清 default 与 config
`default/` 是随仓库发布的副本，`config/` 才是运行时真正读取的用户配置（首次启动自动复制，被 `.gitignore` 忽略）。**只改 `default/` 而 `config/` 下已存在同名文件时，改动不会生效**；长期修改请直接改 `config/` 下的文件。
:::

## 数据文件一览

| 文件 | 内容 | 当前规模 |
| --- | --- | --- |
| `Realm.yaml` | 境界表 | 147 个境界 |
| `beast.yaml` | 妖兽与猎杀 CD | 30 只妖兽 |
| `drop.yaml` | 秘境、丹药、功法 | 9 秘境 + 27 丹药 + 27 功法 |
| `sect.yaml` | 宗门等级、签到与名称审核 | 10 级 |
| `title.yaml` | 排行榜称号与清理任务 | 4 类 × 3 个称号 |
| `setting.yaml` | 修仙全局开关 | — |
| `sroot.yaml` | 灵根与掉落概率 | 19 种灵根 |
| `xiuxian.yaml` | 修炼、开采、闭关、切磋等数值 | — |

## Realm.yaml —— 境界表

```yaml
Realms:
  - name: "练气初期"  # 境界名称
    value: 500  # 突破境界所需的修为
    success: 100  # 突破成功概率（单位：%）
    failed: 0  # 突破失败损失的修为
```

| 字段 | 含义 |
| --- | --- |
| `name` | 境界名称 |
| `value` | 从**当前境界**突破到下一境界所需修为 |
| `success` | 突破成功率（%），判定为 `crypto.randomInt(1, 101) <= success` |
| `failed` | 突破失败扣除的修为 |

玩家身上的 `境界` 存的是数组序号（1 起），`Realms[realm].value` 才是下一境界门槛，**顺序即境界顺序，只能往末尾追加**，插队会让老玩家境界错位。

## beast.yaml —— 妖兽

```yaml
huntBeastCD: 600  # 猎杀妖兽CD（秒）

beasts:
  - name: "暗影狼"
    power: 5000
```

| 字段 | 含义 |
| --- | --- |
| `huntBeastCD` | 猎杀冷却（秒），对全部妖兽生效 |
| `power` | 妖兽战力，胜率 = `自身战力 / (自身战力 + power)` × 0.95~1.05，限制在 1%~99% |
| `reward.cult` / `reward.ls` | 猎杀成功获得的修为 / 灵石 |
| `punishment.cult` | 猎杀失败扣除的修为 |

妖兽 ID 就是它在 `beasts` 里的序号（1 起），第 1 条即 `#查看妖兽1`、`#猎杀妖兽1`；`reward` 与 `punishment` 是每条妖兽下的两个子块。

## drop.yaml —— 秘境与掉落

```yaml
secretRealm_limit:
  easy: 1  # 三档秘境各自要求的境界序号
  medium: 45
  hard: 81

secretRealms:
  - name: 翠风林地  # 秘境名称
    level: easy  # 等级类型：easy、medium、hard
    cost_ls: 200  # 消耗灵石
    drop_rate: 20  # 掉落概率（%）

pills:
  - id: 1  # 物品ID
    name: 翠风露  # 丹药名称
    cult: 100  # 使用丹药获得的修为
    sell_ls: 120  # 出售丹药获得的灵石
    fromSecretRealmID: 1  # 来源秘境ID

arts:
  - id: 10001
    name: 翠风心决
    rate: 50  # 学习功法成功率（%）
    deduct_cult: 100  # 学习失败反噬修为
    addition: 1  # 功法加成（%）
```

| 字段 | 含义 |
| --- | --- |
| `secretRealm_limit` | 三档秘境要求的境界序号，`easy: 1` 代表练气初期即可进入 |
| `secretRealms[].level` | 只能是 `easy` / `medium` / `hard`；「秘境列表」按这三档分组展示，写别的值不会显示 |
| `secretRealms[].cost_ls` / `drop_rate` | 单次探索消耗的灵石（探索十次 / 百次按次数翻倍）与单次掉落概率（%） |
| `id` / `sell_ls` / `fromSecretRealmID` | 物品 ID（丹药与功法共用唯一性校验）、出售价、归属秘境——填的是 `secretRealms` 的**序号（1 起）** |
| `pills[].cult`、`arts[].rate` / `deduct_cult` / `addition` | 丹药使用获得修为；功法学习成功率（%）、失败反噬修为、加成（%） |

掉落流程：探索前按 `fromSecretRealmID` 过滤出该秘境的丹药与功法，每次探索先判 `drop_rate`，命中后再按 70% / 30% 决定出丹药还是功法，随机取一件写进玩家背包的 `丹药` / `功法`。

## sect.yaml —— 宗门

```yaml
sect_level:
  - up_exp: 0  # 宗门升级需要的宗门经验
    memberMax: 10  # 宗门人数上限
    sign:  # 签到奖励
      cult: 10888  # 签到奖励：修为
```

`sect_level` 数组的序号即宗门等级（1 起），每级含 `up_exp`（升到下一级所需宗门经验）、`memberMax`（人数上限）、`sign`（该级签到奖励 `cult` / `ls` / `sectExp`）。另有 `sect_validation.audit.mode` 审核模式（0 手动 / 1 AI / 2 关键词 / 3 无需审核，`keywords` 为关键词黑名单数组）、`sect_validation.name` 与 `desc` 的 `max` / `min` 字符数（`-1` 无上限）与换行开关、`sect_up_reset` 升级后是否重置经验、`create_sect_ls` 创建宗门所需灵石。

## title.yaml —— 排行榜称号

```yaml
rankTitle:
  validDays: 7  # 称号有效期（0表示永久，单位：天）
  cron: 0 0 0 ? * 1  # 排行榜称号定时发放cron
```

`cult` / `ls` / `power` / `retreat` 四组称号分别对应修为榜、灵石榜、战力榜、闭关榜，按名次顺序取用（第 1 名拿该组数组第 1 个，例如修为榜第一名拿「万劫不朽」）；`cleanTitle.cron` 控制过期称号清理，两个 cron 都在 `apps/xiuxian/title.js` 的 `task` 里注册。

## setting.yaml 与 xiuxian.yaml —— 开关与数值

`setting.yaml`：`enable` 总开关；`master_no_cd` 主人是否免冷却；`forceSharp` 是否强制用 `#` 触发；`group` 群名单模式（0 无 / 1 黑名单 / 2 白名单，配 `blackGroup`、`whiteGroup`）；`TextStyle` 输出样式（0 普通文本 / 1 Markdown）；`priority` 指令优先级（越小越优先，改后需重启）；`cronBackup` 与 `maxBackupFile` 定时备份；`contact.peerUid` / `peerName` 是帮助文案里「联系主人」的跳转目标。

`xiuxian.yaml`：`xiulian` / `kaicai` 是修炼与开采冷却（秒）；`maxcult` / `mincult`、`maxls` / `minls` 是单次收益上下限；`retreat.cult` 是闭关收益、`retreat.max` 是闭关时长上限（小时，0 为无上限）；`sign.cult` / `sign.ls` 是修仙签到奖励；`pvp.atk_cd` / `def_cd` 是切磋发起方与接受方冷却；`powerFormula` 是战力公式，可用变量为 `cult`、`realm`，默认 `"realm / 10 * cult / 100"`。

## sroot.yaml —— 灵根

```yaml
root_drop:
  five_elements: 79
  advanced: 15
  supreme: 5
  mozumo: 1
```

`root_drop` 四个等级的概率**总和必须是 100**，面板保存时会校验（提示「灵根概率总和不等于100」）；`sroot` 数组每条含 `id`、`name`、`addition`（加成，如 `1.0`、`3.5`）、`level`（必须是上面四档之一）。`obtain_sroot_ls` 与 `wash_sroot_ls` 分别是获取灵根与洗灵根消耗的灵石。

## 实操：新增一个境界

在 `Realm.yaml` 的 `Realms:` **末尾**追加一条，`value` 必须大于末尾那条（否则会出现「修为够了却不能突破」的区间）；想让新境界成为新秘境的门槛，把 `drop.yaml` 的 `secretRealm_limit` 指向它的序号，然后重启 Yunzai：

```yaml
  - name: "永恒•仙境之上"
    value: 25000000
    success: 5
    failed: 80000
```

## 实操：新增一只妖兽

在 `beast.yaml` 的 `beasts:` **末尾**追加（追加后它就是最后一条，序号即新 ID；若共 31 条，玩家用 `#查看妖兽31`、`#猎杀妖兽31` 即可打到它）：

```yaml
  - name: "试作妖兽"
    power: 500000
    reward:
      cult: 8888
      ls: 20000
```

`power` 决定胜率，别和当前主流玩家战力差出几个数量级，否则胜率会被压到 1% 下限。改完重启 Yunzai。

## 实操：新增一条掉落

加丹药：在 `pills:` 末尾追加，`id` 不能与任何丹药或功法重复：

```yaml
  - id: 28
    name: 试作丹药
    cult: 50000
    sell_ls: 60000
    fromSecretRealmID: 9
```

加功法：同样追加到 `arts:` 末尾，字段依次为 `id`、`name`、`rate`（成功率）、`deduct_cult`（失败反噬）、`addition`（加成）、`sell_ls`、`fromSecretRealmID`，`id` 要避开已有的 1~27 与 10001~10027。

加秘境：在 `secretRealms:` 末尾追加，`level` 只能填 `easy` / `medium` / `hard`；新秘境的序号就是它在数组里的位置（第 10 条即 ID 10）。

```yaml
  - name: 试作秘境
    level: hard
    cost_ls: 40000
    drop_rate: 20
```

用 `#查看秘境<序号>` 确认「秘境产出」里列出了新物品，再用 `#探索秘境<序号>` 实战验证掉落。

## YAML 格式注意事项

- 缩进只能用空格，**不能用 Tab**，同级 `- ` 要对齐。
- 数字不要加引号（加了会变字符串，参与数值比较会出问题），中文名称建议加引号，例如 `name: "试作丹药"`；值里含 `:` 或 `#` 时必须加引号，仓库里的 cron 是裸写的（`cron: 0 0 0 ? * 1`），能正常解析。
- 键名大小写敏感：`Realms`、`TextStyle`、`root_drop`、`fromSecretRealmID` 都要照抄；注释用 `#` 写在行尾即可，不影响解析。

## 生效与备份

`model/Config/Config.js` 用 chokidar 监听配置文件，普通数值改动会热加载；但境界、妖兽、掉落这些数据会参与按钮缓存与构造函数里的读取，**改完数据后重启 Yunzai 最稳妥**。

- 改 yaml 前先复制一份 `config/xiuxian/default/` 与 `config/xiuxian/config/` 目录；配置改乱了，可以用锅巴面板的「重置修仙配置」，它会删除 `config/xiuxian/config/` 并用 `default/` 重新覆盖。
- `scripts/backup.js` 与管理台「修仙备份」页备份的是 **Redis 玩家数据**（`Mozu:xiuxian:*`），用于回滚进度，不能替代上一步的配置备份；玩法侧说明见 [魔族陌修仙](/feature/xiuxian)，面板与备份页见 [锅巴面板配置](/config/guoba)、[内置管理台](/webui/)。
