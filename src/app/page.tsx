import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

/**
 * 根页面: 利用 JIT (Just-In-Time) 初始化逻辑同步 Clerk 到 Supabase，并执行基于权重的路由跳转。
 * 从中间件通过校验的用户都会来到这里进行角色分流。
 */
export default async function IndexPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  // 使用纯粹的 supabase-js (无 RLS 依赖) 连接数据库
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // 1. 查询该 Clerk 用户是否已经在全剧数据库中存在
  let { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  // 2. [JIT 同步] 如果是首次从 Clerk 登录的新用户，立即为他创建基础资料档案！
  if (!profile) {
    const user = await currentUser()
    const fullName = user?.firstName && user?.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : (user?.firstName || '新学员')
    
    // 插入一条新的默认 athlete 数据记录
    const { data: newProfile, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        full_name: fullName,
        role: 'athlete', // 新用户永远默认是 athlete
        avatar_url: user?.imageUrl ?? null,
      })
      .select('role')
      .single()

    if (error) {
      console.error('Failed to JIT sync clerk user:', error)
      return (
        <div className="flex h-screen items-center justify-center bg-gray-950 text-white">
          <div className="text-center">
             <h2 className="text-xl text-red-500 font-bold mb-2">系统同步失败</h2>
             <p className="text-gray-400">建立底层档案时遇到错误，请刷新重试或联系管理员。</p>
          </div>
        </div>
      )
    }
    profile = newProfile
  }

  // 3. 动态角色重定向路由网关
  const role = profile?.role ?? 'athlete'
  if (role === 'coach') redirect('/coach/dashboard')
  if (role === 'admin') redirect('/admin/users')
  
  // 默认学员主页
  redirect('/dashboard')
}
