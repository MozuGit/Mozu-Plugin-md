---
layout: home

hero:
  name: Mozu-Plugin
  text: 适用于 TRSS-Yunzai 的娱乐功能插件
  tagline: 魔族陌修仙、伪造聊天、发言统计等功能
  image:
    src: /Mo.png
    alt: Mozu-Plugin
  actions:
    - theme: brand
      text: 开始安装
      link: /guide/install
    - theme: alt
      text: 看看有什么功能
      link: /feature/xiuxian
    - theme: alt
      text: GitHub
      link: https://github.com/MozuGit/Mozu-Plugin

features:
  - icon: 🎮
    title: 玩法丰富
    details: 魔族陌修仙（境界 · 宗门 · 妖兽 · 秘境 · 兑换码）、伪造聊天、发言统计、定时点赞、QQBot 接口扩展，开箱即用的群聊娱乐全家桶。
  - icon: 🧩
    title: 可视化配置
    details: 支持锅巴面板一键配置所有开关，插件自带 Vue3 + Ant Design Vue 管理台，修仙玩家、宗门、CDK 与备份均可在线管理。
  - icon: ⚡
    title: 轻量易装
    details: 克隆 + 安装依赖两条命令即可跑起来，提供 GitHub / Gitee / GitCode 多源加速，机器人内一条指令完成热更新。
---

## 三分钟跑起来

把插件放进 Yunzai 的 `plugins` 目录，安装依赖后重启即可，无需改动框架代码。

::: code-group

```sh [GitHub]
git clone https://github.com/MozuGit/Mozu-Plugin ./plugins/Mozu-Plugin
cd ./plugins/Mozu-Plugin && pnpm install
```

```sh [Gitee 换源]
git clone https://gitee.com/MozuGit/Mozu-Plugin ./plugins/Mozu-Plugin
cd ./plugins/Mozu-Plugin && pnpm install
```

```sh [GitCode 换源]
git clone https://gitcode.com/MozuGit/Mozu-Plugin ./plugins/Mozu-Plugin
cd ./plugins/Mozu-Plugin && pnpm install
```

:::

装好之后在群里发送 `#修仙帮助` 即可看到完整指令表，发送 `#发言榜` 可以看到本群发言排行。

<HomeLinks />

<p style="text-align:center;margin-top:32px;color:var(--vp-c-text-2)">
遇到问题？先看 <a href="/guide/faq">常见问题</a>，或到 <a href="https://github.com/MozuGit/Mozu-Plugin/issues" target="_blank" rel="noreferrer">GitHub Issues</a> 反馈。
</p>
