import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// 定义哪些路由是完全公开的（不需要登录）
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/report/(.*)'
])

// 初始化并导出 Clerk Middleware
export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    // 强制保护所有未匹配 publicRoute 的路径
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // 保护除内部静态资源之外的所有路由
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

