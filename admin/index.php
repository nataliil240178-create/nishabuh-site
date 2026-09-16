<?php
/**
 * НишаБух — админ-панель для правки данных сайта.
 * Лежит по адресу /admin/ на хостинге. Пароль задаётся при первом входе и хранится
 * вне папки сайта (в ~/update-demand.config.php), поэтому недоступен снаружи.
 * Правит только файл базы nishabuh-data.json — страницы и стили не трогает.
 */
session_name('nb_admin');
session_start();

$HOME = getenv('HOME');
$CFG  = $HOME . '/update-demand.config.php';
$DATA = $HOME . '/nataliil78.beget.tech/public_html/nishabuh-data.json';

function cfg_read($path) {
    if (!is_file($path)) return array();
    $a = @include $path;
    return is_array($a) ? $a : array();
}
function cfg_write($path, $arr) {
    $php = "<?php\nreturn " . var_export($arr, true) . ";\n";
    return @file_put_contents($path, $php) !== false;
}
function h($s) { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }
function token() {
    if (empty($_SESSION['t'])) {
        if (function_exists('random_bytes')) { $_SESSION['t'] = bin2hex(random_bytes(16)); }
        elseif (function_exists('openssl_random_pseudo_bytes')) { $_SESSION['t'] = bin2hex(openssl_random_pseudo_bytes(16)); }
        else { $_SESSION['t'] = md5(uniqid((string)mt_rand(), true)); }
    }
    return $_SESSION['t'];
}
function check_token() { return isset($_POST['t'], $_SESSION['t']) && hash_equals($_SESSION['t'], $_POST['t']); }

$cfg = cfg_read($CFG);
$msg = '';
$msgType = 'ok';

/* ---------- первый вход: задаём пароль ---------- */
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['set_pass'])) {
    $p1 = isset($_POST['p1']) ? (string)$_POST['p1'] : '';
    $p2 = isset($_POST['p2']) ? (string)$_POST['p2'] : '';
    if (empty($cfg['admin_hash'])) {
        if (mb_strlen($p1) < 8) { $msg = 'Пароль слишком короткий — нужно минимум 8 символов.'; $msgType = 'err'; }
        elseif ($p1 !== $p2) { $msg = 'Пароли не совпадают.'; $msgType = 'err'; }
        else {
            $cfg['admin_hash'] = password_hash($p1, PASSWORD_DEFAULT);
            if (cfg_write($CFG, $cfg)) { $_SESSION['auth'] = true; $msg = 'Пароль сохранён. Добро пожаловать!'; }
            else { $msg = 'Не удалось записать файл настроек — проверьте права на ~/update-demand.config.php.'; $msgType = 'err'; }
        }
    }
}

/* ---------- вход ---------- */
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['login'])) {
    if (!empty($cfg['admin_hash']) && password_verify(isset($_POST['pass']) ? (string)$_POST['pass'] : '', $cfg['admin_hash'])) {
        $_SESSION['auth'] = true;
    } else {
        sleep(1);
        $msg = 'Неверный пароль.'; $msgType = 'err';
    }
}
if (isset($_GET['out'])) { session_destroy(); header('Location: /admin/'); exit; }

$autorized = !empty($_SESSION['auth']);

/* ---------- сохранение данных ---------- */
if ($autorized && $_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['save'])) {
    if (!check_token()) { $msg = 'Сессия устарела — обновите страницу и попробуйте снова.'; $msgType = 'err'; }
    else {
        $raw = @file_get_contents($DATA);
        $data = json_decode((string)$raw, true);
        if (!is_array($data) || !isset($data['niches'])) {
            $msg = 'Не удалось прочитать базу данных.'; $msgType = 'err';
        } else {
            @copy($DATA, $DATA . '.bak');
            foreach ($data['niches'] as $i => $n) {
                if (isset($_POST['name'][$i])) {
                    $name = trim((string)$_POST['name'][$i]);
                    if ($name !== '') $data['niches'][$i]['name'] = $name;
                }
                if (isset($_POST['q1'][$i])) {
                    $data['niches'][$i]['q1'] = trim((string)$_POST['q1'][$i]);
                }
                $d = isset($data['niches'][$i]['demand']) && is_array($data['niches'][$i]['demand']) ? $data['niches'][$i]['demand'] : array();
                if (isset($_POST['wordstat'][$i]) && $_POST['wordstat'][$i] !== '') { $d['wordstat'] = (int)$_POST['wordstat'][$i]; }
                if (isset($_POST['hh'][$i]) && $_POST['hh'][$i] !== '') { $d['hhVacancies'] = (int)$_POST['hh'][$i]; }
                if (isset($_POST['trend'][$i]) && $_POST['trend'][$i] !== '') { $d['trend'] = (int)$_POST['trend'][$i]; }
                $d['manual'] = true;
                $d['updatedAt'] = date('c');
                $d['demo'] = false;
                $data['niches'][$i]['demand'] = $d;
            }
            $data['demandUpdatedAt'] = date('c');
            $out = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
            if (@file_put_contents($DATA, $out) !== false) {
                $msg = 'Сохранено. На сайте изменения появятся сразу.';
            } else {
                $msg = 'Не удалось записать базу данных.'; $msgType = 'err';
            }
        }
    }
}

$data = json_decode((string)@file_get_contents($DATA), true);
$niches = (is_array($data) && isset($data['niches'])) ? $data['niches'] : array();
?>
<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>НишаБух — панель управления</title>
<style>
:root{--fg:#1b1e23;--muted:#667;--border:#e2e5ea;--accent:#16b7a9;--soft:rgba(22,183,169,.12);
--font:'Inter','Segoe UI',system-ui,-apple-system,sans-serif;--mono:ui-monospace,'Consolas',Menlo,monospace}
*{box-sizing:border-box}body{margin:0;background:#f6f7f9;color:var(--fg);font:16px/1.55 var(--font)}
.wrap{max-width:1100px;margin:0 auto;padding:28px 22px 60px}
.top{display:flex;justify-content:space-between;align-items:baseline;gap:12px;border-bottom:2px solid var(--fg);padding-bottom:10px;margin-bottom:18px}
.brand{font-weight:800;font-size:19px;background:linear-gradient(90deg,#b24fa7,#4a6cf7);-webkit-background-clip:text;background-clip:text;color:transparent}
.card{background:#fff;border:1px solid var(--border);border-radius:12px;padding:18px 20px;margin:14px 0}
h1{font-size:23px;margin:0 0 6px}h2{font-size:18px;margin:0 0 10px}
label{display:block;font-size:13px;color:var(--muted);margin:0 0 4px}
input[type=text],input[type=password],input[type=number]{width:100%;padding:9px 11px;border:1px solid var(--border);border-radius:8px;font:inherit;background:#fff}
button{background:var(--fg);color:#fff;border:0;border-radius:9px;padding:10px 18px;font:inherit;font-weight:600;cursor:pointer}
button.ghost{background:#fff;color:var(--fg);border:1px solid var(--border)}
table{width:100%;border-collapse:collapse;font-size:15px}
th,td{border-bottom:1px solid var(--border);padding:8px 9px;text-align:left;vertical-align:top}
th{font-family:var(--mono);font-size:11.5px;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);font-weight:500}
.msg{border-radius:10px;padding:11px 14px;margin:12px 0;font-size:15px}
.msg.ok{border-left:3px solid var(--accent);background:var(--soft)}
.msg.err{border-left:3px solid #b4530a;background:#fdf4ea}
.muted{color:var(--muted);font-size:14px}
.row{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}
a{color:#1256c8}
</style>
</head>
<body>
<div class="wrap">
  <div class="top">
    <span class="brand">НишаБух · панель управления</span>
    <?php if ($autorized): ?><a href="?out=1">Выйти</a><?php endif; ?>
  </div>

  <?php if ($msg): ?><div class="msg <?= $msgType === 'ok' ? 'ok' : 'err' ?>"><?= h($msg) ?></div><?php endif; ?>

  <?php if (!$autorized): ?>
    <div class="card" style="max-width:460px">
      <?php if (empty($cfg['admin_hash'])): ?>
        <h1>Создайте пароль</h1>
        <p class="muted">Это первый вход. Придумайте пароль для панели — он сохранится на хостинге вне папки сайта, и больше никто его не увидит, включая меня.</p>
        <form method="post">
          <label>Пароль (минимум 8 символов)</label>
          <input type="password" name="p1" autocomplete="new-password" required />
          <div style="height:10px"></div>
          <label>Повторите пароль</label>
          <input type="password" name="p2" autocomplete="new-password" required />
          <div style="height:14px"></div>
          <button type="submit" name="set_pass" value="1">Сохранить пароль и войти</button>
        </form>
      <?php else: ?>
        <h1>Вход в панель</h1>
        <form method="post">
          <label>Пароль</label>
          <input type="password" name="pass" autocomplete="current-password" required />
          <div style="height:14px"></div>
          <button type="submit" name="login" value="1">Войти</button>
        </form>
      <?php endif; ?>
    </div>

  <?php else: ?>
    <form method="post">
      <input type="hidden" name="t" value="<?= h(token()) ?>" />
      <div class="card">
        <h1>Ниши</h1>
        <p class="muted">Правьте формулировку для Вордстата и цифры. Поля «показов» и «вакансий» заполняет автоматика каждое утро — если поменяете вручную, ваше значение сохранится до следующего обновления.</p>
        <table>
          <tr>
            <th style="width:22%">Ниша</th>
            <th style="width:28%">Фраза для Вордстата</th>
            <th style="width:12%">Показов/мес</th>
            <th style="width:12%">Вакансий</th>
            <th style="width:10%">Динамика, %</th>
            <th style="width:16%">Обновлено</th>
          </tr>
          <?php foreach ($niches as $i => $n):
              $d = isset($n['demand']) && is_array($n['demand']) ? $n['demand'] : array(); ?>
            <tr>
              <td><input type="text" name="name[<?= (int)$i ?>]" value="<?= h(isset($n['name']) ? $n['name'] : '') ?>" /></td>
              <td><input type="text" name="q1[<?= (int)$i ?>]" value="<?= h(isset($n['q1']) ? $n['q1'] : '') ?>" /></td>
              <td><input type="number" name="wordstat[<?= (int)$i ?>]" value="<?= h(isset($d['wordstat']) ? $d['wordstat'] : '') ?>" /></td>
              <td><input type="number" name="hh[<?= (int)$i ?>]" value="<?= h(isset($d['hhVacancies']) ? $d['hhVacancies'] : '') ?>" /></td>
              <td><input type="number" name="trend[<?= (int)$i ?>]" value="<?= h(isset($d['trend']) ? $d['trend'] : '') ?>" /></td>
              <td class="muted"><?= h(isset($d['updatedAt']) ? date('d.m.Y H:i', strtotime($d['updatedAt'])) : '—') ?><br /><span style="font-size:12px"><?= !empty($d['manual']) ? 'правка вручную' : 'автоматически' ?></span></td>
            </tr>
          <?php endforeach; ?>
        </table>
        <div style="margin-top:16px;display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <button type="submit" name="save" value="1">Сохранить изменения</button>
          <span class="muted">Перед записью автоматически делается копия базы (nishabuh-data.json.bak).</span>
        </div>
      </div>
    </form>
    <div class="card">
      <h2>Что дальше</h2>
      <p class="muted">Сейчас панель правит ниши: название, формулировку для Вордстата и цифры. Тексты на страницах, партнёрки и ленту заявок можно добавить сюда же — скажите, что нужнее, и допишу.</p>
      <p class="muted">Открыть сайт: <a href="https://nishabuh.ru/" target="_blank" rel="noopener">nishabuh.ru</a></p>
    </div>
  <?php endif; ?>
</div>
</body>
</html>
