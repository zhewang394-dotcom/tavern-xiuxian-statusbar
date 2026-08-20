import { StoreDefinition } from 'pinia';

export function defineMvuDataStore<T extends z.ZodObject>(
  schema: T,
  variable_option: VariableOption,
  additional_setup?: (data: Ref<z.infer<T>>) => void,
): StoreDefinition<`mvu_data.${string}`, { data: Ref<z.infer<T>> }> {
  if (
    variable_option.type === 'message' &&
    (variable_option.message_id === undefined || variable_option.message_id === 'latest')
  ) {
    variable_option.message_id = -1;
  }

  return defineStore(
    `mvu_data.${_(variable_option)
      .entries()
      .sortBy(entry => entry[0])
      .map(entry => entry[1])
      .join('.')}`,
    errorCatched(() => {
      const data = ref(
        schema.parse(_.get(getVariables(variable_option), 'stat_data', {}), { reportInput: true }),
      ) as Ref<z.infer<T>>;
      if (additional_setup) {
        additional_setup(data);
      }

      // 上一次处理过的原始 stat_data 快照，用作轮询的廉价挡板（见下）。
      let last_seen_stat_data: unknown = undefined;

      useIntervalFn(() => {
        const variables = getVariables(variable_option);
        // 楼层还没有真实 stat_data 时（如聊天刚加载、变量尚未就位）跳过：既不同步也不写回，
        // 避免用 schema 默认值覆盖尚未加载/位于别处的真存档。
        if (!_.has(variables, 'stat_data')) {
          return;
        }
        const stat_data = _.get(variables, 'stat_data', {});
        // 廉价挡板：原始 stat_data 和上次一模一样就直接返回。
        // 绝大多数 tick 都走这条路径（变量只在 AI 回复/玩家改动时才变，其余时间恒定不变）。
        // 挡板之后的 schema.safeParse() 会把整棵 stat_data 深拷贝一份新对象出来
        // （schema 里大量 .transform() / .prefault()），空转时每 2 秒扔一份垃圾给 GC；
        // 而 isEqual 只读不分配。这一行把空转开销从"持续制造垃圾"降到零。
        if (_.isEqual(last_seen_stat_data, stat_data)) {
          return;
        }
        last_seen_stat_data = _.cloneDeep(stat_data);
        const result = schema.safeParse(stat_data);
        if (result.error) {
          return;
        }
        if (!_.isEqual(data.value, result.data)) {
          ignoreUpdates(() => {
            data.value = result.data;
          });
          if (!_.isEqual(stat_data, result.data)) {
            updateVariablesWith(variables => _.set(variables, 'stat_data', result.data), variable_option);
          }
        }
      }, 2000);

      const { ignoreUpdates } = watchIgnorable(
        data,
        new_data => {
          const result = schema.safeParse(new_data);
          if (result.error) {
            return;
          }
          if (!_.isEqual(new_data, result.data)) {
            ignoreUpdates(() => {
              data.value = result.data;
            });
          }
          // 关键护栏：楼层当前没有 stat_data 时绝不写回。
          // 前端只应“修改已有存档”，绝不该用 schema 默认值去“初始化”一个楼层的变量——
          // 否则在聊天加载竞态下（读到空/残缺 → 被 prefault 补成默认）会把默认值写回、覆盖真存档
          // （灵根/体质/物品被清成默认的“状态栏清空”根因）。
          if (!_.has(getVariables(variable_option), 'stat_data')) {
            return;
          }
          updateVariablesWith(variables => _.set(variables, 'stat_data', result.data), variable_option);
        },
        { deep: true },
      );

      return { data };
    }),
  );
}
