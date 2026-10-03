'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const root = path.join(__dirname, '..');
process.chdir(root);

const isWin = process.platform === 'win32';
const isMac = process.platform === 'darwin';
const isLinux = process.platform === 'linux';

const log = (msg) => {
  console.log(`infra:prepare: ${msg}`);
};

const die = (msg) => {
  log(msg);
  process.exit(1);
};

const extraDockerDirs = () => {
  const dirs = [];
  if (isMac) {
    dirs.push(
      '/Applications/Docker.app/Contents/Resources/bin',
      '/usr/local/bin',
      '/opt/homebrew/bin',
    );
  }
  if (isWin) {
    const pf = process.env.ProgramFiles || 'C:\\Program Files';
    dirs.push(path.join(pf, 'Docker', 'Docker', 'resources', 'bin'));
    dirs.push(path.join(pf, 'Docker', 'Docker', 'resources'));
  }
  return dirs.filter((dir) => fs.existsSync(dir));
};

const prependDockerPath = () => {
  const extra = extraDockerDirs();
  if (extra.length > 0) {
    process.env.PATH = `${extra.join(path.delimiter)}${path.delimiter}${process.env.PATH || ''}`;
  }
};

const which = (cmd) => {
  const names =
    isWin && !path.extname(cmd) ? [cmd, `${cmd}.exe`, `${cmd}.cmd`, `${cmd}.bat`] : [cmd];
  const dirs = [...extraDockerDirs(), ...(process.env.PATH || '').split(path.delimiter)];
  for (const name of names) {
    if (name.includes(path.sep) && fs.existsSync(name)) {
      return name;
    }
    for (const dir of dirs) {
      if (!dir) {
        continue;
      }
      const full = path.join(dir, name);
      if (fs.existsSync(full)) {
        return full;
      }
    }
  }
  return null;
};

const run = (cmd, args, opts = {}) =>
  spawnSync(cmd, args, {
    cwd: opts.cwd ?? root,
    env: process.env,
    stdio: opts.stdio ?? 'inherit',
    encoding: 'utf8',
    windowsHide: true,
    shell: opts.shell ?? false,
  });

const runOk = (cmd, args) => run(cmd, args, { stdio: 'ignore' }).status === 0;

const requireStatus = (result, message) => {
  if (result.status !== 0) {
    die(message);
  }
};

const dockerBin = () => which('docker');

const dockerReady = () => {
  prependDockerPath();
  const docker = dockerBin();
  if (!docker) {
    return false;
  }
  return runOk(docker, ['info']) && runOk(docker, ['compose', 'version']);
};

const askYes = (question) =>
  new Promise((resolve) => {
    const input = process.stdin;
    const output = process.stdout;
    if (!input.isTTY) {
      resolve(false);
      return;
    }
    const rl = readline.createInterface({ input, output });
    rl.question(`infra:prepare: ${question} [y/N] `, (answer) => {
      rl.close();
      resolve(/^(y|yes|да|д)$/i.test(String(answer || '').trim()));
    });
  });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitDocker = async (timeoutMs) => {
  log('жду Docker daemon');
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    prependDockerPath();
    const docker = dockerBin();
    if (docker && runOk(docker, ['info'])) {
      return true;
    }
    await sleep(2000);
  }
  return false;
};

const linkComposePlugin = () => {
  const docker = dockerBin();
  if (docker && runOk(docker, ['compose', 'version'])) {
    return true;
  }
  const brew = which('brew');
  if (!brew) {
    return false;
  }
  const prefix = run(brew, ['--prefix'], { stdio: 'pipe' });
  if (prefix.status !== 0) {
    return false;
  }
  const plugin = path.join(
    String(prefix.stdout || '').trim(),
    'lib',
    'docker',
    'cli-plugins',
    'docker-compose',
  );
  if (!fs.existsSync(plugin)) {
    return false;
  }
  const destDir = path.join(osHomedir(), '.docker', 'cli-plugins');
  fs.mkdirSync(destDir, { recursive: true });
  const dest = path.join(destDir, 'docker-compose');
  try {
    fs.rmSync(dest, { force: true });
    fs.symlinkSync(plugin, dest);
  } catch {
    return false;
  }
  prependDockerPath();
  const after = dockerBin();
  return Boolean(after && runOk(after, ['compose', 'version']));
};

const osHomedir = () => require('os').homedir();

const installDockerMacos = async () => {
  const brew = which('brew');
  if (!brew) {
    die('нужен Homebrew: https://brew.sh — затем снова npm run infra:prepare');
  }
  if (!dockerBin()) {
    log('ставлю Docker CLI и Docker Compose (Homebrew)');
    requireStatus(run(brew, ['install', 'docker', 'docker-compose']), 'brew install docker не удался');
  } else if (!runOk(dockerBin(), ['compose', 'version'])) {
    log('ставлю Docker Compose (Homebrew)');
    requireStatus(run(brew, ['install', 'docker-compose']), 'brew install docker-compose не удался');
  }
  linkComposePlugin();
  prependDockerPath();
  if (dockerBin() && runOk(dockerBin(), ['info'])) {
    return;
  }
  if (fs.existsSync('/Applications/Docker.app')) {
    log('запускаю Docker Desktop');
    run('open', ['-a', 'Docker']);
    if (!(await waitDocker(180000))) {
      die('Docker Desktop не поднялся — откройте приложение и повторите npm run infra:prepare');
    }
    return;
  }
  if (!which('colima')) {
    log('ставлю colima (Docker engine без Docker Desktop)');
    requireStatus(run(brew, ['install', 'colima']), 'brew install colima не удался');
  }
  log('запускаю colima');
  requireStatus(run(which('colima') || 'colima', ['start']), 'colima start не удался');
  if (!(await waitDocker(180000))) {
    die('colima запущен, но docker info не отвечает');
  }
};

const installDockerLinux = async () => {
  if (!dockerBin() || !runOk(dockerBin(), ['compose', 'version'])) {
    if (!which('curl')) {
      die('нужен curl для установки Docker');
    }
    log('ставлю Docker Engine и Compose (get.docker.com, нужен sudo)');
    requireStatus(
      run('sh', ['-c', 'curl -fsSL https://get.docker.com | sudo sh']),
      'установка Docker через get.docker.com не удалась',
    );
  }
  if (which('systemctl')) {
    run('sudo', ['systemctl', 'enable', '--now', 'docker'], { stdio: 'ignore' });
    if (!runOk('sudo', ['systemctl', 'is-active', '--quiet', 'docker'])) {
      run('sudo', ['systemctl', 'start', 'docker'], { stdio: 'ignore' });
    }
  }
  prependDockerPath();
  if (dockerBin() && runOk(dockerBin(), ['info'])) {
    return;
  }
  const groups = run('id', ['-nG'], { stdio: 'pipe' });
  const inDockerGroup = String(groups.stdout || '')
    .split(/\s+/)
    .includes('docker');
  if (!inDockerGroup) {
    log('добавляю пользователя в группу docker');
    run('sudo', ['usermod', '-aG', 'docker', process.env.USER || '']);
  }
  if (process.env.INFRA_PREPARE_DOCKER_REEXEC !== '1' && runOk('sg', ['docker', '-c', 'docker info'])) {
    log('перезапускаю скрипт в группе docker');
    const rerun = spawnSync(
      'sg',
      ['docker', '-c', `cd ${JSON.stringify(root)} && node scripts/infra-prepare.cjs`],
      {
        cwd: root,
        env: { ...process.env, INFRA_PREPARE_DOCKER_REEXEC: '1' },
        stdio: 'inherit',
        encoding: 'utf8',
      },
    );
    process.exit(rerun.status === null ? 1 : rerun.status);
  }
  if (!(await waitDocker(180000))) {
    die('Docker установлен, но демон недоступен — выйдите из сессии и повторите npm run infra:prepare');
  }
};

const winPs = (command, opts = {}) =>
  run(
    'powershell.exe',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', command],
    opts,
  );

const dockerDesktopExe = () => {
  const pf = process.env.ProgramFiles || 'C:\\Program Files';
  const exe = path.join(pf, 'Docker', 'Docker', 'Docker Desktop.exe');
  return fs.existsSync(exe) ? exe : null;
};

const startDockerDesktopWindows = () => {
  const exe = dockerDesktopExe();
  if (!exe) {
    return false;
  }
  log('запускаю Docker Desktop');
  const escaped = exe.replace(/'/g, "''");
  winPs(`Start-Process -FilePath '${escaped}'`);
  return true;
};

const installDockerWindows = async () => {
  prependDockerPath();
  if (dockerDesktopExe()) {
    startDockerDesktopWindows();
    if (!(await waitDocker(300000))) {
      die(
        'Docker Desktop не поднялся — откройте приложение (WSL2 backend), при необходимости перезагрузитесь и повторите npm run infra:prepare',
      );
    }
    return;
  }
  const winget =
    which('winget') ||
    (process.env.LOCALAPPDATA
      ? path.join(process.env.LOCALAPPDATA, 'Microsoft', 'WindowsApps', 'winget.exe')
      : null);
  const wingetExists = winget && fs.existsSync(winget);
  if (wingetExists) {
    log('ставлю Docker Desktop (winget)');
    const installed = run(winget, [
      'install',
      '-e',
      '--id',
      'Docker.DockerDesktop',
      '--accept-package-agreements',
      '--accept-source-agreements',
      '--disable-interactivity',
    ]);
    if (installed.status !== 0) {
      log('winget не смог поставить Docker Desktop, пробую Chocolatey');
    }
  }
  if (!dockerDesktopExe() && !dockerBin()) {
    const choco =
      which('choco') ||
      path.join(process.env.ProgramData || 'C:\\ProgramData', 'chocolatey', 'bin', 'choco.exe');
    if (fs.existsSync(choco)) {
      log('ставлю Docker Desktop (Chocolatey)');
      requireStatus(run(choco, ['install', 'docker-desktop', '-y']), 'choco install docker-desktop не удался');
    } else if (!wingetExists) {
      die(
        'на Windows нужен winget (App Installer) или Chocolatey, либо поставьте Docker Desktop вручную: https://docs.docker.com/desktop/setup/install/windows-install/',
      );
    } else if (!dockerDesktopExe()) {
      die(
        'не удалось установить Docker Desktop — поставьте с https://docs.docker.com/desktop/setup/install/windows-install/ и повторите npm run infra:prepare',
      );
    }
  }
  prependDockerPath();
  startDockerDesktopWindows();
  if (!(await waitDocker(300000))) {
    die(
      'Docker Desktop установлен, но демон не отвечает — откройте Docker Desktop, дождитесь зелёного статуса и повторите npm run infra:prepare',
    );
  }
};

const installDockerStack = async () => {
  if (isMac) {
    await installDockerMacos();
    return;
  }
  if (isLinux) {
    await installDockerLinux();
    return;
  }
  if (isWin) {
    await installDockerWindows();
    return;
  }
  die(`автоустановка Docker не поддерживается на ${process.platform}`);
};

const ensureDocker = async () => {
  prependDockerPath();
  if (dockerReady()) {
    return;
  }
  if (!dockerBin()) {
    log('Docker не найден в PATH');
  } else if (!runOk(dockerBin(), ['info'])) {
    log('Docker daemon не запущен');
  } else {
    log('нужен Docker Compose v2 (docker compose)');
  }
  if (!(await askYes('Установить Docker и Docker Compose и продолжить?'))) {
    die('нужен Docker в PATH, запущенный демон и Docker Compose v2');
  }
  await installDockerStack();
  prependDockerPath();
  linkComposePlugin();
  if (!dockerReady()) {
    die('Docker / Compose так и не стали доступны после установки');
  }
  log('Docker готов, продолжаю');
};

const npmCmd = () => (isWin ? which('npm') || 'npm.cmd' : 'npm');

const composeHasWait = (docker) => {
  const help = run(docker, ['compose', 'up', '--help'], { stdio: 'pipe' });
  return /--wait/.test(`${help.stdout || ''}${help.stderr || ''}`);
};

const waitHttp = async (url, serviceName) => {
  const headers = serviceName ? { 'x-service-name': serviceName } : {};
  const deadline = Date.now() + 180000;
  for (;;) {
    try {
      const response = await fetch(url, { headers });
      if (response.ok) {
        return true;
      }
    } catch {
      // retry
    }
    if (Date.now() > deadline) {
      return false;
    }
    await sleep(2000);
  }
};

const main = async () => {
  await ensureDocker();

  if (!fs.existsSync(path.join(root, 'node_modules'))) {
    log('npm install (корень)');
    requireStatus(run(npmCmd(), ['install']), 'npm install в корне не удался');
  }
  if (!fs.existsSync(path.join(root, 'apps', 'test-indexer', 'node_modules'))) {
    log('npm install (apps/test-indexer)');
    requireStatus(
      run(npmCmd(), ['--prefix', 'apps/test-indexer', 'install']),
      'npm install в apps/test-indexer не удался',
    );
  }
  if (!fs.existsSync(path.join(root, '.env')) && fs.existsSync(path.join(root, '.env.example'))) {
    fs.copyFileSync(path.join(root, '.env.example'), path.join(root, '.env'));
    log('создан .env из .env.example (токены не подставляются)');
  }

  prependDockerPath();
  const docker = dockerBin();
  if (!docker) {
    die('docker не найден после установки');
  }

  const compose = ['compose', '-f', 'docker-compose.yml'];
  if (
    fs.existsSync(path.join(root, 'json-examples', 'reference-corpus.json'))
  ) {
    compose.push('-f', 'docker-compose.seed.yml');
    log('подключаю сид documents-reference');
  } else {
    log('корпус json-examples/reference-corpus.json не найден — соседний микросервис без сида референса');
  }

  log('поднимаю postgres, opensearch, test-indexer');
  const up = ['up', '--build', '--detach'];
  if (composeHasWait(docker)) {
    up.push('--wait');
  }
  requireStatus(
    run(docker, [...compose, ...up, 'postgres', 'opensearch', 'test-indexer']),
    'docker compose up не удался',
  );

  log('жду OpenSearch :9200');
  if (!(await waitHttp('http://127.0.0.1:9200'))) {
    die('OpenSearch не ответил на http://127.0.0.1:9200');
  }
  log('жду индексатор :3100/internal/v1/health');
  if (!(await waitHttp('http://127.0.0.1:3100/internal/v1/health', 'synthetic-data-generator'))) {
    die('test-indexer не ответил на health');
  }

  log('готово');
  log('');
  log('Инфраструктура');
  log('  Postgres     127.0.0.1:5434  (indexer / indexer, база indexer)');
  log('  OpenSearch   http://127.0.0.1:9200');
  log('  Соседний микросервис  http://127.0.0.1:3100');
  log('');
  log('Локальный запуск генератора против соседнего микросервиса');
  if (isWin) {
    log('  set INDEXER_BASE_URL=http://127.0.0.1:3100&& npm run start:dev');
    log('  PowerShell: $env:INDEXER_BASE_URL="http://127.0.0.1:3100"; npm run start:dev');
  } else {
    log('  INDEXER_BASE_URL=http://127.0.0.1:3100 npm run start:dev');
  }
  log('');
  log('Пульт: http://127.0.0.1:3000   (без INDEXER_BASE_URL останется in-memory LocalDataModule)');
};

main().catch((error) => {
  die(error instanceof Error ? error.message : String(error));
});
