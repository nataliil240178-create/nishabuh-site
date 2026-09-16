// Обновление реальных цифр спроса в базе сайта НишаБух.
// Запуск: node tools/update-demand.mjs "путь/к/nishabuh-data.json"
// Что делает: спрашивает у hh.ru число активных вакансий по запросу каждой ниши и пишет в базу.
// Вордстат: официальный API Яндекса требует OAuth-токен — если он задан в WF_TOKEN, здесь можно добавить вызов (см. README).
// Рекомендуется запускать по расписанию (cron / планировщик) — например, раз в сутки.

import fs from 'fs';

const DATA = process.argv[2] || 'nishabuh-data.json';
const HH_UA = process.env.HH_UA || 'NishaBuh/1.0 (contact: your@email)';
const delay = (ms) => new Promise(r => setTimeout(r, ms));

const data = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const now = new Date().toISOString();
let ok = 0, fail = 0;

for (const n of data.niches) {
  const q = n.q1 || n.name;
  try {
    const r = await fetch('https://api.hh.ru/vacancies?text=' + encodeURIComponent(q) + '&per_page=1', {
      headers: { 'User-Agent': HH_UA }
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json();
    if (typeof j.found !== 'number') throw new Error('в ответе нет поля found');
    n.demand = Object.assign({}, n.demand, { hhVacancies: j.found, updatedAt: now, demo: false, source: 'hh.ru' });
    ok++;
    console.log('•', n.name, '→ вакансий:', j.found);
  } catch (e) {
    fail++;
    console.log('!', n.name, '→ не удалось:', e.message);
  }
  await delay(1200); // щадящий режим к API
}

data.demandUpdatedAt = now;
fs.writeFileSync(DATA, JSON.stringify(data, null, 2), 'utf8');
console.log('\nГотово: обновлено', ok, 'из', data.niches.length, '| ошибок:', fail, '| файл:', DATA);
console.log('Если hh отвечает 403 — запустите с другого IP (домашний/хостинг) или укажите в HH_UA контакт, одобренный hh.');
