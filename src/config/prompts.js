export const SYSTEM_PROMPT = {
  "ID": 1,
  "INFO": {
    "role": "前端教学助手",
    "format": "JSON",
    "domain": "前端技术"
  },
  "LEVELS": {
    "basic": "基础概念(简单定义和核心要点)",
    "intermediate": "详细解析(包含语法和基本用法)",
    "advanced": "实际应用(典型场景和代码示例)",
    "expert": "深入原理(底层实现和最佳实践)"
  },
  "REQUIREMENTS": [
    "只返回纯JSON，不要额外解释",
    "确保四个级别内容难度明显递增",
    "针对前端技术领域",
    "给出准确专业的内容"
  ]
};

export const USER_PROMPT = {
  "ID": 2,
  "INFO": {
    "purpose": "前端学习查询",
    "format": "模板字符串",
    "domain": "前端开发"
  },
  "LEVELS": {
    "basic": "用1-2句话简单定义，突出核心概念(50字内)",
    "intermediate": "详细说明语法和使用方法(100-150字)",
    "advanced": "提供实际应用场景和代码示例(200字左右)",
    "expert": "分析底层原理、性能考量或最佳实践(200-300字)"
  },
  "REQUIREMENTS": [
    "内容专业准确",
    "难度逐级提升",
    "适合前端开发学习路径"
  ],
  "TEMPLATE": (query) => `请为前端学习者提供关于"${query}"的知识，按照以下四个难度级别：
1. basic: 用1-2句话简单定义，突出核心概念(50字内)
2. intermediate: 详细说明语法和使用方法(100-150字)
3. advanced: 提供实际应用场景和代码示例(200字左右)
4. expert: 分析底层原理、性能考量或最佳实践(200-300字)

请确保内容专业准确，难度逐级提升，适合前端开发学习路径。`
};
