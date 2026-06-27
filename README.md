# 车辆竞拍系统 (JingPai)

英式拍卖 + 软关闭规则，Next.js 16 全栈应用。

## 快速启动

```bash
npm install
npx prisma migrate deploy
npx tsx prisma/seed.ts
npm run dev
```

访问 `http://localhost:3000`

## 默认账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |
| 用户 | user1 | 123456 |
| 用户 | user2 | 123456 |

## 外网访问

启动后自动通过 Cloudflare Tunnel 获取外网地址（需将 `cloudflared.exe` 放在项目根目录）。

## 技术栈

- Next.js 16 (App Router)
- Prisma + SQLite
- Socket.IO 实时通信
- Tailwind CSS
- iron-session 认证

## 拍卖规则

- **英式拍卖**：出价必须 ≥ 当前最高价 + 加价幅度
- **软关闭**：每次出价后倒计时重置，无人出价则到期结束
- **冷却时间**：同一用户 3 秒内不可连续出价
