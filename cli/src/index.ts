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

// 🔥 pega automaticamente todas as variáveis VITE_*** do frontend
function loadFrontendEnvVars(): Record<string, string> {
  const envPath = path.join(process.cwd(), 'apps/frontend/.env');
  if (!fs.existsSync(envPath)) return {};

  const content = fs.readFileSync(envPath, 'utf-8');
  const envVars: Record<string, string> = {};

  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const [keyRaw, ...rest] = trimmed.split('=');
    const key = keyRaw?.trim();
    const value = rest.join('=').trim();

    if (key && key.startsWith('VITE_') && value !== undefined) {
      envVars[key] = value;
    }
  });

  return envVars;
}

// 🔥 runPnpm atualizado
function runPnpm(args: string[], extraEnv: Record<string, string | undefined> = {}): void {
  const frontendVars = loadFrontendEnvVars();

  const finalEnv = sanitizeEnv({
    ...process.env,
    ...frontendVars,
    ...extraEnv,
    TURBO_GLOBAL_ENV: `PORT,JWT_SECRET,${Object.keys(frontendVars).join(',')}`
  });

  spawn('pnpm', args, {
    stdio: 'inherit',
    cwd: process.cwd(),
    shell: true,
    env: finalEnv
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

// ------------------------ CLI ------------------------
program
  .name('forge')
  .description('CLI do Forge Framework')
  .version('1.0.0');

const dev = program
  .command('dev')
  .description('Sobe o ambiente de desenvolvimento');

// Subcomando frontend
dev.command('frontend')
  .description('Roda apenas o frontend')
  .option('--port <number>', 'Define a porta do frontend', (val) => parseInt(val, 10))
  .action((opts) => {
    const envPath = path.join(process.cwd(), 'apps/frontend/.env');
    const examplePath = path.join(process.cwd(), 'apps/frontend/.env.example');
    checkEnvExists('frontend', envPath, examplePath);

    // Porta: CLI > .env > padrão
    const port = opts.port || getEnvVar(envPath, 'VITE_PORT', 5173);

    console.log(`🚀 Rodando frontend na porta ${port}`);

    // Passa a porta para o Vite corretamente
    // 1️⃣ Atualiza a variável VITE_PORT no ambiente
    // 2️⃣ Passa como argumento --port para o script dev:web
    runPnpm(['run', 'dev:web', '--', '--port', String(port)], { VITE_PORT: String(port) });
  });

// Subcomando backend
dev.command('backend')
  .description('Roda apenas o backend')
  .option('--port <number>', 'Define a porta do backend', (val) => parseInt(val, 10))
  .action((opts) => {
    const envPath = path.join(process.cwd(), 'apps/backend/.env');
    const examplePath = path.join(process.cwd(), 'apps/backend/.env.example');
    checkEnvExists('backend', envPath, examplePath);

    const port = opts.port || getEnvVar(envPath, 'PORT', 3001);
    console.log(`🖥️ Rodando backend na porta ${port}`);
    runPnpm(['run', 'dev:api'], { PORT: String(port) });
  });

// Subcomando full (frontend + backend)
dev.command('full')
  .description('Roda frontend e backend simultaneamente')
  .option('--frontend-port <number>', 'Define a porta do frontend', (val) => parseInt(val, 10))
  .option('--backend-port <number>', 'Define a porta do backend', (val) => parseInt(val, 10))
  .action((opts) => {
    const frontendEnvPath = path.join(process.cwd(), 'apps/frontend/.env');
    const backendEnvPath = path.join(process.cwd(), 'apps/backend/.env');
    const frontendExample = path.join(process.cwd(), 'apps/frontend/.env.example');
    const backendExample = path.join(process.cwd(), 'apps/backend/.env.example');

    checkEnvExists('frontend', frontendEnvPath, frontendExample);
    checkEnvExists('backend', backendEnvPath, backendExample);

    const frontendPort = opts.frontendPort || getEnvVar(frontendEnvPath, 'VITE_PORT', 5173);
    const backendPort = opts.backendPort || getEnvVar(backendEnvPath, 'PORT', 3001);

    console.log(`🚀 Rodando frontend na porta ${frontendPort}`);
    console.log(`🖥️ Rodando backend na porta ${backendPort}`);

    // roda backend e frontend em paralelo
    runPnpm(
      ['run', 'dev', '--', '--filter', 'frontend', '--port', String(frontendPort)],
      { PORT: String(backendPort), VITE_PORT: String(frontendPort) }
    );

  });
// forge doctor
// forge doctor 2.0
program
  .command('doctor')
  .description('Verifica se o ambiente está pronto para rodar o Forge (checkup completo)')
  .option('--fix', 'Tenta corrigir automaticamente problemas simples')
  .action(async (opts) => {
    console.log('🩺 Forge Doctor 2.0 - Checkup Completo\n');

    // ------------------- Funções auxiliares -------------------
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

    function ensureEnv(name: string, envPath: string, examplePath: string): boolean {
      if (fs.existsSync(envPath)) {
        console.log(`✅ .env do ${name} encontrado`);
        return true;
      }

      console.error(`❌ .env do ${name} não encontrado`);
      console.log(`   → Esperado em: ${envPath}`);
      if (opts.fix) {
        if (fs.existsSync(examplePath)) {
          fs.copyFileSync(examplePath, envPath);
          console.log(`🛠️  Criado ${envPath} a partir de ${examplePath}`);
        } else {
          fs.writeFileSync(envPath, '');
          console.log(`🛠️  Criado ${envPath} vazio (preencha as variáveis)`);
        }
        return true;
      }
      return false;
    }

    function getEnvVar(envPath: string, key: string, defaultVal: number): number {
      if (!fs.existsSync(envPath)) return defaultVal;
      const content = fs.readFileSync(envPath, 'utf-8');
      const match = content.match(new RegExp(`^${key}=(\\d+)`, 'm'));
      return match ? Number(match[1]) : defaultVal;
    }

    // ------------------- Check ferramentas do sistema -------------------
    let hasError = false;
    let canAutoFix = false;

    if (!checkCmd('Node.js', 'node', ['-v'])) hasError = true;
    if (!checkCmd('pnpm', 'pnpm', ['-v'])) hasError = true;
    if (!checkCmd('Git', 'git', ['--version'])) hasError = true;
    if (!checkCmd('Turbo (local)', 'pnpm', ['exec', 'turbo', '--version'])) hasError = true;

    // ------------------- Check .env -------------------
    const frontendEnv = path.join(process.cwd(), 'apps/frontend/.env');
    const frontendExample = path.join(process.cwd(), 'apps/frontend/.env.example');
    const backendEnv = path.join(process.cwd(), 'apps/backend/.env');
    const backendExample = path.join(process.cwd(), 'apps/backend/.env.example');

    if (!ensureEnv('frontend', frontendEnv, frontendExample)) hasError = true;
    if (!ensureEnv('backend', backendEnv, backendExample)) hasError = true;

    // ------------------- Check portas -------------------
    const frontendPort = getEnvVar(frontendEnv, 'VITE_PORT', 5173);
    const backendPort = getEnvVar(backendEnv, 'PORT', 3001);

    const frontendPortFree = await checkPort(frontendPort);
    const backendPortFree = await checkPort(backendPort);

    console.log(frontendPortFree
      ? `✅ Porta ${frontendPort} disponível (frontend)`
      : `❌ Porta ${frontendPort} já está em uso (frontend)`);
    console.log(backendPortFree
      ? `✅ Porta ${backendPort} disponível (backend)`
      : `❌ Porta ${backendPort} já está em uso (backend)`);

    if (!frontendPortFree || !backendPortFree) hasError = true;

    // ------------------- Check node_modules -------------------
    ['apps/frontend', 'apps/backend'].forEach((dir) => {
      const nodeModulesPath = path.join(process.cwd(), dir, 'node_modules');
      if (fs.existsSync(nodeModulesPath)) {
        console.log(`✅ node_modules em ${dir} encontrado`);
      } else {
        console.error(`❌ node_modules em ${dir} não encontrado`);
        hasError = true;
      }
    });

    // ------------------- Variáveis obrigatórias -------------------
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
    
    // ------------------- Resultado final -------------------
    if (hasError) {
      console.error('\n🚨 Ambiente incompleto.');
      if (canAutoFix && !opts.fix) {
        console.log('💡 Dica: rode `forge doctor --fix` para corrigir automaticamente problemas simples.');
      }
      process.exit(1);
    }

    console.log('\n🎉 Ambiente pronto pra rodar o Forge!🔥');
  });

program
  .command('new <name>')
  .description('Cria um novo projeto Forge')
  .action(async (name: string) => {
    const targetDir = path.resolve(process.cwd(), name);
    const templateDir = path.resolve(__dirname, '../templates/default');

    if (fs.existsSync(targetDir)) {
      console.error(`❌ A pasta "${name}" já existe.`);
      process.exit(1);
    }

    console.log(`📁 Criando projeto em ${targetDir}...`);
    fs.cpSync(templateDir, targetDir, { recursive: true });

    console.log('📦 Instalando dependências com pnpm...');
    spawnSync('pnpm', ['install'], {
      cwd: targetDir,
      stdio: 'inherit',
      shell: true
    });

    console.log('🩺 Rodando forge doctor --fix...');
    spawnSync('node', [path.join(__dirname, '../dist/index.js'), 'doctor', '--fix'], {
      cwd: targetDir,
      stdio: 'inherit',
      shell: true
    });

    console.log('\n🎉 Projeto Forge criado com sucesso!');
    console.log(`👉 Agora rode:\n   cd ${name}\n   forge dev`);
  });

program.parse();
