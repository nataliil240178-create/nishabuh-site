<?php
/**
 * НишаБух — обновление базы спроса.
 *
 * Источники:
 *   1) hh.ru — публичный API вакансий (ключ не нужен). ВАЖНО: hh отвечает 403
 *      на запросы с серверных адресов (хостинги, дата-центры). С домашнего
 *      интернета работает; с хостинга — как правило нет.
 *   2) «Работа России» — открытый API портала opendata.trudvsem.ru (ключ не нужен),
 *      доступен и с хостинга. Используется автоматически, если hh недоступен.
 *   3) Вордстат (частотность показов) — только через Wordstat API в Yandex Cloud
 *      (ключ сервисного аккаунта yc_api_key). В Директе числовой частотности больше нет:
 *      сервис отчётов Вордстата закрыт (проверено 15.09.2026 — эндпоинты v4 отдают 404),
 *      а метод keywordsresearch.hasSearchVolume даёт лишь признак «показы есть/нет».
 *      Токен Директа (wf_token) в скрипте больше не используется.
 *
 * Запуск (только из командной строки, например по cron на хостинге):
 *   php tools/update-demand.php [путь_к_базе] [путь_к_настройкам]
 * Без аргументов: база берётся из ../nishabuh-data.json (папка сайта),
 * настройки ищутся в домашней папке аккаунта (вне public_html) и рядом со скриптом.
 *
 * Требования: PHP 7.4+ и расширение curl.
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit("Этот скрипт запускается только из командной строки.\n");
}

$dataPath   = isset($argv[1]) ? $argv[1] : __DIR__ . '/../nishabuh-data.json';
$configPath = isset($argv[2]) ? $argv[2] : '';

/* ---------- где искать файл настроек ---------- */
if ($configPath === '') {
    $candidates = array(
        __DIR__ . '/update-demand.config.php',
        dirname(dirname(__DIR__)) . '/update-demand.config.php',
        dirname(dirname(dirname(__DIR__))) . '/update-demand.config.php',
        dirname(dirname(dirname(dirname(__DIR__)))) . '/update-demand.config.php'
    );
    foreach ($candidates as $c) {
        if (is_file($c)) { $configPath = $c; break; }
    }
}

/* ---------- настройки ---------- */
$cfg = array(
    'hh_ua'            => 'NishaBuh/1.0 (contact: your@email.example)',
    'trudvsem_ua'      => 'NishaBuh/1.0 (contact: your@email.example)',
    'vacancies_source' => 'auto',   // auto | hh | trudvsem
    'wf_token'         => '',       // Вордстат, путь 1: токен Яндекс.Директ API
    'yc_api_key'       => '',       // Вордстат, путь 2: API-ключ сервисного аккаунта Yandex Cloud
    'yc_folder_id'     => '',       // Вордстат, путь 2: id каталога (сервисному аккаунту можно не указывать)
    'wf_mode'          => 'auto',   // auto | cloud | direct | off
    'wf_device'        => 'DEVICE_ALL',
    'wf_endpoint'      => 'https://api.direct.yandex.com/json/v4/',
    'wf_region'        => 225,      // 225 = Россия
    'delay_ms'         => 1200,
    'wf_delay_ms'      => 800,
    'wf_waits'         => 8,
    'backup'           => true
);
$cfgLoaded = false;
if ($configPath !== '' && is_file($configPath)) {
    $user = include $configPath;
    if (is_array($user)) { $cfg = array_merge($cfg, $user); $cfgLoaded = true; }
}
$cfgSource = $cfgLoaded ? $configPath : 'не найден, используются значения по умолчанию';

function logline($s) { echo $s . "\n"; }
function msleep($ms) { usleep((int)$ms * 1000); }

/* ---------- проверки ---------- */
if (!function_exists('curl_init')) {
    exit("Ошибка: не подключено расширение curl (включите его в панели хостинга).\n");
}
if (!is_file($dataPath) || !is_readable($dataPath)) {
    exit("Ошибка: не найден файл базы: {$dataPath}\n");
}
$data = json_decode(file_get_contents($dataPath), true);
if (!is_array($data) || !isset($data['niches']) || !is_array($data['niches'])) {
    exit("Ошибка: файл базы не разобран — не найден массив niches.\n");
}
if (!is_writable($dataPath)) {
    exit("Ошибка: нет прав на запись в файл базы: {$dataPath}\n");
}

/* ---------- HTTP-помощник ---------- */
function http_json($url, $headers, $postBody = null, $timeout = 25) {
    $ch = curl_init($url);
    $opt = array(
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => $timeout,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_HTTPHEADER     => $headers
    );
    if ($postBody !== null) {
        $opt[CURLOPT_POST]       = true;
        $opt[CURLOPT_POSTFIELDS] = $postBody;
    }
    curl_setopt_array($ch, $opt);
    $body = curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err  = curl_error($ch);
    curl_close($ch);
    if ($body === false) { return array(0, null, $err !== '' ? $err : 'ошибка сети'); }
    $json = json_decode($body, true);
    return array($code, $json, $json === null ? 'ответ не разобран: ' . substr($body, 0, 160) : '');
}

/* ---------- источник 1: hh.ru ---------- */
function hh_found($query, $ua) {
    $url = 'https://api.hh.ru/vacancies?text=' . rawurlencode($query) . '&per_page=1';
    $headers = array('User-Agent: ' . $ua, 'HH-User-Agent: ' . $ua, 'Accept: application/json');
    list($code, $json, $err) = http_json($url, $headers);
    if ($code === 403) { return array(null, '403 — hh закрыл доступ с серверного адреса'); }
    if ($code !== 200 || !is_array($json)) { return array(null, 'HTTP ' . $code . ($err !== '' ? ' (' . $err . ')' : '')); }
    if (!isset($json['found']) || !is_numeric($json['found'])) { return array(null, 'в ответе нет числа found'); }
    return array((int)$json['found'], '');
}

/* ---------- источник 2: «Работа России» (opendata.trudvsem.ru) ---------- */
function trudvsem_total($query, $ua) {
    $url = 'https://opendata.trudvsem.ru/api/v1/vacancies?text=' . rawurlencode($query) . '&limit=1';
    $headers = array('User-Agent: ' . $ua, 'Accept: application/json');
    list($code, $json, $err) = http_json($url, $headers);
    if ($code !== 200 || !is_array($json)) { return array(null, 'HTTP ' . $code . ($err !== '' ? ' (' . $err . ')' : '')); }
    if (!isset($json['meta']['total'])) { return array(null, 'в ответе нет meta.total'); }
    return array((int)$json['meta']['total'], '');
}

/* ---------- Вордстат, путь 2: Wordstat API в Yandex Cloud ----------
 * POST https://searchapi.api.cloud.yandex.net/v2/wordstat/topRequests
 * Авторизация: Authorization: Api-Key <ключ сервисного аккаунта>
 * Роль сервисного аккаунта: search-api.webSearch.user
 * Ответ содержит totalCount — число запросов с фразой за последние 30 дней.
 */
function wf_top_cloud($phrase, $cfg) {
    $url = 'https://searchapi.api.cloud.yandex.net/v2/wordstat/topRequests';
    $headers = array(
        'Authorization: Api-Key ' . $cfg['yc_api_key'],
        'Content-Type: application/json; charset=utf-8'
    );
    $body = json_encode(array(
        'phrase'     => $phrase,
        'numPhrases' => '1',
        'regions'    => array((string)$cfg['wf_region']),
        'devices'    => array($cfg['wf_device']),
        'folderId'   => $cfg['yc_folder_id']
    ), JSON_UNESCAPED_UNICODE);
    list($code, $json, $err) = http_json($url, $headers, $body);
    if ($code !== 200 || !is_array($json)) {
        return array(null, 'HTTP ' . $code . ($err !== '' ? ' (' . $err . ')' : ''));
    }
    if (!isset($json['totalCount'])) { return array(null, 'в ответе нет totalCount'); }
    return array((int)$json['totalCount'], '');
}

/* ---------- значение вакансий из доступного источника ---------- */
function vacancies_count($query, $cfg) {
    $mode = $cfg['vacancies_source'];
    $hhErr = '';
    if ($mode === 'auto' || $mode === 'hh') {
        list($v, $e) = hh_found($query, $cfg['hh_ua']);
        if ($v !== null) { return array($v, 'hh.ru', ''); }
        $hhErr = $e;
        if ($mode === 'hh') { return array(null, '', $e); }
    }
    list($v, $e) = trudvsem_total($query, $cfg['trudvsem_ua']);
    if ($v !== null) { return array($v, 'trudvsem.ru', $hhErr !== '' ? 'hh недоступен (' . $hhErr . ')' : ''); }
    return array(null, '', $e . ($hhErr !== '' ? ' | hh: ' . $hhErr : ''));
}

/* ---------- основной проход ---------- */
$now     = date('c');
$total   = count($data['niches']);
$okVac   = 0;
$okWf    = 0;
$failed  = 0;
$bySource = array();
$wfMode  = $cfg['wf_mode'];
if ($wfMode === 'auto') {
    if ($cfg['yc_api_key'] !== '') { $wfMode = 'cloud'; }
    elseif ($cfg['wf_token'] !== '') { $wfMode = 'direct'; }
    else { $wfMode = 'off'; }
}
$wfSkip  = ($wfMode === 'off');

logline('НишаБух: обновление базы спроса — ' . date('d.m.Y H:i'));
logline('База: ' . $dataPath);
logline('Настройки: ' . $cfgSource);
logline('Ниш в базе: ' . $total . ' | вакансии: ' . $cfg['vacancies_source'] . ' | Вордстат: ' . $wfMode);

foreach ($data['niches'] as $i => $n) {
    $name  = isset($n['name']) ? $n['name'] : ('ниша #' . ($i + 1));
    $query = isset($n['q1']) && $n['q1'] !== '' ? $n['q1'] : $name;

    list($count, $src, $err) = vacancies_count($query, $cfg);
    if ($count !== null) {
        $d = isset($data['niches'][$i]['demand']) && is_array($data['niches'][$i]['demand'])
            ? $data['niches'][$i]['demand'] : array();
        $d['hhVacancies']      = $count;
        $d['vacanciesSource']  = $src;
        $d['updatedAt']        = $now;
        $d['demo']             = false;
        $d['source']           = trim(($d['source'] === 'Вордстат' ? '' : '') . ($wfSkip ? $src : $src . ' + Вордстат'));
        $data['niches'][$i]['demand'] = $d;
        $okVac++;
        $bySource[$src] = isset($bySource[$src]) ? $bySource[$src] + 1 : 1;
        logline('  • ' . $name . ' → вакансий: ' . $count . ' (' . $src . ')' . ($err !== '' ? ' [' . $err . ']' : ''));
    } else {
        $failed++;
        logline('  ! ' . $name . ' → не удалось: ' . $err);
    }
    msleep($cfg['delay_ms']);
}

/* ---------- Вордстат: по одной нише за прогон ---------- */
if (!$wfSkip) {
    $idx = 0;
    foreach ($data['niches'] as $i => $n) {
        $d = isset($n['demand']) && is_array($n['demand']) ? $n['demand'] : array();
        if (empty($d['wfAt'])) { $idx = $i; break; }
    }
    $n     = $data['niches'][$idx];
    $name  = isset($n['name']) ? $n['name'] : ('ниша #' . ($idx + 1));
    $query = isset($n['q1']) && $n['q1'] !== '' ? $n['q1'] : $name;
    if ($wfMode === 'cloud') {
        list($shows, $err) = wf_top_cloud($query, $cfg);
    } else {
        $shows = null;
        $err = 'числовая частотность через Директ недоступна: сервис отчётов Вордстата закрыт (проверено 15.09.2026). Нужен ключ Yandex Cloud (yc_api_key) — либо вручную вносить значения';
    }
    if ($shows !== null) {
        $d = isset($n['demand']) && is_array($n['demand']) ? $n['demand'] : array();
        $d['wordstat'] = $shows;
        $d['wfAt']     = $now;
        $data['niches'][$idx]['demand'] = $d;
        $okWf++;
        logline('  • Вордстат «' . $query . '» → показов/мес: ' . $shows);
    } else {
        logline('  ! Вордстат «' . $query . '» → ' . $err);
    }
}

/* ---------- запись ---------- */
if ($okVac > 0 || $okWf > 0) {
    $data['demandUpdatedAt'] = $now;
    $srcList = array();
    foreach ($bySource as $s => $c) { $srcList[] = $s . ' (' . $c . ')'; }
    if ($okWf > 0) { $srcList[] = 'Вордстат'; }
    $data['demandSource'] = implode(' + ', $srcList);
    if ($cfg['backup']) { @copy($dataPath, $dataPath . '.bak'); }
    $jsonOut = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    if ($jsonOut === false) { exit("Ошибка: не удалось собрать JSON.\n"); }
    $tmp = $dataPath . '.tmp';
    if (file_put_contents($tmp, $jsonOut) === false) { exit("Ошибка: не удалось записать временный файл.\n"); }
    if (!rename($tmp, $dataPath)) { @unlink($tmp); exit("Ошибка: не удалось заменить файл базы.\n"); }
    logline('');
    logline('Готово: обновлено ниш — ' . $okVac . ' из ' . $total . ' (источники: ' . $data['demandSource'] . '), Вордстат — ' . $okWf . ', ошибок: ' . $failed . '.');
    logline('База записана: ' . $dataPath);
} else {
    logline('');
    logline('Внимание: ни из одного источника не получилось взять данные — база НЕ изменена, метки времени не тронуты.');
    logline('Если у вас hh.ru: попробуйте запустить скрипт с домашнего компьютера или укажите vacancies_source = trudvsem.');
}
logline('Сайт подхватит новые числа сам: при открытии страницы и далее каждые 10 минут.');
