<script setup lang="ts">
interface LinkItem {
  text: string
  link: string
}

interface LinkGroup {
  icon: string
  title: string
  items: LinkItem[]
}

const groups: LinkGroup[] = [
  {
    icon: '🌱',
    title: '生态',
    items: [
      { text: 'TRSS-Yunzai 机器人框架', link: 'https://github.com/TimeRainStarSky/Yunzai' },
      { text: '锅巴面板 Guoba-Plugin', link: 'https://github.com/guoba-yunzai/guoba-plugin' },
      { text: 'QQ 机器人官方文档', link: 'https://bot.q.qq.com/wiki/' },
      { text: 'OneBot 标准协议', link: 'https://onebot.dev/' }
    ]
  },
  {
    icon: '🧰',
    title: '工具',
    items: [
      { text: '内置可视化管理台', link: '/webui/' },
      { text: '锅巴面板配置项', link: '/config/guoba' },
      { text: '安装与换源（Gitee / GitCode）', link: '/guide/install#换源安装' },
      { text: '一键更新指令', link: '/guide/update' }
    ]
  },
  {
    icon: '💬',
    title: '社区',
    items: [
      { text: '陌陌の小窝（QQ 群 976719017）', link: '/other/about' },
      { text: '提交 Issue 反馈问题', link: 'https://github.com/MozuGit/Mozu-Plugin/issues' },
      { text: 'Star 支持项目', link: 'https://github.com/MozuGit/Mozu-Plugin/stargazers' },
      { text: '爱发电赞助开发者', link: 'https://www.ifdian.net/a/Mozumo' }
    ]
  }
]

function isExternal(link: string) {
  return /^https?:\/\//.test(link)
}
</script>

<template>
  <div class="mozu-links">
    <section v-for="group in groups" :key="group.title" class="mozu-links__group">
      <h3 class="mozu-links__title">{{ group.icon }} {{ group.title }}</h3>
      <ul class="mozu-links__list">
        <li v-for="item in group.items" :key="item.text">
          <a
            :href="item.link"
            :target="isExternal(item.link) ? '_blank' : undefined"
            :rel="isExternal(item.link) ? 'noreferrer' : undefined"
          >
            {{ item.text }}
            <i v-if="isExternal(item.link)" class="ext">↗</i>
          </a>
        </li>
      </ul>
    </section>
  </div>
</template>
