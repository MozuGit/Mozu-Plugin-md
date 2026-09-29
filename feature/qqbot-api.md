# QQBot 接口

「QQBot 接口」是对 QQBot 适配器的补充 API 接口：它会在每条群消息上补齐官方接口提供、但适配器还没封装的群信息与群操作能力，并把几个常用的 Markdown / 指令拼接工具挂到全局对象上，方便本插件与其它插件直接调用。

::: warning 默认关闭，需要手动开启
`config/config/interface.yaml` 里的 `enable` 默认为 `false`（注释写着「接口全局开关（测试中）」）。锅巴面板中该项名称为「Interface → 测试接口开关」，说明文字是「给QQBot适配器添加API接口」。开启后建议重启机器人。
:::

## 动机

README 中写得很直接：

> QQBot适配器更新有点慢
> 所以我看看能不能自己加点API接口（只加了一点点）
> 需要去锅巴面版自行开启接口功能（默认关闭）

所以这里的接口是「适配器等不及了，先自己补上」的产物，功能范围有限，行为也可能随官方接口调整而变化。

## 启用方式

| 步骤 | 操作 |
| --- | --- |
| 1 | 打开锅巴面板，进入 Interface 分组 |
| 2 | 打开「测试接口开关」，对应配置键 `config.interface.enable` |
| 3 | 重启机器人（`global.Mozu` 只在插件加载时挂载一次） |

对应配置项只有一条：

| 配置键 | 锅巴面板标签 | 说明 | 默认值 |
| --- | --- | --- | --- |
| `config.interface.enable` | 测试接口开关 | 「给QQBot适配器添加API接口」，控制接口是否生效 | `false` |

## 生效条件

- **仅 QQBot 适配器**：`if (!['QQBot'].includes(e?.bot?.adapter?.name) || !Config.config.interface.enable) return false`。
- **仅群聊**：私聊消息直接返回，不会补数据。
- **不拦截消息**：插件 `MozuInterface` 的优先级是 `-Infinity`，并且使用 `accept(e)` 形式，处理完总是 `return false`，只做数据补充，不影响其它插件的匹配。

## 新增了哪些接口

### 群信息与机器人状态

| 接口 | 用途 | 备注 |
| --- | --- | --- |
| `e.group.info` | 群基本信息 + 机器人群内状态，合并为 `{ ...groupInfo, group_bot_state: groupBotState }` | 仅在该字段不存在时写入，数据来自官方接口 |
| （缓存）`Mozu:groupinfo:<群号>` | 群信息缓存 | 通过 `GET /v2/groups/{group_id}/info` 获取，缓存 3600 秒 |
| （缓存）`Mozu:groupbotstate:<群号>` | 机器人群内状态缓存 | 通过 `GET /v2/groups/{group_id}/bot_state` 获取，缓存 3600 秒 |
| `e.group.is_admin` | 机器人在群内是否为管理员 | 当 `bot_state.member_role === 'admin'` 时置为 `true` |

群号在请求与缓存键里都会去掉 `self_id:` 前缀（`group_id.replace(this.e.self_id + ':', '')`）。

### 群成员禁言

| 接口 | 用途 | 备注 |
| --- | --- | --- |
| `e.group.muteMember(openid, time = 0, obj = [])` | 禁言（或解除禁言）群成员，`time` 单位为秒，`obj` 为可选的额外成员数组 | 通过 `POST /v2/groups/{group_id}/restrict_chat_setting` 实现；只有原本没有该方法时才会挂载 |
| `e.group.muteMember(openid, 0)` | 解除禁言 | 该项的 `time` 为 `0` 时请求体里的 `op` 为 `del`，否则为 `add` 并按 `+08:00` 计算 `mute_expire_at` |
| `e.group.muteMember(openid, time, [{ openid, time }])` | 一次处理多个成员 | 第三个参数 `obj` 是额外的 `{ openid, time }` 数组，会与第一个参数合并成待处理列表；某一项没写 `time` 时沿用第二个参数的值、写 `0` 则该项单独解除禁言；内部**每 20 个成员发一次请求**（`for (let i = 0; i < all.length; i += 20)`），任何一批失败就立即返回 `false`，全部成功返回 `true` |

请求体结构为 `members: [{ op, member_openid, mute_expire_at }]`，其中 `member_openid` 会去掉 `self_id:` 前缀，`mute_expire_at` 由「当前秒级时间 + `time` + 1 秒」按 `+08:00` 时区生成（`op: 'del'` 时同样会带上这个字段）。请求失败时方法返回 `false`。

### 入群申请列表

| 接口 | 用途 | 备注 |
| --- | --- | --- |
| `e.group.getJoinList()` | 获取入群申请列表 | 通过 `GET /v2/groups/{group_id}/join_request_list` 实现，返回官方响应里的 `result`；失败时返回 `false` |

### 群人数自动维护

插件还监听了 `notice.group.member` 事件：当群信息缓存存在时，按 `member.increase` 判断是 +1 还是 -1，直接更新缓存里的 `group_member_num`，避免每次都要重新请求官方接口。

### 全局工具（global.Mozu）

开启接口后，插件会把 `lib/protocol.js` 里的三个工具挂到 `global.Mozu` 上，任何插件都可以直接使用：

| 接口 | 用途 | 备注 |
| --- | --- | --- |
| `global.Mozu.mqqapi.command(text, command, ender)` | 生成 `mqqapi://aio/inlinecmd` 行内指令 Markdown 链接 | 点击即发送指令；`ender` 为 `true` 时额外拼一段带头像的写法，源码注释提醒「由于 mqqapi 限制，该方法可能在未来某一时间失效」 |
| `global.Mozu.laTex.colorize(text, perLine, color)` | 生成 LaTeX 彩色文本 | `perLine` 为 `false` 时逐字上色，`true` 时逐行上色；默认颜色为红、橙、黄、绿、青、蓝、紫、紫红 |
| `global.Mozu.qagent`（函数形式为 `qagent(peerUid, peerName)`） | 生成 `qagent://markdown/node` 的用户卡片链接 | 用于「联系主人」这类可点击的 QQ 名片 |

另外，文件顶部还有一行独立判断：

```js
if (Config.config.Redis.global) global.Redis = Redis
```

它的作用是把 Redis 实例挂到 `global.Redis` 上，与 `interface.enable` 无关。

::: info 相关开关
挂载与否由 `Config.config.Redis.global` 决定，默认配置文件里的键名就是 `global`（注释：「将Redis挂载到云崽global上」），用锅巴面板的「全局Redis」开关或直接改 YAML 都可以。
:::

## 调用示例

这些能力只在 QQBot 适配器的群里、且接口开关打开时才会被补齐，因此调用前建议做好判断：

```js
// 禁言 / 解除禁言（openid 为 QQBot 的成员 openid）
if (e.group?.muteMember) await e.group.muteMember(openid, 60)
if (e.group?.muteMember) await e.group.muteMember(openid, 0)   // time 为 0 → op: 'del'，解除禁言

// 批量：第三个参数是额外的 [{ openid, time }]，内部每 20 个成员发一次请求
if (e.group?.muteMember) {
  await e.group.muteMember(openid, 60, [
    { openid: openid2, time: 0 },   // 这一项单独解除禁言
    { openid: openid3 },            // 不写 time 就沿用第二个参数（60 秒）
  ])
}

// 获取入群申请列表
const joinList = e.group?.getJoinList ? await e.group.getJoinList() : false

// 判断机器人在群内是否为管理员
if (e.group?.is_admin) { /* ... */ }
```

本插件自身的 Markdown 输出与可点击指令按钮（帮助、发言榜、修仙面板）就是基于 `mqqapi`、`segment.markdown`、`segment.button` 实现的，可以直接参考它们的用法。

## 官方文档

接口的字段与返回结构以官方文档为准：<https://bot.q.qq.com/wiki/>。README 中给出的参考链接是官方 API v2 中「获取群 openid 信息」那一节。

## 相关页面

- [魔族陌修仙](/feature/xiuxian)：大量使用 QQBot 的 Markdown 与按钮能力
- [锅巴面板配置](/config/guoba)：接口开关的位置与用法
