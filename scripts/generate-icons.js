/**
 * 生成「芥菜种子」品牌图标
 *  - TabBar 图标 5 组 × 2 态（81x81 PNG，线性圆角风格 + 种子/新芽元素）
 *  - 小程序头像 logo.png（512x512，渐变底 + 白色种子新芽）
 *
 * 运行方式：node scripts/generate-icons.js （依赖 devDependencies 中的 sharp）
 */
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const TABBAR_DIR = path.join(__dirname, '..', 'src', 'assets', 'tabbar')
const LOGO_PATH = path.join(__dirname, '..', 'src', 'assets', 'logo.png')

const COLOR_NORMAL = '#7a9c8a' // 与 tabBar 未选中文字同色
const COLOR_ACTIVE = '#1a9464' // 主色 mint-600

/* ---------- 通用零件 ---------- */

// 种子/叶片形：上尖下圆的水滴形
const seed = (cx, cy, rx, ry, fill = false) =>
  `<path d="M ${cx} ${cy - ry}
     C ${cx + rx} ${cy - ry * 0.45}, ${cx + rx} ${cy + ry}, ${cx} ${cy + ry}
     C ${cx - rx} ${cy + ry}, ${cx - rx} ${cy - ry * 0.45}, ${cx} ${cy - ry} Z"
   ${fill ? `fill="currentColor" stroke="none"` : 'fill="none"'}/>`

// 顶部新芽：短茎 + 左右两片小叶
const sprout = (x, yTop, stemBottom) => `
  <path d="M ${x} ${stemBottom} V ${yTop}"/>
  <path d="M ${x} ${yTop} C ${x - 2.5} ${yTop - 4.5}, ${x - 7} ${yTop - 5}, ${x - 9.5} ${yTop - 2}"/>
  <path d="M ${x} ${yTop} C ${x + 2.5} ${yTop - 4.5}, ${x + 7} ${yTop - 5}, ${x + 9.5} ${yTop - 2}"/>`

/* ---------- 5 个 TabBar 图标（viewBox 96x96，stroke 6 圆角线性） ---------- */

const ICONS = {
  // 首页：小房子，门是一粒种子，屋顶冒出新芽
  home: `
    <path d="M18 46 L48 22 L78 46"/>
    <path d="M28 42 V70 a4 4 0 0 0 4 4 H64 a4 4 0 0 0 4 -4 V42"/>
    ${seed(48, 58, 6, 8)}
    ${sprout(48, 15, 22)}
  `,
  // 番茄钟：计时圆盘 + 顶部新芽（番茄蒂变芽）
  pomodoro: `
    <circle cx="48" cy="56" r="26"/>
    ${sprout(48, 22, 30)}
    <path d="M48 56 V44"/>
    <path d="M48 56 L57 61"/>
  `,
  // 待办：清单板 + 两行待办 + 一个勾
  todo: `
    <rect x="26" y="18" width="44" height="60" rx="8"/>
    <path d="M40 18 V15 a4 4 0 0 1 4 -4 h8 a4 4 0 0 1 4 4 V18"/>
    <path d="M36 38 H60"/>
    <path d="M36 50 H56"/>
    <path d="M36 64 l6.5 6.5 L56 57"/>
  `,
  // 金句：摊开的书 + 书页上方悬浮的新芽
  verse: `
    <path d="M48 36 C43 30.5, 34 28.5, 26 30.5 V68 C34 66, 43 68, 48 73
             C53 68, 62 66, 70 68 V30.5 C62 28.5, 53 30.5, 48 36 Z"/>
    <path d="M48 36 V73"/>
    ${sprout(48, 19, 26)}
  `,
  // 测试：问号，问号点是粒种子
  quiz: `
    <path d="M36 34 C36 22, 60 22, 60 36 C60 46, 48 46, 48 58"/>
    ${seed(48, 70, 4.5, 6, true)}
  `,
  // 更多：三粒种子（省略号意象），中间一粒微微抬头
  more: `
    ${seed(26, 56, 5, 8, true)}
    ${seed(48, 47, 5, 8, true)}
    ${seed(70, 56, 5, 8, true)}
  `,
}

const wrap = (body, color) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
     <g fill="none" stroke="${color}" stroke-width="6"
        stroke-linecap="round" stroke-linejoin="round" color="${color}">${body}</g>
   </svg>`

/* ---------- 小程序头像 logo（512x512） ---------- */

const LOGO_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#3cba83"/>
      <stop offset="1" stop-color="#157652"/>
    </linearGradient>
  </defs>
  <rect x="16" y="16" width="480" height="480" rx="120" fill="url(#bg)"/>

  <!-- 土壤弧线 -->
  <path d="M188 366 Q256 392 324 366" fill="none" stroke="#ffffff"
        stroke-width="12" stroke-linecap="round" opacity="0.35"/>

  <!-- 种子（倾斜的白色大种子） -->
  <g transform="rotate(-18 256 296)">
    <path d="M 256 222
       C 312 252, 312 330, 256 366
       C 200 330, 200 252, 256 222 Z" fill="#ffffff"/>
  </g>

  <!-- 茎 -->
  <path d="M256 244 C 252 208, 256 178, 270 150" fill="none"
        stroke="#ffffff" stroke-width="16" stroke-linecap="round"/>

  <!-- 左叶 / 右叶 -->
  <g transform="rotate(-38 206 186)">
    <path d="M 206 128 C 244 154, 244 206, 206 236 C 168 206, 168 154, 206 128 Z" fill="#ffffff"/>
  </g>
  <g transform="rotate(30 322 128)">
    <path d="M 322 84 C 356 108, 356 154, 322 180 C 288 154, 288 108, 322 84 Z" fill="#ffffff"/>
  </g>

  <!-- 点缀星光 -->
  <path d="M140 120 l7 18 18 7 -18 7 -7 18 -7 -18 -18 -7 18 -7 Z" fill="#ffffff" opacity="0.9"/>
  <path d="M392 320 l5.5 14 14 5.5 -14 5.5 -5.5 14 -5.5 -14 -14 -5.5 14 -5.5 Z" fill="#ffffff" opacity="0.7"/>
</svg>`

/* ---------- 渲染 ---------- */

async function main() {
  if (!fs.existsSync(TABBAR_DIR)) fs.mkdirSync(TABBAR_DIR, { recursive: true })

  for (const [name, body] of Object.entries(ICONS)) {
    const normal = await sharp(Buffer.from(wrap(body, COLOR_NORMAL)))
      .resize(81, 81).png().toBuffer()
    const active = await sharp(Buffer.from(wrap(body, COLOR_ACTIVE)))
      .resize(81, 81).png().toBuffer()
    fs.writeFileSync(path.join(TABBAR_DIR, `${name}.png`), normal)
    fs.writeFileSync(path.join(TABBAR_DIR, `${name}-active.png`), active)
    console.log(`  ✓ tabbar: ${name}.png / ${name}-active.png`)
  }

  await sharp(Buffer.from(LOGO_SVG)).resize(512, 512).png().toFile(LOGO_PATH)
  console.log(`  ✓ logo: ${LOGO_PATH}`)

  console.log(`\n✅ 完成：5 组 TabBar 图标（81x81）+ 1 个小程序头像（512x512）`)
}

main().catch((e) => { console.error(e); process.exit(1) })
