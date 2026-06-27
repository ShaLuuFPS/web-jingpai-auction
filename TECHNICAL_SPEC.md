# 车辆竞拍系统 — 技术规格文档

> **版本**: v1.0  
> **日期**: 2026-06-27  
> **状态**: 已确认，待开发  

---

## 1. 项目概述

面向公司内部的**小型二手车在线竞拍系统**。支持局域网直连访问和外网穿透访问，适配手机端和电脑端。第一版聚焦核心竞拍流程，不做花哨设计。

### 1.1 核心约束

| 约束 | 决策 |
|------|------|
| 部署成本 | 完全免费，不买域名 |
| 网络 | 局域网 IP 直连 + Cloudflare Tunnel 外网穿透 |
| 支付 | 模拟支付（点击弹窗"支付成功"） |
| 账户 | 管理员创建，不开放注册 |
| 设计 | 优先功能，Tailwind 默认样式即可 |

---

## 2. 技术栈

| 层 | 选型 | 版本/说明 |
|----|------|-----------|
| 全栈框架 | **Next.js** | App Router, Custom Server |
| 数据库 | **SQLite** | 零配置，单文件 |
| ORM | **Prisma** | 类型安全，自动迁移 |
| 实时通信 | **Socket.IO** | 附着在 Next.js 同一端口 |
| CSS | **Tailwind CSS** | 移动优先响应式 |
| 认证 | **iron-session** | Session + Cookie，服务端可控 |
| 内网穿透 | **Cloudflare Tunnel** | cloudflared，免费 HTTPS |
| 运行时 | **Node.js 18+** | |

---

## 3. 竞拍业务规则

### 3.1 拍卖模式：英式拍卖 + 软关闭

- **英式拍卖**：从起拍价开始，买家逐次加价，价高者得
- **软关闭 (Soft Close)**：每次出价倒计时自动重置（默认 120 秒），倒计时归零才真正结束
- **加价幅度**：最低 100 RMB（`vehicles.min_bid_increment`）

### 3.2 出价规则

- 出价金额 ≥ 当前最高价 + 加价幅度
- 5 个快捷按钮：+100 / +200 / +500 / +1000 / +2000
- 支持自由输入自定义金额
- 出价前弹窗确认（"确认出价 ¥XX,XXX？"）
- **并发冲突处理**：数据库事务 + 乐观锁，先到者得。后来者收到"已被超越"提示

### 3.3 出价并发流程（关键）

```
1. 收到出价请求
2. 开启数据库事务
3. SELECT current_highest_bid FROM auctions WHERE id = ? FOR UPDATE (行锁)
4. 校验: 出价 >= current_highest_bid + min_bid_increment
5. 通过 → INSERT INTO bids + UPDATE auctions SET current_highest_bid, current_winner_id, bid_count+1
6. 提交事务
7. 广播 WebSocket: { type: 'NEW_BID', auction_id, amount, user, bid_count }
8. 广播倒计时重置: { type: 'TIMER_RESET', auction_id, reset_seconds }
9. 失败 → 返回错误 "出价已被超越，请刷新后重试"
```

---

## 4. 数据模型

### 4.1 ER 图

```
users ──┬── vehicles (created_by)
        │
        ├── auctions (created_by, current_winner_id)
        │
        └── bids (user_id)

vehicles ──┬── auctions (vehicle_id)
           │
           └── vehicle_images (vehicle_id)

auctions ──── bids (auction_id)
```

### 4.2 表结构

#### users
```prisma
model User {
  id            String    @id @default(uuid())
  username      String    @unique
  passwordHash  String    @map("password_hash")
  nickname      String
  role          String    @default("user")  // "admin" | "user"
  enabled       Boolean   @default(true)
  createdAt     DateTime  @default(now()) @map("created_at")

  vehicles      Vehicle[]     @relation("VehicleCreator")
  auctions      Auction[]     @relation("AuctionCreator")
  wonAuctions   Auction[]     @relation("AuctionWinner")
  bids          Bid[]
}
```

#### vehicles
```prisma
model Vehicle {
  id              String    @id @default(uuid())
  title           String
  plateNumber     String    @map("plate_number")
  mileage         Int
  registrationDate String   @map("registration_date")
  startingPrice   Float     @map("starting_price")
  minBidIncrement Float     @map("min_bid_increment")
  description     String    @default("")
  status          String    @default("available") // "available" | "in_auction" | "sold"
  createdBy       String    @map("created_by")
  createdAt       DateTime  @default(now()) @map("created_at")

  creator         User      @relation("VehicleCreator", fields: [createdBy], references: [id])
  images          VehicleImage[]
  auctions        Auction[]
}
```

#### vehicle_images
```prisma
model VehicleImage {
  id        String   @id @default(uuid())
  vehicleId String   @map("vehicle_id")
  filePath  String   @map("file_path")
  sortOrder Int      @default(0) @map("sort_order")
  createdAt DateTime @default(now()) @map("created_at")

  vehicle   Vehicle  @relation(fields: [vehicleId], references: [id])
}
```

#### auctions
```prisma
model Auction {
  id                  String    @id @default(uuid())
  vehicleId           String    @map("vehicle_id")
  status              String    @default("pending") // "pending" | "active" | "ended"
  startTime           DateTime? @map("start_time")
  endTime             DateTime? @map("end_time")
  currentHighestBid   Float?    @map("current_highest_bid")
  currentWinnerId     String?   @map("current_winner_id")
  bidResetSeconds     Int       @default(120) @map("bid_reset_seconds")
  bidCount            Int       @default(0) @map("bid_count")
  createdBy           String    @map("created_by")
  createdAt           DateTime  @default(now()) @map("created_at")
  startedAt           DateTime? @map("started_at")
  endedAt             DateTime? @map("ended_at")

  vehicle             Vehicle   @relation(fields: [vehicleId], references: [id])
  creator             User      @relation("AuctionCreator", fields: [createdBy], references: [id])
  currentWinner       User?     @relation("AuctionWinner", fields: [currentWinnerId], references: [id])
  bids                Bid[]
}
```

#### bids
```prisma
model Bid {
  id        String   @id @default(uuid())
  auctionId String   @map("auction_id")
  userId    String   @map("user_id")
  amount    Float
  createdAt DateTime @default(now()) @map("created_at")

  auction   Auction  @relation(fields: [auctionId], references: [id])
  user      User     @relation(fields: [userId], references: [id])

  @@unique([auctionId, amount], name: "unique_bid_amount_per_auction")
}
```

---

## 5. 页面路由结构

### 5.1 Next.js App Router 路由

```
/                           → 竞拍大厅（进行中的拍卖列表）
/auctions/[id]              → 竞拍详情页（车辆信息 + 出价面板）
/auctions/[id]/result       → 拍卖结果页（成交信息）
/login                      → 登录页
/admin                      → 后台仪表盘
/admin/vehicles             → 车辆管理
/admin/vehicles/new         → 新增车辆
/admin/vehicles/[id]/edit   → 编辑车辆
/admin/auctions             → 拍卖管理列表
/admin/auctions/new         → 创建拍卖
/admin/auctions/[id]        → 拍卖详情（管理视角）
/admin/users                → 账户管理
/admin/users/new            → 创建用户
```

### 5.2 API 路由

```
POST   /api/auth/login          → 登录
POST   /api/auth/logout         → 登出
GET    /api/auth/me             → 当前用户信息

GET    /api/auctions            → 拍卖列表（公开）
GET    /api/auctions/[id]       → 拍卖详情（公开）
GET    /api/auctions/[id]/bids  → 出价记录（公开）

POST   /api/admin/auctions      → 创建拍卖
PATCH  /api/admin/auctions/[id] → 更新拍卖（开始/结束）
POST   /api/admin/vehicles      → 创建车辆
PATCH  /api/admin/vehicles/[id] → 更新车辆
POST   /api/admin/vehicles/[id]/images → 上传车辆图片
DELETE /api/admin/vehicles/[id]/images/[imageId] → 删除图片
POST   /api/admin/users         → 创建用户
PATCH  /api/admin/users/[id]    → 更新用户（禁用/重置密码）
GET    /api/admin/dashboard     → 仪表盘数据
GET    /api/admin/bids          → 出价记录查询（管理视角）

GET    /api/tunnel-url          → 获取当前公网访问地址（管理员可见）
```

---

## 6. WebSocket 事件协议

### 6.1 客户端 → 服务端

| 事件 | Payload | 说明 |
|------|---------|------|
| `join-auction` | `{ auctionId }` | 加入拍卖房间 |
| `leave-auction` | `{ auctionId }` | 离开拍卖房间 |
| `place-bid` | `{ auctionId, amount }` | 出价 |

### 6.2 服务端 → 客户端

| 事件 | Payload | 说明 |
|------|---------|------|
| `bid-update` | `{ auctionId, amount, userId, nickname, bidCount, timestamp }` | 新出价通知 |
| `timer-reset` | `{ auctionId, resetSeconds }` | 倒计时重置 |
| `timer-sync` | `{ auctionId, remainingSeconds }` | 服务端时间同步（连接时发送） |
| `auction-started` | `{ auctionId }` | 拍卖开始 |
| `auction-ended` | `{ auctionId, winnerId?, winnerNickname?, finalAmount?}` | 拍卖结束 |
| `error` | `{ message }` | 错误消息 |
| `bid-success` | `{ auctionId, amount }` | 出价成功确认（只发给出价者） |
| `bid-failed` | `{ message }` | 出价失败（只发给出价者） |

### 6.3 倒计时实现

**服务端不维护实时倒计时。** 只记录：
- `auctions.started_at`：实际开始时间
- `auctions.bid_reset_seconds`：每次出价重置秒数
- 最后一次出价时间（从 bids 表最后一条记录获取）

**客户端计算剩余时间：**
```
剩余秒数 = bid_reset_seconds - (now - last_bid_time)
```

客户端每秒更新一次 UI。服务端在新客户端连接时发送 `timer-sync` 做时间校准，防止客户端时钟不准。

服务端用定时器检查过期拍卖（每分钟一次）：如果 `now - last_bid_time >= bid_reset_seconds` 且状态为 active，自动结束拍卖。

---

## 7. 内网穿透方案

### 7.1 实现

使用 Cloudflare Tunnel（cloudflared），无需域名，免费 HTTPS。

**启动脚本 `start.js`：**
```javascript
// 1. 启动 Next.js server
// 2. 启动 cloudflared tunnel --url http://localhost:3000
// 3. 从 cloudflared stdout 解析出 *.trycloudflare.com 地址
// 4. 打印控制台 + 写入可被前端读取的端点
```

### 7.2 部署命令
```bash
npm run start  # 一条命令启动服务 + 穿透
```

控制台输出：
```
🚀 竞拍系统已启动
📍 局域网访问: http://192.168.1.xxx:3000
🌐 外网访问:   https://xxx-xxx.trycloudflare.com
```

---

## 8. 移动端适配

### 8.1 断点策略

Tailwind 默认断点：
- `sm`: 640px（手机横屏）
- `md`: 768px（平板）
- `lg`: 1024px（桌面）

### 8.2 关键适配点

| 组件 | 桌面 (>768px) | 移动 (≤768px) |
|------|---------------|---------------|
| 竞拍大厅网格 | `grid-cols-3` 或 `grid-cols-4` | `grid-cols-1` |
| 竞拍详情 | `flex-row` 左右分栏 | `flex-col` 上下堆叠 |
| 出价操作区 | 右侧面板内 | `fixed bottom-0` 固定底栏 |
| 后台侧边栏 | `w-64` 固定侧栏 | 汉堡菜单 `absolute` 抽屉 |
| 表格 | 完整列 | 省略次要列，或卡片化 |

### 8.3 移动端出价底栏

```jsx
// 竞拍详情页移动端
<div className="fixed bottom-0 left-0 right-0 bg-white border-t p-3 md:static md:border-0 md:p-0 z-10">
  {/* 快捷按钮：+100 +200 +500 */}
  {/* 输入框 */}
  {/* 确认出价按钮 */}
</div>
```

---

## 9. 认证与安全

### 9.1 Session 管理

- 使用 `iron-session`（加密 cookie，无需服务端存储）
- Session 内容：`{ userId, username, nickname, role }`
- Cookie 设置：`httpOnly: true, secure: true（生产）, sameSite: 'lax'`
- 登出时清除 cookie

### 9.2 权限中间件

| 路由 | 权限 |
|------|------|
| `/api/auth/*` | 公开 |
| `GET /api/auctions/*` | 公开（围观） |
| `/api/admin/*` | admin only |
| WebSocket `place-bid` | 已登录用户（session 验证） |

### 9.3 WebSocket 认证

Socket.IO connection 时从 cookie 中解析 session，验证通过后存入 `socket.data.user`。`place-bid` 事件处理时检查 `socket.data.user` 是否存在。

### 9.4 密码策略

- bcrypt 哈希存储
- 管理员重置密码时生成随机密码或设置临时密码
- 第一版不做密码复杂度校验（用户是管理员创建的）

---

## 10. 图片存储

### 10.1 存储方案

图片存在本地文件系统 `public/uploads/vehicles/`，数据库只存相对路径。

```
public/uploads/vehicles/
  ├── {vehicle-uuid}/
  │   ├── 001.jpg
  │   ├── 002.jpg
  │   └── 003.jpg
```

### 10.2 图片处理

- 上传时用 `multer` 或 Next.js API Route 的 FormData 解析
- 文件名使用 UUID 防冲突
- 前端用 `<Image>` 组件优化加载
- 不做压缩/缩略图（第一版简化）

### 10.3 访问路径

```
/public/uploads/vehicles/{vehicle-uuid}/001.jpg
→ 可通过 /uploads/vehicles/{vehicle-uuid}/001.jpg 直接访问
```

---

## 11. 启动与部署

### 11.1 开发环境
```bash
npm install
npx prisma migrate dev --name init
npm run dev        # next dev + socket.io (custom server)
```

### 11.2 生产环境
```bash
npm install
npx prisma migrate deploy
npm run build
npm run start      # node server.js + cloudflared tunnel
```

### 11.3 server.js 结构

```
server.js
├── 初始化 Prisma
├── 创建 HTTP server (Next.js)
├── 绑定 Socket.IO 到同一 HTTP server
│   ├── 认证中间件（解析 session cookie）
│   ├── join-auction / leave-auction（房间管理）
│   └── place-bid（出价逻辑 + 事务 + 广播）
├── 启动定时器（每分钟检查过期拍卖）
├── 启动 cloudflared tunnel（子进程）
└── 监听端口 3000
```

### 11.4 默认管理员

首次运行自动创建默认管理员：
- 用户名: `admin`
- 密码: `admin123`（首次登录后强制修改，或至少在文档中提示修改）

---

## 12. 开发顺序建议

| 阶段 | 内容 | 预计文件 |
|------|------|---------|
| **Phase 1** | 项目初始化 + Prisma schema + 基础布局 | 5-8 个文件 |
| **Phase 2** | 认证系统（登录/登出/session） | 5-8 个文件 |
| **Phase 3** | 管理员后台（车辆 CRUD + 账户管理） | 10-15 个文件 |
| **Phase 4** | 竞拍大厅 + 详情页（公开部分） | 8-12 个文件 |
| **Phase 5** | WebSocket + 实时出价（核心） | 3-5 个文件 |
| **Phase 6** | 移动端适配 + 出价底栏 | 修改已有文件 |
| **Phase 7** | Cloudflare Tunnel 集成 + 启动脚本 | 2-3 个文件 |
| **Phase 8** | 测试 + 修 bug + 打磨 | - |

---

## 13. 依赖清单

```json
{
  "dependencies": {
    "next": "^14",
    "react": "^18",
    "react-dom": "^18",
    "prisma": "^5",
    "@prisma/client": "^5",
    "socket.io": "^4",
    "socket.io-client": "^4",
    "iron-session": "^8",
    "bcryptjs": "^2",
    "multer": "^1",
    "uuid": "^9",
    "tailwindcss": "^3",
    "autoprefixer": "^10",
    "postcss": "^8"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/bcryptjs": "^2",
    "@types/multer": "^1",
    "@types/uuid": "^9",
    "typescript": "^5"
  }
}
```

---

## 14. 关键决策记录

所有决策的详细理由和上下文记录在项目 memory 目录：
- [[project-overview]] — 项目目标和约束
- [[auction-mode]] — 英式拍卖 + 软关闭
- [[account-system]] — 管理员创建 + 公开围观
- [[data-model]] — 完整表结构
- [[feature-list]] — 功能清单
- [[mobile-adaptation]] — 移动端适配策略

---

> **下一步**: 按 Phase 1 → Phase 8 顺序开始编码实现。
