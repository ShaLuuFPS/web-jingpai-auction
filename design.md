# 竞拍系统 — 设计规范

> **基因来源**: Stripe 设计语言共性基因提取  
> **版本**: v1.0  
> **最后更新**: 2026-06-28

---

## 1. 配色

### 1.1 色板

| Token | 色值 | 用途 |
|-------|------|------|
| **主色 Primary** | `#635BFF` | CTA 按钮、链接、focus ring、激活态 |
| **主色 Hover** | `#0A2540` | Primary 按钮 hover 态 |
| **主色 Hover-alt** | `#4F49CC` | 链接 hover、移动端按钮 hover |
| **主色浅底** | `#EEF2FF` | 激活标签背景、通知栏背景 |
| **语义-危险** | `#FF6B6B` | 删除按钮、错误提示、倒计时 ≤30s |
| **语义-成功** | `#22C55E` | 成功消息、启用状态标签 |
| **背景-页面** | `#F8F9FB` | 全站页面底色 |
| **背景-卡片** | `#FFFFFF` | 所有卡片/容器背景 |
| **背景-hover** | `#F3F4F6` | 表格行 hover、灰色标签背景 |
| **文字-主** | `#111827` | 标题、核心数据、重要文字 |
| **文字-正文** | `#6B7280` | 描述文字、表格内容 |
| **文字-辅助** | `#9CA3AF` | 占位符、次要标注、时间戳 |
| **文字-反色** | `#FFFFFF` | 深色/紫色按钮上的文字 |
| **边框-默认** | `#E5E7EB` | 卡片边框、表格分割线 |
| **边框-输入框** | `#E0E6EB` | 输入框/下拉框默认边框 |
| **边框-focus** | `#635BFF` | 输入框 focus 边框色 |

### 1.2 灰度阶

使用 Tailwind **neutral gray**（`gray`），**不使用** `slate`（蓝灰）或 `zinc`。

| 灰阶 | 用途 |
|------|------|
| `gray-50` (`#F9FAFB`) | 当前出价信息区背景、表格行 hover |
| `gray-100` (`#F3F4F6`) | 中性标签背景、页面底 |
| `gray-200` (`#E5E7EB`) | 边框默认色 |
| `gray-400` (`#9CA3AF`) | 辅助文字 |
| `gray-500` (`#6B7280`) | 正文 |
| `gray-900` (`#111827`) | 主文字 |

### 1.3 颜色使用规则

- **价格/金额**: 用 `text-gray-900 font-semibold`，不用红色。红色仅用于错误和倒计时紧迫状态。
- **出价按钮**: 唯一 Primary 紫色按钮。每个视图中最多一个 Primary 按钮。
- **"竞拍中"标签**: 唯一有彩色的状态标签（`bg-[#EEF2FF] text-[#635BFF]`），其余状态标签统一灰色。
- **错误提示**: 红底 `bg-red-50` + `border-[#FF6B6B]/30`，图标用 SVG 不用 emoji。

---

## 2. 字体

### 2.1 字体家族

```css
font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
```

通过 `next/font/google` 加载 Inter，`subsets: ["latin"]`，`display: "swap"`。

### 2.2 字号层级

| 层级 | 大小 | 字重 | 行高 | 用途 |
|------|------|------|------|------|
| **核心数据** | `32px` (`text-[32px]`) | `700` | 1.2 | 当前出价 ¥XX,XXX、KPI 数字 |
| **页面标题** | `28px` (`text-[28px]`) | `600` | 1.25 | 页面大标题，`tracking-tight` |
| **卡片标题** | `18px` (`text-lg`) | `600` | 1.4 | 拍卖卡片车辆名 |
| **区块标题** | `16px` (`text-base`) | `600` | 1.4 | 出价记录、价格走势等区块标题 |
| **正文** | `14px` (`text-sm`) | `400` | 1.5 | 描述文字、表格内容、标签 |
| **辅助/标签** | `12px` (`text-xs`) | `500` | 1.4 | 状态标签、输入框标签 |
| **微文本** | `11px` | `400` | 1.4 | 时间轴标签、页脚注释 |

### 2.3 其他字体规则

- 表头: `text-xs font-medium text-gray-400 uppercase tracking-wider`
- 等宽数字: `font-mono tabular-nums` — 用于倒计时、价格、出价次数等需要对齐的数字
- 页面标题统一使用 `tracking-tight`（`-0.02em`）
- `-webkit-font-smoothing: antialiased` 全局开启

---

## 3. 间距与留白

### 3.1 基准网格

**8px 基准网格**。所有间距取 8 的倍数。

### 3.2 常用间距速查

| Token | 值 | Tailwind | 用途 |
|-------|-----|----------|------|
| `space-xs` | 4px | `gap-1` | 图标与文字紧贴 |
| `space-sm` | 8px | `gap-2` | 行内元素间距 |
| `space-md` | 12px | `gap-3` | 按钮组间距 |
| `space-lg` | 16px | `gap-4` / `p-4` | 紧凑卡片内边距 |
| `space-xl` | 20px | `space-y-5` | 表单字段间距 |
| `space-2xl` | 24px | `gap-6` / `p-6` | 卡片网格间距 / 卡片内边距 |
| `space-3xl` | 32px | `mb-8` | 页面标题到内容区 |
| `space-4xl` | 48px | `py-12` | 页面上下留白（桌面） |

### 3.3 页面布局

```css
/* 主内容区 */
main {
  padding-top: 24px;     /* py-6，移动端 */
  padding-bottom: 24px;
  padding-left: 16px;    /* px-4 */
  padding-right: 16px;
  max-width: 1280px;     /* max-w-7xl */
  margin: 0 auto;        /* container mx-auto */
}

@media (min-width: 768px) {
  main {
    padding-top: 48px;   /* md:py-12，桌面端 */
    padding-bottom: 48px;
  }
}
```

### 3.4 导航栏

| 场景 | 高度 | 样式 |
|------|------|------|
| 前台页面 | `60px` (`h-14 md:h-[60px]`) | `bg-white/85 backdrop-blur-md` |
| 后台管理 | `56px` (`h-14`) | `bg-white` |
| 登录页 | `60px` | `bg-transparent`（透出光晕背景） |

导航栏底部统一 `border-b border-gray-100`（登录页除外）。

页面内容需添加对应高度的 spacer，防止被固定导航遮挡。

---

## 4. 组件样式

### 4.1 圆角规范

| 元素 | 圆角 | Tailwind |
|------|------|----------|
| 卡片/容器 | `16px` | `rounded-2xl` |
| 按钮 | `8px` | `rounded-lg` |
| 输入框/下拉框 | `8px` | `rounded-lg` |
| 小元素（计数芯片等）| `6px` | `rounded-md` |
| 标签/徽章 | `9999px` | `rounded-full` |
| 表格容器 | `16px` | `rounded-2xl` |

### 4.2 阴影系统

| 层级 | 阴影值 | 使用场景 |
|------|--------|----------|
| **卡片** | `0 1px 2px rgba(0,0,0,0.04)` | 所有卡片、表格容器 |
| **卡片 hover** | `0 4px 12px rgba(0,0,0,0.06)` | 卡片 hover 上浮效果 |
| **浮层** | `0 -4px 16px rgba(0,0,0,0.06)` | 移动端出价底栏 |
| **登录卡片** | `0 50px 100px -20px rgba(50,50,93,0.1), 0 30px 60px -30px rgba(0,0,0,0.15)` | 仅登录页卡片 |

- 阴影极度克制。不叠加多层阴影。
- 卡片默认用 **1px 灰色边框**（`border border-gray-100`）而非仅靠阴影区分边界。

### 4.3 按钮

#### Primary（主要操作）

```css
bg-[#635BFF] text-white rounded-lg px-4 py-2.5 text-sm font-medium
hover:bg-[#0A2540] hover:-translate-y-px
hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]
active:translate-y-0
transition-all duration-150 ease-out
```

用于：出价、登录、创建/保存等唯一正向操作。每个视图最多一个 Primary 按钮。

#### Secondary（次要操作）

```css
bg-white border border-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium
hover:border-[#635BFF] hover:text-[#635BFF]
transition-all duration-150
```

用于：查看详情、取消、返回、快速出价按钮。

#### Danger（危险操作）

```css
bg-[#FF6B6B] text-white rounded-lg px-4 py-2 text-sm font-medium
hover:bg-[#e55]
transition-colors
```

用于：删除、结束拍卖。

#### Ghost / Link

```css
text-[#635BFF] hover:text-[#4F49CC] text-sm font-medium
transition-colors
```

用于表格中的操作链接、导航链接。

### 4.4 输入框

```css
/* 默认 */
border border-[#E0E6EB] rounded-lg px-3 py-2.5 text-sm
text-gray-900 placeholder:text-gray-400
bg-white
transition-all duration-200

/* Focus */
border-[#635BFF]
box-shadow: 0 0 0 4px rgba(99, 91, 255, 0.15)
outline: none

/* Error */
border-[#FF6B6B]
box-shadow: 0 0 0 4px rgba(255, 107, 107, 0.15)
```

- 输入框高度 42-44px（`py-2.5`），保证触控友好
- 标签在输入框上方，`text-sm font-medium text-gray-700 mb-1.5`
- 下拉框（`<select>`）样式同输入框，`bg-white`

### 4.5 卡片

```css
bg-white rounded-2xl border border-gray-100 p-6
box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04)
```

- 卡片内部区块分隔用 `border-t border-gray-100 pt-5 mt-5`
- 卡片标题 `font-semibold text-base text-gray-900 mb-4`
- 空状态卡片居中，灰色 SVG 图标 + `text-gray-500/400`

### 4.6 表格

```css
/* 容器 */
bg-white rounded-2xl border border-gray-100 overflow-hidden
box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04)

/* 表头 */
border-b border-gray-100
th: text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider

/* 数据行 */
border-b border-gray-50 hover:bg-gray-50/50 transition-colors
td: py-3 px-4

/* 无纵向分割线，无表头背景色 */
```

- 文字列左对齐，数字/金额列右对齐并 `tabular-nums`
- 操作链接用 `text-[#635BFF]`，分隔符用 `text-gray-200`

### 4.7 状态标签（Badge）

```css
/* 激活/进行中（唯一有彩色） */
bg-[#EEF2FF] text-[#635BFF]

/* 中性（预告、待开始、已结束） */
bg-gray-100 text-gray-500

/* 成功（可售、启用） */
bg-green-50 text-green-700

/* 危险（禁用、错误） */
bg-red-50 text-[#FF6B6B]

/* 通用 */
inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full
```

### 4.8 错误/消息提示

```css
/* 错误 */
bg-red-50 border border-[#FF6B6B]/30 rounded-lg px-4 py-3
内部用 SVG 图标（圆形感叹号）+ text-sm text-[#FF6B6B]

/* 成功 */
bg-green-50 border border-green-200 rounded-lg px-4 py-3
```

### 4.9 Focus Ring（全局）

```css
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: none;
  border-color: #635BFF;
  box-shadow: 0 0 0 4px rgba(99, 91, 255, 0.15);
}
```

### 4.10 导航栏

- **Logo**: 纯文字 "竞拍系统"，`text-[#635BFF] font-semibold tracking-tight`，无 emoji
- **前台链接**: `text-sm font-medium text-gray-500 hover:text-gray-900`
- **登录链接**: `text-sm font-medium text-[#635BFF]`
- **退出按钮**: `text-sm text-gray-400 hover:text-[#FF6B6B]`
- **后台侧栏**: `bg-white rounded-2xl border border-gray-100 p-4`，每组用 `text-xs text-gray-400 uppercase tracking-wider` 做分类标题，链接 `text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg`

---

## 5. 页面专属规则

### 5.1 登录页

- 全屏暖色渐变光晕：`fixed inset-0`，`blur(100px)`，`opacity-0.5`
  - 四层 radial-gradient：暖橙 `rgba(255,120,80,0.45)` + 金 `rgba(255,180,60,0.45)` + 紫 `rgba(99,91,255,0.35)` + 粉 `rgba(200,60,180,0.35)`
- 导航栏 `bg-transparent`（透出光晕）
- 登录卡片使用专用重阴影

### 5.2 拍卖详情页

- 左栏（车辆信息+出价记录）60%，右栏（图表+出价面板）40%（`md:w-80 lg:w-96`）
- 移动端出价栏固定在底部，阴影 `0 -4px 16px rgba(0,0,0,0.06)`
- 倒计时 >30s 正常灰色，≤30s 变 `text-[#FF6B6B] animate-pulse`

### 5.3 管理后台

- 左侧导航 `w-48`（桌面端），移动端无侧栏
- 导航栏用纯白 `bg-white`（非透明模糊）

---

## 6. 禁止事项

| 禁止 | 替代方案 |
|------|----------|
| emoji 用作图标 | Lucide 图标库 或 SVG inline |
| `text-red-600` 用于价格 | `text-gray-900 font-semibold` |
| `bg-blue-*` 用于按钮/链接 | `bg-[#635BFF]` / `text-[#635BFF]` |
| Tailwind `slate` 灰阶 | 使用 `gray` 灰阶 |
| 默认 `focus:ring-2` | 统一用 4px 紫色 `ring-4 ring-[#635BFF]/15` |
| 多个 Primary 按钮同一视图 | 每个视图最多 1 个 Primary |
| `rounded-lg` 用于卡片 | 卡片用 `rounded-2xl` |
| 重阴影/多层阴影 | 使用文内定义的四级阴影 |
| `font-bold`（700）用于正文 | 正文用 `font-medium`(500) 或 `font-semibold`(600) |

---

> **适用规则**: 此后所有新页面和组件修改，必须先对照本文档，确保颜色/间距/字号/圆角/阴影与全局一致。
