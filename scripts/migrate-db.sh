#!/usr/bin/env bash

# Load environment variables
set -a
source .env.local
set +a

if [ -z "$SUPABASE_DB_PASSWORD" ]; then
  echo "❌ 错误：未能检测到数据库密码。"
  echo "请在 .env.local 中填入 SUPABASE_DB_PASSWORD=你的密码"
  exit 1
fi

echo "🚀 开始验证并连接到你的线上 Supabase 项目 (xibqavywcafplnqwbsae)..."

# 执行 Link 认证登录
npx supabase link --project-ref xibqavywcafplnqwbsae -p "$SUPABASE_DB_PASSWORD"

if [ $? -ne 0 ]; then
  echo "⚠️ 链接失败！这可能是因为你还没有在这台电脑授权过 Supabase CLI。"
  echo "💡 解决方法：请先在终端运行一次 \`npx supabase login\`，根据提示授权后再重新运行本脚本。"
  exit 1
fi

echo "⬆️ 通道建立成功！正在将本地的 001、002 SQL剧本一次性自动推送到云端..."
npx supabase db push -p "$SUPABASE_DB_PASSWORD"

echo "✅ 恭喜！整个底层架构和数据库鉴权规则已经全网生效就绪！请回 Vercel 网址去爽快地操作吧！"
