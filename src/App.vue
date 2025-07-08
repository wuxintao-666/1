<template>
  <div class="doc-container">
    <!-- Sidebar Navigation -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2><i class="fas fa-book"></i> 文档目录</h2>
      </div>
      
      <div class="sidebar-search">
        <input 
          v-model="searchQuery" 
          @keyup.enter="searchKnowledge"
          placeholder="搜索知识点..."
          class="search-input"
        />
        <button @click="searchKnowledge" class="search-btn">
          <i class="fas fa-search"></i>
        </button>
      </div>
      
      <nav class="sidebar-nav">
        <div 
          v-for="(topic, key) in apiTopics" 
          :key="key"
          :class="['nav-item', { active: currentTopic === key }]"
          @click="selectTopic(key)"
        >
          <div class="nav-item-name">{{ topic.name }}</div>
          <div class="nav-item-desc">{{ topic.description }}</div>
        </div>
      </nav>
      
      <div class="sidebar-footer">
        <button 
          class="progressive-btn" 
          @click="toggleView"
        >
          <i class="fas fa-layer-group"></i> 
          {{ showProgressive ? '返回文档' : '渐进式文档' }}
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="doc-content">
      <transition name="fade" mode="out-in">
        <div :key="showProgressive ? 'progressive' : 'doc'">
          <div v-if="loading" class="loading-indicator">
            <i class="fas fa-spinner fa-spin"></i> 加载中...
          </div>
          <template v-else>
            <template v-if="!showProgressive">
              <h1>{{ apiTopics[currentTopic].name }}</h1>
              <div class="doc-body" v-html="apiTopics[currentTopic].contents[5]"></div>
            </template>
            <template v-else>
              <!-- Original Progressive Learning Interface -->
              <div class="container">
                <header>
                  <h1><i class="fas fa-book-open"></i> 渐进式披露系统</h1>
                  <p class="subtitle">根据用户在不同披露等级上的停留时间，智能判断用户是API新手还是经验丰富的开发者</p>
                </header>
                
                <div class="content">
                  <div class="left-panel">
                    <h2>选择学习主题</h2>
                    <div class="topic-selector">
                      <div 
                        v-for="(topic, key) in apiTopics" 
                        :key="key"
                        :class="['topic-item', { active: currentTopic === key }]"
                        @click="selectTopic(key)"
                      >
                        <div class="topic-name">{{ topic.name }}</div>
                        <div class="topic-desc">{{ topic.description }}</div>
                      </div>
                    </div>
                    
                    <div class="progress-container">
                      <div class="progress-bar">
                        <div class="progress-fill" :style="{ width: progressWidth + '%' }"></div>
                      </div>
                      <div class="levels">
                        <div 
                          v-for="level in 4" 
                          :key="level"
                          :class="['level', { active: currentLevel === level }]"
                        >
                          级别{{ level }}
                        </div>
                      </div>
                    </div>
                    
                    <div class="timer-display">
                      <p>当前级别停留时间: <span class="time-info">{{ currentTimer }}</span> 秒</p>
                      <p>级别1累计时间: <span class="time-info">{{ levelTimes[1] }}</span> 秒 | 级别2: <span class="time-info">{{ levelTimes[2] }}</span> 秒</p>
                      <p>级别3累计时间: <span class="time-info">{{ levelTimes[3] }}</span> 秒 | 级别4: <span class="time-info">{{ levelTimes[4] }}</span> 秒</p>
                      <p>总停留时间: <span class="time-info">{{ totalTime }}</span> 秒</p>
                    </div>
                  </div>
                  
                  <div class="right-panel">
                    <div class="function-display">
                      <div class="level-indicator">级别 {{ currentLevel }}/4</div>
                      <div class="function-name">{{ apiTopics[currentTopic].name }}</div>
                      
                      <div class="function-desc-container">
                        <div class="function-desc" v-html="apiTopics[currentTopic].contents[currentLevel]"></div>
                      </div>
                    </div>
                    
                    <div class="controls">
                      <div class="btn-group">
                        <button 
                          class="prev-btn" 
                          @click="prevLevel" 
                          :disabled="currentLevel === 1 || finished"
                        >
                          <i class="fas fa-arrow-left"></i> 上一级
                        </button>
                        <button 
                          class="next-btn" 
                          @click="nextLevel" 
                          :disabled="currentLevel === 4 || finished"
                        >
                          下一级 <i class="fas fa-arrow-right"></i>
                        </button>
                        <button 
                          v-if="currentLevel === 4 && !finished"
                          class="finish-btn" 
                          @click="finishReading"
                        >
                          <i class="fas fa-flag-checkered"></i> 阅览完毕
                        </button>
                      </div>
                      <button class="reset-btn" @click="reset">
                        <i class="fas fa-sync-alt"></i> 重新开始
                      </button>
                    </div>
                    
                    <div class="analysis">
                      <h2><i class="fas fa-chart-line"></i> 用户类型分析</h2>
                      <div 
                        :class="['user-type', userTypeClass, { show: userType }]"
                        v-if="userType"
                      >
                        {{ userType }}
                      </div>
                      <div class="analysis-desc" v-html="analysisDesc"></div>
                    </div>
                  </div>
                </div>
                
                <footer>
                  <p>基于 Judicious: API Documentation for Novices 论文概念设计 | 渐进式披露教学系统 | Vue3版本</p>
                </footer>
              </div>
            </template>
          </template>
        </div>
      </transition>
    </main>
  </div>
</template>

<script>
import axios from 'axios';
import { ref, computed, onMounted, onUnmounted } from 'vue'

export default {
  name: 'App',
  setup() {
    const showProgressive = ref(false)
    const loading = ref(false)
    const startLearning = ref(false)
    const timerEnabled = ref(false) // 新增计时器启用状态
    
    // 响应式数据
    const currentLevel = ref(1)
    const levelStartTime = ref(Date.now())
    const levelTimes = ref([0, 0, 0, 0, 0]) // 索引0不使用，1-4对应级别
    const finished = ref(false)
    const userType = ref('')
    const analysisDesc = ref('系统正在分析您在不同文档级别的行为模式。完成所有4个级别后，点击"阅览完毕"按钮，您将看到详细的用户类型分析报告。')
    const timerInterval = ref(null)
    const currentTime = ref(0) // 添加当前时间响应式变量来触发更新
    const searchQuery = ref('') // 新增搜索输入框的值
    
    // 添加多个API知识点
    const apiTopics = {
      'math.log': {
        name: 'math.log(x)',
        description: '数学对数函数',
        contents: {
          1: `
            <p>此函数计算一个数的对数。</p>
            <p style="margin-top: 20px; font-style: italic;">这是最基础的文档级别，只提供最简单的功能描述，适合完全的新手。</p>
          `,
          2: `
            <p>计算一个数的自然对数（以 e 为底）。</p>
            <p style="margin-top: 15px;"><strong>参数:</strong></p>
            <ul style="margin: 10px 0 20px 25px;">
              <li><code>x</code> - 要计算对数的数字</li>
            </ul>
            <p style="font-style: italic;">级别2添加了参数信息，帮助用户理解函数的基本输入。</p>
          `,
          3: `
            <p>返回 x 的自然对数（以 e 为底）。</p>
            
            <div class="function-diagram">
              <div class="param-box">
                <div class="param-label">x: number</div>
                <div class="param-arrow">→</div>
              </div>
              <div class="function-box">log</div>
              <div class="param-box">
                <div class="param-arrow">→</div>
                <div class="return-box">number</div>
              </div>
            </div>
            
            <p><strong>参数:</strong></p>
            <ul style="margin: 10px 0 20px 25px;">
              <li><code>x: number</code> - 必须大于0的数值</li>
            </ul>
            
            <p><strong>返回值:</strong></p>
            <ul style="margin: 10px 0 20px 25px;">
              <li><code>number</code> - x 的自然对数</li>
            </ul>
          `,
          4: `
            <p>返回 x 的自然对数（以 e 为底）或指定底数的对数。</p>
            
            <div class="function-diagram">
              <div class="param-box">
                <div class="param-label">x: number</div>
                <div class="param-arrow">→</div>
              </div>
              <div class="function-box">log</div>
              <div class="param-box">
                <div class="param-arrow">→</div>
                <div class="return-box">number</div>
              </div>
            </div>
            
            <p style="margin-top: 15px;"><i class="fas fa-exclamation-triangle"></i> <strong>副作用:</strong> 这是一个纯函数，无副作用</p>
            
            <p><strong>参数:</strong></p>
            <ul style="margin: 10px 0 10px 25px;">
              <li><code>x: number</code> - 必须大于0的数值</li>
              <li><code>[base]: number</code> - <i>(可选)</i> 对数的底数，默认为 e</li>
            </ul>
            
            <p><strong>返回值:</strong></p>
            <ul style="margin: 10px 0 20px 25px;">
              <li><code>number</code> - x 的自然对数，或指定底数的对数</li>
            </ul>
            
            <p><strong>示例:</strong></p>
            <pre style="background: #2c3e50; color: #ecf0f1; padding: 15px; border-radius: 8px; margin-top: 15px;">
math.log(10)     // 返回 ≈2.302
math.log(100, 10) // 返回 2</pre>
            
            <p style="margin-top: 15px; font-style: italic;">这是完整文档级别，提供所有详细信息，包括可选参数、示例和副作用说明。</p>
            <p style="margin-top: 20px; font-weight: bold; color: #9b59b6;">
              <i class="fas fa-info-circle"></i> 请点击"阅览完毕"按钮完成分析
            </p>
          `,
          5: `
            <h2>math.log(x)知识点总结</h2>
            <h3>基础概念:</h3>
            <p>此函数计算一个数的对数。</p>
            <h3>进阶理解:</h3>
            <p>计算一个数的自然对数（以 e 为底）。</p>
            <h3>高级应用:</h3>
            <p>返回 x 的自然对数（以 e 为底）或指定底数的对数。</p>
            <h3>专家分析:</h3>
            <p>这是一个纯函数，无副作用</p>
          `
        }
      },
      'array.map': {
        name: 'array.map(callback)',
        description: '数组映射函数',
        contents: {
          1: `
            <p>此函数对数组中的每个元素执行一个操作。</p>
            <p style="margin-top: 20px; font-style: italic;">这是最基础的文档级别，只提供最简单的功能描述，适合完全的新手。</p>
          `,
          2: `
            <p>创建一个新数组，其结果是该数组中的每个元素调用提供的函数后的返回值。</p>
            <p style="margin-top: 15px;"><strong>参数:</strong></p>
            <ul style="margin: 10px 0 20px 25px;">
              <li><code>callback</code> - 用于测试每个元素的函数</li>
            </ul>
            <p style="font-style: italic;">级别2添加了参数信息，帮助用户理解函数的基本输入。</p>
          `,
          3: `
            <p>返回一个新数组，包含原数组中的每个元素调用回调函数后的结果。</p>
            
            <div class="function-diagram">
              <div class="param-box">
                <div class="param-label">array: any[]</div>
                <div class="param-arrow">→</div>
              </div>
              <div class="function-box">map</div>
              <div class="param-box">
                <div class="param-arrow">→</div>
                <div class="return-box">any[]</div>
              </div>
            </div>
            
            <p><strong>参数:</strong></p>
            <ul style="margin: 10px 0 20px 25px;">
              <li><code>callback: function</code> - 用于测试每个元素的函数</li>
            </ul>
            
            <p><strong>返回值:</strong></p>
            <ul style="margin: 10px 0 20px 25px;">
              <li><code>array</code> - 新数组，包含回调函数的返回值</li>
            </ul>
          `,
          4: `
            <p>创建一个新数组，其结果是该数组中的每个元素调用提供的函数后的返回值。</p>
            
            <div class="function-diagram">
              <div class="param-box">
                <div class="param-label">array: any[]</div>
                <div class="param-arrow">→</div>
              </div>
              <div class="function-box">map</div>
              <div class="param-box">
                <div class="param-arrow">→</div>
                <div class="return-box">any[]</div>
              </div>
            </div>
            
            <p style="margin-top: 15px;"><i class="fas fa-exclamation-triangle"></i> <strong>副作用:</strong> 不会修改原数组，返回新数组</p>
            
            <p><strong>参数:</strong></p>
            <ul style="margin: 10px 0 10px 25px;">
              <li><code>callback: function(element, index, array)</code> - 用于测试每个元素的函数</li>
              <li><code>[thisArg]: any</code> - <i>(可选)</i> 执行回调时使用的this值</li>
            </ul>
            
            <p><strong>返回值:</strong></p>
            <ul style="margin: 10px 0 20px 25px;">
              <li><code>array</code> - 新数组，包含回调函数的返回值</li>
            </ul>
            
            <p><strong>示例:</strong></p>
            <pre style="background: #2c3e50; color: #ecf0f1; padding: 15px; border-radius: 8px; margin-top: 15px;">
[1, 2, 3].map(x => x * 2)     // 返回 [2, 4, 6]
['a', 'b'].map((x, i) => i + x) // 返回 ['0a', '1b']</pre>
            
            <p style="margin-top: 15px; font-style: italic;">这是完整文档级别，提供所有详细信息，包括可选参数、示例和副作用说明。</p>
            <p style="margin-top: 20px; font-weight: bold; color: #9b59b6;">
              <i class="fas fa-info-circle"></i> 请点击"阅览完毕"按钮完成分析
            </p>
          `,
          5: `
            <h2>array.map(callback)知识点总结</h2>
            <h3>基础概念:</h3>
            <p>此函数对数组中的每个元素执行一个操作。</p>
            <h3>进阶理解:</h3>
            <p>创建一个新数组，其结果是该数组中的每个元素调用提供的函数后的返回值。</p>
            <h3>高级应用:</h3>
            <p>返回一个新数组，包含原数组中的每个元素调用回调函数后的结果。</p>
            <h3>专家分析:</h3>
            <p>不会修改原数组，返回新数组</p>
          `
        }
      },
      'string.split': {
        name: 'string.split(separator)',
        description: '字符串分割函数',
        contents: {
          1: `
            <p>此函数将字符串分割成数组。</p>
            <p style="margin-top: 20px; font-style: italic;">这是最基础的文档级别，只提供最简单的功能描述，适合完全的新手。</p>
          `,
          2: `
            <p>使用指定的分隔符将字符串分割成子字符串数组。</p>
            <p style="margin-top: 15px;"><strong>参数:</strong></p>
            <ul style="margin: 10px 0 20px 25px;">
              <li><code>separator</code> - 分隔符字符串</li>
            </ul>
            <p style="font-style: italic;">级别2添加了参数信息，帮助用户理解函数的基本输入。</p>
          `,
          3: `
            <p>返回一个字符串数组，该数组是通过在指定的分隔符字符串处分割原字符串而创建的。</p>
            
            <div class="function-diagram">
              <div class="param-box">
                <div class="param-label">string: string</div>
                <div class="param-arrow">→</div>
              </div>
              <div class="function-box">split</div>
              <div class="param-box">
                <div class="param-arrow">→</div>
                <div class="return-box">string[]</div>
              </div>
            </div>
            
            <p><strong>参数:</strong></p>
            <ul style="margin: 10px 0 20px 25px;">
              <li><code>separator: string</code> - 分隔符字符串</li>
            </ul>
            
            <p><strong>返回值:</strong></p>
            <ul style="margin: 10px 0 20px 25px;">
              <li><code>array</code> - 分割后的字符串数组</li>
            </ul>
          `,
          4: `
            <p>使用指定的分隔符将字符串分割成子字符串数组。</p>
            
            <div class="function-diagram">
              <div class="param-box">
                <div class="param-label">string: string</div>
                <div class="param-arrow">→</div>
              </div>
              <div class="function-box">split</div>
              <div class="param-box">
                <div class="param-arrow">→</div>
                <div class="return-box">string[]</div>
              </div>
            </div>
            
            <p style="margin-top: 15px;"><i class="fas fa-exclamation-triangle"></i> <strong>副作用:</strong> 不会修改原字符串，返回新数组</p>
            
            <p><strong>参数:</strong></p>
            <ul style="margin: 10px 0 10px 25px;">
              <li><code>separator: string</code> - 分隔符字符串</li>
              <li><code>[limit]: number</code> - <i>(可选)</i> 限制返回数组的长度</li>
            </ul>
            
            <p><strong>返回值:</strong></p>
            <ul style="margin: 10px 0 20px 25px;">
              <li><code>array</code> - 分割后的字符串数组</li>
            </ul>
            
            <p><strong>示例:</strong></p>
            <pre style="background: #2c3e50; color: #ecf0f1; padding: 15px; border-radius: 8px; margin-top: 15px;">
"a,b,c".split(",")     // 返回 ["a", "b", "c"]
"hello".split("")      // 返回 ["h", "e", "l", "l", "o"]
"a,b,c".split(",", 2)  // 返回 ["a", "b"]</pre>
            
            <p style="margin-top: 15px; font-style: italic;">这是完整文档级别，提供所有详细信息，包括可选参数、示例和副作用说明。</p>
            <p style="margin-top: 20px; font-weight: bold; color: #9b59b6;">
              <i class="fas fa-info-circle"></i> 请点击"阅览完毕"按钮完成分析
            </p>
          `,
          5: `
            <h2>string.split(separator)知识点总结</h2>
            <h3>基础概念:</h3>
            <p>此函数将字符串分割成数组。</p>
            <h3>进阶理解:</h3>
            <p>使用指定的分隔符将字符串分割成子字符串数组。</p>
            <h3>高级应用:</h3>
            <p>返回一个字符串数组，该数组是通过在指定的分隔符字符串处分割原字符串而创建的。</p>
            <h3>专家分析:</h3>
            <p>不会修改原字符串，返回新数组</p>
          `
        }
      },
      'object.keys': {
        name: 'Object.keys(obj)',
        description: '对象键获取函数',
        contents: {
          1: `
            <p>此函数获取对象的所有键名。</p>
            <p style="margin-top: 20px; font-style: italic;">这是最基础的文档级别，只提供最简单的功能描述，适合完全的新手。</p>
          `,
          2: `
            <p>返回一个由指定对象的所有可枚举属性的键名组成的数组。</p>
            <p style="margin-top: 15px;"><strong>参数:</strong></p>
            <ul style="margin: 10px 0 20px 25px;">
              <li><code>obj</code> - 要获取键名的对象</li>
            </ul>
            <p style="font-style: italic;">级别2添加了参数信息，帮助用户理解函数的基本输入。</p>
          `,
          3: `
            <p>返回一个数组，包含指定对象的所有可枚举属性的键名。</p>
            
            <div class="function-diagram">
              <div class="param-box">
                <div class="param-label">obj: object</div>
                <div class="param-arrow">→</div>
              </div>
              <div class="function-box">keys</div>
              <div class="param-box">
                <div class="param-arrow">→</div>
                <div class="return-box">string[]</div>
              </div>
            </div>
            
            <p><strong>参数:</strong></p>
            <ul style="margin: 10px 0 20px 25px;">
              <li><code>obj: object</code> - 要获取键名的对象</li>
            </ul>
            
            <p><strong>返回值:</strong></p>
            <ul style="margin: 10px 0 20px 25px;">
              <li><code>array</code> - 包含对象键名的字符串数组</li>
            </ul>
          `,
          4: `
            <p>返回一个数组，包含指定对象的所有可枚举属性的键名。</p>
            
            <div class="function-diagram">
              <div class="param-box">
                <div class="param-label">obj: object</div>
                <div class="param-arrow">→</div>
              </div>
              <div class="function-box">keys</div>
              <div class="param-box">
                <div class="param-arrow">→</div>
                <div class="return-box">string[]</div>
              </div>
            </div>
            
            <p style="margin-top: 15px;"><i class="fas fa-exclamation-triangle"></i> <strong>副作用:</strong> 不会修改原对象，返回新数组</p>
            
            <p><strong>参数:</strong></p>
            <ul style="margin: 10px 0 10px 25px;">
              <li><code>obj: object</code> - 要获取键名的对象</li>
            </ul>
            
            <p><strong>返回值:</strong></p>
            <ul style="margin: 10px 0 20px 25px;">
              <li><code>array</code> - 包含对象键名的字符串数组</li>
            </ul>
            
            <p><strong>示例:</strong></p>
            <pre style="background: #2c3e50; color: #ecf0f1; padding: 15px; border-radius: 8px; margin-top: 15px;">
Object.keys({a: 1, b: 2})     // 返回 ["a", "b"]
Object.keys([1, 2, 3])        // 返回 ["0", "1", "2"]
Object.keys("hello")           // 返回 ["0", "1", "2", "3", "4"]</pre>
            
            <p style="margin-top: 15px; font-style: italic;">这是完整文档级别，提供所有详细信息，包括可选参数、示例和副作用说明。</p>
            <p style="margin-top: 20px; font-weight: bold; color: #9b59b6;">
              <i class="fas fa-info-circle"></i> 请点击"阅览完毕"按钮完成分析
            </p>
          `,
          5: `
            <h2>Object.keys(obj)知识点总结</h2>
            <h3>基础概念:</h3>
            <p>此函数获取对象的所有键名。</p>
            <h3>进阶理解:</h3>
            <p>返回一个由指定对象的所有可枚举属性的键名组成的数组。</p>
            <h3>高级应用:</h3>
            <p>返回一个数组，包含指定对象的所有可枚举属性的键名。</p>
            <h3>专家分析:</h3>
            <p>不会修改原对象，返回新数组</p>
          `
        }
      }
    }

    // 当前选中的API主题
    const currentTopic = ref('math.log')

    // 计算属性
    const currentTimer = computed(() => {
      if (finished.value) return 0
      // 添加currentTime.value作为依赖，确保计算属性会重新计算
      currentTime.value
      return Math.floor((Date.now() - levelStartTime.value) / 1000)
    })
    
    const totalTime = computed(() => {
      return levelTimes.value.reduce((sum, time) => sum + time, 0)
    })
    
    const progressWidth = computed(() => {
      return (currentLevel.value - 1) * 33.33
    })
    
    const userTypeClass = computed(() => {
      if (userType.value.includes('新手')) return 'beginner'
      if (userType.value.includes('中级')) return 'intermediate'
      if (userType.value.includes('专家')) return 'expert'
      return ''
    })

    // 方法
    const recordCurrentLevelTime = () => {
      if (finished.value) return
      const currentTime = Math.floor((Date.now() - levelStartTime.value) / 1000)
      levelTimes.value[currentLevel.value] += currentTime
    }

    const switchLevel = (newLevel) => {
      if (finished.value) return
      
      recordCurrentLevelTime()
      currentLevel.value = newLevel
      levelStartTime.value = Date.now()
    }

    const nextLevel = () => {
      if (currentLevel.value < 4) {
        switchLevel(currentLevel.value + 1)
      }
    }

    const prevLevel = () => {
      if (currentLevel.value > 1) {
        switchLevel(currentLevel.value - 1)
      }
    }

    const finishReading = () => {
      recordCurrentLevelTime()
      finished.value = true
      analyzeUserType()
    }

    const analyzeUserType = () => {
      const basicLevelTime = levelTimes.value[1] + levelTimes.value[2]
      const advancedLevelTime = levelTimes.value[3] + levelTimes.value[4]
      const totalTime = basicLevelTime + advancedLevelTime
      
      const basicRatio = totalTime > 0 ? basicLevelTime / totalTime : 0
      
      if (totalTime === 0) {
        userType.value = '未检测到数据'
        analysisDesc.value = '请在不同级别上停留一段时间以获得分析结果。'
      } else if (basicRatio > 0.7) {
        userType.value = 'API新手'
        analysisDesc.value = `您在基础级别（1-2级）累计停留了${basicLevelTime}秒（占总时间${Math.round(basicRatio*100)}%），表明您可能需要更多时间来理解API的基本概念和参数。建议从基础API文档开始学习，逐步提升。`
      } else if (basicRatio > 0.4) {
        userType.value = '中级开发者'
        analysisDesc.value = `您的时间分配比较均衡（基础级别：${basicLevelTime}秒，高级别：${advancedLevelTime}秒）。您对API有基本了解，但可能在某些高级概念上需要更多时间。`
      } else {
        userType.value = 'API专家'
        analysisDesc.value = `您快速通过基础级别（仅${basicLevelTime}秒），并在高级别停留了${advancedLevelTime}秒（占总时间${Math.round((1-basicRatio)*100)}%）。这表明您对API基础非常熟悉，更关注高级功能和细节。`
      }
      
      analysisDesc.value += '<p style="margin-top:15px;color:#9b59b6;font-weight:bold;"><i class="fas fa-check-circle"></i> 分析已完成！</p>'
    }

    const reset = () => {
      // 重置所有级别时间为0
      levelTimes.value = [0, 0, 0, 0, 0]
      
      currentLevel.value = 1
      finished.value = false
      levelStartTime.value = Date.now()
      currentTime.value = Date.now()  // 强制更新当前时间
      
      // 重置用户类型分析
      userType.value = ''
      analysisDesc.value = '系统正在分析您在不同文档级别的行为模式。完成所有4个级别后，点击"阅览完毕"按钮，您将看到详细的用户类型分析报告。'
    }

    const selectTopic = (topicKey) => {
      // 重置所有级别时间为0
      levelTimes.value = [0, 0, 0, 0, 0]
      
      currentTopic.value = topicKey
      currentLevel.value = 1 // 切换主题时重置到第一级
      finished.value = false // 切换主题时重置完成状态
      levelStartTime.value = Date.now() // 切换主题时重置开始时间
      currentTime.value = Date.now() // 强制更新当前时间
      
      // 重置用户类型分析
      userType.value = ''
      analysisDesc.value = '系统正在分析您在不同文档级别的行为模式。完成所有4个级别后，点击"阅览完毕"按钮，您将看到详细的用户类型分析报告。'
    }

    const toggleView = () => {
      startLearning.value = false
      loading.value = true
      showProgressive.value = !showProgressive.value
      
      // 重置所有时间相关状态
      if (showProgressive.value) {
        levelTimes.value = [0, 0, 0, 0, 0]
        levelStartTime.value = Date.now()
        currentTime.value = Date.now()
        finished.value = false
        userType.value = ''
        analysisDesc.value = '系统正在分析您在不同文档级别的行为模式...'
      }
      
      timerEnabled.value = showProgressive.value
      
      setTimeout(() => {
        loading.value = false
      }, 300)
    }
    
    // 生命周期
    onMounted(() => {
      timerInterval.value = setInterval(() => {
        // 只在计时器启用时更新时间
        if (timerEnabled.value) {
          currentTime.value = Date.now()
        }
      }, 1000)
    })

    onUnmounted(() => {
      if (timerInterval.value) {
        clearInterval(timerInterval.value)
      }
    })

    const searchKnowledge = async () => {
      if (!searchQuery.value.trim()) return;
      
      loading.value = true;
      
      try {
        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: '你是一个知识检索助手，请严格按照JSON格式返回四级知识点，包含以下字段：\n1. basic(基础概念)\n2. intermediate(进阶理解)\n3. advanced(高级应用)\n4. expert(专家分析)\n只返回纯JSON内容，不要任何解释或标记'
            },
            {
              role: 'user',
              content: `请提供关于"${searchQuery.value}"的四级知识点，按以下要求：\n1. basic: 简单定义(50字内)\n2. intermediate: 详细说明(100字)\n3. advanced: 实际应用案例\n4. expert: 深入分析和见解`
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.7
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer sk-c4f33ed515e64ffea0b457753a147678'
          }
        });
        
        // 解析JSON响应
        const result = JSON.parse(response.data.choices[0].message.content);
        
        const topicKey = `search_${Date.now()}`;
        apiTopics[topicKey] = {
          name: `搜索结果: ${searchQuery.value}`,
          description: '来自DeepSeek的知识点',
          contents: {
            1: result.basic || '暂无基础概念内容',
            2: result.intermediate || '暂无进阶理解内容',
            3: result.advanced || '暂无高级应用内容',
            4: result.expert || '暂无专家分析内容',
            5: `<h2>${searchQuery.value}知识点总结</h2>
              <h3>基础概念:</h3>
              <p>${result.basic || '暂无'}</p>
              <h3>进阶理解:</h3>
              <p>${result.intermediate || '暂无'}</p>
              <h3>高级应用:</h3>
              <p>${result.advanced || '暂无'}</p>
              <h3>专家分析:</h3>
              <p>${result.expert || '暂无'}</p>`
          }
        };
        
        selectTopic(topicKey);
        showProgressive.value = true;
      } catch (error) {
        console.error('搜索出错:', error);
      } finally {
        loading.value = false;
      }
    };

    return {
      showProgressive,
      loading,
      startLearning,
      currentLevel,
      levelTimes,
      finished,
      userType,
      analysisDesc,
      currentTimer,
      totalTime,
      progressWidth,
      userTypeClass,
      nextLevel,
      prevLevel,
      finishReading,
      reset,
      apiTopics,
      currentTopic,
      selectTopic,
      toggleView,
      searchQuery,
      searchKnowledge
    }
  }
}
</script>

<style scoped>
.sidebar-search {
  padding: 15px;
  display: flex;
  gap: 8px;
  border-bottom: 1px solid #e1e1e1;
}

.search-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.search-btn {
  padding: 8px 12px;
  background: #4a6fa5;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.search-btn:hover {
  background: #3a5a8f;
}
</style>