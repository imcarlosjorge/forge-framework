#!/usr/bin/env node
import { Command } from 'commander';
import { spawn, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import net from 'net';

const program = new Command();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔥 sanitizeEnv garante que não haja undefined
function sanitizeEnv(env: Record<string, string | undefined>): Record<string, string> {
  const sanitized: Record<string, string> = {};
  Object.entries(env).forEach(([key, value]) => {
    if (value !== undefined) sanitized[key] = value;
  });
  return sanitized;
}

function runPnpm(args: string[], env?: Record<string, string>, opts?: { cwd?: string }) {
  spawnSync('pnpm', args, {
    cwd: opts?.cwd ?? process.cwd(),
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      ...sanitizeEnv(env ?? {})
    }
  });
}

function runPnpmAsync(args: string[], env?: Record<string, string>, opts?: { cwd?: string }) {
  spawn('pnpm', args, {
    cwd: opts?.cwd ?? process.cwd(),
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      ...sanitizeEnv(env ?? {})
    }
  });
}

// ------------------------ Funções auxiliares ------------------------

function getEnvVar(envPath: string, key: string, defaultVal: number): number {
  if (!fs.existsSync(envPath)) return defaultVal;
  const content = fs.readFileSync(envPath, 'utf-8');
  const match = content.match(new RegExp(`^${key}=(\\d+)`, 'm'));
  return match ? Number(match[1]) : defaultVal;
}

function checkEnvExists(name: string, envPath: string, examplePath: string) {
  if (!fs.existsSync(envPath)) {
    console.error(`❌ .env do ${name} não encontrado! Crie a partir de: ${examplePath}`);
    process.exit(1);
  }
}

function hasScript(scriptName: string): boolean {
  const pkgPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(pkgPath)) return false;
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  return Boolean(pkg.scripts?.[scriptName]);
}

function fixTurboConfigIfNeeded(opts: { fix?: boolean }) {
  const turboPath = path.join(process.cwd(), 'turbo.json');
  if (!fs.existsSync(turboPath)) return;

  const turboConfig = JSON.parse(fs.readFileSync(turboPath, 'utf-8'));
  if (turboConfig.pipeline) {
    if (opts.fix) {
      turboConfig.tasks = turboConfig.pipeline;
      delete turboConfig.pipeline;
      fs.writeFileSync(turboPath, JSON.stringify(turboConfig, null, 2));
      console.log('🛠️  turbo.json atualizado (pipeline → tasks)');
    } else {
      console.error('❌ turbo.json usa "pipeline". Turbo 2.x exige "tasks".');
      process.exit(1);
    }
  }
}

function parseEnv(file: string): Record<string, string> {
  if (!fs.existsSync(file)) return {};

  return Object.fromEntries(
    fs.readFileSync(file, "utf-8")
      .split("\n")
      .map(l => l.trim())
      .filter(l => l && !l.startsWith("#"))
      .map(line => {
        const [key, ...rest] = line.split("=");
        return [key, rest.join("=")];
      })
  );
}

function writeEnvExample(file: string, keys: string[]) {
  const content = keys.map(k => `${k}=`).join("\n");
  fs.writeFileSync(file, content + "\n");
}

function writeEnv(file: string, values: Record<string, string>) {
  const content = Object.entries(values)
    .map(([k, v]) => `${k}=${v ?? ""}`)
    .join("\n");

  fs.writeFileSync(file, content + "\n");
}

// ------------------------ CLI ------------------------

program
  .name('forge')
  .description('CLI do Forge Framework')
  .version('1.0.0');

const dev = program
  .command('dev')
  .description('Sobe o ambiente de desenvolvimento');

// frontend
dev.command('frontend')
  .description('Roda apenas o frontend')
  .option('--port <number>', 'Define a porta do frontend', (v) => parseInt(v, 10))
  .action((opts) => {
    const envPath = path.join(process.cwd(), 'apps/frontend/.env');
    const examplePath = path.join(process.cwd(), 'apps/frontend/.env.example');
    checkEnvExists('frontend', envPath, examplePath);

    const port = opts.port || getEnvVar(envPath, 'VITE_PORT', 5173);
    console.log(`🚀 Rodando frontend na porta ${port}`);

    //runPnpm(['run', 'dev:web'], { VITE_PORT: String(port) });
    const frontendDir = path.join(process.cwd(), 'apps/frontend');

    runPnpm(
      ['run', 'dev'],
      { VITE_PORT: String(port) },
      { cwd: frontendDir }
    );
  });

// backend
dev.command('backend')
  .description('Roda apenas o backend')
  .option('--port <number>', 'Define a porta do backend', (v) => parseInt(v, 10))
  .action((opts) => {
    const envPath = path.join(process.cwd(), 'apps/backend/.env');
    const examplePath = path.join(process.cwd(), 'apps/backend/.env.example');
    checkEnvExists('backend', envPath, examplePath);

    const port = opts.port || getEnvVar(envPath, 'PORT', 3001);
    console.log(`🖥️ Rodando backend na porta ${port}`);

    //runPnpm(['run', 'dev:api'], { PORT: String(port) });
    const backendDir = path.join(process.cwd(), 'apps/backend');

    runPnpm(
      ['run', 'dev'],
      { PORT: String(port) },
      { cwd: backendDir }
    );
  });

// full
dev.command('full')
  .description('Roda frontend e backend simultaneamente')
  .option('--frontend-port <number>', 'Define a porta do frontend', (v) => parseInt(v, 10))
  .option('--backend-port <number>', 'Define a porta do backend', (v) => parseInt(v, 10))
  .action((opts) => {
    console.log('📍 CLI rodando em:', process.cwd());

    if (!hasScript('dev:web') || !hasScript('dev:api')) {
      console.error('❌ Scripts dev:web e dev:api não encontrados no package.json do projeto.');
      process.exit(1);
    }

    fixTurboConfigIfNeeded({ fix: true });

    const frontendEnvPath = path.join(process.cwd(), 'apps/frontend/.env');
    const backendEnvPath = path.join(process.cwd(), 'apps/backend/.env');

    const frontendPort = opts.frontendPort || getEnvVar(frontendEnvPath, 'VITE_PORT', 5173);
    const backendPort = opts.backendPort || getEnvVar(backendEnvPath, 'PORT', 3001);

    console.log(`🚀 Rodando frontend na porta ${frontendPort}`);
    console.log(`🖥️ Rodando backend na porta ${backendPort}`);

    const frontendDir = path.join(process.cwd(), 'apps/frontend');
    const backendDir = path.join(process.cwd(), 'apps/backend');

    runPnpmAsync(
      ['run', 'dev'],
      { VITE_PORT: String(frontendPort) },
      { cwd: frontendDir }
    );

    runPnpmAsync(
      ['run', 'dev'],
      { PORT: String(backendPort) },
      { cwd: backendDir }
    );
  });

// ------------------------ DOCTOR COMPLETO ------------------------

program
  .command('doctor')
  .description('Verifica se o ambiente está pronto para rodar o Forge (checkup completo)')
  .option('--fix', 'Tenta corrigir automaticamente problemas simples')
  .action(async (opts) => {
    console.log('🩺 Forge Doctor - Checkup Completo\n');

    let hasError = false;

    function checkCmd(name: string, cmd: string, args: string[]): boolean {
      const res = spawnSync(cmd, args, { shell: true, stdio: 'ignore' });
      if (res.status === 0) {
        console.log(`✅ ${name} OK`);
        return true;
      } else {
        console.error(`❌ ${name} não encontrado`);
        return false;
      }
    }

    if (!checkCmd('Node.js', 'node', ['-v'])) hasError = true;
    if (!checkCmd('pnpm', 'pnpm', ['-v'])) hasError = true;
    if (!checkCmd('Git', 'git', ['--version'])) hasError = true;

    const hasTurbo = checkCmd('Turbo (local)', 'pnpm', ['exec', 'turbo', '--version']);
    if (!hasTurbo) {
      hasError = true;
      console.log('💡 Dica: instale o Turbo local no workspace root com:');
      console.log('   pnpm add -Dw turbo');
    }

    fixTurboConfigIfNeeded(opts);

    const frontendEnv = path.join(process.cwd(), 'apps/frontend/.env');
    const frontendExample = path.join(process.cwd(), 'apps/frontend/.env.example');
    const backendEnv = path.join(process.cwd(), 'apps/backend/.env');
    const backendExample = path.join(process.cwd(), 'apps/backend/.env.example');

    function ensureEnv(name: string, envPath: string, examplePath: string): boolean {
      if (fs.existsSync(envPath)) {
        console.log(`✅ .env do ${name} encontrado`);
        return true;
      }

      console.error(`❌ .env do ${name} não encontrado`);
      if (opts.fix) {
        if (fs.existsSync(examplePath)) {
          fs.copyFileSync(examplePath, envPath);
          console.log(`🛠️  Criado ${envPath} a partir de ${examplePath}`);
        } else {
          fs.writeFileSync(envPath, '');
          console.log(`🛠️  Criado ${envPath} vazio`);
        }
        return true;
      }
      return false;
    }

    if (!ensureEnv('frontend', frontendEnv, frontendExample)) hasError = true;
    if (!ensureEnv('backend', backendEnv, backendExample)) hasError = true;

    const frontendPort = getEnvVar(frontendEnv, 'VITE_PORT', 5173);
    const backendPort = getEnvVar(backendEnv, 'PORT', 3001);

    function checkPort(port: number): Promise<boolean> {
      return new Promise((resolve) => {
        const server = net.createServer()
          .once('error', () => resolve(false))
          .once('listening', () => {
            server.close();
            resolve(true);
          })
          .listen(port);
      });
    }

    const frontendPortFree = await checkPort(frontendPort);
    const backendPortFree = await checkPort(backendPort);

    console.log(frontendPortFree ? `✅ Porta ${frontendPort} disponível (frontend)` : `❌ Porta ${frontendPort} em uso (frontend)`);
    console.log(backendPortFree ? `✅ Porta ${backendPort} disponível (backend)` : `❌ Porta ${backendPort} em uso (backend)`);

    if (!frontendPortFree || !backendPortFree) hasError = true;

    ['apps/frontend', 'apps/backend'].forEach((dir) => {
      const nodeModulesPath = path.join(process.cwd(), dir, 'node_modules');
      if (fs.existsSync(nodeModulesPath)) {
        console.log(`✅ node_modules em ${dir} encontrado`);
      } else {
        console.error(`❌ node_modules em ${dir} não encontrado`);
        hasError = true;
      }
    });

    const requiredBackendVars = ['PORT', 'JWT_SECRET'];
    const requiredFrontendVars = ['VITE_PORT', 'VITE_API_URL'];

    function checkVars(envPath: string, vars: string[], label: string) {
      if (!fs.existsSync(envPath)) return;
      const content = fs.readFileSync(envPath, 'utf-8');
      vars.forEach((v) => {
        if (!new RegExp(`^${v}=.+`, 'm').test(content)) {
          console.error(`❌ Variável ${v} não definida no .env (${label})`);
          hasError = true;
        } else {
          console.log(`✅ Variável ${v} definida (${label})`);
        }
      });
    }

    checkVars(backendEnv, requiredBackendVars, 'backend');
    checkVars(frontendEnv, requiredFrontendVars, 'frontend');

    if (hasError) {
      console.error('\n🚨 Ambiente incompleto.');
      process.exit(1);
    }

    console.log('\n🎉 Ambiente pronto pra rodar o Forge!🔥');
  });

// ------------------------ INIT ------------------------

program
  .command('init <name>')
  .description('Cria um novo projeto Forge baseado no framework completo')
  .action(async (name: string) => {
    const targetDir = path.resolve(process.cwd(), name);
    const templateDir = path.resolve(__dirname, '../templates/default');

    if (fs.existsSync(targetDir)) {
      console.error(`❌ A pasta "${name}" já existe.`);
      process.exit(1);
    }

    console.log(`📁 Criando projeto em ${targetDir}...`);
    fs.cpSync(templateDir, targetDir, { recursive: true });
    console.log('📦 Template copiado com sucesso!');

    const crypto = await import('crypto');

    const backendEnvPath = path.join(targetDir, 'apps/backend/.env');
    fs.writeFileSync(
      backendEnvPath,
      `PORT=3001
JWT_SECRET=${crypto.randomBytes(32).toString('hex')}`
    );

    const frontendEnvPath = path.join(targetDir, 'apps/frontend/.env');
    fs.writeFileSync(
      frontendEnvPath,
      `VITE_PORT=5173
VITE_API_URL=http://localhost:3001`
    );

    const installDeps = (dir: string, label: string) => {
      console.log(`📦 Instalando dependências do ${label}...`);

      const res = spawnSync('pnpm', ['install', '--prefix', dir, '--silent'], {
        stdio: 'pipe',
        shell: true,
      });

      if (res.status !== 0) {
        console.error(`❌ Erro ao instalar dependências do ${label}:`);
        console.error(res.stderr?.toString() || 'Erro desconhecido');
        process.exit(1);
      }

      console.log(`✅ ${label} pronto`);
    };

    installDeps(path.join(targetDir, 'apps/backend'), 'backend');
    installDeps(path.join(targetDir, 'apps/frontend'), 'frontend');

    console.log('🩺 Rodando forge doctor --fix...');
    spawnSync('node', [path.join(__dirname, '../dist/index.js'), 'doctor', '--fix'], {
      cwd: targetDir,
      stdio: 'inherit',
      shell: true
    });

    console.log('🌱 Rodando forge env sync...');
    spawnSync('node', [path.join(__dirname, '../dist/index.js'), 'env', 'sync'], {
      cwd: targetDir,
      stdio: 'inherit',
      shell: true
    });

    console.log('\n🎉 Projeto Forge criado com sucesso!');
    console.log(`👉 Agora rode:\n   cd ${name}\n   forge dev full`);
  });

// ------------------------ INFO ------------------------

program
  .command('info')
  .description('Mostra informações do ambiente e do projeto Forge')
  .action(() => {
    console.log('ℹ️  Forge Info\n');

    function getCmdVersion(cmd: string, args: string[]) {
      const res = spawnSync(cmd, args, { shell: true, encoding: 'utf-8' });
      if (res.status === 0) {
        return res.stdout?.trim() || 'OK';
      }
      return 'não encontrado';
    }

    const nodeVersion = getCmdVersion('node', ['-v']);
    const pnpmVersion = getCmdVersion('pnpm', ['-v']);
    const turboVersion = getCmdVersion('pnpm', ['exec', 'turbo', '--version']);

    const root = process.cwd();
    const frontendDir = path.join(root, 'apps/frontend');
    const backendDir = path.join(root, 'apps/backend');

    const frontendEnv = path.join(frontendDir, '.env');
    const backendEnv = path.join(backendDir, '.env');

    const frontendPort = getEnvVar(frontendEnv, 'VITE_PORT', 5173);
    const backendPort = getEnvVar(backendEnv, 'PORT', 3001);

    console.log(`Node: ${nodeVersion}`);
    console.log(`pnpm: ${pnpmVersion}`);
    console.log(`turbo: ${turboVersion}\n`);

    console.log(`📁 Root: ${root}`);
    console.log(`📦 Frontend: ${fs.existsSync(frontendDir) ? frontendDir : 'não encontrado'}`);
    console.log(`📦 Backend: ${fs.existsSync(backendDir) ? backendDir : 'não encontrado'}\n`);

    console.log(`🌐 Frontend port: ${frontendPort}`);
    console.log(`🖥️ Backend port: ${backendPort}\n`);

    if (!fs.existsSync(frontendEnv)) {
      console.log('⚠️  .env do frontend não encontrado');
    }
    if (!fs.existsSync(backendEnv)) {
      console.log('⚠️  .env do backend não encontrado');
    }
  });

// ------------------------ PORTS ------------------------

program
  .command('ports')
  .description('Mostra as portas do frontend/backend e verifica se estão livres')
  .option('--port <number>', 'Verifica se uma porta específica está livre', (v) => parseInt(v, 10))
  .action(async (opts) => {
    function checkPort(port: number): Promise<boolean> {
      return new Promise((resolve) => {
        const server = net.createServer()
          .once('error', () => resolve(false))
          .once('listening', () => {
            server.close();
            resolve(true);
          })
          .listen(port);
      });
    }

    // Caso: usuário quer checar uma porta específica
    if (opts.port) {
      const free = await checkPort(opts.port);
      console.log(
        free
          ? `✅ Porta ${opts.port} está livre`
          : `🚨 Porta ${opts.port} está em uso`
      );
      return;
    }

    // Caso padrão: mostra portas do projeto
    const frontendEnv = path.join(process.cwd(), 'apps/frontend/.env');
    const backendEnv = path.join(process.cwd(), 'apps/backend/.env');

    const frontendPort = getEnvVar(frontendEnv, 'VITE_PORT', 5173);
    const backendPort = getEnvVar(backendEnv, 'PORT', 3001);

    const frontendFree = await checkPort(frontendPort);
    const backendFree = await checkPort(backendPort);

    console.log('\n🔌 Portas do Forge:\n');

    console.log(
      frontendFree
        ? `🚀 Frontend: ${frontendPort} (livre)`
        : `🚨 Frontend: ${frontendPort} (em uso)`
    );

    console.log(
      backendFree
        ? `🖥️ Backend: ${backendPort} (livre)`
        : `🚨 Backend: ${backendPort} (em uso)`
    );

    if (!frontendFree || !backendFree) {
      console.log('\n💡 Dica: você pode trocar as portas com:');
      console.log('   forge dev frontend --port <nova>');
      console.log('   forge dev backend --port <nova>');
      console.log('   forge dev full --frontend-port <nova> --backend-port <nova>');
    }

    console.log('');
  });

// ------------------------ INSTALL ------------------------

program
  .command('install')
  .description('Instala as dependências do projeto Forge (workspace inteiro)')
  .action(() => {
    console.log('📦 Forge Install\n');

    function checkCmd(name: string, cmd: string, args: string[], hint: string): boolean {
      const res = spawnSync(cmd, args, { shell: true, stdio: 'ignore' });
      if (res.status === 0) {
        console.log(`✅ ${name} OK`);
        return true;
      } else {
        console.error(`❌ ${name} não encontrado`);
        console.log(`💡 Como resolver: ${hint}\n`);
        return false;
      }
    }

    let ok = true;

    ok = checkCmd('Node.js', 'node', ['-v'], 'Instale em https://nodejs.org (recomendado LTS)') && ok;
    ok = checkCmd('pnpm', 'pnpm', ['-v'], 'npm i -g pnpm') && ok;
    ok = checkCmd('Turbo (local)', 'pnpm', ['exec', 'turbo', '--version'], 'pnpm add -Dw turbo') && ok;

    if (!ok) {
      console.error('🚨 Corrija os erros acima e rode novamente: forge install');
      process.exit(1);
    }

    console.log('\n📥 Instalando dependências do workspace...');
    const res = spawnSync('pnpm', ['install'], {
      cwd: process.cwd(),
      stdio: 'inherit',
      shell: true
    });

    if (res.status !== 0) {
      console.error('\n❌ Falha ao instalar dependências.');
      process.exit(1);
    }

    console.log('\n🎉 Dependências instaladas com sucesso!');
    console.log('👉 Próximo passo: forge dev full');
  });

// ------------------------ STOP ------------------------

program
  .command('stop [target]')
  .description('Para serviços do Forge (frontend, backend) ou mata processos por porta')
  .option('--port <number>', 'Mata processo na porta específica', (v) => parseInt(v, 10))
  .action((target: 'frontend' | 'backend' | undefined, opts) => {
    console.log('🛑 Forge Stop\n');

    const isWindows = process.platform === 'win32';
    if (isWindows) {
      console.warn('⚠️  forge stop ainda não tem suporte nativo no Windows (usa lsof).');
      console.warn('   Dica: use WSL ou encerre os processos manualmente.');
      return;
    }

    function getPort(envPath: string, key: string, defaultVal: number) {
      if (!fs.existsSync(envPath)) return defaultVal;
      const content = fs.readFileSync(envPath, 'utf-8');
      const match = content.match(new RegExp(`^${key}=(\\d+)`, 'm'));
      return match ? Number(match[1]) : defaultVal;
    }

    function killPort(port: number): boolean {
      const res = spawnSync('bash', ['-c', `lsof -ti :${port} | xargs -r kill -9`], {
        stdio: 'ignore'
      });
      return res.status === 0;
    }

    const frontendEnv = path.join(process.cwd(), 'apps/frontend/.env');
    const backendEnv = path.join(process.cwd(), 'apps/backend/.env');

    const frontendPort = getPort(frontendEnv, 'VITE_PORT', 5173);
    const backendPort = getPort(backendEnv, 'PORT', 3001);

    const targets: { label: string; port: number }[] = [];

    if (opts.port) {
      targets.push({ label: `porta ${opts.port}`, port: opts.port });
    } else if (target === 'frontend') {
      targets.push({ label: 'frontend', port: frontendPort });
    } else if (target === 'backend') {
      targets.push({ label: 'backend', port: backendPort });
    } else {
      targets.push({ label: 'frontend', port: frontendPort });
      targets.push({ label: 'backend', port: backendPort });
    }

    let killedAny = false;

    for (const t of targets) {
      console.log(`🔍 Tentando parar ${t.label} (porta ${t.port})...`);
      const killed = killPort(t.port);

      if (killed) {
        console.log(`✅ ${t.label} parado (porta ${t.port})`);
        killedAny = true;
      } else {
        console.log(`ℹ️  Nenhum processo encontrado na porta ${t.port}`);
      }
    }

    if (!killedAny) {
      console.log('\n😴 Nada para parar. Tudo limpo.');
    } else {
      console.log('\n🧹 Serviços finalizados. \n\rPode rodar o comando: forge dev full');
    }
  });

// ------------------------ CLEAN ------------------------
program
  .command('clean [target]')
  .description('Limpa caches, builds e node_modules do projeto')
  .option('--all', 'Limpa tudo (root + frontend + backend)')
  .option('--force', 'Não pede confirmação')
  .option('--json', 'Saída em JSON (para CI/CD)')
  .action(async (target: 'frontend' | 'backend' | undefined, opts: { all?: boolean; force?: boolean; json?: boolean }) => {
    const isJson = Boolean(opts.json);

    if (!isJson) {
      console.log('🧹 Forge Clean\n');
    }

    const paths: string[] = [];
    const cleaned: string[] = [];
    const errors: { path: string; error: string }[] = [];

    function collect(dir: string) {
      const targets = ['node_modules', 'dist', 'build', '.turbo', '.vite', '.cache'];
      for (const folder of targets) {
        const full = path.join(dir, folder);
        if (fs.existsSync(full)) paths.push(full);
      }
    }

    const root = process.cwd();
    const frontendDir = path.join(root, 'apps/frontend');
    const backendDir = path.join(root, 'apps/backend');

    if (opts.all || !target) {
      collect(root);
      collect(frontendDir);
      collect(backendDir);
    } else if (target === 'frontend') {
      collect(frontendDir);
    } else if (target === 'backend') {
      collect(backendDir);
    }

    if (paths.length === 0) {
      if (isJson) {
        console.log(JSON.stringify({ success: true, cleaned: [], errors: [] }, null, 2));
        process.exit(0);
      }

      console.log('✨ Nada para limpar.');
      return;
    }

    if (!isJson) {
      console.log('🗑️  Itens que serão removidos:');
      paths.forEach((p) => console.log(' -', p));
    }

    if (!opts.force && !isJson) {
      process.stdout.write('\n⚠️  Confirma limpeza? (y/N): ');

      await new Promise<void>((resolve) => {
        process.stdin.resume();
        process.stdin.setEncoding('utf-8');

        process.stdin.once('data', (data: string | Buffer) => {
          const answer = data.toString().trim().toLowerCase();
          if (answer !== 'y' && answer !== 'yes') {
            console.log('❌ Cancelado.');
            process.exit(0);
          }
          resolve();
        });
      });
    }

    if (!isJson) {
      console.log('\n🚀 Iniciando limpeza...\n');
    }

    const total = paths.length;

    function renderProgress(current: number, total: number, label: string) {
      if (isJson) return;

      const percent = Math.round((current / total) * 100);
      const size = 24;
      const filled = Math.round((percent / 100) * size);
      const bar = '█'.repeat(filled) + '░'.repeat(size - filled);

      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(
        `[${bar}] ${percent}% • Apagando: ${label.padEnd(50).slice(0, 50)}`
      );
    }

    for (const [i, p] of paths.entries()) {
      renderProgress(i + 1, total, path.relative(root, p));

      try {
        fs.rmSync(p, { recursive: true, force: true });
        cleaned.push(path.relative(root, p));
      } catch (err: any) {
        errors.push({
          path: path.relative(root, p),
          error: err?.message ?? 'Erro desconhecido'
        });
      }

      if (!isJson) {
        await new Promise((r) => setTimeout(r, 50));
      }
    }

    if (isJson) {
      console.log(
        JSON.stringify(
          {
            success: errors.length === 0,
            cleaned,
            errors
          },
          null,
          2
        )
      );
      process.exit(errors.length > 0 ? 1 : 0);
    }

    process.stdout.write('\n\n🎉 Limpeza concluída com sucesso!\n\n');
    console.log('👉 Agora você pode rodar: forge install\n');

    process.stdin.pause();
    process.exit(0);
  });

// ------------------------ LINT ------------------------

program
  .command('lint [target]')
  .description('Roda lint, typecheck e validações do projeto')
  .action((target: 'frontend' | 'backend' | undefined) => {
    console.log('🧪 Forge Lint\n');

    function run(dir: string, label: string) {
      console.log(`\n🔍 Lint em ${label}`);

      const scripts = ['lint', 'typecheck', 'format:check'];

      scripts.forEach((script) => {
        console.log(`➡️  ${label}: ${script}`);
        const res = spawnSync('pnpm', ['run', script], {
          cwd: dir,
          stdio: 'inherit',
          shell: true
        });

        if (res.status !== 0) {
          console.error(`❌ Falhou em ${label}: ${script}`);
          process.exit(1);
        }
      });
    }

    const root = process.cwd();
    const frontendDir = path.join(root, 'apps/frontend');
    const backendDir = path.join(root, 'apps/backend');

    if (!target) {
      run(frontendDir, 'frontend');
      run(backendDir, 'backend');
      console.log('\n✅ Lint passou em tudo!');
      return;
    }

    if (target === 'frontend') run(frontendDir, 'frontend');
    if (target === 'backend') run(backendDir, 'backend');

    console.log('\n✅ Lint concluído com sucesso.');
  });

//--------------- ENV SYNC --------------------

program
  .command("env sync")
  .description("Sincroniza .env e .env.example (frontend e backend)")
  .action(() => {
    const root = process.cwd();
    const apps = ["backend", "frontend"];

    for (const app of apps) {
      const dir = path.join(root, "apps", app);
      if (!fs.existsSync(dir)) {
        console.warn(`⚠️  ${app} não encontrado, pulando...`);
        continue;
      }

      const envPath = path.join(dir, ".env");
      const examplePath = path.join(dir, ".env.example");

      const env = parseEnv(envPath);
      const example = parseEnv(examplePath);

      const keys = Array.from(
        new Set([...Object.keys(env), ...Object.keys(example)])
      );

      const newEnv: Record<string, string> = {};
      for (const key of keys) {
        newEnv[key] = env[key] ?? "";
      }

      writeEnv(envPath, newEnv);
      writeEnvExample(examplePath, keys);

      console.log(`✅ ${app}: .env e .env.example sincronizados`);
    }

    console.log("\n🌱 Env sync concluído sem vazar segredos.");
  });

//------------------FORMAT -----------------
program
  .command("format")
  .description("Formata frontend e backend com Prettier")
  .option("--check", "Apenas verifica (não escreve)")
  .action(async (opts) => {
    console.log("🎨 Forge Format\n");

    const mode = opts.check ? "--check" : "--write";

    function runPrettier(label: string, cwd: string) {
      console.log(`🧹 Formatando ${label}...`);
      const res = spawnSync("pnpm", ["exec", "prettier", mode, "."], {
        cwd,
        stdio: "inherit",
        shell: true,
      });

      if (res.status !== 0) {
        console.error(`❌ Falhou ao formatar ${label}`);
        process.exit(1);
      }

      console.log(`✅ ${label} formatado`);
    }

    runPrettier("frontend", path.join(process.cwd(), "apps/frontend"));
    runPrettier("backend", path.join(process.cwd(), "apps/backend"));

    console.log("\n🎉 Código formatado com sucesso!");
  });

// ------------------------ BUILD ------------------------

program
  .command('build')
  .description('Gera build de produção do monorepo (frontend + backend)')
  .option('--json', 'Saída em JSON (para CI/CD)')
  .option('--skip-checks', 'Pula verificações de ambiente')
  .action(async (opts: { json?: boolean; skipChecks?: boolean }) => {
    const isJson = Boolean(opts.json);
    const start = Date.now();

    if (!isJson) {
      console.log('🏗️ Forge Build\n');
    }

    function checkCmd(name: string, cmd: string, args: string[]): boolean {
      const res = spawnSync(cmd, args, { shell: true, stdio: 'ignore' });
      if (res.status === 0) {
        if (!isJson) console.log(`✅ ${name} OK`);
        return true;
      } else {
        if (!isJson) console.error(`❌ ${name} não encontrado`);
        return false;
      }
    }

    if (!opts.skipChecks) {
      let ok = true;

      ok = checkCmd('Node.js', 'node', ['-v']) && ok;
      ok = checkCmd('pnpm', 'pnpm', ['-v']) && ok;
      ok = checkCmd('Turbo (local)', 'pnpm', ['exec', 'turbo', '--version']) && ok;

      if (!ok) {
        if (isJson) {
          console.log(
            JSON.stringify(
              { success: false, error: 'Ambiente incompleto para build' },
              null,
              2
            )
          );
        } else {
          console.error('\n🚨 Ambiente incompleto para build.');
          console.log('💡 Rode: forge doctor --fix');
        }
        process.exit(1);
      }
    }

    if (!isJson) {
      console.log('\n🚀 Rodando build do monorepo (Turbo)...\n');
    }

    const res = spawnSync('pnpm', ['exec', 'turbo', 'run', 'build'], {
      cwd: process.cwd(),
      stdio: isJson ? 'pipe' : 'inherit',
      shell: true
    });

    if (res.status !== 0) {
      if (isJson) {
        console.log(
          JSON.stringify(
            {
              success: false,
              error: 'Falha no turbo run build',
              stdout: res.stdout?.toString(),
              stderr: res.stderr?.toString()
            },
            null,
            2
          )
        );
      } else {
        console.error('\n❌ Build falhou.');
      }
      process.exit(1);
    }

    const root = process.cwd();
    const frontendDist = path.join(root, 'apps/frontend/dist');
    const backendDist = path.join(root, 'apps/backend/dist');

    const frontendOk = fs.existsSync(frontendDist);
    const backendOk = fs.existsSync(backendDist);

    if (!frontendOk || !backendOk) {
      const errorMsg = 'Build finalizou mas artefatos não foram encontrados';

      if (isJson) {
        console.log(
          JSON.stringify(
            {
              success: false,
              error: errorMsg,
              frontendDist: frontendOk ? frontendDist : null,
              backendDist: backendOk ? backendDist : null
            },
            null,
            2
          )
        );
      } else {
        console.error('\n❌ ' + errorMsg);
        if (!frontendOk) console.error(' - apps/frontend/dist não encontrado');
        if (!backendOk) console.error(' - apps/backend/dist não encontrado');
      }

      process.exit(1);
    }

    const durationMs = Date.now() - start;

    if (isJson) {
      console.log(
        JSON.stringify(
          {
            success: true,
            frontend: 'apps/frontend/dist',
            backend: 'apps/backend/dist',
            durationMs
          },
          null,
          2
        )
      );
      process.exit(0);
    }

    console.log('\n📦 Artefatos gerados:');
    console.log(' - apps/frontend/dist');
    console.log(' - apps/backend/dist');

    console.log(`\n🎉 Build concluído em ${durationMs}ms`);
  });

program.parse(process.argv)
