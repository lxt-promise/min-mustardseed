# 薄荷小站 · 微信小程序版 🌿

> 一个清新、治愈的微信小程序工具箱，基于 **Taro 4 + React + TypeScript**。办公工具与休闲娱乐一站式集合。

![小程序版本](https://img.shields.io/badge/version-1.0.0-brightgreen) ![Taro](https://img.shields.io/badge/Taro-4.2.1-blue) ![React](https://img.shields.io/badge/React-18.3.1-61dafb)

---

## ✨ 功能特性

### 核心工具（全部已实现 ✅）

| 模块 | 功能 | 状态 |
|------|------|------|
| 🏠 **首页** | 功能导航 + 今日统计卡片 | ✅ 完成 |
| 🍅 **番茄钟** | 三模式计时 + 自定义时长 + 7天统计 | ✅ 完成 |
| ✅ **待办清单** | CRUD + 截止日期 + 多维筛选 + 导出 | ✅ 完成 |
| 📅 **工作日计算** | 双休/单休/大小周 + 法定假日 + 日历视图 | ✅ 完成 |
| ✨ **治愈金句** | 200 条中英经文 + 标签筛选 + 收藏 | ✅ 完成 |
| 🎯 **纠结人神器** | 6 大模板 + 自定义选项 + 抽签动画 | ✅ 完成 |
| 🎵 **音乐小站** | 钢琴/白噪音/热门 + 播放控制 + 自定义 URL | ✅ 完成 |
| 🧠 **趣味测试** | 颜色性格 + 笑话 + 人生锦囊 | ✅ 完成 |

### 设计亮点

- 🎨 **清新薄荷绿主题**，统一网页版视觉
- 🪟 **玻璃拟态卡片** + 渐变 + 阴影
- ✨ **微交互动画**：fade-up / pop-in / shake
- 📱 **rpx 自适应**，750 设计稿
- 💾 **本地数据持久化**，无需后端
- 🔌 **零网络依赖**（除音频外）

---

## 🚀 快速开始

### 环境要求

- **Node.js** >= 18.0
- **npm** >= 8.0（或 yarn / pnpm）
- **微信开发者工具** >= 1.06.0

### 安装依赖

```bash
cd miniprogram
npm install
```

> ⚠️ `weapp-tailwindcss` 会自动在 postinstall 阶段 patch Taro 配置。

### 开发模式（实时编译）

```bash
npm run dev:weapp
```

编译产物在 `dist/` 目录，用微信开发者工具打开即可预览。

### 生产构建

```bash
npm run build:weapp
```

---

## 📦 部署上线

### 1. 申请微信小程序 AppID

1. 访问 [微信公众平台](https://mp.weixin.qq.com/) 注册小程序账号
2. 完成主体认证（个人 / 企业）
3. 获得 AppID（一串 wx 开头字符）

### 2. 修改项目配置

编辑 `project.config.json`：

```json
{
  "appid": "wx1234567890abcdef",  // 替换为你的真实 AppID
  "projectname": "mustard-seed"
}
```

### 3. 配置合法域名

进入 [微信公众平台](https://mp.weixin.qq.com/) → 开发管理 → 开发设置：

| 域名类型 | 当前配置 | 说明 |
|----------|----------|------|
| `request合法域名` | （无需） | 本项目不发起网络请求 |
| `downloadFile合法域名` | `https://lxt-java.github.io` | 音频 CDN（临时） |
| `uploadFile合法域名` | （无需） | 无上传 |
| `业务域名` | （无需） | 无 H5 跳转 |

**⚠️ 重要**：音频 CDN `lxt-java.github.io` 不在中国大陆备案，正式上线前必须迁移：
1. 将音频文件上传到 **腾讯云 COS** / **阿里云 OSS** / **七牛云**
2. 域名完成 ICP 备案
3. 修改 `src/config/audio.ts` 中的 `AUDIO_CDN_BASE`

### 4. 上传代码

1. 微信开发者工具点击 **「上传」** 按钮
2. 填写版本号（如 `1.0.0`）和项目备注
3. 登录公众平台 → 版本管理 → 提交审核

### 5. 审核发布

- 个人主体小程序：1-3 天
- 企业主体小程序：1-7 天
- 类目需选择 **工具 > 效率**

---

## 📁 项目结构

```
miniprogram/
├── src/
│   ├── app.ts                 # 应用入口（含全局错误处理）
│   ├── app.config.ts          # 全局配置（含 TabBar）
│   ├── app.scss               # 全局样式（动画 + 工具类）
│   │
│   ├── assets/tabbar/         # TabBar 图标
│   │
│   ├── components/
│   │   └── CopyBtn/           # 通用复制按钮组件
│   │
│   ├── config/                # 业务配置
│   │   ├── app.ts             # 应用元信息
│   │   └── audio.ts           # 音频 CDN 配置
│   │
│   ├── data/                  # 静态数据
│   │   ├── verses.ts          # 200 条经文
│   │   └── quiz.ts            # 测试题库
│   │
│   ├── pages/                 # 页面（8 个）
│   │   ├── home/              # 首页
│   │   ├── pomodoro/          # 番茄钟
│   │   ├── todo/              # 待办
│   │   ├── workdays/          # 工作日
│   │   ├── verse/             # 金句
│   │   ├── picker/            # 抽签
│   │   ├── music/             # 音乐
│   │   └── quiz/              # 测试
│   │
│   └── utils/                 # 工具函数
│       ├── storage.ts         # 本地存储
│       ├── clipboard.ts       # 剪贴板
│       ├── audio.ts           # 提示音（WebAudio + 振动）
│       └── index.ts           # 通用工具（uid、debounce、checkUpdate）
│
├── config/                    # Taro 编译配置
│   ├── index.ts               # 主配置
│   ├── dev.ts                 # 开发环境
│   └── prod.ts                # 生产环境
│
├── scripts/
│   └── generate-icons.js      # TabBar 图标生成脚本
│
├── babel.config.js
├── tailwind.config.js         # 芥菜种子主题色板（薄荷绿基调）
├── postcss.config.js
├── tsconfig.json
├── project.config.json        # 微信项目配置（appid 已配置）
└── package.json
```

---

## 🎨 主题色板

| 色阶 | 色值 | 用途 |
|------|------|------|
| `mint-50` | `#effbf6` | 浅背景 |
| `mint-100` | `#d9f5e8` | 标签底 |
| `mint-300` | `#85dbb6` | 装饰 |
| `mint-500` | `#2ab07a` | 按钮/进度 |
| **`mint-600`** | **`#1a9464`** | **主色** |
| `mint-700` | `#157652` | 主色加深 |
| `mint-900` | `#104c37` | 标题/正文 |

辅助色：`rose`（番茄钟）、`indigo`（长休息）、`amber`（锦囊）、`fuchsia`（测试）。

---

## 🔧 常用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev:weapp` | 开发模式（watch） |
| `npm run build:weapp` | 生产构建 |
| `npm run clean` | 删除 dist 目录 |
| `npm run lint` | ESLint 检查 |
| `node scripts/generate-icons.js` | 重新生成 TabBar 图标 |

---

## ⚠️ 上线前检查清单

### 必改项

- [ ] **替换 `project.config.json` 中的 `appid`**（当前为 `touristappid`）
- [ ] **替换 `src/assets/tabbar/*.png` 为正式图标**（当前为单色字母占位）
- [ ] **迁移音频 CDN 域名**到已备案地址（修改 `src/config/audio.ts`）
- [ ] **填写 `src/config/app.ts` 中的反馈邮箱和隐私政策链接**

### 建议项

- [ ] 添加 **用户协议** 和 **隐私政策** 弹窗（微信审核必要）
- [ ] 设置 **小程序简介**、**客服微信** 等基本信息
- [ ] 关闭调试模式：`project.config.json` 中 `urlCheck: true`
- [ ] 体验版测试：邀请 5-10 名体验成员

### 可选项

- [ ] 接入 **微信分析**（wx.reportMonitor）
- [ ] 添加 **分享海报** 功能
- [ ] 实现 **深色模式**

---

## 🐛 常见问题

### Q1: 编译报错 "Taro not found"
```bash
rm -rf node_modules package-lock.json
npm install
```

### Q2: Tailwind 样式不生效
确认 `npm install` 时自动执行了 `weapp-tw patch`（看 `package.json` 的 `postinstall`）。

### Q3: 音频无法播放
1. 检查 `https://lxt-java.github.io` 是否在 `downloadFile` 合法域名
2. 开发期：微信开发者工具 → 详情 → 本地设置 → 勾选"不校验合法域名"

### Q4: 番茄钟在后台计时不准
小程序后台 `setInterval` 会暂停，这是微信的限制。如需精确计时，建议使用服务器端计时或本地存储时间戳对比。

### Q5: TabBar 图标不显示
1. 确认 `src/assets/tabbar/*.png` 文件存在
2. 确认编译后 `dist/assets/tabbar/*.png` 也存在
3. 重新 `npm run build:weapp`

---

## 📄 许可证

MIT License

---

## 🙏 致谢

- [Taro](https://taro-docs.jd.com/) - 京东凹凸实验室出品的多端框架
- [TailwindCSS](https://tailwindcss.com/) - 原子化 CSS
- [weapp-tailwindcss](https://github.com/sonofmagic/weapp-tailwindcss) - Taro 集成方案

---

Made with ❤️ by MintBox Team
