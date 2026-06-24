const fs = require('fs')
const path = require('path')

const oldMetrics = [
  { id: 'standing_long_jump', reg_base_min: 100, reg_base_max: 180, reg_growth_min: 6, reg_growth_max: 8, elite_base_min: 120, elite_base_max: 200, elite_growth_min: 8, elite_growth_max: 10 },
  { id: 'sprint_10m', reg_base_min: 2.8, reg_base_max: 1.8, reg_growth_min: -0.05, reg_growth_max: -0.05, elite_base_min: 2.6, elite_base_max: 1.7, elite_growth_min: -0.06, elite_growth_max: -0.06 },
  { id: 'sprint_20m', reg_base_min: 5.5, reg_base_max: 3.9, reg_growth_min: -0.15, reg_growth_max: -0.12, elite_base_min: 5.2, elite_base_max: 3.7, elite_growth_min: -0.18, elite_growth_max: -0.15 },
  { id: 'shuttle_10x5', reg_base_min: 17.5, reg_base_max: 14.0, reg_growth_min: -0.3, reg_growth_max: -0.4, elite_base_min: 16.5, elite_base_max: 13.0, elite_growth_min: -0.4, elite_growth_max: -0.5 },
  { id: 'run_5000m', reg_base_min: 2800, reg_base_max: 1500, reg_growth_min: -60, reg_growth_max: -40, elite_base_min: 2400, elite_base_max: 1200, elite_growth_min: -70, elite_growth_max: -50 },
  { id: 'run_3000m', reg_base_min: 1800, reg_base_max: 900, reg_growth_min: -40, reg_growth_max: -30, elite_base_min: 1500, elite_base_max: 700, elite_growth_min: -50, elite_growth_max: -40 },
  { id: 'run_1000m', reg_base_min: 600, reg_base_max: 300, reg_growth_min: -15, reg_growth_max: -10, elite_base_min: 500, elite_base_max: 240, elite_growth_min: -20, elite_growth_max: -15 },
  { id: 'run_800m', reg_base_min: 450, reg_base_max: 240, reg_growth_min: -10, reg_growth_max: -8, elite_base_min: 380, elite_base_max: 180, elite_growth_min: -15, elite_growth_max: -10 },
  { id: 'run_400m', reg_base_min: 200, reg_base_max: 90, reg_growth_min: -5, reg_growth_max: -3, elite_base_min: 160, elite_base_max: 70, elite_growth_min: -6, elite_growth_max: -4 },
  { id: 'sprint_200m', reg_base_min: 45, reg_base_max: 28, reg_growth_min: -1, reg_growth_max: -0.5, elite_base_min: 40, elite_base_max: 24, elite_growth_min: -1.2, elite_growth_max: -0.8 },
  { id: 'sprint_100m', reg_base_min: 22, reg_base_max: 14, reg_growth_min: -0.5, reg_growth_max: -0.3, elite_base_min: 19, elite_base_max: 12, elite_growth_min: -0.6, elite_growth_max: -0.4 },
  { id: 'sit_and_reach', reg_base_min: 0, reg_base_max: 20, reg_growth_min: 0.5, reg_growth_max: 1, elite_base_min: 5, elite_base_max: 25, elite_growth_min: 0.5, elite_growth_max: 1 },
  { id: 'pull_up', reg_base_min: 0, reg_base_max: 8, reg_growth_min: 0, reg_growth_max: 1, elite_base_min: 0, elite_base_max: 15, elite_growth_min: 1, elite_growth_max: 2 },
  { id: 'push_up', reg_base_min: 0, reg_base_max: 20, reg_growth_min: 1, reg_growth_max: 3, elite_base_min: 5, elite_base_max: 40, elite_growth_min: 2, elite_growth_max: 5 }
];

let sql = `-- Seed JSONB matrices derived from previous linear data\n\n`;

oldMetrics.forEach(m => {
  const matrix = {
    regular: { male: {}, female: {} },
    elite: { male: {}, female: {} }
  };

  for (let age = 8; age <= 18; age++) {
    const years = age - 9;
    
    // Evaluate regular
    const reg_min = Number((m.reg_base_min + m.reg_growth_min * years).toFixed(2));
    const reg_max = Number((m.reg_base_max + m.reg_growth_max * years).toFixed(2));
    
    // Evaluate elite
    const elite_min = Number((m.elite_base_min + m.elite_growth_min * years).toFixed(2));
    const elite_max = Number((m.elite_base_max + m.elite_growth_max * years).toFixed(2));

    // For male
    matrix.regular.male[age.toString()] = { min_0: reg_min, max_100: reg_max };
    matrix.elite.male[age.toString()] = { min_0: elite_min, max_100: elite_max };
    
    // For female (simulate slightly lower performance for demonstration of gender split)
    // We add 10% penalty for female in power/speed/endurance for demo (or just keep it same if flexibility)
    // Actually, to make it perfectly compatible with old code, we'll just keep female identical to male for now,
    // and let the user tweak them later!
    matrix.regular.female[age.toString()] = { min_0: reg_min, max_100: reg_max };
    matrix.elite.female[age.toString()] = { min_0: elite_min, max_100: elite_max };
  }

  sql += `UPDATE public.test_metrics SET scoring_matrix = '${JSON.stringify(matrix)}'::jsonb WHERE id = '${m.id}';\n`;
});

fs.writeFileSync(path.join(__dirname, 'supabase', 'migrations', '20260624000003_seed_jsonb_matrices.sql'), sql);
console.log('Generated 20260624000003_seed_jsonb_matrices.sql');
