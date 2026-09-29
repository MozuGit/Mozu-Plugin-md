# 新增功能模块

这一页教你在 `apps/` 下加一个新的指令模块：文件放哪、构造函数怎么填、怎么回复消息、需要配置项时怎么接锅巴面板，最后是生效方式与调试套路。

## 模块是怎么被加载的

入口 `index.js` 会递归扫描 `apps` 目录、取出所有 `.js` 文件（所以放在 `apps/` 下任意层级都会生效），再用 `Promise.allSettled` 并行 `import`，单个文件报错不影响其它模块：

```js [index.js]
if (ret[i].status !== "fulfilled") {
  logger.error(`载入插件错误：${logger.red(name)}`)
  logger.error(ret[i].reason)
  continue
}
const keys = Object.keys(ret[i].value)
const validKey = keys.find(key => key.toLowerCase() === appName.toLowerCase()) || keys[0]
apps[name] = ret[i].value[validKey]
```

## 官方模板：apps/example/

`apps/example/` 就是官方示例目录，里面的文件同时也是线上功能，可以直接当模板抄。README 里把它们写作 `apps/makeMessage.js` 与 `apps/fayan.js`，实际文件位于 `apps/example/` 下——扫描是递归的，放在这一层同样会被加载。`like.js` 则是另一种模板：只有 `task`（cron 定时任务），没有 `rule`。

伪造聊天的构造函数原文：

```js [apps/example/makeMessage.js]
import Config from "#Config"

export class MozuMakeMessage extends plugin {
  constructor() {
    super({
      name: "魔族陌:伪造聊天",
      dsc: "自定义伪造聊天",
      event: "message",
      priority: 1145,
      rule: [
        {
          reg: "^#?伪(造|装)聊天",
          fnc: "forged"
        },
        {
          reg: /^#?伪(造|装)复读\s*(.+?)(?:\s+(\d+))?$/,
          fnc: "repeat"
        }
      ]
    })
  }
}
```

发言统计的 `rule` 数组（节选第一条）：

```js [apps/example/fayan.js]
rule: [
  {
    reg: '^#?发言榜(日榜|月榜|周榜)?\s*(\d*)',
    fnc: 'fayan'
  }
]
```

### 构造函数字段

| 字段 | 说明 |
| --- | --- |
| `name` | 模块名称，日志与锅巴面板里显示，例如 `魔族陌:伪造聊天` |
| `dsc` / `event` | 一句话描述；监听的事件，指令类模块都是 `"message"` |
| `priority` | 优先级，**数字越小越优先**。示例模块用固定的 `1145`；修仙系列读 `Config.xiuxian.setting.priority`（默认 `1000`） |
| `rule` | 规则数组，每项 `{ reg, fnc }`：`reg` 可以是字符串或正则，命中后调用 `fnc` 指定的方法 |
| `task` | 定时任务数组，每项 `{ cron, name, fnc }`，例如 `apps/xiuxian/title.js` 里的 `cron: Config.xiuxian.title.rankTitle.cron \|\| "0 0 0 ? * 1"` |

## 回复消息：this.e.reply

方法参数 `e` 与 `this.e` 是同一个事件对象，仓库里两种写法混用。常见的真实调用形式：

| 写法 | 出处 | 说明 |
| --- | --- | --- |
| `e.reply("私聊暂不支持此操作", true)` | `apps/example/makeMessage.js` | 第二参数为引用回复标记 |
| `await this.e.reply(message)` | `apps/example/fayan.js` | 普通文本回复，`message` 可以是多行字符串 |
| `await e.reply(forwardMsg, false, { recallMsg: 60 })` | `apps/example/makeMessage.js` | 合并转发 + 追加选项；源码里主人传 `{ recallMsg: 0 }`、其他人传 `{ recallMsg: 60 }` |
| `this.e.reply([message, Button.author])` | `apps/xiuxian/help.js` | 数组形式，文本片段和按钮可以一起发 |

常用事件字段：`this.e.msg`、`this.e.user_id`、`this.e.group_id`、`this.e.self_id`、`this.e.group`（私聊时为 falsy）、`this.e.isMaster`、`this.e.at`。

返回值约定：提前放行时 `return false`（功能没开、适配器不符、不在群里），表示这次不处理、交给后续插件继续匹配；处理完 `return true`。

## 写一个新模块

在 `apps/example/` 下新建 `hello.js`，类名与文件名保持一致（`reg` 用 `^#?` 开头是仓库通行写法，让「无 #」和「带 #」两种输入都能命中）：

```js [apps/example/hello.js]
import Config from "#Config"

export class MozuHello extends plugin {
  constructor() {
    super({
      name: '魔族陌:打招呼',
      event: 'message',
      priority: 1145,
      rule: [{ reg: '^#?(你好|hello)$', fnc: 'hello' }]
    })
  }

  async hello(e) {
    if (!Config.example.hello.enable || !this.e.group) return false
    return e.reply(Config.example.hello.reply)
  }
}
```

## 加配置项

### 第 1 步：加默认 yaml

在 `config/example/default/` 新建 `hello.yaml`，键的写法参考真实的 `config/example/default/fayan.yaml`（`enable` / `sendMarkdown` / `count`）：

```yaml [config/example/default/hello.yaml]
# 招呼开关
enable: true

# 回复内容
reply: "你好呀"
```

配置组跟着模块所在目录走：`apps/example/` 下的模块用 `example` 组，修仙用 `xiuxian` 组，管理台用 `panel` 组，`Redis` / `interface` / `openai` 这类通用配置放在 `config` 组。`model/Config/Config.js` 的 `initCfg()` 在启动时会遍历 `config`、`xiuxian`、`example`、`panel` 四个目录，把 `default/*.yaml` 里尚不存在的文件复制到同级 `config/` 目录并挂上 chokidar 监听——**不需要手写复制逻辑**，也不必预先创建 `config/example/hello.yaml`。

### 第 2 步：用 #Config 读取

配置对象由 Proxy 暴露，路径就是 `<目录名>.<文件名>`：

```js [apps/example/fayan.js]
async fayan(e) {
  if (!Config.example.fayan.enable || !this.e.group) return false
```

| 写法 | 对应文件 |
| --- | --- |
| `Config.example.fayan.enable` | `config/example/<default 或 config>/fayan.yaml` 的 `enable` |
| `Config.example.like.cron` | `config/example/<default 或 config>/like.yaml` 的 `cron` |
| `Config.xiuxian.setting.enable` | `config/xiuxian/<default 或 config>/setting.yaml` 的 `enable` |
| `Config.panel.login.port` | `config/panel/<default 或 config>/login.yaml` 的 `port` |

读取时 `getDefOrConfig()` 把 `default` 与用户 `config` 合并、用户配置优先；文件不存在时返回空对象而不抛错，所以缺配置只会得到 `undefined`，记得写兜底值（仓库里的写法如 `|| "0 0 0 ? * 1"`）。

### 第 3 步：加锅巴面板 schema

新建 `guoba/schemas/hello.js` 导出数组，字段名直接用点分路径（面板用法见 [锅巴面板配置](/config/guoba)）：

```js [guoba/schemas/hello.js]
export default [
  {
    field: 'example.hello.enable',
    label: '招呼开关',
    component: 'Switch'
  },
  {
    field: 'example.hello.reply',
    label: '回复内容',
    component: 'Input'
  }
]
```

再在 `guoba/schemas/index.js` 里 import 并加入汇总数组：

```js [guoba/schemas/index.js]
import fayan from './fayan.js'
import like from './like.js'
import _interface from './interface.js'

export const schemas = [
  ...RedisConfig,
  ...panel,
  ...xiuxian,
  ...makeMessage,
  ...fayan,
  ...like,
  ...openai,
  ..._interface
]
```

::: warning 保存回写要单独登记
`setConfigData()` 里的 `batchModifyConfig` 是显式列举的，新增配置文件必须补一行，否则面板点保存不会写回你的 yaml。`dir` 要与配置组目录名一致（`config/example/` 对应 `example`），`data` 取 `nested.<组名>.<文件名>`：

```js [guoba/schemas/index.js]
batchModifyConfig([
  { dir: 'config', file: 'Redis', data: nested.config.Redis },
  { dir: 'config', file: 'openai', data: nested.config.openai },
  { dir: 'config', file: 'interface', data: nested.config.interface },
  { dir: 'example', file: 'makeMessage', data: nested.example.makeMessage },
  { dir: 'example', file: 'fayan', data: nested.example.fayan },
  { dir: 'example', file: 'like', data: nested.example.like },
  { dir: 'example', file: 'hello', data: nested.example.hello },
  { dir: 'panel', file: 'login', data: nested.panel.login },
])
```

真实文件里 `like` 就是按这个约定新加的条目，可以对照。
:::

## 生效方式与调试

- 新增或修改 `apps/` 下的 js：要重启 Yunzai 才会重新扫描载入。
- 只改 yaml 里的开关值：`Config.js` 用 chokidar 监听并刷新缓存，一般无需重启；但构造函数里读的值（修仙 `priority`、各种 `cron`）只在启动时执行一次，必须重启。
- 载入失败时日志里会先出现 `载入插件错误：<文件路径>`，紧接着是原始错误堆栈——语法错误、导入路径写错、`super()` 字段拼错都会在这里暴露；单个模块报错不会拖垮其它模块（入口用 `Promise.allSettled`），所以「只有我的功能不生效」通常就是本文件载入失败了。
- 功能没反应时先确认开关与适配器：修仙系列普遍有 `if (!['QQBot'].includes(e?.bot?.adapter?.name) || !Config.xiuxian.setting.enable) return false`，非 QQBot 适配器或开关关闭时会静默放行，看起来就像「没实现」；日志前缀（`[魔族陌修仙]`、`[魔族陌面版]`）能帮你判断报错属于哪个子系统。
- 代码风格统一交给 prettier（仓库根的 `.prettierrc`：无分号、单引号、`printWidth: 120`），提交前跑一次 `npx prettier --write .`，免得格式差异淹没真正的改动。
