import { createClient } from '@/lib/supabase/server'
import type { TestItem } from '@/lib/supabase/types'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const METRIC_SOURCES: Record<string, { regularSource: string; eliteSource: string; description: string }> = {
  'dead_hang': {
    regularSource: 'NSCA (美国国家体能协会) 青少年上肢与握力耐力评价指南',
    eliteSource: 'Longevity Benchmark & 竞技体操/攀岩/网球青少年专项相对力量常模',
    description: '单杠直臂悬垂主要评估前臂屈肌握力耐力与肩袖关节稳定性。8岁及格线为15秒，精英达标为30秒以上；U16-U18及格线为30秒，精英满分线高达150秒(2.5分钟)。'
  },
  'plank': {
    regularSource: '《国家学生体质健康标准》核心稳定评估及 Eurofit 常模',
    eliteSource: 'NSCA / USTA 青少年网球躯干核心抗伸展耐力等级划分',
    description: '平板支撑评估躯干前后侧核心肌群静态耐力。8岁及格线为30秒(常规)/60秒(精英)；U16-U18常规及格60秒/满分180秒(3分钟)，精英模式满分高达300秒(5分钟)。'
  },
  'double_under_3min': {
    regularSource: '中国网球协会 (CTA) 青少年体能考核规范 & 中考体育专项',
    eliteSource: 'CTA 竞技网球/省队/职业梯队 U14-U16 入队专项体能通关门槛',
    description: '3分钟双摇跳是衡量高强度无氧耐力、足踝爆发力与手眼节奏协调的核心指标。对于 U14-U16 优秀运动员，及格线为 220 次，满分线 260 次以上，省队/职业准入标准高达 280-330 次。'
  },
  'double_under_1min': {
    regularSource: 'CTA 体能测试 - 1分钟快速双摇测试',
    eliteSource: 'ITF / USTA 青少年下肢神经肌肉快速招募频率测试',
    description: '1分钟双摇跳侧重评估神经肌肉极速招募与下肢弹跳功率输出。U14-U16 竞技精英 1 分钟及格线 70 次，满分线 115 次以上。'
  },
  'single_under_1min': {
    regularSource: '《国家学生体质健康标准》一分钟跳绳评分表',
    eliteSource: '中国网球协会 (CTA) 基础有氧与脚步频率测评',
    description: '基础下肢频次与连续弹跳测试。U14-U16 常规及格线 120 次/分钟，精英满分线达 230 次/分钟。'
  },
  'shuttle_10x5': {
    regularSource: 'CTA / Eurofit 10x5米折返跑测试法',
    eliteSource: 'ITF (国际网球联合会) 青少年灵敏与减速再加速常模',
    description: '测试网球运动中频繁制动、改变重心及急停急起能力。数值越小越好。'
  },
  'standing_long_jump': {
    regularSource: '《国家学生体质健康标准》立定跳远评分标准',
    eliteSource: '《中国田径运动员技术等级标准》及 USTA 下肢爆发力评级',
    description: '测试下肢伸肌群瞬间爆发力与身体协调性。'
  },
  'five_jump_test': {
    regularSource: 'NSCA (美国国家体能协会) & Chamari et al. (5JT 五步跳常模测试)',
    eliteSource: 'ITF (国际网球联合会) / 田径跳跃与网球下肢多级跳爆发力常模',
    description: 'Five-Jump Test (5JT) 是评估运动员下肢水平爆发力、下肢弹性功率与拉伸-短缩循环 (SSC) 效率的核心测试。运动员双脚并拢起跳，连续进行 5 次跨步跃跳后双脚落地。评估下肢无氧爆发功率与神经肌肉控制能力。'
  },
  'yoyo_test': {
    regularSource: 'Yo-Yo Intermittent Recovery Test Level 1 (YYIR1)',
    eliteSource: '职业足球/网球体能专项 - Yo-Yo 间歇恢复跑国际常模',
    description: '评估高强度间歇跑中的有氧/无氧混合耐力及恢复速率。'
  }
}

export default async function StandardsDetailPage() {
  const supabase = await createClient()

  const { data: metrics, error } = await supabase
    .from('test_metrics')
    .select('*')
    .order('created_at', { ascending: true })

  const typedMetrics = (metrics ?? []) as TestItem[]

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 md:p-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <span>🛡️ Data Integrity & Science</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            科学评分引擎底层逻辑与全量评分标准 (Scoring Rules & Sources)
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            透明化展示全量体测指标在 8-18 岁（双性别、双模式）下的评分基线、参考依据及权威数据源。
          </p>
        </div>

        <Link
          href="/admin/metrics"
          className="inline-flex items-center gap-2 rounded-xl bg-gray-900 border border-gray-800 px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-gray-800 hover:text-white transition-all shadow-lg w-max"
        >
          ← 返回指标字典管理
        </Link>
      </div>

      {/* Philosophy Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
            <span>🔰 常规模式 (Regular Mode)</span>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">
            面向普通学龄青少年的健康体质评估。标准紧密契合教育部《国家学生体质健康标准（2014年修订）》及国家体育总局测评大纲，精确匹配青少年生长发育曲线与青春期突增规律。
          </p>
          <div className="text-[11px] text-gray-500 bg-gray-950/50 rounded-lg p-3 border border-gray-800/50">
            📌 计分逻辑：60 分代表同年龄段及格/健康门槛；100 分代表同年龄段顶尖体质。
          </div>
        </div>

        <div className="rounded-2xl border border-indigo-900/40 bg-indigo-950/20 p-6 space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-5xl">👑</div>
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-base">
            <span>👑 精英模式 (Elite Mode)</span>
          </div>
          <p className="text-xs text-indigo-200/80 leading-relaxed">
            专为竞技网球、省队/国家梯队及好苗子选拔设计。锚定 18 岁达到国家二级/一级运动员门槛或职业准入线，结合 LTAD (长期运动员发展模型) 科学反推至 8 岁。
          </p>
          <div className="text-[11px] text-indigo-300/60 bg-indigo-950/50 rounded-lg p-3 border border-indigo-900/30">
            📌 计分逻辑：针对 CTA/ITF 竞技标准。如 3分钟双摇跳 U14-U16 优秀线 260+ 次，省队门槛 280-330 次。
          </div>
        </div>
      </div>

      {/* Metrics Detail Cards */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
          📋 全量指标打分明细与数据源对照 (All Metric Standards & Sources)
        </h2>

        {error && (
          <div className="rounded-xl bg-red-950/40 border border-red-900/50 p-4 text-xs text-red-400">
            无法加载指标数据：{error.message}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {typedMetrics.map((m) => {
            const meta = METRIC_SOURCES[m.id] || {
              regularSource: '国家学生体质健康标准 / 体育测试大纲',
              eliteSource: 'ITF / USTA / 中国竞技体育运动员技术等级常模',
              description: '标准体测项目，采用多维年龄与性别曲线计算。'
            }

            const regMale8 = m.scoring_matrix?.regular?.male?.['8']
            const regMale18 = m.scoring_matrix?.regular?.male?.['18']
            const eliteMale8 = m.scoring_matrix?.elite?.male?.['8']
            const eliteMale18 = m.scoring_matrix?.elite?.male?.['18']
            const eliteMale14 = m.scoring_matrix?.elite?.male?.['14']

            return (
              <div key={m.id} className="rounded-2xl border border-gray-800 bg-gray-900/80 p-6 flex flex-col justify-between space-y-4 hover:border-gray-700 transition-colors">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono bg-indigo-950 text-indigo-400 border border-indigo-900 px-2 py-0.5 rounded">
                        {m.id}
                      </span>
                      <h3 className="text-base font-bold text-white">{m.name_zh}</h3>
                    </div>
                    <span className="text-xs font-medium text-gray-400 bg-gray-800 px-2.5 py-1 rounded-full">
                      单位: {m.unit === 'boolean' ? '通过制' : m.unit}
                    </span>
                  </div>

                  <p className="text-xs text-gray-400 leading-relaxed mb-4">
                    {meta.description}
                  </p>

                  {/* Benchmark Data Preview Box */}
                  {m.scoring_matrix && typeof m.scoring_matrix === 'object' && (
                    <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                      {/* Regular Benchmark */}
                      <div className="rounded-xl bg-gray-950/60 p-3 border border-gray-800/80 space-y-1">
                        <div className="font-semibold text-gray-300 text-[11px]">🔰 常规标准区间</div>
                        <div className="text-gray-400 text-[10px]">
                          8岁男: <span className="text-red-400">{regMale8?.min_0}</span> → <span className="text-emerald-400">{regMale8?.max_100}</span> {m.unit}
                        </div>
                        <div className="text-gray-400 text-[10px]">
                          18岁男: <span className="text-red-400">{regMale18?.min_0}</span> → <span className="text-emerald-400">{regMale18?.max_100}</span> {m.unit}
                        </div>
                      </div>

                      {/* Elite Benchmark */}
                      <div className="rounded-xl bg-indigo-950/40 p-3 border border-indigo-900/40 space-y-1">
                        <div className="font-semibold text-indigo-300 text-[11px]">👑 精英/CTA标准区间</div>
                        {eliteMale14 && (
                          <div className="text-indigo-200/80 text-[10px]">
                            U14男: <span className="text-amber-400">{eliteMale14?.min_0}</span> → <span className="text-emerald-400">{eliteMale14?.max_100}</span> {m.unit}
                          </div>
                        )}
                        <div className="text-indigo-200/80 text-[10px]">
                          18岁男: <span className="text-amber-400">{eliteMale18?.min_0}</span> → <span className="text-emerald-400">{eliteMale18?.max_100}</span> {m.unit}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sources Section */}
                <div className="border-t border-gray-800/80 pt-3 space-y-1 text-[11px]">
                  <div className="text-gray-400">
                    <span className="text-gray-500 font-medium">常规数据源：</span>{meta.regularSource}
                  </div>
                  <div className="text-indigo-300/80">
                    <span className="text-indigo-400/60 font-medium">精英数据源：</span>{meta.eliteSource}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
