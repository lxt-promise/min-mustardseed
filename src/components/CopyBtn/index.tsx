import { View, Text } from '@tarojs/components'
import { copyText } from '@/utils/clipboard'

/** 公共复制按钮（从网页版 Quiz.tsx 提出，各页复用）。block=true 时为全宽大按钮 */
const CopyBtn: React.FC<{ text: string; label?: string; block?: boolean }> = ({ text, label = '复制', block }) => (
  <View
    hoverClass="view-press"
    hoverStayTime="80"
    className={
      block
        ? 'w-full py-3 flex items-center justify-center rounded-2xl bg-mint-600 shadow-soft'
        : 'inline-flex items-center px-3 py-1.5 rounded-full bg-gradient-to-r from-mint-500 to-mint-600 shadow-soft'
    }
    onClick={() => copyText(text, block ? '已复制，发给朋友吧～' : '已复制到剪贴板')}
  >
    <Text className={block ? 'text-sm font-semibold text-white' : 'text-xs font-medium text-white'}>
      📋 {block ? '一键复制结果' : label}
    </Text>
  </View>
)

export default CopyBtn
