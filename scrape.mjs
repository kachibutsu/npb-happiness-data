// NPB公式の順位表(std_c/std_p)を取得して current.json を生成する。
// GitHub Actions(Ubuntu, Node20+)で実行。Node標準のfetchを使用。
import * as cheerio from 'cheerio';
import fs from 'fs';

const KEY = {
  hanshin:'阪神', giants:'ジャイアンツ', dena:'ベイスターズ', carp:'カープ',
  yakult:'スワローズ', chunichi:'ドラゴンズ',
  softbank:'ホークス', nipponham:'ファイターズ', lotte:'マリーンズ',
  rakuten:'イーグルス', orix:'バファローズ', seibu:'ライオンズ'
};
const CL = ['hanshin','giants','dena','carp','yakult','chunichi'];
const PL = ['softbank','nipponham','lotte','rakuten','orix','seibu'];

function idOf(text){ for (const [id,k] of Object.entries(KEY)) if (text.includes(k)) return id; return null; }

export function parseLeague(html, leagueIds){
  const $ = cheerio.load(html);
  const found = {}, order = [];
  $('tr').each((_, tr) => {
    const tds = $(tr).find('td,th').toArray().map(td => $(td).text().replace(/\s+/g,' ').trim());
    if (tds.length < 6) return;
    let ti = -1, id = null;
    for (let i=0;i<tds.length;i++){ const x = idOf(tds[i]); if (x){ ti=i; id=x; break; } }
    if (ti < 0 || !leagueIds.includes(id) || found[id]) return;
    const w = parseInt(tds[ti+2],10), l = parseInt(tds[ti+3],10), d = parseInt(tds[ti+4],10);
    const pct = tds[ti+5] || '';
    // 標準順位表の行だけ採用：勝率セル(.xxx)が続くことを条件にする
    if (!Number.isFinite(w) || !Number.isFinite(l) || !/\.\d{3}/.test(pct)) return;
    found[id] = { w, l, d: Number.isFinite(d) ? d : 0 };
    order.push(id);
  });
  const recs = {};
  order.forEach((id,i) => { recs[id] = { rank:i+1, ...found[id] }; });
  return { recs, count: order.length };
}

function parseAsOf(html){ const m = html.match(/(\d{1,2})月(\d{1,2})日\s*現在/); return m ? `${m[1]}月${m[2]}日` : null; }

async function getHtml(url){
  const r = await fetch(url, { headers: { 'User-Agent':'npb-happiness-bot/1.0' } });
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return await r.text();
}

async function main(){
  const year = Number(process.env.NPB_YEAR) || new Date().getFullYear();
  const base = `https://npb.jp/bis/${year}/stats/`;
  const [cHtml, pHtml] = await Promise.all([getHtml(base+'std_c.html'), getHtml(base+'std_p.html')]);
  const c = parseLeague(cHtml, CL), p = parseLeague(pHtml, PL);
  if (c.count !== 6 || p.count !== 6) throw new Error(`parse incomplete CL=${c.count} PL=${p.count} (ページ構造変更の可能性)`);
  const out = {
    season: year,
    asOf: parseAsOf(cHtml) || parseAsOf(pHtml) || null,
    updated: new Date().toISOString(),
    records: { ...c.recs, ...p.recs }
  };
  fs.writeFileSync('current.json', JSON.stringify(out, null, 2));
  console.log('wrote current.json:', out.asOf, Object.keys(out.records).length, 'teams');
}

// 直接実行時のみmain()（テスト時はparseLeagueをimport）
if (import.meta.url === `file://${process.argv[1]}`) main().catch(e => { console.error(e); process.exit(1); });
