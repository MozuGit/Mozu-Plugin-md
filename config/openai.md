# AI 自动审核

AI 自动审核用一个大模型来判断玩家提交的文本是否违规。它是魔族陌修仙里「宗门名称 / 宗门简介」审核方式的一种，README 的功能介绍中写作「AI自动审核玩家输入文本」。

::: info 它审的是哪两处文本
源码里目前只有两个调用点：`model/xiuxian/xiuxian.js` 的 `sectSetName()`（设置宗门名称）与 `sectSetDesc()`（设置宗门简介）。也就是说，只有这两处文本会被送去 AI 审核。
:::

## 什么时候会触发

是否走 AI 由 `config/xiuxian/config/sect.yaml` 的 `sect_validation.audit.mode` 决定：

| `audit.mode` | 审核方式 |
| --- | --- |
| `0` | 手动审核（提交后进 `Mozu:xiuxian:audit:sect:name` / `:desc`，等主人处理） |
| `1` | **AI 审核** |
| `2` | 关键词审核（命中 `audit.keywords` 黑名单词即拒绝） |
| `3` | 无需审核 |

除了审核方式，名字/简介还要先通过长度与换行校验（`sect_validation.name.*`、`sect_validation.desc.*`），任何一项不通过都不会走到 AI。

## 配置文件

```yaml [config/config/default/openai.yaml]
# OpenAI的URL地址
baseURL: "https://api.deepseek.com"

# OpenAI的模型
model: "deepseek-v4-flash"

# OpenAI的密钥
apiKey: "sk-***"
```

实际生效的文件是 `config/config/config/openai.yaml`（首次加载时从 `default` 复制）。也可以在锅巴面板的 `OpenAI` 分组里改，三个字段的面板名称分别是「API链接」「模型名称」「API密钥」。

| 字段 | 默认值 | 说明 |
| --- | --- | --- |
| `baseURL` | `"https://api.deepseek.com"` | 接口地址，填兼容 OpenAI 协议的服务地址 |
| `model` | `"deepseek-v4-flash"` | 模型名称，必须换成你所选服务真实提供的模型 |
| `apiKey` | `"sk-***"` | 密钥，占位值，必须换成自己的 |

::: warning 默认值只是示例
`baseURL` 与 `model` 的默认值是随仓库发布的示例。源码通过 `openai` 包的 `client.chat.completions.create()` 发起请求，所以任何兼容 OpenAI Chat Completions 协议的服务都能用，但**模型名写错或密钥无效时请求会失败**——失败后不是放行，而是掉进人工审核（见下文）。
:::

## 提示词写死在代码里

提示词没有配置项，它硬编码在 `model/ai/openai.js` 中：

```js [model/ai/openai.js]
const complettion = await client.chat.completions.create({
  model: Config.config.openai.model,
  messages: [
    { role: 'user', content: "返回是/否\n请只判断以下内容是否违规\n内容：" + messgae }
  ]
})
```

插件把玩家文本拼在这段提示词后面，要求模型只回一个字：`是` 或 `否`。想改判定口径只能改这段代码。

## 如何申请与填写

1. 选一个兼容 OpenAI 协议的服务（官方或第三方中转都可以），在它的控制台创建 API Key。
2. 拿到服务的接口地址与模型名：`baseURL` 填服务商给出的接口地址（默认值 `https://api.deepseek.com` 就是这种形式），`model` 填该服务文档里给出的模型名。
3. 打开锅巴面板 → `OpenAI` 分组，把「API链接」「模型名称」「API密钥」填好并保存（写入 `config/config/config/openai.yaml`）。
4. 把修仙审核方式改成 AI：锅巴面板 → `修仙设置` → `修仙宗门设置` → 「审核模式」选 `AI审核`（即 `mode: 1`），或者直接编辑 `config/xiuxian/config/sect.yaml` 里的 `sect_validation.audit.mode: 1`。
5. 用一个小号在群里试着设置宗门名称，观察是否直接被拒或直接通过。

## 审核不通过的玩家表现

| 模型返回 | 插件行为 | 玩家在群里看到 |
| --- | --- | --- |
| `否` | 判定正常，直接写入名称/简介并通知主人 | 「设置宗门名称成功」/「设置宗门简介成功」 |
| `是` | 判定违规，不写入 | 「**设置宗门名称失败** / 请修改宗门名称 / 宗门名称中包含违禁词或违规」（简介同理） |
| 其它任何内容、请求超时、密钥无效、额度不足 | 走 `default` 分支：文本存入待审 Redis 键并通知主人 | 「**宗门名称审核中** / 已发送宗门名称审核」 |

最后一行值得记住：**AI 挂了等于退回人工审核，不等于放行**。所以看到玩家一直卡在「审核中」，先去机器人日志里找 `[魔族陌修仙][OpenAI]` 开头的报错。

## 怎么关闭 AI 审核

- 只是不想用 AI：把 `sect_validation.audit.mode` 改成 `0`（手动审核）、`2`（关键词审核）或 `3`（无需审核，玩家提交即生效）。
- 完全不想审核宗门名称/简介：用 `3`。
- 注意：**清空或写错 `apiKey` 并不会关闭审核**，只会让每次请求失败并落到人工审核队列，白白堆积待审文本。

改了 `openai.yaml` 或 `sect.yaml` 不需要重启（这几项没有「修改后需要重启才能生效」标记）。

## 密钥安全

::: danger API Key 泄露等于钱包泄露
- `apiKey` 以明文形式保存在 `config/config/config/openai.yaml`。该目录已在 `.gitignore` 中忽略，但**备份、网盘同步、整包分享**都会把它一起带走。分享插件目录前请先清空密钥。
- 锅巴面板读取配置时只抹掉面版密码，**`config.openai.apiKey` 会原样回显到浏览器前端**。因此不要把锅巴面板、管理台直接暴露到公网，也不要在公共网络下打开它们（做法见 [部署与安全](/webui/security)）。
- 密钥泄露后请立刻去服务商控制台吊销并重建，不要只在本地改文件。
- 发送日志或截图求助前，先确认里面没有 `sk-` 开头的字符串。
:::

## 相关链接

- [配置文件说明](/config/files)
- [锅巴面板配置](/config/guoba)
- [魔族陌修仙](/feature/xiuxian)
- [部署与安全](/webui/security)
