#!/usr/bin/env bash

# ==============================================================================
# VLTA Physical - 本地一键 Supabase 数据库备份脚本
# ==============================================================================

set -e

# 1. 尝试从 .env.local 载入环境变量
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
fi

PROJECT_REF="${SUPABASE_PROJECT_REF:-xibqavywcafplnqwbsae}"
DB_PASSWORD="${SUPABASE_DB_PASSWORD:-Vltaaitechnology11!}"

if [ -z "$DB_PASSWORD" ]; then
  echo "❌ 错误: 找不到 SUPABASE_DB_PASSWORD 环境变量。"
  exit 1
fi

mkdir -p backups

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_FILE="backups/vlta_backup_${TIMESTAMP}.sql"

echo "📦 正在导出 Supabase 数据库到: ${OUTPUT_FILE} ..."

DB_URI="postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@aws-0-eu-north-1.pooler.supabase.com:5432/postgres"

pg_dump "$DB_URI" > "$OUTPUT_FILE"

echo "✅ 备份导出成功！"
echo "📄 文件路径: $(pwd)/${OUTPUT_FILE}"
echo "💡 提示: 还原此数据库只需运行: psql \"<NEW_DB_URL>\" < ${OUTPUT_FILE}"
