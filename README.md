# Mozu-Plugin 文档站

[Mozu-Plugin](https://github.com/MozuGit/Mozu-Plugin) 的官方文档站，基于 [VitePress](https://vitepress.dev/) 构建

线上地址：**https://mozumiao.com**

## 本地开发

```sh
pnpm install
pnpm dev        # 开发预览 http://localhost:5173
pnpm build      # 构建到 .vitepress/dist
pnpm preview    # 预览构建产物
```

## 目录结构

```text
.
├─ .github/workflows/deploy.yml   # 推送 main 自动构建并发布到 GitHub Pages
├─ .vitepress
│  ├─ config.mts                  # 站点配置：导航、侧边栏、搜索、页脚
│  └─ theme
│     ├─ index.ts                 # 主题入口（注册首页组件）
│     ├─ custom.css               # 金色主题定制
│     └─ components/HomeLinks.vue # 首页「生态 / 工具 / 社区」三列区块
├─ public                         # 静态资源（Mo.png、favicon.ico、CNAME）
├─ index.md                       # 首页（Hero + 特性卡 + 三列区块）
├─ guide/                         # 快速开始
├─ feature/                       # 功能说明
├─ config/                        # 配置说明
├─ webui/                         # 内置管理台
├─ develop/                       # 开发指南
└─ other/                         # 关于、鸣谢、更新日志
```

## 写作约定

- 每页以单个 `# 一级标题` 开头，正文从 `##` 开始。
- 侧边栏在 `.vitepress/config.mts` 的 `sidebar()` 中维护，新增页面记得同步。
- 每页底部的「在 GitHub 上编辑此页面」由 `.vitepress/config.mts` 的 `editLink` 提供，指向本仓库 `MozuGit/Mozu-Plugin-md` 的 `main` 分支。
- 内部链接写 `/guide/install` 这样的绝对路径（`cleanUrls: true`，不带 `.html`）。
- 可用容器：`::: tip` / `::: warning` / `::: danger` / `::: info` / `::: details 标题`；
  代码组用 `::: code-group` + ` ```sh [标签] `。

## 部署

推送到 `main` 分支后由 `.github/workflows/deploy.yml` 自动发布：

1. 仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
2. 若使用自定义域名，`public/CNAME` 已写入 `mozumiao.com`，还需在 DNS 添加指向 `mozugit.github.io` 的 `CNAME` 记录。
3. 若改为 GitHub Pages 项目页（`mozugit.github.io/Mozu-Plugin-md/`），需要把 `.vitepress/config.mts` 里的 `base` 改为 `'/Mozu-Plugin-md/'`，并删除 `public/CNAME`。

## 许可

文档内容基于 [GPL-3.0](https://www.gnu.org/licenses/gpl-3.0.html) 发布，与主项目保持一致。
