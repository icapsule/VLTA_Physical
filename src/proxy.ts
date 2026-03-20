import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import type { NextRequest, NextFetchEvent } from 'next/server'

// 定义哪些路由是完全公开的（不需要登录）
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)'
])

// 初始化 Clerk Middleware
const middleware = clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    // 强制保护所有未匹配 publicRoute 的路径
    await auth.protect()
  }
})

// Vercel / Next 16 的强制导出桥接
export async function proxy(request: NextRequest, event: NextFetchEvent) {
  return middleware(request, event)
}

export const config = {
  matcher: [
    // 保护由于除内部静态资源之外的所有路由
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
