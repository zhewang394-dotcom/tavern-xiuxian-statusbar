<template>
  <section class="xy-page xy-page-relations">
    <div class="xy-npc-list">
      <div v-if="_.isEmpty(store.data.关系列表)" class="xy-empty">
        <div class="xy-empty-mark">独</div>
        <p>尚未结识其他人</p>
      </div>
      <!-- 无主 傀儡/灵兽 卡片 (类型='傀儡'|'灵兽') -->
      <article
        v-for="{ name, npc } in wildUnits"
        :key="'wu-' + name"
        class="xy-npc xy-wild-unit"
        :class="{ 'xy-npc-open': state.openedNPC === name }"
        @click="state.openedNPC = state.openedNPC === name ? null : name"
      >
        <div class="xy-wild-head">
          <span class="xy-wild-icon" :title="npc.类型">{{ npc.类型 === '灵兽' ? '兽' : '傀' }}</span>
          <div class="xy-wild-meta">
            <div class="xy-wild-line1">
              <span class="xy-wild-name">{{ name }}</span>
              <span v-if="npc.境界" class="xy-npc-realm">{{ npc.境界 }}</span>
              <span v-if="npc.在场" class="xy-npc-online">在场</span>
            </div>
            <div class="xy-wild-line2">
              <span class="xy-wild-type-tag">{{ npc.类型 }}</span>
              <span v-if="npc.品质" class="xy-wild-q-tag" :class="'xy-q-' + npc.品质">{{ npc.品质 }}品</span>
              <span v-if="npc.五行" class="xy-element xy-element-mini" :style="{ '--el': elColor(npc.五行) }">{{ npc.五行 === '混沌' ? '混' : npc.五行 }}</span>
            </div>
          </div>
          <div class="xy-favor" :class="favorClass(npc.好感度)" @click.stop>
            <div class="xy-favor-num">
              <EditableValue v-model.number="npc.好感度" type="number" label="好感度" :min="-100" :max="100" />
            </div>
            <div class="xy-favor-label">{{ favorLabel(npc.好感度) }}</div>
          </div>
          <button
            type="button"
            class="xy-trash xy-trash-npc"
            title="删除此条目"
            @click.stop="requestDelete('npc', name, name)"
          >
            <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true">
              <path d="M9 3v1H4v2h16V4h-5V3H9zM6 8l1 13h10l1-13H6zm3 2h2v9H9v-9zm4 0h2v9h-2v-9z" />
            </svg>
          </button>
        </div>
        <div v-if="state.openedNPC === name" class="xy-wild-body" @click.stop>
          <CombatUnit :unit="npc" :name="String(name)" compact />
          <div v-if="!_.isEmpty(npc.状态效果)" class="xy-mini-block">
            <h4>状态效果</h4>
            <div class="xy-buff-list">
              <div
                v-for="(eff, ename) in npc.状态效果"
                :key="ename"
                class="xy-buff-item"
                :class="['xy-buff-' + (eff.类型 || '特殊')]"
              >
                <div class="xy-buff-head">
                  <span class="xy-buff-name">{{ ename }}</span>
                  <span class="xy-buff-tag">{{ eff.类型 }}</span>
                  <span v-if="eff.层数 > 1" class="xy-buff-stack">x{{ eff.层数 }}</span>
                  <span class="xy-buff-time">{{ eff.剩余时间 }}</span>
                </div>
                <EffectList v-if="!_.isEmpty(eff.效果)" v-model="eff.效果" line-class="xy-buff-effect" />
              </div>
            </div>
          </div>
        </div>
      </article>

      <!-- 人物 (NPC) 卡片 (类型='人物' 或未指定) -->
      <article
        v-for="{ name, npc } in characterRelations"
        :key="name"
        class="xy-npc"
        :class="{ 'xy-npc-open': state.openedNPC === name }"
        @click="state.openedNPC = state.openedNPC === name ? null : name"
      >
        <div class="xy-npc-head">
          <div
            class="xy-npc-avatar"
            :class="{ active: npc.在场, 'has-img': getNpcAvatar(name as string) }"
            @click="onAvatarClick(name as string, $event)"
          >
            <img
              v-if="getNpcAvatar(name as string)"
              :src="getNpcAvatar(name as string)"
              :alt="String(name)"
              class="xy-npc-avatar-img"
            />
            <span v-else class="xy-npc-avatar-char">{{ avatarChar(name as string) }}</span>
            <button
              type="button"
              class="xy-npc-avatar-cam"
              :title="getNpcAvatar(name as string) ? '更换头像（右键清除）' : '上传头像'"
              @click.stop="triggerAvatarUpload(name as string)"
              @contextmenu.prevent.stop="getNpcAvatar(name as string) && clearNpcAvatar(name as string)"
            >
              <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true">
                <path d="M9.5 4l-1.7 2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3.8L14.5 4h-5zm2.5 4a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
              </svg>
            </button>
          </div>
          <div class="xy-npc-info">
            <div class="xy-npc-line1">
              <span class="xy-npc-name" :class="`xy-npc-name--${npcGender(npc)}`">{{ name }}</span>
              <span class="xy-npc-realm">{{ npc.修炼进度?.境界 || '凡人' }}</span>
              <span
                v-if="npc.在场 || state.editMode"
                class="xy-npc-online"
                :class="{ 'xy-bool-toggle': state.editMode, 'xy-bool-off': state.editMode && !npc.在场 }"
                :title="state.editMode ? '点击切换 在场' : ''"
                @click.stop="state.editMode && (npc.在场 = !npc.在场)"
              >在场</span>
            </div>
            <div class="xy-npc-line2">
              <span class="xy-npc-race">{{ npc.种族 }}</span>
              <span v-if="(npc.身份 && npc.身份.length) || state.editMode">·</span>
              <IdentityTags v-model="npc.身份" label="身份" />
              <!-- 元阳(并入体质): null≡不存在 → 查看态仅在成立(true/false)时显示;编辑态恒显以便左键循环 -->
              <span
                v-if="state.editMode || npc.体质?.元阳 != null"
                class="xy-npc-yang"
                :class="{ 'xy-bool-toggle': state.editMode, 'xy-bool-off': state.editMode && npc.体质?.元阳 === false, 'xy-bool-null': state.editMode && npc.体质?.元阳 == null }"
                :title="state.editMode ? `元阳：${essenceState(npc.体质?.元阳)}（左键循环 尚存→已损→无）` : ''"
                @click.stop="state.editMode && cycleEssence(npc, '元阳')"
              >元阳<span class="xy-bool-mark">{{ essenceMark(npc.体质?.元阳) }}</span></span>
              <!-- 元阴: 同上 -->
              <span
                v-if="state.editMode || npc.体质?.元阴 != null"
                class="xy-npc-yin"
                :class="{ 'xy-bool-toggle': state.editMode, 'xy-bool-off': state.editMode && npc.体质?.元阴 === false, 'xy-bool-null': state.editMode && npc.体质?.元阴 == null }"
                :title="state.editMode ? `元阴：${essenceState(npc.体质?.元阴)}（左键循环 尚存→已损→无）` : ''"
                @click.stop="state.editMode && cycleEssence(npc, '元阴')"
              >元阴<span class="xy-bool-mark">{{ essenceMark(npc.体质?.元阴) }}</span></span>
              <span
                v-if="npc.道侣 || state.editMode"
                class="xy-npc-couple"
                :class="{ 'xy-bool-toggle': state.editMode, 'xy-bool-off': state.editMode && !npc.道侣 }"
                :title="state.editMode ? '点击切换 道侣' : ''"
                @click.stop="state.editMode && (npc.道侣 = !npc.道侣)"
              >道侣</span>
            </div>
          </div>
          <div class="xy-favor" :class="favorClass(npc.好感度)">
            <div class="xy-favor-num">
              <EditableValue v-model.number="npc.好感度" type="number" label="好感度" :min="-100" :max="100" />
            </div>
            <div class="xy-favor-label">{{ favorLabel(npc.好感度) }}</div>
          </div>
          <button
            type="button"
            class="xy-trash xy-trash-npc"
            title="删除此 NPC"
            @click.stop="requestDelete('npc', name, name)"
          >
            <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true">
              <path d="M9 3v1H4v2h16V4h-5V3H9zM6 8l1 13h10l1-13H6zm3 2h2v9H9v-9zm4 0h2v9h-2v-9z" />
            </svg>
          </button>
          <!-- 细节可见开关：右侧、垃圾桶正下方的小圆；悬停即显功能说明 -->
          <button
            type="button"
            class="xy-vis-eye"
            :class="{ 'xy-vis-off': npc.细节可见 === false }"
            :title="npc.细节可见 === false
              ? '细节已隐藏：该人物的物品/功法/装备/傀儡/灵兽不发送给 AI（前端此处仍可查看）· 点击恢复'
              : '细节可见：该人物的物品/功法/装备/傀儡/灵兽会发送给 AI · 点击隐藏（关闭后 AI 收不到这些细节，可省篇幅/避免过早暴露）'"
            @click.stop="toggleDetail(npc)"
          >
            <svg v-if="npc.细节可见 !== false" viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true">
              <path d="M12 5c-5 0-9 4.5-10 7 1 2.5 5 7 10 7s9-4.5 10-7c-1-2.5-5-7-10-7zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm0-2a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
            </svg>
            <svg v-else viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true">
              <path d="M2 4.27L3.28 3l17.72 17.72-1.27 1.28-3.11-3.11A11.9 11.9 0 0 1 12 19c-5 0-9-4.5-10-7a13.2 13.2 0 0 1 3.62-4.35L2 4.27zM12 8a4 4 0 0 1 4 4c0 .5-.1.97-.27 1.4l-5.13-5.13A3.9 3.9 0 0 1 12 8zm0-3c5 0 9 4.5 10 7a13.3 13.3 0 0 1-2.16 2.98l-2.9-2.9A4 4 0 0 0 12 8c-.4 0-.79.06-1.15.17L8.6 5.92C9.66 5.32 10.8 5 12 5z" />
            </svg>
          </button>
          <button
            type="button"
            class="xy-character-refine"
            title="人物细化：用当前世界书和人物变量生成细化信息或独立世界书条目"
            @click.stop="openCharacterRefinement(String(name))"
          >
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true">
              <path d="m15.5 2 .95 2.55L19 5.5l-2.55.95L15.5 9l-.95-2.55L12 5.5l2.55-.95L15.5 2ZM6.9 7.1l1.45 3.9 3.9 1.45-3.9 1.45-1.45 3.9L5.45 13.9l-3.9-1.45 3.9-1.45L6.9 7.1Zm10.47 5.4 1.02 2.73 2.73 1.02-2.73 1.02-1.02 2.73-1.02-2.73-2.73-1.02 2.73-1.02 1.02-2.73Z" />
            </svg>
          </button>
        </div>

        <div v-if="state.openedNPC === name" class="xy-npc-body" @click.stop>
          <!-- 基础信息四宫 -->
          <div class="xy-npc-grid">
            <div class="xy-mini">
              <h4>寿元</h4>
              <p>
                <EditableValue v-if="npc.寿元" v-model.number="npc.寿元.年龄" type="number" label="年龄" :min="0" /> /
                <EditableValue v-if="npc.寿元" v-model.number="npc.寿元.寿命" type="number" label="寿命" :min="1" />
                <small v-if="npc.寿元">貌 <EditableValue v-model.number="npc.寿元.外观年龄" type="number" label="外观年龄" :min="0" /></small>
              </p>
            </div>
            <div class="xy-mini">
              <h4>灵根</h4>
              <p>
                <span><EditableValue v-if="npc.灵根" v-model="npc.灵根.名称" label="灵根名称" :format="(v) => v || '未检测'" /></span>
                <span v-for="el in npc.灵根?.五行 || []" :key="el" class="xy-element xy-element-mini" :style="{ '--el': elColor(el) }">{{ el === '未知' ? '未' : el === '混沌' ? '混' : el }}</span>
              </p>
            </div>
            <div class="xy-mini">
              <h4>体质</h4>
              <p>
                <EditableValue v-if="npc.体质" v-model="npc.体质.名称" label="体质名称" />
                <small v-if="npc.体质">
                  悟<EditableValue v-model.number="npc.体质.悟性" type="number" label="悟性" :min="0" />/骨<EditableValue v-model.number="npc.体质.根骨" type="number" label="根骨" :min="0" />/感<EditableValue v-model.number="npc.体质.气感" type="number" label="气感" :min="0" />
                </small>
              </p>
            </div>
            <div class="xy-mini">
              <h4>境界</h4>
              <p>
                <EditableValue v-if="npc.修炼进度" v-model="npc.修炼进度.境界" label="境界" />
                <small v-if="npc.修炼进度">
                  <EditableValue v-model.number="npc.修炼进度.当前进度" type="number" label="当前进度" :min="0" />/<EditableValue v-model.number="npc.修炼进度.进度上限" type="number" label="进度上限" :min="1" />
                </small>
              </p>
            </div>
          </div>

          <!-- 体质效果 -->
          <div v-if="(npc.体质 && (!_.isEmpty(npc.体质.效果) || state.editMode))" class="xy-effect-list xy-npc-effects">
            <EffectList v-model="npc.体质.效果" />
          </div>

          <!-- 资源池 -->
          <div v-if="npc.资源池" class="xy-mini-block">
            <h4>资源池</h4>
            <div class="xy-npc-bars">
              <div v-if="npc.资源池.气血" class="xy-unit-bar">
                <span class="xy-unit-bar-label">气血</span>
                <span class="xy-unit-bar-track">
                  <span class="xy-unit-bar-fill blood" :style="{ width: npcBarPct(npc.资源池.气血) + '%' }" />
                </span>
                <span class="xy-unit-bar-num">
                  <EditableValue v-model.number="npc.资源池.气血.现值" type="number" label="气血现值" :min="0" />/<EditableValue v-model.number="npc.资源池.气血.上限" type="number" label="气血上限" :min="1" />
                </span>
              </div>
              <div v-if="npc.资源池.灵气" class="xy-unit-bar">
                <span class="xy-unit-bar-label">灵气</span>
                <span class="xy-unit-bar-track">
                  <span class="xy-unit-bar-fill spirit" :style="{ width: npcBarPct(npc.资源池.灵气) + '%' }" />
                </span>
                <span class="xy-unit-bar-num">
                  <EditableValue v-model.number="npc.资源池.灵气.现值" type="number" label="灵气现值" :min="0" />/<EditableValue v-model.number="npc.资源池.灵气.上限" type="number" label="灵气上限" :min="1" />
                </span>
              </div>
              <div class="xy-unit-bar">
                <span class="xy-unit-bar-label">遁速</span>
                <span class="xy-unit-bar-num xy-bar-solo">
                  <EditableValue v-model.number="npc.资源池.遁速" type="number" label="遁速" :min="0" /> m/s
                </span>
              </div>
            </div>
          </div>

          <!-- 技艺 -->
          <div v-if="hasSkills(npc)" class="xy-mini-block">
            <h4>技艺</h4>
            <div class="xy-npc-skills">
              <div v-if="!_.isEmpty(npc.技艺?.生产类)" class="xy-npc-skills-row">
                <span class="xy-npc-skills-tag xy-pill-soft">生产</span>
                <span v-for="(v, n) in npc.技艺?.生产类" :key="'p-'+n" class="xy-npc-skill" :class="{ dim: !v }" :title="`${n}：${v} / ${formatSkillNum(skillCap(npc.修炼进度?.境界 || ''))}`">
                  {{ n }}<em>
                    <EditableValue
                      :model-value="v"
                      type="number"
                      :label="String(n)"
                      :min="0"
                      :format="formatSkillNum"
                      @update:model-value="npc.技艺.生产类[n] = Number($event)"
                    />
                  </em>
                </span>
              </div>
              <div v-if="!_.isEmpty(npc.技艺?.战斗类)" class="xy-npc-skills-row">
                <span class="xy-npc-skills-tag xy-pill-cost">战斗</span>
                <span v-for="(v, n) in npc.技艺?.战斗类" :key="'c-'+n" class="xy-npc-skill" :class="{ dim: !v }" :title="`${n}：${v} / ${formatSkillNum(skillCap(npc.修炼进度?.境界 || ''))}`">
                  {{ n }}<em>
                    <EditableValue
                      :model-value="v"
                      type="number"
                      :label="String(n)"
                      :min="0"
                      :format="formatSkillNum"
                      @update:model-value="npc.技艺.战斗类[n] = Number($event)"
                    />
                  </em>
                </span>
              </div>
            </div>
          </div>

          <!-- 状态效果（可折叠） -->
          <div v-if="!_.isEmpty(npc.状态效果)" class="xy-mini-block">
            <button
              type="button"
              class="xy-collapse-head"
              :class="{ open: isSectionOpen(name, '状态效果') }"
              @click.stop="toggleSection(name, '状态效果')"
            >
              <span class="xy-collapse-title">状态效果</span>
              <span class="xy-collapse-count">{{ Object.keys(npc.状态效果).length }}</span>
              <span class="xy-collapse-caret">▾</span>
            </button>
            <div v-show="isSectionOpen(name, '状态效果')" class="xy-buff-list xy-collapse-body">
              <div
                v-for="(eff, ename) in npc.状态效果"
                :key="ename"
                class="xy-buff-item"
                :class="['xy-buff-' + (eff.类型 || '特殊')]"
              >
                <button
                  type="button"
                  class="xy-trash"
                  title="删除此状态"
                  @click.stop="requestDelete('npc-buff', `${name}::${ename}`, String(ename))"
                >
                  <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true">
                    <path d="M9 3v1H4v2h16V4h-5V3H9zM6 8l1 13h10l1-13H6zm3 2h2v9H9v-9zm4 0h2v9h-2v-9z" />
                  </svg>
                </button>
                <div class="xy-buff-head">
                  <span class="xy-buff-name">{{ ename }}</span>
                  <span class="xy-buff-tag">{{ eff.类型 }}</span>
                  <span v-if="eff.层数 > 1" class="xy-buff-stack">x{{ eff.层数 }}</span>
                  <span class="xy-buff-time">{{ eff.剩余时间 }}</span>
                </div>
                <div v-if="!_.isEmpty(eff.效果) || state.editMode" class="xy-buff-effects">
                  <EffectList v-model="eff.效果" line-class="xy-buff-effect" />
                </div>
                <div v-if="eff.来源" class="xy-buff-source">来源：{{ eff.来源 }}</div>
              </div>
            </div>
          </div>

          <!-- 功法（可折叠 + 可控/自动选定标识） -->
          <div v-if="!_.isEmpty(npc.功法)" class="xy-mini-block">
            <button
              type="button"
              class="xy-collapse-head"
              :class="{ open: isSectionOpen(name, '功法') }"
              @click.stop="toggleSection(name, '功法')"
            >
              <span class="xy-collapse-title">功法</span>
              <span class="xy-collapse-count">{{ Object.keys(npc.功法).length }}</span>
              <span v-if="!canControlNpc(npc)" class="xy-collapse-lock" title="需道侣或好感度>80才可调整">🔒</span>
              <span class="xy-collapse-caret">▾</span>
            </button>
            <div v-show="isSectionOpen(name, '功法')" class="xy-npc-arts xy-collapse-body">
              <article
                v-for="(art, aname) in npc.功法"
                :key="aname"
                class="xy-art xy-art-mini"
                :class="{ 'xy-art-active': isArtEffectivelyActive(npc, aname as string, art) }"
              >
                <button
                  type="button"
                  class="xy-trash"
                  title="删除此功法"
                  @click.stop="requestDelete('npc-art', `${name}::${aname}`, String(aname))"
                >
                  <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true">
                    <path d="M9 3v1H4v2h16V4h-5V3H9zM6 8l1 13h10l1-13H6zm3 2h2v9H9v-9zm4 0h2v9h-2v-9z" />
                  </svg>
                </button>
                <div class="xy-art-head">
                  <div class="xy-art-title">
                    <span class="xy-art-name">{{ aname }}</span>
                    <span :class="['xy-quality', 'xy-q-' + art.品质]">{{ art.品质 }}品</span>
                  </div>
                  <button
                    type="button"
                    class="xy-toggle xy-toggle-mini"
                    :class="{ on: isArtEffectivelyActive(npc, aname as string, art) }"
                    @click.stop="toggleNpcArt(name, aname as string, !isArtEffectivelyActive(npc, aname as string, art))"
                  >
                    {{ isArtEffectivelyActive(npc, aname as string, art) ? '运转' : '凝息' }}
                  </button>
                </div>
                <div class="xy-art-meta">
                  <span class="xy-pill">{{ art.类型 }}</span>
                  <span v-if="art.境界" class="xy-pill xy-pill-soft">{{ art.境界 }}</span>
                  <span v-if="art.五行" class="xy-element xy-element-mini" :style="{ '--el': elColor(art.五行) }">{{ art.五行 === '混沌' ? '混' : art.五行 }}</span>
                  <span v-if="art.消耗 || state.editMode" class="xy-pill xy-pill-cost">耗 <EditableValue v-model="art.消耗" label="消耗" /></span>
                </div>
                <div v-if="art.描述 || state.editMode" class="xy-art-desc"><EditableValue v-model="art.描述" label="描述" multiline /></div>
                <div v-if="!_.isEmpty(art.效果) || state.editMode" class="xy-effect-list">
                  <EffectList v-model="art.效果" />
                </div>
              </article>
            </div>
          </div>

          <!-- 储物空间（灵石常驻 + 各分类独立折叠） -->
          <div v-if="hasStorage(npc)" class="xy-mini-block">
            <h4 class="xy-mini-block-title">储物空间</h4>
            <div class="xy-npc-storage">
              <div class="xy-npc-stone">
                <span class="xy-npc-stone-label">灵石</span>
                <span class="xy-npc-stone-value">
                  <EditableValue
                    v-if="npc"
                    :model-value="npc.灵石 || 0"
                    type="number"
                    label="灵石"
                    :min="0"
                    :format="(v) => Number(v ?? 0).toLocaleString()"
                    @update:model-value="npc.灵石 = Number($event)"
                  />
                  <template v-else>{{ (npc.灵石 || 0).toLocaleString() }}</template>
                </span>
              </div>

              <div v-if="!_.isEmpty(npc.物品)" class="xy-npc-sub">
                <button
                  type="button"
                  class="xy-collapse-head xy-collapse-sub"
                  :class="{ open: isSectionOpen(name, '物品') }"
                  @click.stop="toggleSection(name, '物品')"
                >
                  <span class="xy-collapse-title">物品</span>
                  <span class="xy-collapse-count">{{ Object.keys(npc.物品).length }}</span>
                  <span class="xy-collapse-caret">▾</span>
                </button>
                <div v-show="isSectionOpen(name, '物品')" class="xy-item-grid xy-item-grid-mini xy-collapse-body">
                  <article
                    v-for="(it, iname) in npc.物品"
                    :key="iname"
                    class="xy-item"
                    :class="['xy-q-bg-' + it.品质]"
                  >
                    <button
                      type="button"
                      class="xy-trash"
                      title="删除此物品"
                      @click.stop="requestDelete('npc-item', `${name}::${iname}`, String(iname))"
                    >
                      <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true">
                        <path d="M9 3v1H4v2h16V4h-5V3H9zM6 8l1 13h10l1-13H6zm3 2h2v9H9v-9zm4 0h2v9h-2v-9z" />
                      </svg>
                    </button>
                    <div class="xy-item-head">
                      <span class="xy-item-name">{{ iname }}</span>
                      <span class="xy-item-qty">×<EditableValue v-model.number="it.数量" type="number" label="数量" :min="0" /></span>
                    </div>
                    <div class="xy-item-meta">
                      <span :class="['xy-quality', 'xy-q-' + it.品质]">{{ it.品质 }}</span>
                      <span class="xy-pill">{{ it.类型 }}</span>
                      <span v-if="it.五行" class="xy-element xy-element-mini" :style="{ '--el': elColor(it.五行) }">{{ it.五行 === '混沌' ? '混' : it.五行 }}</span>
                    </div>
                    <div v-if="parseItemTags(it.标签).length" class="xy-item-tags">
                      <span v-for="(t, i) in parseItemTags(it.标签)" :key="i" class="xy-item-tag" :class="'xy-item-tag-' + t.label">
                        {{ t.label }} <b>{{ t.value }}</b>
                      </span>
                    </div>
                    <div v-if="it.描述 || state.editMode" class="xy-item-desc"><EditableValue v-model="it.描述" label="描述" multiline /></div>
                    <div v-if="!_.isEmpty(it.效果) || state.editMode" class="xy-effect-list">
                      <EffectList v-model="it.效果" />
                    </div>
                  </article>
                </div>
              </div>

              <div v-if="!_.isEmpty(npc.装备)" class="xy-npc-sub">
                <button
                  type="button"
                  class="xy-collapse-head xy-collapse-sub"
                  :class="{ open: isSectionOpen(name, '装备') }"
                  @click.stop="toggleSection(name, '装备')"
                >
                  <span class="xy-collapse-title">装备</span>
                  <span class="xy-collapse-count">{{ Object.keys(npc.装备).length }}</span>
                  <span class="xy-collapse-caret">▾</span>
                </button>
                <div v-show="isSectionOpen(name, '装备')" class="xy-item-grid xy-item-grid-mini xy-collapse-body">
                  <article
                    v-for="(eq, ename2) in npc.装备"
                    :key="ename2"
                    class="xy-item xy-equipment"
                    :class="['xy-q-bg-' + eq.品质]"
                  >
                    <button
                      type="button"
                      class="xy-trash"
                      title="删除此装备"
                      @click.stop="requestDelete('npc-equip', `${name}::${ename2}`, String(ename2))"
                    >
                      <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true">
                        <path d="M9 3v1H4v2h16V4h-5V3H9zM6 8l1 13h10l1-13H6zm3 2h2v9H9v-9zm4 0h2v9h-2v-9z" />
                      </svg>
                    </button>
                    <div class="xy-item-head">
                      <span class="xy-item-name">{{ ename2 }}</span>
                      <span class="xy-item-pos">{{ eq.位置 }}</span>
                    </div>
                    <div class="xy-item-meta">
                      <span :class="['xy-quality', 'xy-q-' + eq.品质]">{{ eq.品质 }}</span>
                      <span class="xy-pill">{{ eq.类型 }}</span>
                      <span v-if="eq.五行" class="xy-element xy-element-mini" :style="{ '--el': elColor(eq.五行) }">{{ eq.五行 === '混沌' ? '混' : eq.五行 }}</span>
                    </div>
                    <div class="xy-eq-stats">
                      <span v-if="getEquipStat(eq, '攻击力') !== null || (state.editMode && eq.类型 === '法宝')" class="xy-eq-stat xy-stat-atk">
                        攻 <EditableValue
                          :model-value="getEquipStat(eq, '攻击力') ?? 0"
                          type="number" label="攻击力" :min="0"
                          @update:model-value="setEquipStat(eq, '攻击力', Number($event))"
                        />
                      </span>
                      <span v-if="getEquipStat(eq, '防御力') !== null || (state.editMode && eq.类型 === '护甲')" class="xy-eq-stat xy-stat-def">
                        防 <EditableValue
                          :model-value="getEquipStat(eq, '防御力') ?? 0"
                          type="number" label="防御力" :min="0"
                          @update:model-value="setEquipStat(eq, '防御力', Number($event))"
                        />
                      </span>
                    </div>
                    <div v-if="eq.描述 || state.editMode" class="xy-item-desc"><EditableValue v-model="eq.描述" label="描述" multiline /></div>
                    <div v-if="!_.isEmpty(eq.效果) || state.editMode" class="xy-effect-list">
                      <EffectList v-model="eq.效果" />
                    </div>
                  </article>
                </div>
              </div>

              <div v-if="!_.isEmpty(npc.傀儡)" class="xy-npc-sub">
                <button
                  type="button"
                  class="xy-collapse-head xy-collapse-sub"
                  :class="{ open: isSectionOpen(name, '傀儡') }"
                  @click.stop="toggleSection(name, '傀儡')"
                >
                  <span class="xy-collapse-title">傀儡</span>
                  <span class="xy-collapse-count">{{ Object.keys(npc.傀儡).length }}</span>
                  <span class="xy-collapse-caret">▾</span>
                </button>
                <div v-show="isSectionOpen(name, '傀儡')" class="xy-item-grid xy-item-grid-mini xy-collapse-body">
                  <CombatUnit
                    v-for="(u, uname) in npc.傀儡"
                    :key="uname"
                    :unit="u"
                    :name="String(uname)"
                    compact
                    deletable
                    @delete="requestDelete('npc-puppet', `${name}::${uname}`, String(uname))"
                  />
                </div>
              </div>

              <div v-if="!_.isEmpty(npc.灵兽)" class="xy-npc-sub">
                <button
                  type="button"
                  class="xy-collapse-head xy-collapse-sub"
                  :class="{ open: isSectionOpen(name, '灵兽') }"
                  @click.stop="toggleSection(name, '灵兽')"
                >
                  <span class="xy-collapse-title">灵兽</span>
                  <span class="xy-collapse-count">{{ Object.keys(npc.灵兽).length }}</span>
                  <span class="xy-collapse-caret">▾</span>
                </button>
                <div v-show="isSectionOpen(name, '灵兽')" class="xy-item-grid xy-item-grid-mini xy-collapse-body">
                  <CombatUnit
                    v-for="(u, uname) in npc.灵兽"
                    :key="uname"
                    :unit="u"
                    :name="String(uname)"
                    compact
                    deletable
                    @delete="requestDelete('npc-beast', `${name}::${uname}`, String(uname))"
                  />
                </div>
              </div>
            </div>
          </div>

          <div v-if="npc.性格 || state.editMode" class="xy-mini-block">
            <h4>性格</h4>
            <p><EditableValue v-model="npc.性格" label="性格" multiline :rows="3" /></p>
          </div>
          <div v-if="npc.外貌 || state.editMode" class="xy-mini-block">
            <h4>外貌</h4>
            <p><EditableValue v-model="npc.外貌" label="外貌" multiline :rows="3" /></p>
          </div>
          <div v-if="npc.着装 || state.editMode" class="xy-mini-block">
            <h4>着装</h4>
            <p><EditableValue v-model="npc.着装" label="着装" multiline :rows="3" /></p>
          </div>
          <!-- 性器（名器）：外部脚本按五行随机填充；仅有内容或编辑态显示，默认折叠，可编辑 -->
          <div v-if="!_.isEmpty(npc.性器) || state.editMode" class="xy-mini-block">
            <h4
              class="xy-genital-toggle"
              @click="state.genitalOpen[String(name)] = !state.genitalOpen[String(name)]"
            >
              性器
              <span v-if="!_.isEmpty(npc.性器)" class="xy-genital-count">{{ Object.keys(npc.性器).length }}</span>
              <span class="xy-collapse-caret">{{ state.genitalOpen[String(name)] ? '▾' : '▸' }}</span>
            </h4>
            <div v-show="state.genitalOpen[String(name)]" class="xy-genital-list">
              <EffectList v-model="npc.性器" line-class="xy-genital-line" label-name="性器" />
            </div>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import _ from 'lodash';
import { computed } from 'vue';
import { useDataStore } from '../store';
import CombatUnit from './CombatUnit.vue';
import EditableValue from './EditableValue.vue';
import EffectList from './EffectList.vue';
import IdentityTags from './IdentityTags.vue';
import {
  state,
  sortedRelations,
  USER_AVATAR_KEY,
  getNpcAvatar,
  onAvatarClick,
  avatarChar,
  triggerAvatarUpload,
  clearNpcAvatar,
  favorClass,
  favorLabel,
  requestDelete,
  openCharacterRefinement,
  isSectionOpen,
  toggleSection,
  hasSkills,
  hasStorage,
  getEquipStat,
  setEquipStat,
  parseItemTags,
  canControlNpc,
  isArtEffectivelyActive,
  toggleNpcArt,
  npcBarPct,
  skillCap,
  formatSkillNum,
  elColor,
  npcGender,
  cycleEssence,
  essenceState,
  essenceMark,
} from '../composables';

const store = useDataStore();

// 区分人物条目与无主战斗单位条目
const characterRelations = computed(() =>
  sortedRelations.value.filter(({ npc }) => !npc?.类型 || npc.类型 === '人物'),
);
const wildUnits = computed(() =>
  sortedRelations.value.filter(({ npc }) => npc?.类型 === '傀儡' || npc?.类型 === '灵兽'),
);

// 切换某 NPC 的「细节可见」（默认视为可见；关闭后 EJS 会从发给 AI 的变量里隐去其 物品/功法/装备/傀儡/灵兽）
function toggleDetail(npc: any) {
  npc.细节可见 = npc.细节可见 === false ? true : false;
}

// 元阴/元阳 性征三态(并入 体质)的判定/循环/展示助手已移至 composables.ts,供 NPC 与玩家共用
</script>

<style scoped>
/* 保证垃圾桶/眼睛这两个绝对定位小圆锚定在人物头栏右上（与 padding-right 预留列一致） */
.xy-npc-head {
  position: relative;
}
/* 细节可见开关：右侧、垃圾桶正下方的小圆，悬停人物条目时显示。 */
.xy-vis-eye {
  position: absolute;
  top: 26px;
  right: 4px;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid var(--xy-line);
  border-radius: 50%;
  background: var(--xy-paper);
  color: var(--xy-jade-deep, #3d6b54);
  cursor: pointer;
  opacity: 0;
  transition: all 0.16s ease;
  z-index: 4;
}
.xy-npc:hover > .xy-npc-head > .xy-vis-eye,
.xy-vis-eye:focus-visible {
  opacity: 1;
}
.xy-vis-eye:hover {
  border-color: var(--xy-jade, #5b8a72);
  background: var(--xy-tint-jade-mid, rgba(91, 138, 114, 0.14));
}
.xy-vis-eye.xy-vis-off {
  color: var(--xy-ink-faint, #b9b0a0);
}
.xy-vis-eye.xy-vis-off:hover {
  color: var(--xy-cinnabar, #b13a3a);
  border-color: var(--xy-cinnabar, #b13a3a);
  background: var(--xy-tint-cinnabar-faint, rgba(177, 58, 58, 0.06));
}
/* 人物细化 / 世界书生成入口：位于详情可见开关下方，与删除按钮一样仅在人物条目悬停时显示。 */
.xy-character-refine {
  position: absolute;
  top: 48px;
  right: 4px;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid var(--xy-line);
  border-radius: 50%;
  background: var(--xy-paper);
  color: var(--xy-gold-deep, #8a682b);
  cursor: pointer;
  opacity: 0;
  transition: all 0.16s ease;
  z-index: 4;
}
.xy-npc:hover > .xy-npc-head > .xy-character-refine,
.xy-character-refine:focus-visible {
  opacity: 1;
}
.xy-character-refine:hover {
  color: var(--xy-cinnabar, #b13a3a);
  border-color: var(--xy-gold, #b18a42);
  background: var(--xy-tint-gold-mid, rgba(177, 138, 66, 0.14));
}

.xy-wild-unit {
  border-left: 3px solid var(--xy-cinnabar, #a07f48);
  padding: 0;
  margin-bottom: 8px;
  cursor: pointer;
  overflow: hidden;
}
.xy-wild-head {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 36px 8px 12px;  /* 右侧留出 trash + caret 的空间 */
}
/* 垃圾桶: 默认隐藏,hover wild 卡片时显示(对齐 NPC) */
.xy-wild-unit:hover > .xy-wild-head > .xy-trash,
.xy-wild-unit > .xy-wild-head > .xy-trash:focus-visible {
  opacity: 1;
}
/* 让 trash 与 caret 不重叠: trash 置于右上角(类型 NPC),caret 置于行内 flex */
.xy-wild-head > .xy-trash-npc {
  top: 6px;
  right: 6px;
}
.xy-wild-icon {
  flex: 0 0 auto;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--xy-font-display);
  font-size: 13px;
  background: var(--xy-tint-cinnabar-mid, rgba(160, 127, 72, 0.18));
  color: var(--xy-cinnabar-deep, #6e4f1d);
  border: 1px solid var(--xy-tint-cinnabar-border, rgba(160, 127, 72, 0.5));
}
.xy-wild-meta {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.xy-wild-line1 {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}
.xy-wild-line2 {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}
.xy-wild-name {
  font-family: var(--xy-font-display);
  font-size: 14px;
  letter-spacing: 1px;
  color: var(--xy-ink);
}
.xy-wild-type-tag {
  font-size: 10.5px;
  padding: 1px 7px;
  border-radius: 8px;
  background: rgba(160, 127, 72, 0.14);
  color: var(--xy-cinnabar-deep, #6e4f1d);
  border: 1px solid rgba(160, 127, 72, 0.30);
  letter-spacing: 0.5px;
}
.xy-wild-q-tag {
  font-size: 10.5px;
  padding: 1px 7px;
  border-radius: 4px;
  letter-spacing: 0.5px;
}
.xy-wild-q-tag.xy-q-凡 { background: #d4cfc4; color: #5a5249; }
.xy-wild-q-tag.xy-q-黄 { background: linear-gradient(135deg, #d4b06a, #b58938); color: #fff; }
.xy-wild-q-tag.xy-q-玄 { background: linear-gradient(135deg, #6b6f7a, #4a4d56); color: #fff; }
.xy-wild-q-tag.xy-q-地 { background: linear-gradient(135deg, #a06439, #6b3c1a); color: #fff; }
.xy-wild-q-tag.xy-q-天 {
  background: linear-gradient(135deg, #d4af37, #8b6914);
  color: #fff;
  box-shadow: 0 0 6px rgba(212, 175, 55, 0.32);
}

.xy-wild-body {
  padding: 6px 12px 10px;
  border-top: 1px dashed rgba(160, 127, 72, 0.18);
  background: rgba(160, 127, 72, 0.04);
}
</style>
