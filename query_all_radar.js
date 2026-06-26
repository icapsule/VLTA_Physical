const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if(key) acc[key] = val.join('=');
  return acc;
}, {});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function main() {
  const { data, error } = await supabase.from('test_metrics').select('id, name_zh, dimension, in_radar');
  if (error) console.error(error);
  else console.table(data);
}
main();
