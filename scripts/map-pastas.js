import fs from 'fs';
import path from 'path';

function mapDirs(dir, result = []) {
  const items = fs.readdirSync(dir, { withFileTypes: true });

  // Ignora node_modules
  if (path.basename(dir) === 'node_modules' || path.basename(dir) === '.git') return result;

  result.push(dir);

  for (const item of items) {
    if (item.isDirectory()) {
      mapDirs(path.join(dir, item.name), result);
    }
  }

  return result;
}

// './meu-framework' pode ser '.' se você estiver na raiz
const dirs = mapDirs('../forge-framework');

// Salva em JSON
fs.writeFileSync('estrutura.json', JSON.stringify(dirs, null, 2));

console.log('Estrutura salva, node_modules e git ignorados!');



// Depois, você pode ler o JSON e recriar tudo:

// const dirs = JSON.parse(fs.readFileSync('estrutura.json'));
// dirs.forEach(d => fs.mkdirSync(d, { recursive: true }));