/**
 * SVG 转 PNG 预览图
 * 依赖：npm install sharp
 */
const fs = require('fs')
const path = require('path')

let sharp
try {
  sharp = require('sharp')
} catch (e) {
  console.log('sharp not available, SVG will be used directly')
  console.log('Run: npm install sharp')
  process.exit(0)
}

const SVG_PATH = path.join(__dirname, '..', 'src', 'assets', 'preview', 'pages-overview.svg')
const OUT_PATH = path.join(__dirname, '..', 'src', 'assets', 'preview', 'pages-overview.png')

const svg = fs.readFileSync(SVG_PATH)

sharp(svg)
  .resize(1400, 960)
  .png({ quality: 90 })
  .toFile(OUT_PATH)
  .then(() => {
    console.log(`✅ 生成了预览图：${OUT_PATH}`)
  })
  .catch(err => {
    console.error('Error:', err)
  })
