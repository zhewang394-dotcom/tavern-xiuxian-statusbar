import { defineMvuDataStore } from '@util/mvu';
import { CultivationStatusSchema } from './schema';

// message_id 用 'latest' (内部转为 -1)：始终读写最新楼层。
// 这样:
//   1. 引擎写的 传闻 总落在 AI 下一轮 prompt 实际会读的那一楼
//   2. 玩家无论从哪一楼打开 修仙状态栏，看到的都是当前最新状态
//   3. 避免 iframe 嵌在 floor X 时引擎写到 X，但玩家在 X+1 求 AI 时看不到
export const useDataStore = defineMvuDataStore(CultivationStatusSchema, {
  type: 'message',
  message_id: 'latest',
});
