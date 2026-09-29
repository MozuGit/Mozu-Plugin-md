# 定时点赞

「定时点赞」会按 cron 定时给一批 QQ 号点赞：到点后插件遍历所有可用的机器人，对每个目标调用 OneBot 的 `send_like` 类接口。整个过程没有任何指令参与，也不需要群里有人说话。

## 功能说明

| 项目 | 说明 |
| --- | --- |
| 触发方式 | **只有定时任务（`task`），没有任何群指令**——源码里除 `task` 之外没有配置 `rule`，发送任何指令都不会触发它 |
| 默认状态 | **关闭**：`enable: false`，不打开开关就不会执行 |
| 依赖能力 | 机器人需要具备 `sendApi` / `sendLike` / `like` 三者之一，源码优先走 `sendApi('send_like', { user_id, times })` |
| 插件名 | 「魔族陌:定时点赞」，`event: message`，`priority: 1145`（源码写死） |
| cron 来源 | `Config.example.like.cron || '0 0 8 * * ?'`，在插件加载时注册进 `task` |

::: warning 它没有群指令
不要去找「点赞」「给赞」之类的指令：这个模块只注册了定时任务，源码里没有 `rule`。想让它跑起来只能改配置——打开开关、填好目标，然后等 cron 到点触发。
:::

## 执行流程

到点后执行一次 `like()`，顺序如下：

1. 读 `Config.example.like.enable` 与 `targets`，任一为空就**直接返回，连完成日志都不会打印**。
2. 从 `Bot.bots` 里筛出具备 `sendApi` / `sendLike` / `like` 的机器人；一个都没有也直接返回。
3. 对**每个机器人 × 每个目标**：循环 `batchCount` 次，每次调用一次 `send_like`（`user_id` 是目标 QQ，`times` 是 `times` 的值），然后等待 `interval` 毫秒再进入下一批。
4. 某个「机器人 + 目标」组合抛错时静默 `continue`，换下一个目标继续，不会回复任何消息。
5. 全部跑完后打印一行日志：`[魔族陌][定时点赞] 执行完成`。

以默认值为例，单个机器人、单个目标每天的点赞量是 `batchCount 5 × times 10 = 50` 次；整轮耗时至少为 `batchCount × interval`（默认 `5 × 200ms`），目标或机器人越多总耗时越长。

## 配置项

| 配置键 | 锅巴面板标签 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `example.like.enable` | 定时点赞开关 | `false` | 总开关，关闭时任务直接返回 |
| `example.like.cron` | 定时点赞cron | `0 0 8 * * ?` | 定时任务的 cron 表达式，面板使用 EasyCron 组件 |
| `example.like.targets` | 点赞目标 | `[]` | 目标 QQ 号数组，为空时任务直接返回；面板提示「机器人定时点赞的目标QQ」 |
| `example.like.batchCount` | 点赞批次 | `5` | 对每个目标分几批发起点赞，面板提示「发起点赞的次数」，最小值 `0` |
| `example.like.times` | 点赞次数 | `10` | 每次调用作为 `send_like` 的 `times` 参数传出（YAML 注释写「单批点赞次数」，面板提示「单次点赞的次数」），最小值 `1` |
| `example.like.interval` | 批次间隔 | `200` | 每批之间的等待时间，单位毫秒；面板提示「批次间隔，避免请求频率过高（单位：ms）」，最小值 `0`、步进 `100` |

面板里这些项都在「定时点赞」分组下（`guoba/schemas/like.js`）。

### cron 怎么写

这个 cron 是 6 段式：`秒 分 时 日 月 周`。

| 表达式 | 含义 |
| --- | --- |
| `0 0 8 * * ?`（默认） | 每天 08:00:00 |
| `0 0 0 ? * 1` | 只在星期一 00:00:00 执行（周段写 `1`、日段用 `?`；插件里修仙称号发放用的就是这种写法） |

面板上该字段是 EasyCron 组件，输入框的占位提示写的是「\*表示任意，?表示不指定（月日和星期互斥）」——「日」与「周」两段不能同时指定具体值，所以要写星期几时，「日」段要用 `?`。

`cron` 是在插件加载时读取并注册任务的，**改完 cron 需要重启机器人**；`enable`、`targets` 等项在每次执行时读取，改完保存即可生效。

## 配置文件

| 用途 | 路径 |
| --- | --- |
| 实际生效的配置 | `config/example/config/like.yaml` |
| 仓库自带的模板 | `config/example/default/like.yaml` |

::: tip 面板保存到哪里
锅巴面板的「定时点赞」分组与 `example.like.*` 字段一一对应，保存时由 `guoba/schemas/index.js` 写回 `config/example/config/like.yaml`（源码里写作 `{ dir: 'example', file: 'like' }`）。该文件不存在时，插件首次加载会自动从 `config/example/default/like.yaml` 复制一份；`default` 与 `config` 的关系见 [配置文件说明](/config/files)。
:::

## 常见问题

### 到点了没反应

按顺序检查三件事：

1. `example.like.enable` 是否为 `true`（默认是 `false`）。
2. `example.like.targets` 是否非空——默认是 `[]`，空数组时任务在第一步就返回了。
3. 日志里有没有 `[魔族陌][定时点赞] 执行完成`。没有这行说明流程没走到最后；**有这行也只代表流程跑完了，不代表点赞成功**，因为源码把失败包在 `try / catch` 里静默 `continue`，接口报错不会出现在聊天里。

### 适配器不支持怎么办

`like()` 只挑具备 `sendApi`、`sendLike`、`like` 之一的机器人。如果当前适配器一个都没提供，机器人列表筛完就是空的，任务同样静默返回。某个适配器是否实现了 `send_like`（或等价方法）取决于适配器本身，源码不会为此输出提示。

### `targets` 怎么填

它是 QQ 号数组，例如：

```yaml
targets:
  - 123456789
  - 987654321
```

面板上这一项用的是 `GSelectGroup` 选择器组件，而源码把数组里的每一项直接当作 QQ 号传给 `send_like` 的 `user_id`。由于选择器用途与代码读取方式并不一致，**建议直接在 `config/example/config/like.yaml` 里手填 QQ 号**，填完确认数组里存的是号码。

### 会不会被限流

面板提示写得很直白：「批次间隔，避免请求频率过高（单位：ms）」。默认的 `5 批 × 10 次` 已经不算小；把 `interval` 调得很小、`batchCount` / `times` 调得很大，就是在给自己找限流。

## 相关页面

- [锅巴面板配置](/config/guoba)：面板分组与字段前缀的对应关系
- [配置文件说明](/config/files)：`config/example/` 目录结构、`default` 与 `config` 的关系、手改 YAML 的注意事项
