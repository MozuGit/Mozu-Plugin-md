import { defineConfig, type DefaultTheme } from 'vitepress'

const REPO = 'https://github.com/MozuGit/Mozu-Plugin'
const SITE_REPO = 'https://github.com/MozuGit/Mozu-Plugin-md'

export default defineConfig({
  lang: 'zh-CN',
  title: 'Mozu-Plugin',
  description: '适用于 TRSS-Yunzai 的娱乐功能插件，内置魔族陌修仙、伪造聊天、发言统计与可视化配置面版',

  base: '/',
  cleanUrls: true,
  metaChunk: true,
  lastUpdated: true,

  srcExclude: ['README.md', '.reference/**', 'node_modules/**'],

  head: [
    ['link', { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/Mo.png' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/Mo.png' }],
    ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: '/Mo.png' }],
    ['link', { rel: 'mask-icon', href: '/Mo.png', color: '#d4a24c' }],
    ['meta', { name: 'theme-color', content: '#d4a24c' }],
    ['meta', { name: 'author', content: 'MozuGit' }],
    ['meta', { name: 'keywords', content: 'Yunzai,TRSS-Yunzai,Mozu-Plugin,魔族陌,修仙插件,QQ机器人,OneBot' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'Mozu-Plugin' }],
    ['meta', { property: 'og:description', content: '适用于 TRSS-Yunzai 的娱乐功能插件：魔族陌修仙、伪造聊天、发言统计、可视化配置面版' }],
    ['meta', { property: 'og:image', content: '/Mo.png' }]
  ],

  sitemap: {
    hostname: 'https://mozumiao.com/'
  },

  themeConfig: {
    logo: { src: '/Mo.png', width: 24, height: 24 },

    nav: nav(),

    sidebar: sidebar(),

    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索文档',
            buttonAriaLabel: '搜索文档'
          },
          modal: {
            noResultsText: '无法找到相关结果',
            resetButtonTitle: '清除查询条件',
            footer: {
              selectText: '选择',
              navigateText: '切换',
              closeText: '关闭'
            }
          }
        }
      }
    },

    socialLinks: [
      { icon: 'github', link: REPO }
    ],

    editLink: {
      pattern: `${SITE_REPO}/edit/main/:path`,
      text: '在 GitHub 上编辑此页面'
    },

    docFooter: {
      prev: '上一页',
      next: '下一页'
    },

    outline: {
      label: '页面导航',
      level: [2, 3]
    },

    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'medium'
      }
    },

    footer: {
      message: '基于 GPL-3.0 许可发布 · <a href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer">闽ICP备2026007389号-1</a>',
      copyright: 'Copyright © 2026 <a href="https://github.com/MozuGit" target="_blank" rel="noreferrer">MozuGit</a>'
    },

    langMenuLabel: '中文',
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
    externalLinkIcon: true
  }
})

function nav(): DefaultTheme.NavItem[] {
  return [
    {
      text: '快速开始',
      link: '/guide/',
      activeMatch: '/guide/'
    },
    {
      text: '功能',
      link: '/feature/xiuxian',
      activeMatch: '/feature/'
    },
    {
      text: '配置',
      link: '/config/guoba',
      activeMatch: '/config/'
    },
    {
      text: '管理台',
      link: '/webui/',
      activeMatch: '/webui/'
    },
    {
      text: '开发',
      link: '/develop/structure',
      activeMatch: '/develop/'
    },
    {
      text: '关于',
      link: '/other/about',
      activeMatch: '/other/'
    }
  ]
}

function sidebar(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: '快速开始',
      collapsed: false,
      items: [
        { text: '目录导航', link: '/guide/' },
        { text: '魔族陌插件', link: '/guide/what' },
        { text: '安装', link: '/guide/install' },
        { text: '更新与卸载', link: '/guide/update' },
        { text: '常见问题', link: '/guide/faq' }
      ]
    },
    {
      text: '功能',
      collapsed: false,
      items: [
        {
          text: '魔族陌修仙',
          link: '/feature/xiuxian',
          items: [
            { text: '基础指令', link: '/feature/xiuxian#基础指令' },
            { text: '宗门指令', link: '/feature/xiuxian#宗门指令' },
            { text: '排行与兑换', link: '/feature/xiuxian#排行指令' }
          ]
        },
        { text: '伪造聊天', link: '/feature/make-message' },
        { text: '发言统计', link: '/feature/fayan' },
        { text: '定时点赞', link: '/feature/like' },
        { text: 'QQBot 接口', link: '/feature/qqbot-api' }
      ]
    },
    {
      text: '配置',
      collapsed: false,
      items: [
        { text: '锅巴面板配置', link: '/config/guoba' },
        { text: '配置文件说明', link: '/config/files' },
        { text: 'AI 自动审核', link: '/config/openai' }
      ]
    },
    {
      text: '管理台',
      collapsed: false,
      items: [
        { text: '内置管理台', link: '/webui/' },
        { text: '部署与安全', link: '/webui/security' }
      ]
    },
    {
      text: '开发',
      collapsed: false,
      items: [
        { text: '项目结构', link: '/develop/structure' },
        { text: '新增功能模块', link: '/develop/module' },
        { text: '修仙数据扩展', link: '/develop/xiuxian-data' }
      ]
    },
    {
      text: '关于',
      collapsed: false,
      items: [
        { text: '关于与联系', link: '/other/about' },
        { text: '鸣谢', link: '/other/thanks' },
        { text: '更新日志', link: '/other/changelog' }
      ]
    }
  ]
}
