<template>
  <div v-if="store.data" class="xy-app" :class="state.layoutMode === 'mobile' ? 'xy-layout-mobile' : 'xy-layout-pc'">
    <!-- 装饰背景：远山 + 仙鹤 + 印章 -->
    <div class="xy-bg" aria-hidden="true">
      <svg class="xy-bg-mountain" viewBox="0 0 1200 240" preserveAspectRatio="none">
        <defs>
          <linearGradient id="mtGrad" x1="0" y1="0" x2="0" y2="1">
            <stop class="xy-mt-stop-1" offset="0%" />
            <stop class="xy-mt-stop-2" offset="100%" />
          </linearGradient>
          <linearGradient id="mtGrad2" x1="0" y1="0" x2="0" y2="1">
            <stop class="xy-mt-stop-3" offset="0%" />
            <stop class="xy-mt-stop-4" offset="100%" />
          </linearGradient>
        </defs>
        <path
          d="M0,200 Q120,80 220,140 T420,120 T620,160 T840,100 T1060,150 T1200,130 L1200,240 L0,240 Z"
          fill="url(#mtGrad)"
        />
        <path
          d="M0,220 Q150,150 280,200 T520,180 T780,210 T1020,170 T1200,200 L1200,240 L0,240 Z"
          fill="url(#mtGrad2)"
        />
      </svg>
      <svg class="xy-crane xy-crane-1" viewBox="0 0 80 60">
        <path
          class="xy-crane-body"
          d="M5,40 Q15,28 28,30 Q34,22 42,26 Q50,20 56,28 Q62,26 70,32 Q66,38 58,38 Q52,44 44,42 Q38,48 30,44 Q22,48 14,44 Q8,46 5,40 Z"
        />
        <circle cx="62" cy="29" r="1.2" fill="#b13a3a" />
        <path class="xy-crane-tail" d="M64,28 L72,24" stroke-width="1" fill="none" />
      </svg>
      <svg class="xy-crane xy-crane-2" viewBox="0 0 80 60">
        <path
          class="xy-crane-body xy-crane-body--soft"
          d="M5,40 Q15,28 28,30 Q34,22 42,26 Q50,20 56,28 Q62,26 70,32 Q66,38 58,38 Q52,44 44,42 Q38,48 30,44 Q22,48 14,44 Q8,46 5,40 Z"
        />
      </svg>
    </div>

    <!-- 主体卷轴 -->
    <div class="xy-scroll" :class="{ 'xy-scroll-collapsed': state.appCollapsed }">
      <!-- ============ 总折叠条（始终可见） ============ -->
      <div class="xy-app-collapse-bar">
        <button
          v-if="!state.appCollapsed"
          type="button"
          class="xy-edit-toggle"
          :class="{ active: state.editMode }"
          :title="state.editMode ? '关闭编辑模式' : '允许编辑数据'"
          @click="state.editMode = !state.editMode"
        >
          <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true">
            <path
              d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
            />
          </svg>
          <span>{{ state.editMode ? '编辑中' : '编辑' }}</span>
        </button>
        <button
          v-if="!state.appCollapsed"
          type="button"
          class="xy-summary-btn"
          title="打开总结助手"
          @click="openSummary"
        >
          <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true">
            <path d="M4 5h16v2H4V5zm0 4h16v2H4V9zm0 4h10v2H4v-2zm0 4h16v2H4v-2z" />
          </svg>
          <span>总结</span>
        </button>
        <button
          v-if="!state.appCollapsed"
          type="button"
          class="xy-settings-btn"
          title="打开设置"
          @click="state.settingsOpen = true"
        >
          <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true">
            <path
              d="M19.14 12.94a7.5 7.5 0 0 0 .05-.94 7.5 7.5 0 0 0-.05-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.61-.22l-2.39.96a7 7 0 0 0-1.62-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54a7 7 0 0 0-1.62.94l-2.39-.96a.5.5 0 0 0-.61.22L2.29 8.2a.5.5 0 0 0 .12.64l2.03 1.58a7.5 7.5 0 0 0 0 1.88l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .61.22l2.39-.96a7 7 0 0 0 1.62.94l.36 2.54a.5.5 0 0 0 .5.42h3.84a.5.5 0 0 0 .5-.42l.36-2.54a7 7 0 0 0 1.62-.94l2.39.96a.5.5 0 0 0 .61-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z"
            />
          </svg>
          <span>设置</span>
        </button>
        <span v-if="state.appCollapsed" class="xy-app-collapse-tag">
          {{ store.data.姓名 }} · {{ store.data.修炼进度.境界 }}
        </span>
        <button
          type="button"
          class="xy-app-collapse-btn"
          :title="state.appCollapsed ? '展开状态栏' : '收起状态栏'"
          @click="state.appCollapsed = !state.appCollapsed"
        >
          <span class="xy-app-collapse-caret">{{ state.appCollapsed ? '▸' : '▾' }}</span>
          <span class="xy-app-collapse-label">{{ state.appCollapsed ? '展开' : '收起' }}</span>
        </button>
      </div>

      <div v-show="!state.appCollapsed" class="xy-app-body">
        <!-- ============ 头部 · 道号 / 境界 / 资源 ============ -->
        <header class="xy-hero">
          <div class="xy-hero-top">
            <div class="xy-name-block">
              <div
                class="xy-user-avatar"
                :class="{ 'has-img': getNpcAvatar(USER_AVATAR_KEY) }"
                @click="onAvatarClick(USER_AVATAR_KEY, $event)"
              >
                <img
                  v-if="getNpcAvatar(USER_AVATAR_KEY)"
                  :src="getNpcAvatar(USER_AVATAR_KEY)"
                  :alt="store.data.姓名"
                  class="xy-user-avatar-img"
                />
                <span v-else class="xy-user-avatar-char">{{ avatarChar(store.data.姓名) }}</span>
                <button
                  type="button"
                  class="xy-user-avatar-cam"
                  :title="getNpcAvatar(USER_AVATAR_KEY) ? '更换头像（右键清除）' : '上传头像'"
                  @click.stop="triggerAvatarUpload(USER_AVATAR_KEY)"
                  @contextmenu.prevent.stop="getNpcAvatar(USER_AVATAR_KEY) && clearNpcAvatar(USER_AVATAR_KEY)"
                >
                  <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true">
                    <path
                      d="M9.5 4l-1.7 2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3.8L14.5 4h-5zm2.5 4a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"
                    />
                  </svg>
                </button>
              </div>
              <div class="xy-name-meta">
                <h1 class="xy-name">{{ store.data.姓名 }}</h1>
                <div class="xy-realm">
                  <span class="xy-realm-label">境界</span>
                  <span class="xy-realm-value">{{ store.data.修炼进度.境界 }}</span>
                  <span v-if="store.data.修炼进度.天谴 > 0 || state.editMode" class="xy-tianqian">
                    天谴 <EditableValue v-model.number="store.data.修炼进度.天谴" type="number" label="天谴" :min="0" />
                  </span>
                  <span v-if="store.data.修炼进度.丹毒 > 0 || state.editMode" class="xy-dandu">
                    丹毒 <EditableValue v-model.number="store.data.修炼进度.丹毒" type="number" label="丹毒" :min="0" />
                  </span>
                </div>
              </div>
            </div>
            <div class="xy-meta-line">
              <span class="xy-meta-item"><i>种</i><EditableValue v-model="store.data.种族" label="种族" /></span>
              <span class="xy-meta-item">
                <i>寿</i><EditableValue v-model.number="store.data.寿元.年龄" type="number" label="年龄" :min="0" /> /
                <EditableValue v-model.number="store.data.寿元.寿命" type="number" label="寿命" :min="1" />
              </span>
              <span class="xy-meta-item">
                <i>貌</i
                ><EditableValue v-model.number="store.data.寿元.外观年龄" type="number" label="外观年龄" :min="0" />
              </span>
              <span class="xy-meta-item xy-time">
                <i>时</i>
                <EditableValue v-model.number="store.data.时间.年" type="number" label="年" /> 年
                <EditableValue v-model.number="store.data.时间.月" type="number" label="月" :min="1" :max="12" /> 月
                <EditableValue v-model.number="store.data.时间.日" type="number" label="日" :min="1" :max="31" /> 日 ·
                <EditableValue v-model="store.data.时间.时辰" label="时辰" />
              </span>
            </div>
            <div class="xy-meta-line">
              <span class="xy-meta-item xy-loc">
                <i>地</i>{{ store.data.地点.世界 }} · {{ store.data.地点.地域 }} · {{ store.data.地点.具体地点 }}
              </span>
              <span v-if="(store.data.身份 && store.data.身份.length) || state.editMode" class="xy-meta-item">
                <i>份</i><IdentityTags v-model="store.data.身份" label="身份" />
              </span>
            </div>

            <!-- 主角专属：仙颜道体 / 女修风姿 面板 -->
            <ProtagonistCard :edit-mode="state.editMode" />
          </div>

          <div class="xy-overview-grid">
            <!-- 三脉资源：压缩为细条，为灵根与体质腾出横向空间 -->
            <div class="xy-resources">
              <div class="xy-bar xy-bar-cultivation">
                <div class="xy-bar-head">
                  <span class="xy-bar-label">修为</span>
                  <span class="xy-bar-num">
                    <EditableValue
                      v-model.number="store.data.修炼进度.当前进度"
                      type="number"
                      label="当前修为"
                      :min="0"
                    />
                    /
                    <EditableValue
                      v-model.number="store.data.修炼进度.进度上限"
                      type="number"
                      label="修为上限"
                      :min="1"
                    />
                  </span>
                </div>
                <div class="xy-bar-track">
                  <div
                    class="xy-bar-fill"
                    :style="{ width: barPct(store.data.修炼进度.当前进度, store.data.修炼进度.进度上限) + '%' }"
                  />
                  <div
                    class="xy-bar-shimmer"
                    :style="{ width: barPct(store.data.修炼进度.当前进度, store.data.修炼进度.进度上限) + '%' }"
                  />
                </div>
              </div>
              <div class="xy-bar xy-bar-blood">
                <div class="xy-bar-head">
                  <span class="xy-bar-label">气血</span>
                  <span class="xy-bar-num">
                    <EditableValue
                      v-model.number="store.data.资源池.气血.现值"
                      type="number"
                      label="气血现值"
                      :min="0"
                    />
                    /
                    <EditableValue
                      v-model.number="store.data.资源池.气血.上限"
                      type="number"
                      label="气血上限"
                      :min="1"
                    />
                  </span>
                </div>
                <div class="xy-bar-track">
                  <div
                    class="xy-bar-fill"
                    :style="{ width: barPct(store.data.资源池.气血.现值, store.data.资源池.气血.上限) + '%' }"
                  />
                  <div
                    class="xy-bar-shimmer"
                    :style="{ width: barPct(store.data.资源池.气血.现值, store.data.资源池.气血.上限) + '%' }"
                  />
                </div>
              </div>
              <div class="xy-bar xy-bar-spirit">
                <div class="xy-bar-head">
                  <span class="xy-bar-label">灵气</span>
                  <span class="xy-bar-num">
                    <EditableValue
                      v-model.number="store.data.资源池.灵气.现值"
                      type="number"
                      label="灵气现值"
                      :min="0"
                    />
                    /
                    <EditableValue
                      v-model.number="store.data.资源池.灵气.上限"
                      type="number"
                      label="灵气上限"
                      :min="1"
                    />
                  </span>
                </div>
                <div class="xy-bar-track">
                  <div
                    class="xy-bar-fill"
                    :style="{ width: barPct(store.data.资源池.灵气.现值, store.data.资源池.灵气.上限) + '%' }"
                  />
                  <div
                    class="xy-bar-shimmer"
                    :style="{ width: barPct(store.data.资源池.灵气.现值, store.data.资源池.灵气.上限) + '%' }"
                  />
                </div>
              </div>
              <div class="xy-resource-extra">
                <span class="xy-extra-item"
                  ><i>遁速</i
                  ><EditableValue v-model.number="store.data.资源池.遁速" type="number" label="遁速" :min="0" />
                  m/s</span
                >
              </div>
            </div>

            <!-- 灵根 / 体质 / 状态：详情共用一个紧凑抽屉 -->
            <section class="xy-traits-panel">
              <div class="xy-trait-cards">
                <button
                  type="button"
                  class="xy-overview-trait xy-overview-root"
                  :class="{ active: state.overviewOpen === 'root' }"
                  @click="toggleOverview('root')"
                >
                  <span class="xy-trait-kicker">灵根</span>
                  <strong>{{ store.data.灵根.名称 }}</strong>
                  <span class="xy-trait-rank">{{ store.data.灵根.品阶 }}</span>
                  <span class="xy-trait-elements">
                    <span
                      v-for="el in store.data.灵根.五行"
                      :key="el"
                      class="xy-element xy-element-mini"
                      :style="{ '--el': elColor(el) }"
                      >{{ el === '未知' ? '未' : el === '混沌' ? '混' : el }}</span
                    >
                  </span>
                </button>
                <button
                  type="button"
                  class="xy-overview-trait xy-overview-body"
                  :class="{ active: state.overviewOpen === 'body' }"
                  @click="toggleOverview('body')"
                >
                  <span class="xy-trait-kicker">体质</span>
                  <strong>{{ store.data.体质.名称 }}</strong>
                  <span v-if="!_.isEmpty(store.data.体质.效果)" class="xy-trait-effect-count">
                    {{ Object.keys(store.data.体质.效果).length }} 效
                  </span>
                  <span class="xy-trait-attrs">
                    <span
                      >悟性<b>{{ store.data.体质.悟性 }}</b></span
                    >
                    <span
                      >根骨<b>{{ store.data.体质.根骨 }}</b></span
                    >
                    <span
                      >气感<b>{{ store.data.体质.气感 }}</b></span
                    >
                  </span>
                </button>
              </div>

              <div v-if="!_.isEmpty(store.data.状态效果)" class="xy-overview-statuses">
                <span class="xy-status-label">状态</span>
                <button
                  v-for="(eff, name) in store.data.状态效果"
                  :key="name"
                  type="button"
                  class="xy-status-icon"
                  :class="['xy-buff-' + (eff.类型 || '特殊'), { active: state.openedBuff === name }]"
                  :title="String(name)"
                  :aria-label="`查看状态：${String(name)}`"
                  @click="toggleOverviewBuff(name as string)"
                >
                  {{ buffIcon(name as string) }}<small v-if="eff.层数 > 1">{{ eff.层数 }}</small>
                </button>
              </div>

              <transition name="xy-fade">
                <div v-if="state.overviewOpen === 'root'" class="xy-trait-detail xy-root-detail">
                  <div class="xy-root-name">
                    <span class="xy-root-rank"><EditableValue v-model="store.data.灵根.品阶" label="灵根品阶" /></span>
                    <span class="xy-root-fullname"
                      ><EditableValue v-model="store.data.灵根.名称" label="灵根名称"
                    /></span>
                  </div>
                  <div class="xy-root-elements">
                    <span
                      v-for="el in store.data.灵根.五行"
                      :key="el"
                      class="xy-element"
                      :style="{ '--el': elColor(el) }"
                      >{{ el === '未知' ? '未' : el === '混沌' ? '混' : el }}</span
                    >
                  </div>
                  <button type="button" class="xy-trait-detail-close" aria-label="关闭灵根详情" @click="closeOverview">
                    ×
                  </button>
                </div>

                <div v-else-if="state.overviewOpen === 'body'" class="xy-trait-detail xy-body-detail">
                  <div class="xy-body-name"><EditableValue v-model="store.data.体质.名称" label="体质名称" /></div>
                  <div class="xy-attr-grid">
                    <div class="xy-attr">
                      <span class="xy-attr-label">悟性</span>
                      <span class="xy-attr-value"
                        ><EditableValue v-model.number="store.data.体质.悟性" type="number" label="悟性" :min="0"
                      /></span>
                    </div>
                    <div class="xy-attr">
                      <span class="xy-attr-label">根骨</span>
                      <span class="xy-attr-value"
                        ><EditableValue v-model.number="store.data.体质.根骨" type="number" label="根骨" :min="0"
                      /></span>
                    </div>
                    <div class="xy-attr">
                      <span class="xy-attr-label">气感</span>
                      <span class="xy-attr-value"
                        ><EditableValue v-model.number="store.data.体质.气感" type="number" label="气感" :min="0"
                      /></span>
                    </div>
                  </div>
                  <div v-if="!_.isEmpty(store.data.体质.效果) || state.editMode" class="xy-body-effects">
                    <EffectList v-model="store.data.体质.效果" line-class="xy-body-effect" />
                  </div>
                  <div
                    v-if="state.editMode || store.data.体质.元阳 != null || store.data.体质.元阴 != null"
                    class="xy-body-essence"
                  >
                    <span class="xy-attr-label">性征</span>
                    <span
                      v-if="state.editMode || store.data.体质.元阳 != null"
                      class="xy-npc-yang"
                      :class="{
                        'xy-bool-toggle': state.editMode,
                        'xy-bool-off': state.editMode && store.data.体质.元阳 === false,
                        'xy-bool-null': state.editMode && store.data.体质.元阳 == null,
                      }"
                      :title="
                        state.editMode ? `元阳：${essenceState(store.data.体质.元阳)}（左键循环 尚存→已损→无）` : ''
                      "
                      @click="state.editMode && cycleEssence(store.data, '元阳')"
                      >元阳<span class="xy-bool-mark">{{ essenceMark(store.data.体质.元阳) }}</span></span
                    >
                    <span
                      v-if="state.editMode || store.data.体质.元阴 != null"
                      class="xy-npc-yin"
                      :class="{
                        'xy-bool-toggle': state.editMode,
                        'xy-bool-off': state.editMode && store.data.体质.元阴 === false,
                        'xy-bool-null': state.editMode && store.data.体质.元阴 == null,
                      }"
                      :title="
                        state.editMode ? `元阴：${essenceState(store.data.体质.元阴)}（左键循环 尚存→已损→无）` : ''
                      "
                      @click="state.editMode && cycleEssence(store.data, '元阴')"
                      >元阴<span class="xy-bool-mark">{{ essenceMark(store.data.体质.元阴) }}</span></span
                    >
                  </div>
                  <div v-if="!_.isEmpty(store.data.性器) || state.editMode" class="xy-body-genital">
                    <button
                      type="button"
                      class="xy-genital-toggle"
                      @click="state.genitalOpen['user'] = !state.genitalOpen['user']"
                    >
                      <span class="xy-attr-label">性器</span>
                      <span v-if="!_.isEmpty(store.data.性器)" class="xy-genital-count">{{
                        Object.keys(store.data.性器).length
                      }}</span>
                      <span class="xy-collapse-caret">{{ state.genitalOpen['user'] ? '▾' : '▸' }}</span>
                    </button>
                    <div v-show="state.genitalOpen['user']" class="xy-genital-list">
                      <EffectList v-model="store.data.性器" line-class="xy-genital-line" label-name="性器" />
                    </div>
                  </div>
                  <button type="button" class="xy-trait-detail-close" aria-label="关闭体质详情" @click="closeOverview">
                    ×
                  </button>
                </div>

                <div
                  v-else-if="openedBuffData"
                  class="xy-buff-detail xy-overview-buff-detail"
                  :class="['xy-buff-' + (openedBuffData.类型 || '特殊')]"
                >
                  <div class="xy-buff-detail-head">
                    <span class="xy-buff-detail-name">{{ state.openedBuff }}</span>
                    <span class="xy-buff-tag">{{ openedBuffData.类型 }}</span>
                    <span v-if="openedBuffData.层数 > 1" class="xy-buff-detail-stack">x{{ openedBuffData.层数 }}</span>
                    <span class="xy-buff-time">{{ openedBuffData.剩余时间 }}</span>
                    <button
                      v-if="state.editMode"
                      type="button"
                      class="xy-buff-detail-delete"
                      @click="requestDelete('user-buff', state.openedBuff as string, state.openedBuff as string)"
                    >
                      删除
                    </button>
                    <button type="button" class="xy-buff-detail-close" @click="closeOverview">×</button>
                  </div>
                  <div v-if="!_.isEmpty(openedBuffData.效果) || state.editMode" class="xy-buff-effects">
                    <EffectList v-model="openedBuffData.效果" line-class="xy-buff-effect" />
                  </div>
                  <div v-if="openedBuffData.来源" class="xy-buff-source">来源：{{ openedBuffData.来源 }}</div>
                </div>
              </transition>
            </section>
          </div>
        </header>

        <!-- ============ Tab 导航 ============ -->
        <nav class="xy-tabs">
          <button
            v-for="(t, i) in tabs"
            :key="i"
            :class="['xy-tab', { active: state.currentTab === i }]"
            @click="state.currentTab = i"
          >
            <span class="xy-tab-icon">{{ t.icon }}</span>
            <span class="xy-tab-label">{{ t.label }}</span>
          </button>
        </nav>

        <!-- ============ Tab 内容 ============ -->
        <transition name="xy-fade" mode="out-in">
          <main :key="state.currentTab" class="xy-content">
            <!-- ▼ 技艺 ▼ -->
            <section v-if="state.currentTab === 0" class="xy-page xy-page-skills">
              <div class="xy-skill-layout">
                <section v-for="group in skillGroups" :key="group.key" class="xy-skill-panel">
                  <h3 class="xy-skill-group-title">{{ group.label }}</h3>
                  <div class="xy-skill-grid">
                    <div v-for="(v, n) in group.values" :key="group.key + '-' + String(n)" class="xy-skill-wrap">
                      <div
                        class="xy-skill"
                        :class="{
                          open: state.skillRecipeOpen[String(n)] && recipesForSkill(store.data.物品, String(n)).length,
                          'has-recipes': recipesForSkill(store.data.物品, String(n)).length,
                        }"
                      >
                        <button
                          type="button"
                          class="xy-skill-toggle"
                          :title="
                            recipesForSkill(store.data.物品, String(n)).length
                              ? '点击展开 ' + n + ' 配方'
                              : n + ' 暂无配方'
                          "
                          :aria-expanded="
                            recipesForSkill(store.data.物品, String(n)).length
                              ? Boolean(state.skillRecipeOpen[String(n)])
                              : undefined
                          "
                          :aria-disabled="!recipesForSkill(store.data.物品, String(n)).length"
                          @click="recipesForSkill(store.data.物品, String(n)).length && toggleSkillRecipes(String(n))"
                        >
                          <span
                            class="xy-skill-seal"
                            :style="{ '--skill-pct': skillPct(v, store.data.修炼进度.境界) + '%' }"
                          >
                            <span>{{ skillGlyph(String(n)) }}</span>
                          </span>
                          <span class="xy-skill-name" :title="String(n)">{{ n }}</span>
                          <span v-if="recipesForSkill(store.data.物品, String(n)).length" class="xy-skill-recipe-count">
                            配方 {{ recipesForSkill(store.data.物品, String(n)).length }}
                          </span>
                        </button>
                        <span class="xy-skill-num">
                          <EditableValue
                            :model-value="v"
                            type="number"
                            :label="String(n)"
                            :min="0"
                            :format="formatSkillNum"
                            @update:model-value="setSkillValue(group.key, String(n), $event)"
                          />
                        </span>
                      </div>
                      <div
                        v-if="state.skillRecipeOpen[String(n)] && recipesForSkill(store.data.物品, String(n)).length"
                        class="xy-recipe-list"
                      >
                        <article
                          v-for="rec in recipesForSkill(store.data.物品, String(n))"
                          :key="rec.name"
                          class="xy-item xy-recipe-card"
                          :class="['xy-q-bg-' + rec.it.品质]"
                        >
                          <div class="xy-item-head">
                            <span class="xy-item-name" :title="rec.name">{{ rec.name }}</span>
                            <button
                              type="button"
                              class="xy-craft-btn"
                              :title="'追加 ' + craftVerbForSkill(String(n)) + '【' + rec.name + '】 到输入栏'"
                              @click.stop="sendCraftCommand(String(rec.name))"
                            >
                              {{ craftVerbForSkill(String(n)) }}
                            </button>
                          </div>
                          <div class="xy-item-meta">
                            <span :class="['xy-quality', 'xy-q-' + rec.it.品质]">{{ rec.it.品质 }}</span>
                            <span class="xy-pill">{{ rec.it.类型 }}</span>
                            <span v-if="rec.it.境界" class="xy-pill xy-pill-soft">{{ rec.it.境界 }}</span>
                            <span
                              v-if="rec.it.五行"
                              class="xy-element xy-element-mini"
                              :style="{ '--el': elColor(rec.it.五行) }"
                              >{{ rec.it.五行 === '混沌' ? '混' : rec.it.五行 }}</span
                            >
                          </div>
                          <div v-if="parseItemTags(rec.it.标签).length" class="xy-item-tags">
                            <span
                              v-for="(t, i) in parseItemTags(rec.it.标签)"
                              :key="i"
                              class="xy-item-tag"
                              :class="'xy-item-tag-' + t.label"
                              >{{ t.label }} <b>{{ t.value }}</b></span
                            >
                          </div>
                          <div v-if="rec.it.描述" class="xy-item-desc">{{ rec.it.描述 }}</div>
                          <div v-if="!_.isEmpty(rec.it.效果)" class="xy-effect-list">
                            <EffectList :model-value="rec.it.效果" />
                          </div>
                        </article>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </section>

            <!-- ▼ 储物 ▼ -->
            <PageStorage v-else-if="state.currentTab === 1" />

            <!-- ▼ 关系 ▼ -->
            <PageRelations v-else-if="state.currentTab === 2" />

            <!-- ▼ 固定资产 ▼ -->
            <PageAssets v-else-if="state.currentTab === 3" />

            <!-- ▼ 传闻 ▼ -->
            <PageRumors v-else-if="state.currentTab === 4" />

            <!-- ▼ 地图 ▼ -->
            <PageMap v-else-if="state.currentTab === 5" />
          </main>
        </transition>
      </div>
    </div>

    <!-- 全局头像上传 input（始终挂载，避免切换页面后无法触发） -->
    <input ref="avatarFileInput" type="file" accept="image/*" class="xy-avatar-file" @change="onAvatarFileChange" />

    <!-- ============ 头像放大查看 ============ -->
    <transition name="xy-fade">
      <div v-if="state.lightboxImage" class="xy-lightbox" @click="closeLightbox" @contextmenu.prevent>
        <img :src="state.lightboxImage" class="xy-lightbox-img" alt="头像大图" @click.stop />
        <button type="button" class="xy-lightbox-close" aria-label="关闭" @click.stop="closeLightbox">×</button>
      </div>
    </transition>

    <!-- ============ 删除确认 ============ -->
    <transition name="xy-fade">
      <div v-if="state.confirmDelete" class="xy-confirm-overlay" @click="cancelDelete" @contextmenu.prevent>
        <div class="xy-confirm-box" @click.stop>
          <div class="xy-confirm-title">确认删除</div>
          <div class="xy-confirm-msg">
            是否删除「<strong>{{ state.confirmDelete.label }}</strong
            >」？此操作无法撤销。
          </div>
          <div class="xy-confirm-actions">
            <button type="button" class="xy-btn xy-btn-cancel" @click.stop="cancelDelete">取消</button>
            <button type="button" class="xy-btn xy-btn-danger" @click.stop="performDelete">确认删除</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ============ 设置面板 ============ -->
    <SettingsPanel v-if="state.settingsOpen" />

    <!-- ============ 人物细化 ============ -->
    <CharacterRefinementModal v-if="state.characterRefinement" />

    <!-- ============ Toast 提示 ============ -->
    <transition name="xy-toast">
      <div v-if="state.toast" class="xy-toast" @click="state.toast = ''">
        {{ state.toast }}
      </div>
    </transition>

    <!-- 主题切换悬浮按钮 -->
    <button type="button" class="xy-floating-theme" :title="isDark ? '切换日间' : '切换夜间'" @click="toggleTheme">
      {{ isDark ? '☀' : '🌙' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import _ from 'lodash';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { publishSharedTheme, readSharedTheme, subscribeSharedTheme, type SharedTheme } from '../shared/theme';
import { readSharedLayout, subscribeSharedLayout } from '../shared/layout';
import { useDataStore } from './store';
import ProtagonistCard from './pages/ProtagonistCard.vue';
import PageAssets from './pages/PageAssets.vue';
import PageStorage from './pages/PageStorage.vue';
import PageRelations from './pages/PageRelations.vue';
import PageRumors from './pages/PageRumors.vue';
import PageMap from './pages/PageMap.vue';
import EditableValue from './pages/EditableValue.vue';
import EffectList from './pages/EffectList.vue';
import IdentityTags from './pages/IdentityTags.vue';
import SettingsPanel from './pages/SettingsPanel.vue';
import CharacterRefinementModal from './pages/CharacterRefinementModal.vue';
import {
  state,
  tabs,
  USER_AVATAR_KEY,
  avatarFileInput,
  openedBuffData,
  barPct,
  skillPct,
  formatSkillNum,
  elColor,
  avatarChar,
  getNpcAvatar,
  triggerAvatarUpload,
  clearNpcAvatar,
  onAvatarClick,
  onAvatarFileChange,
  closeLightbox,
  requestDelete,
  cancelDelete,
  performDelete,
  recipesForSkill,
  toggleSkillRecipes,
  sendCraftCommand,
  craftVerbForSkill,
  parseItemTags,
  cycleEssence,
  essenceState,
  essenceMark,
  syncTimeline,
} from './composables';

const store = useDataStore();

type SkillGroupKey = '生产类' | '战斗类';
const skillGroups = computed(() => [
  { key: '生产类' as const, label: '生产', values: store.data?.技艺?.生产类 ?? {} },
  { key: '战斗类' as const, label: '战斗', values: store.data?.技艺?.战斗类 ?? {} },
]);

function setSkillValue(group: SkillGroupKey, name: string, value: unknown) {
  const values = store.data.技艺[group] as Record<string, number>;
  values[name] = Number(value) || 0;
}

function skillGlyph(name: string): string {
  const glyphs = Array.from(name.trim());
  return glyphs[glyphs.length - 1] || '艺';
}

function buffIcon(name: string): string {
  return Array.from(name.trim())[0] || '效';
}

function toggleOverview(panel: 'root' | 'body') {
  state.openedBuff = null;
  state.overviewOpen = state.overviewOpen === panel ? null : panel;
}

function toggleOverviewBuff(name: string) {
  state.overviewOpen = null;
  state.openedBuff = state.openedBuff === name ? null : name;
}

function closeOverview() {
  state.overviewOpen = null;
  state.openedBuff = null;
}

const isDark = ref(false);
let stopThemeSync: (() => void) | undefined;
let stopLayoutSync: (() => void) | undefined;
function applyTheme(theme: SharedTheme, publish = false) {
  isDark.value = theme === 'dark';
  const el = document.documentElement;
  if (theme === 'dark') el.setAttribute('data-theme', 'dark');
  else el.removeAttribute('data-theme');
  if (publish) publishSharedTheme(theme);
}
function toggleTheme() {
  applyTheme(isDark.value ? 'light' : 'dark', true);
}

// 打开「总结助手」面板：向总结脚本(主页面)广播事件。
// eventEmit 是酒馆助手的全局事件总线，跨消息 iframe ↔ 预设脚本送达；
// 总结.js 里 eventOn('本格修仙:打开总结', showSettingsPopup) 接收并弹出面板。
function openSummary() {
  try {
    if (typeof eventEmit === 'function') {
      eventEmit('本格修仙:打开总结');
    } else {
      console.warn('[状态栏] eventEmit 不可用，无法打开总结');
    }
  } catch (e) {
    console.error('[状态栏] 打开总结失败：', e);
  }
}
onMounted(() => {
  applyTheme(readSharedTheme('dark'));
  stopThemeSync = subscribeSharedTheme(theme => applyTheme(theme));
  state.layoutMode = readSharedLayout('pc');
  stopLayoutSync = subscribeSharedLayout(layout => {
    state.layoutMode = layout;
  });
});
onBeforeUnmount(() => {
  stopThemeSync?.();
  stopLayoutSync?.();
});

// 时间轴引擎：玩家时间/地点/境界变化时
//   1) 生成/剪枝事件缓存（localStorage 保留跨地域暂存语义）
//   2) 把当前可见子集写回 store.data.传闻
//   3) store 自身的 watchEffect 把 store.data.传闻 同步到酒馆 mvu 变量
//   4) 下一轮 <status_current_variable> 自然带出，AI 能读到
watch(
  () => {
    const t = store.data?.时间;
    const loc = store.data?.地点;
    const realm = store.data?.修炼进度?.境界;
    return [t?.年, t?.月, t?.日, loc?.世界, loc?.地域, realm];
  },
  () => syncTimeline(),
  { immediate: true },
);
</script>
