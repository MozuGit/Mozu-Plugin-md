# 天选之人

「天选之人」是个一句话的群聊小游戏：发一条 `天选之人`，机器人从当前群里随机抽一个人，**当场禁言几秒**。源码位置是 `apps/example/whois.js`，插件名写死为「天选之人」，描述是「随机选择一个人禁言」。

::: warning 它会真的禁言
这不是发个表情包就完事的玩具，抽中的人会被真禁言 5～60 秒。只在**你自己能接受**的群里开，别在陌生人多的群里随手试。
:::

## 功能说明

| 项目 | 说明 |
| --- | --- |
| 指令 | `天选之人` / `#天选之人`，正则 `^#?天选之人$` |
| 默认状态 | **开启**（`config/example/default/whois.yaml` 里 `enable: true`） |
| 适配器 | 仅 QQBot（源码里 `['QQBot'].includes(e?.bot?.adapter?.name)`，其它适配器静默返回） |
| 群聊限制 | 仅群聊；私聊直接返回 |
| 机器人权限 | 机器人**必须是群管理或群主**——源码取 `getGroupBotState()` 的 `member_role` 判断，没有权限就不响应 |
| 插件名 / 优先级 | 「天选之人」，`event: message`，`priority: 1000`（源码写死） |
| 冷却 | 没有冷却，但**一轮只能禁一个人**（见下节的记录机制） |

## 执行流程

发一条 `天选之人` 后，`whois()` 依次做这些事：

1. 校验适配器与 `example.whois.enable`，任一不满足就 `return false`。
2. 通过 `model/QQBot/interface.js` 的 `getGroupBotState()` 取机器人自己在群里的 `member_role`；不是群管理 / 群主就返回。
3. 从 `e.group.getMemberMap()` 里**随机抽一个成员**，取 `nickname`（没有就退化成 QQ 号，实在没有就是「未知」）。
4. 判断要不要「自己中招」：`self_add_rate` 为真、随机数大于 70、且发指令的人**不是主人**时，把目标换成发送者本人。
5. 掷一个 **5～60 秒**的禁言时长（`Math.floor(Math.random() * 56) + 5`）。
6. 如果 Redis 里 `Mozu:whois:mute:<群号>` 还记着上一个人，先给他解禁。
7. 禁言这次的「幸运儿」，并把目标写进同一个键，`EX` 设为禁言时长（时间到自动过期，不会误伤下一轮）。
8. 回复一段 Markdown：`天选之人` 标题、幸运儿昵称、禁言秒数，以及一个「我也要玩喵~」的 `mqqapi://aio/inlinecmd` 点击按钮。

所以**同一时间每群最多只有一个被记录在案的人**；因为是先解禁旧的再禁新的，即使上一轮的 TTL 还没到，也不会出现「两个人一直被禁」的情况。

## 配置项

配置文件是 `config/example/config/whois.yaml`（仓库自带模板 `config/example/default/whois.yaml`）。

```yaml [config/example/default/whois.yaml]
# 天选之人开关
enable: true

# 启用发起人增加被选中的概率
self_add_rate: true
```

| 配置键 | 锅巴面板标签 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `example.whois.enable` | 天选之人开关 | `true` | 总开关，关闭后指令静默返回 |
| `example.whois.self_add_rate` | 发起人概率 | `true` | 打开后，**发指令的人**有约三成概率成为幸运儿（源码判断 `Math.round(Math.random() * 100) > 70`，且主人不受影响） |

面板里这两项都在「天选之人」分组下（`guoba/schemas/whois.js`）。

::: tip `self_add_rate` 不是「加权抽签」
它的实现不是给发起人加权重，而是**一次独立的二次判定**：满足条件时直接把人换成发起人，原来的随机结果作废。所以打开它并不会让其他人更容易被抽中，只是让「嘴嗨的人自己进去」多了一种可能。名字里的 `rate` 指的是这次判定的频率，不是概率权重。
:::

## 常见问题

### 发了没反应

按顺序排查：

1. 当前是不是 **QQBot 适配器**。其它适配器下这条指令没有任何输出，也不报错。
2. `example.whois.enable` 是不是被关掉了。
3. **机器人有没有群管理权限**。这是最容易被忽略的一条：源码要求 `member_role` 非空，普通成员身份的机器人会直接返回，连提示都不给。
4. 是不是在私聊里发的——私聊同样直接返回。

### 禁言时间为什么这么短

源码把时长限制在 `5 ~ 60` 秒之间（`Math.floor(Math.random() * (60 - 5 + 1)) + 5`），没有配置项可以改，也不会读群设置里的默认禁言时长。

### 会不会一直被禁

不会。禁言时长等于 Redis 记录键的过期时间，且下一轮会先解禁上一个人。但如果机器人在某次禁言后**立刻离线**，Redis 里会残留这个键，下一轮开始时会被解禁一次，属于预期行为。

### 主人会被抽中吗

会被抽中——随机抽选对所有人一视同仁。唯一的例外是 `self_add_rate` 的「自己中招」分支，它显式排除了主人（`!this.e.isMaster`），也就是说**主人不会被这条规则换上来**，但仍可能被正常随机抽到。

## 相关页面

- [锅巴面板配置](/config/guoba)：`example.whois.*` 两项在面板里的位置
- [配置文件说明](/config/files)：`config/example/` 目录结构与 `default` / `config` 的关系
- [QQBot 接口](/feature/qqbot-api)：`getGroupBotState` 等接口的来源
- [群管](/feature/group-admin)：另一个需要机器人具备管理权限的模块
