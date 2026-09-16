<?php
/**
 * НишаБух — обновление частотности (Wordstat API в Yandex Cloud).
 * Запуск только из командной строки: php tools/wf-update.php
 * Ключ берётся из ~/update-demand.config.php (вне папки сайта).
 */
if (PHP_SAPI !== 'cli') { http_response_code(403); exit("Только из командной строки.\n"); }
$home = getenv('HOME');
$cfgFile = $home . '/update-demand.config.php';
$cfg = is_file($cfgFile) ? include $cfgFile : array();
$key    = isset($cfg['yc_api_key'])   ? $cfg['yc_api_key']   : '';
$folder = isset($cfg['yc_folder_id']) ? $cfg['yc_folder_id'] : '';
$region = isset($cfg['wf_region'])    ? $cfg['wf_region']    : 225;
$device = isset($cfg['wf_device'])    ? $cfg['wf_device']    : 'DEVICE_ALL';
$dataPath = $home . '/nataliil78.beget.tech/public_html/nishabuh-data.json';
if ($key === '') { exit("Нет ключа yc_api_key в настройках.\n"); }
$data = json_decode(file_get_contents($dataPath), true);
if (!is_array($data) || !isset($data['niches'])) { exit("База не разобрана.\n"); }
$now = date('c'); $ok = 0; $err = 0;
foreach ($data['niches'] as $i => $n) {
    $phrase = (isset($n['q1']) && $n['q1'] !== '') ? $n['q1'] : $n['name'];
    $ch = curl_init('https://searchapi.api.cloud.yandex.net/v2/wordstat/topRequests');
    curl_setopt_array($ch, array(
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 25,
        CURLOPT_HTTPHEADER => array('Authorization: Api-Key ' . $key, 'Content-Type: application/json'),
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode(array('phrase'=>$phrase,'numPhrases'=>'1','regions'=>array((string)$region),'devices'=>array($device),'folderId'=>$folder), JSON_UNESCAPED_UNICODE)
    ));
    $out = curl_exec($ch); $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
    $j = json_decode($out, true);
    if ($code === 200 && is_array($j) && isset($j['totalCount'])) {
        $d = (isset($data['niches'][$i]['demand']) && is_array($data['niches'][$i]['demand'])) ? $data['niches'][$i]['demand'] : array();
        $d['wordstat'] = (int)$j['totalCount'];
        $d['wfAt'] = $now;
        $data['niches'][$i]['demand'] = $d;
        $ok++;
        echo '  + ' . $n['name'] . ' → показов: ' . $j['totalCount'] . "\n";
    } else {
        $err++;
        echo '  ! ' . $n['name'] . ' → ошибка ' . $code . ' ' . substr((string)$out, 0, 120) . "\n";
    }
    usleep(400000);
}
if ($ok > 0) {
    if (!empty($cfg['backup'])) { @copy($dataPath, $dataPath . '.bak'); }
    file_put_contents($dataPath, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    echo "Готово: частотность обновлена у $ok ниш из " . count($data['niches']) . ", ошибок: $err\n";
} else {
    echo "Ничего не обновлено — база не изменена.\n";
}
