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

// ------------------------ NEW ------------------------

program
  .command('new <name>')
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

    const installDeps = (dir: string) => {
      console.log(`📦 Instalando dependências em ${dir}...`);
      const res = spawnSync('pnpm', ['install', '--prefix', dir], { stdio: 'inherit', shell: true });
      if (res.status !== 0) process.exit(1);
    };

    installDeps(path.join(targetDir, 'apps/backend'));
    installDeps(path.join(targetDir, 'apps/frontend'));

    console.log('🩺 Rodando forge doctor --fix...');
    spawnSync('node', [path.join(__dirname, '../dist/index.js'), 'doctor', '--fix'], {
      cwd: targetDir,
      stdio: 'inherit',
      shell: true
    });

    console.log('\n🎉 Projeto Forge criado com sucesso!');
    console.log(`👉 Agora rode:\n   cd ${name}\n   forge dev full`);
  });

program.parse();
