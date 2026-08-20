import App from './App.vue';
import './global.css';
import './styles.css';
import './mobile-layout.css';

let initialized = false;

// 轮询等待最新楼层的 MVU stat_data 就位（最多 ~8s）再挂载。
// 目的：避免在存档尚未加载完成时就用 schema 默认值渲染/写回而覆盖真存档。
// 超时也照常挂载——util/mvu.ts 的“无 stat_data 不写回”护栏兜底，
// 即便此刻读到空值也绝不会把默认值写回。
async function waitStatData(timeoutMs = 8000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (_.has(getVariables({ type: 'message', message_id: -1 }), 'stat_data')) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

$(async () => {
  if (initialized) return;
  initialized = true;

  await waitGlobalInitialized('Mvu');
  await waitStatData();

  // 数据就位后再挂载，store 读到的即为真存档
  createApp(App).use(createPinia()).mount('#app');
});
