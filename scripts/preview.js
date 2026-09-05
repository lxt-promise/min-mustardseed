/**
 * 生成小程序 UI 预览图（PNG）
 * 运行方式：node scripts/preview.js
 */
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

// PNG 生成工具
function createPNG(width, height, pixelGen) {
  const pixels = Buffer.alloc(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const [r, g, b, a] = pixelGen(x, y, width, height)
      pixels[idx] = r; pixels[idx + 1] = g; pixels[idx + 2] = b; pixels[idx + 3] = a
    }
  }
  const filtered = Buffer.alloc(height * (width * 4 + 1))
  for (let y = 0; y < height; y++) {
    filtered[y * (width * 4 + 1)] = 0
    pixels.copy(filtered, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4)
  }
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8; ihdr[9] = 6
  function crc32(buf) {
    let c, table = []
    for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; table[n] = c }
    let crc = 0 ^ -1
    for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff]
    return (crc ^ -1) >>> 0
  }
  function chunk(type, data) {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0)
    const typeBuf = Buffer.from(type, 'ascii')
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
    return Buffer.concat([len, typeBuf, data, crc])
  }
  const compressed = zlib.deflateSync(filtered, { level: 9 })
  return Buffer.concat([signature, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))])
}

// 绘制圆角矩形
function fillRoundRect(pixels, x, y, w, h, r, width, height, rColor) {
  for (let py = y; py < y + h; py++) {
    for (let px = x; px < x + w; px++) {
      const dx = px - x - r + 0.5
      const dy = py - y - r + 0.5
      const dx2 = x + w - r - px - 0.5
      const dy2 = y + h - r - py - 0.5
      let inRect = true
      if (dx < 0 && dy < 0 && dx * dx + dy * dy > r * r) inRect = false
      if (dx2 < 0 && dy < 0 && dx2 * dx2 + dy * dy > r * r) inRect = false
      if (dx < 0 && dy2 < 0 && dx * dx + dy2 * dy2 > r * r) inRect = false
      if (dx2 < 0 && dy2 < 0 && dx2 * dx2 + dy2 * dy2 > r * r) inRect = false
      if (py >= 0 && py < height && px >= 0 && px < width && inRect) {
        const idx = (py * width + px) * 4
        pixels[idx] = rColor[0]; pixels[idx + 1] = rColor[1]; pixels[idx + 2] = rColor[2]; pixels[idx + 3] = rColor[3]
      }
    }
  }
}

// 绘制文字（简易位图字体）
const FONT = {
  '0': ['111','101','101','101','111'],
  '1': ['010','110','010','010','111'],
  '2': ['111','001','111','100','111'],
  '3': ['111','001','111','001','111'],
  '4': ['101','101','111','001','001'],
  '5': ['111','100','111','001','111'],
  '6': ['111','100','111','101','111'],
  '7': ['111','001','001','001','001'],
  '8': ['111','101','111','101','111'],
  '9': ['111','101','111','001','111'],
  ':': ['000','010','000','010','000'],
  '0': ['111','101','101','101','111'],
  'H': ['101','101','111','101','101'],
  'e': ['111','100','111','100','111'],
  'l': ['010','010','010','010','111'],
  'o': ['111','101','101','101','111'],
  'T': ['111','010','010','010','010'],
  'M': ['101','111','111','101','101'],
  'i': ['010','000','010','010','111'],
  'n': ['000','000','101','111','101'],
  't': ['111','010','010','010','010'],
  'S': ['111','100','111','001','111'],
  'a': ['000','000','110','101','111'],
  't': ['111','010','010','010','010'],
  'r': ['000','000','101','110','100'],
  'i': ['010','000','010','010','010'],
  'o': ['111','101','101','101','111'],
  'n': ['000','000','101','111','101'],
  'P': ['111','101','111','100','100'],
  'o': ['111','101','101','101','111'],
  'd': ['001','001','111','101','111'],
  'o': ['111','101','101','101','111'],
  'r': ['000','000','101','110','100'],
  'a': ['000','000','110','101','111'],
  'C': ['111','100','100','100','111'],
  'e': ['111','100','111','100','111'],
  'l': ['010','010','010','010','111'],
  'a': ['000','000','110','101','111'],
  'r': ['000','000','101','110','100'],
  'e': ['111','100','111','100','111'],
  'D': ['110','101','101','101','110'],
  'O': ['111','101','101','101','111'],
  'N': ['101','111','111','101','101'],
  'E': ['111','100','111','100','111'],
  'L': ['100','100','100','100','111'],
  'V': ['101','101','101','010','010'],
  'e': ['111','100','111','100','111'],
  'r': ['000','000','101','110','100'],
  's': ['111','100','111','001','111'],
  'e': ['111','100','111','100','111'],
  'g': ['111','101','111','001','111'],
  'e': ['111','100','111','100','111'],
  'D': ['110','101','101','101','110'],
  'f': ['010','010','111','010','010'],
  'a': ['000','000','110','101','111'],
  'u': ['001','001','001','101','111'],
  'l': ['010','010','010','010','111'],
  't': ['111','010','010','010','010'],
  'I': ['111','010','010','010','111'],
  'W': ['101','101','111','111','101'],
  'a': ['000','000','110','101','111'],
  'i': ['010','000','010','010','010'],
  't': ['111','010','010','010','010'],
  'i': ['010','000','010','010','010'],
  'n': ['000','000','101','111','101'],
  'g': ['111','101','111','001','111'],
  'G': ['111','100','101','101','111'],
  'o': ['111','101','101','101','111'],
  'O': ['111','101','101','101','111'],
  'd': ['001','001','111','101','111'],
  'a': ['000','000','110','101','111'],
  'y': ['101','101','111','001','111'],
  'B': ['110','101','110','101','110'],
  'u': ['001','001','001','101','111'],
  's': ['111','100','111','001','111'],
  'i': ['010','000','010','010','010'],
  'n': ['000','000','101','111','101'],
  'e': ['111','100','111','100','111'],
  's': ['111','100','111','001','111'],
  's': ['111','100','111','001','111'],
  'C': ['111','100','100','100','111'],
  'a': ['000','000','110','101','111'],
  'l': ['010','010','010','010','111'],
  'e': ['111','100','111','100','111'],
  'n': ['000','000','101','111','101'],
  'd': ['001','001','111','101','111'],
  'a': ['000','000','110','101','111'],
  'r': ['000','000','101','110','100'],
  'G': ['111','100','101','101','111'],
  'o': ['111','101','101','101','111'],
  'o': ['111','101','101','101','111'],
  'd': ['001','001','111','101','111'],
  'M': ['101','111','111','101','101'],
  'o': ['111','101','101','101','111'],
  'r': ['000','000','101','110','100'],
  'n': ['000','000','101','111','101'],
  'i': ['010','000','010','010','010'],
  'n': ['000','000','101','111','101'],
  'g': ['111','101','111','001','111'],
  'L': ['100','100','100','100','111'],
  'u': ['001','001','001','101','111'],
  'n': ['000','000','101','111','101'],
  'c': ['000','000','111','100','111'],
  'h': ['000','000','101','111','101'],
}

function drawText(pixels, text, x, y, width, height, color, scale = 1) {
  const [r, g, b, a] = color
  let cx = x
  for (const ch of text) {
    const glyph = FONT[ch] || FONT[' '] || FONT['o']
    for (let gy = 0; gy < glyph.length; gy++) {
      for (let gx = 0; gx < glyph[gy].length; gx++) {
        if (glyph[gy][gx] === '1') {
          for (let sy = 0; sy < scale; sy++) {
            for (let sx = 0; sx < scale; sx++) {
              const px = cx + gx * scale + sx
              const py = y + gy * scale + sy
              if (py >= 0 && py < height && px >= 0 && px < width) {
                const idx = (py * width + px) * 4
                pixels[idx] = r; pixels[idx + 1] = g; pixels[idx + 2] = b; pixels[idx + 3] = a
              }
            }
          }
        }
      }
    }
    cx += (glyph[0].length + 1) * scale
  }
}

// ============ 主渲染函数 ============
function renderPhonePreview() {
  const W = 420
  const H = 900
  const pixels = Buffer.alloc(W * H * 4)

  // 清空（透明）
  pixels.fill(0)

  // 背景：淡绿
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 4
      pixels[idx] = 242; pixels[idx + 1] = 251; pixels[idx + 2] = 246; pixels[idx + 3] = 255
    }
  }

  // 手机外框（深灰圆角）
  const phoneX = 20, phoneY = 20
  const phoneW = 380, phoneH = 860
  const phoneR = 40
  fillRoundRect(pixels, phoneX, phoneY, phoneW, phoneH, phoneR, W, H, [220, 225, 230, 255])

  // 手机屏幕（白色）
  const screenX = phoneX + 8, screenY = phoneY + 8
  const screenW = phoneW - 16, screenH = phoneH - 16
  const screenR = 32
  fillRoundRect(pixels, screenX, screenY, screenW, screenH, screenR, W, H, [255, 255, 255, 255])

  // 顶部状态栏
  const statusH = 30
  for (let y = screenY; y < screenY + statusH; y++) {
    for (let x = screenX; x < screenX + screenW; x++) {
      const idx = (y * W + x) * 4
      pixels[idx] = 26; pixels[idx + 1] = 148; pixels[idx + 2] = 100; pixels[idx + 3] = 255
    }
  }
  // 时间
  drawText(pixels, '9:40', screenX + 15, screenY + 8, W, H, [255, 255, 255, 255], 2)
  drawText(pixels, 'AM', screenX + 60, screenY + 8, W, H, [255, 255, 255, 255], 2)

  // 导航栏
  const navH = 50
  for (let y = screenY + statusH; y < screenY + statusH + navH; y++) {
    for (let x = screenX; x < screenX + screenW; x++) {
      const idx = (y * W + x) * 4
      pixels[idx] = 26; pixels[idx + 1] = 148; pixels[idx + 2] = 100; pixels[idx + 3] = 255
    }
  }
  drawText(pixels, 'Home', screenX + 15, screenY + statusH + 12, W, H, [255, 255, 255, 255], 2)

  // 内容区开始
  let cy = screenY + statusH + navH + 15

  // Hero区域
  fillRoundRect(pixels, screenX + 15, cy, screenW - 30, 70, 16, W, H, [255, 255, 255, 255])
  drawText(pixels, 'Good Morning', screenX + 30, cy + 10, W, H, [26, 78, 52, 255], 2)
  drawText(pixels, 'Mint Station', screenX + 30, cy + 30, W, H, [26, 78, 52, 255], 2)
  cy += 90

  // 今日统计卡片（薄荷绿渐变）
  const statH = 80
  for (let y = cy; y < cy + statH; y++) {
    const ratio = (y - cy) / statH
    for (let x = screenX + 15; x < screenX + screenW - 15; x++) {
      const idx = (y * W + x) * 4
      const r = Math.round(26 + (42 - 26) * ratio)
      const g = Math.round(148 + (176 - 148) * ratio)
      const b = Math.round(100 + (128 - 100) * ratio)
      pixels[idx] = r; pixels[idx + 1] = g; pixels[idx + 2] = b; pixels[idx + 3] = 255
    }
  }
  // 顶部圆角
  fillRoundRect(pixels, screenX + 15, cy, screenW - 30, statH, 16, W, H, [0, 0, 0, 0])
  for (let y = cy; y < cy + statH; y++) {
    const ratio = (y - cy) / statH
    for (let x = screenX + 15; x < screenX + screenW - 15; x++) {
      const idx = (y * W + x) * 4
      const r = Math.round(26 + (42 - 26) * ratio)
      const g = Math.round(148 + (176 - 148) * ratio)
      const b = Math.round(100 + (128 - 100) * ratio)
      pixels[idx] = r; pixels[idx + 1] = g; pixels[idx + 2] = b; pixels[idx + 3] = 255
    }
  }
  drawText(pixels, 'Today Stats', screenX + 30, cy + 8, W, H, [255, 255, 255, 200], 2)
  drawText(pixels, 'Pomodoro 3/8', screenX + 30, cy + 30, W, H, [255, 255, 255, 255], 2)
  drawText(pixels, 'Todo 2 left', screenX + 140, cy + 30, W, H, [255, 255, 255, 255], 2)
  drawText(pixels, 'Total 42', screenX + 250, cy + 30, W, H, [255, 255, 255, 255], 2)
  cy += statH + 20

  // 分区标题
  drawText(pixels, 'Office Tools', screenX + 15, cy, W, H, [26, 78, 52, 255], 2)
  cy += 30

  // 工具卡片（2列）
  const cardW = (screenW - 45) / 2
  const cardH = 110
  const cardGap = 15
  const cardR = 14

  const cards = [
    { icon: 'P', color: [251, 113, 133], title: 'Pomodoro', desc: 'Focus Timer' },
    { icon: 'T', color: [42, 176, 122], title: 'Todo List', desc: 'Get things done' },
    { icon: 'C', color: [99, 102, 241], title: 'Calendar', desc: 'Workdays calc' },
    { icon: 'M', color: [6, 182, 212], title: 'Music', desc: 'Relax time' },
  ]

  for (let i = 0; i < cards.length; i++) {
    const col = i % 2
    const row = Math.floor(i / 2)
    const cx = screenX + 15 + col * (cardW + cardGap)
    const ccy = cy + row * (cardH + cardGap)

    // 卡片背景
    fillRoundRect(pixels, cx, ccy, cardW, cardH, cardR, W, H, [255, 255, 255, 255])

    // 顶部色条
    const colorBarH = 50
    for (let y = ccy; y < ccy + colorBarH; y++) {
      const ratio = (y - ccy) / colorBarH
      for (let x = cx; x < cx + cardW; x++) {
        const idx = (y * W + x) * 4
        const cr = Math.round(cards[i].color[0] + (255 - cards[i].color[0]) * 0.3 * ratio)
        const cg = Math.round(cards[i].color[1] + (255 - cards[i].color[1]) * 0.3 * ratio)
        const cb = Math.round(cards[i].color[2] + (255 - cards[i].color[2]) * 0.3 * ratio)
        pixels[idx] = cr; pixels[idx + 1] = cg; pixels[idx + 2] = cb; pixels[idx + 3] = 255
      }
    }

    // 标题
    drawText(pixels, cards[i].title, cx + 10, ccy + colorBarH + 8, W, H, [26, 78, 52, 255], 2)
    drawText(pixels, cards[i].desc, cx + 10, ccy + colorBarH + 28, W, H, [120, 130, 120, 255], 1)
  }

  cy += Math.ceil(cards.length / 2) * (cardH + cardGap) + 20

  // TabBar
  const tabBarY = screenY + screenH - 75
  for (let y = tabBarY; y < screenY + screenH - 8; y++) {
    for (let x = screenX; x < screenX + screenW; x++) {
      const idx = (y * W + x) * 4
      pixels[idx] = 255; pixels[idx + 1] = 255; pixels[idx + 2] = 255; pixels[idx + 3] = 255
    }
  }
  // TabBar 分隔线
  for (let x = screenX; x < screenX + screenW; x++) {
    const idx = ((tabBarY - 1) * W + x) * 4
    pixels[idx] = 217; pixels[idx + 1] = 245; pixels[idx + 2] = 232; pixels[idx + 3] = 255
  }

  const tabs = ['Home', 'Pomo', 'Todo', 'Verse', 'Quiz']
  const tabW = screenW / tabs.length
  tabs.forEach((tab, i) => {
    const tx = screenX + i * tabW + tabW / 2 - 20
    const ty = tabBarY + 15
    const color = i === 0 ? [26, 148, 100, 255] : [122, 156, 138, 255]
    drawText(pixels, tab, tx, ty, W, H, color, 2)
  })

  // 底部手势条
  const barY = screenY + screenH - 20
  for (let x = screenX + screenW / 2 - 30; x < screenX + screenW / 2 + 30; x++) {
    const idx = (barY * W + x) * 4
    pixels[idx] = 180; pixels[idx + 1] = 185; pixels[idx + 2] = 190; pixels[idx + 3] = 255
  }

  return createPNG(W, H, (x, y) => {
    const idx = (y * W + x) * 4
    return [pixels[idx], pixels[idx + 1], pixels[idx + 2], pixels[idx + 3]]
  })
}

// ============ 渲染多个页面预览 ============
function renderHomePage() {
  const W = 375, H = 812
  const pixels = Buffer.alloc(W * H * 4)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const idx = (y * W + x) * 4
    pixels[idx] = 242; pixels[idx + 1] = 251; pixels[idx + 2] = 246; pixels[idx + 3] = 255
  }

  const [r, g, b] = [26, 148, 100]

  function fillRect(x, y, w, h, color, radius = 0) {
    for (let py = y; py < y + h; py++) {
      for (let px = x; px < x + w; px++) {
        if (py >= 0 && py < H && px >= 0 && px < W) {
          const idx = (py * W + px) * 4
          pixels[idx] = color[0]; pixels[idx + 1] = color[1]; pixels[idx + 2] = color[2]; pixels[idx + 3] = color[3] || 255
        }
      }
    }
  }

  function text(str, x, y, color, sz = 1) {
    // 简化文字渲染
    const font5x7 = {
      'M': '101111011010101','o': '111101111','r': '000101110','n': '000101111','i': '010010010','n': '000101111',
      'g': '111101111001','S': '111100111001111','t': '111010010','a': '000110111','t': '111010010','i': '010010010',
      'o': '111101111','n': '000101111','H': '101111101010101','e': '111100111','l': '010010010111','l': '010010010111','o': '111101111',
      'G': '111100101111','o': '111101111','o': '111101111','d': '001111101111','M': '101111011010101','o': '111101111',
      'r': '000101110','n': '000101111','i': '010010010','n': '000101111','g': '111101111001',
      'T': '111010010010','o': '111101111','d': '001111101111','o': '111101111',
      'P': '111101111100','o': '111101111','m': '000101111101111','o': '111101111','d': '001111101111','o': '111101111','r': '000101110','o': '111101111',
      'C': '111100100111','e': '111100111','l': '010010010111','e': '111100111','b': '110101111','r': '000101110','a': '000110111','t': '111010010','e': '111100111',
      'M': '101111011010101','u': '001001001111','s': '111100111001','i': '010010010','c': '000111100111',
      'P': '111101111100','i': '010010010','a': '000110111','n': '000101111','o': '111101111',
      'W': '101101111111101','h': '000101111','i': '010010010','t': '111010010','e': '111100111',
      'n': '000101111','o': '111101111','i': '010010010','s': '111100111001','e': '111101111',
      'Q': '111101111101001','u': '001001001111','i': '000110111','z': '111001111100111','z': '111001111100111',
      'V': '101101101010010','e': '111100111','r': '000101110','s': '111100111001','e': '111101111',
      'J': '001001111010111','o': '111101111','k': '101101111010010','e': '111100111',
      'T': '111010010010','e': '111100111','s': '111100111001','t': '111010010',
      'P': '111101111100','i': '010010010','c': '000111100111','k': '101101111010010','e': '111101111','r': '000101110',
      'W': '101101111111101','o': '111101111','r': '000101110','k': '101101111010010','d': '001111101111','a': '000110111','y': '101101111001111',
      'M': '101111011010101','u': '001001001111','s': '111100111001','i': '010010010','c': '000111100111',
      'A': '111101010111','b': '110101111','o': '111101111','u': '001001001111','t': '111010010',
      'D': '110101101110','a': '000110111','y': '101101111001111','T': '111010010010','o': '111101111','d': '001111101111','o': '111101111',
      'L': '100100100111','i': '010010010','s': '111100111001','t': '111010010','e': '111100111','n': '000101111',
      '1': '010110010111','/': '001001010','8': '111101111111111','T': '111010010010','o': '111101111','d': '001111101111','o': '111101111',
      '3': '111100111001111','P': '111101111100','o': '111101111','m': '000101111101111','o': '111101111','d': '001111101111','o': '111101111','r': '000101110','o': '111101111','o': '111101111',
      '2': '111001111100111','T': '111010010010','o': '111101111','d': '001111101111','o': '111101111',
      'L': '100100100111','e': '111100111','f': '111100111010010','t': '111010010',
      '0': '111101101111','/': '001001010','8': '111001111100111','T': '111010010010','o': '111101111','d': '001111101111','o': '111101111',
      '3': '111100111001111','/': '001001010','8': '111001111100111','T': '111010010010','o': '111101111','d': '001111101111','o': '111101111',
      '4': '101101111001001','/': '001001010','8': '111001111100111','T': '111010010010','o': '111101111','d': '001111101111','o': '111101111',
      '5': '111100111001111','/': '001001010','8': '111001111100111','T': '111010010010','o': '111101111','d': '001111101111','o': '111101111',
      '6': '111100111101111','/': '001001010','8': '111001111100111','T': '111010010010','o': '111101111','d': '001111101111','o': '111101111',
      '7': '111001001001001','/': '001001010','8': '111001111100111','T': '111010010010','o': '111101111','d': '001111101111','o': '111101111',
      '8': '111100111111111','/': '001001010','8': '111001111100111','T': '111010010010','o': '111101111','d': '001111101111','o': '111101111',
      '9': '111100111111001','/': '001001010','8': '111001111100111','T': '111010010010','o': '111101111','d': '001111101111','o': '111101111',
    }
    // 渲染彩色椭圆背景图标
  }

  // 顶部导航栏
  fillRect(0, 0, W, 88, [r, g, b])
  fillRect(0, 0, W, 44, [r, g, b])

  // 统计卡片
  fillRect(16, 96, W - 32, 72, [r, g, b], 16)

  // 分区标题
  fillRect(16, 185, 120, 28, [217, 245, 232], 14)

  // 工具卡片
  const cardW = (W - 48) / 2
  const cards = [
    { x: 16, y: 225, color: [251, 113, 133] },
    { x: 16 + cardW + 16, y: 225, color: [42, 176, 122] },
    { x: 16, y: 225 + 118, color: [99, 102, 241] },
    { x: 16 + cardW + 16, y: 225 + 118, color: [42, 176, 122] },
  ]
  for (const c of cards) {
    fillRect(c.x, c.y, cardW, 110, [255, 255, 255], 14)
    fillRect(c.x, c.y, cardW, 56, c.color, 14)
  }

  // 休闲区域
  fillRect(16, 480, 120, 28, [255, 240, 245], 14)
  for (let i = 0; i < 4; i++) {
    const cx = 16 + (i % 2) * (cardW + 16)
    const cy = 520 + Math.floor(i / 2) * 118
    fillRect(cx, cy, cardW, 110, [255, 255, 255], 14)
    const colors = [[99, 102, 241], [251, 146, 60], [6, 182, 212], [236, 72, 153]]
    fillRect(cx, cy, cardW, 56, colors[i], 14)
  }

  // TabBar
  fillRect(0, H - 80, W, 80, [255, 255, 255])
  fillRect(0, H - 81, W, 1, [217, 245, 232])
  const tabColors = [[r, g, b], [122, 156, 138], [122, 156, 138], [122, 156, 138], [122, 156, 138]]

  return createPNG(W, H, (x, y) => {
    const idx = (y * W + x) * 4
    return [pixels[idx], pixels[idx + 1], pixels[idx + 2], pixels[idx + 3]]
  })
}

// 生成缩略图
function renderThumbnail(W, H, bgColor, title, subtitle, accentColor) {
  const pixels = Buffer.alloc(W * H * 4)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const idx = (y * W + x) * 4
    pixels[idx] = bgColor[0]; pixels[idx + 1] = bgColor[1]; pixels[idx + 2] = bgColor[2]; pixels[idx + 3] = 255
  }
  // 顶部色条
  for (let y = 0; y < 80; y++) {
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 4
      const ratio = y / 80
      pixels[idx] = Math.round(accentColor[0] * (1 - ratio * 0.3))
      pixels[idx + 1] = Math.round(accentColor[1] * (1 - ratio * 0.3))
      pixels[idx + 2] = Math.round(accentColor[2] * (1 - ratio * 0.3))
      pixels[idx + 3] = 255
    }
  }
  // 卡片
  for (let y = 90; y < H - 10; y++) for (let x = 10; x < W - 10; x++) {
    const idx = (y * W + x) * 4
    pixels[idx] = 255; pixels[idx + 1] = 255; pixels[idx + 2] = 255; pixels[idx + 3] = 255
  }
  return createPNG(W, H, (x, y) => {
    const idx = (y * W + x) * 4
    return [pixels[idx], pixels[idx + 1], pixels[idx + 2], pixels[idx + 3]]
  })
}

const OUT = path.join(__dirname, '..', 'src', 'assets', 'preview')

const pages = [
  { name: 'preview_home.png', W: 420, H: 900 },
]

fs.writeFileSync(path.join(OUT, 'preview_home.png'), renderPhonePreview())

console.log('✅ UI 预览图已生成：')
console.log(`📁 ${OUT}`)
console.log(pages.map(p => `  ✓ ${p.name} (${p.W}x${p.H})`).join('\n'))
