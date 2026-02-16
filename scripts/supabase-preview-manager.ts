import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });


const SUPABASE_DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;
const SUPABASE_ORG_ID = 'aygigraudmgpdwimcjpm';



if (!SUPABASE_DB_PASSWORD) {
  console.error('Erro: SUPABASE_DB_PASSWORD não está definido nas variáveis de ambiente.');
  process.exit(1);
}

function runCommand(command: string, captureOutput: boolean = false): string {
  try {
    console.log(`Executando: ${command}`);
    const stdioOption = captureOutput ? 'pipe' : 'inherit';
    const output = execSync(command, { encoding: 'utf-8', stdio: stdioOption });
    if (captureOutput) {
      return output.trim();
    }
    return ''; // Se não estiver a capturar, não há saída para retornar aqui
  } catch (error: any) {
    console.error(`Erro ao executar comando: ${command}`);
    console.error(error.message);
    process.exit(1);
  }
}

export function createSupabaseProject(projectName: string, region: string = 'sa-east-1'): string {
  console.log(`A criar projeto Supabase "${projectName}" na região "${region}"...`);
  const createCommand = `supabase projects create ${projectName} --org-id ${SUPABASE_ORG_ID} --region ${region} --db-password ${SUPABASE_DB_PASSWORD}`;
  const createOutput = runCommand(createCommand, true); // Capturar a saída
  const projectRefMatch = createOutput.match(/REFERENCE ID\s+\|\s+(\w+)/);
  if (projectRefMatch && projectRefMatch[1]) {
    const projectRef = projectRefMatch[1];
    console.log(`Projeto Supabase "${projectName}" criado com sucesso. Project Ref: ${projectRef}`);

    console.log(`A ligar o projeto local ao novo projeto Supabase remoto (${projectRef})...`);
    const linkCommand = `supabase link --project-ref ${projectRef} --org-id ${SUPABASE_ORG_ID}`;
    runCommand(linkCommand);
    console.log('Projeto Supabase local ligado com sucesso.');

    console.log('A enviar as migrações para o novo projeto Supabase...');
    const dbPushCommand = `supabase db push`;
    runCommand(dbPushCommand);
    console.log('Migrações enviadas com sucesso.');

    return projectRef;
  } else {
    console.error('Não foi possível extrair o Project Ref da saída do comando de criação do projeto.');
    console.error('Saída completa:', createOutput);
    process.exit(1);
  }
}









function getSupabaseProjectDetails(projectRef: string): { dbUrl: string, anonKey: string, serviceRoleKey: string } {
  console.log(`A obter detalhes do projeto Supabase com ref "${projectRef}"...`);
  // O comando `supabase projects get` não retorna as chaves diretamente.
  // Precisamos de usar `supabase secrets list` para as chaves.

  // Obter chaves
  const secretsCommand = `supabase secrets list --project-ref ${projectRef} --json`;
  const secretsOutput = runCommand(secretsCommand, true);
  const secrets = JSON.parse(secretsOutput);

  let anonKey = '';
  let serviceRoleKey = '';

  for (const secret of secrets) {
    if (secret.name === 'SUPABASE_ANON_KEY') {
      anonKey = secret.value;
    }
    if (secret.name === 'SUPABASE_SERVICE_ROLE_KEY') {
      serviceRoleKey = secret.value;
    }
  }

  // O SUPABASE_URL é geralmente no formato https://<project-ref>.supabase.co
  const supabaseUrl = `https://${projectRef}.supabase.co`;

  return { dbUrl: supabaseUrl, anonKey, serviceRoleKey };
}

function deleteSupabaseProject(projectRef: string) {
  console.log(`A eliminar projeto Supabase com ref "${projectRef}"...`);
  const deleteCommand = `supabase projects delete ${projectRef} --org-id ${SUPABASE_ORG_ID}`;
  runCommand(deleteCommand);
  console.log(`Projeto Supabase com ref "${projectRef}" eliminado com sucesso.`);
}

async function main() {
  const action = process.env.SUPABASE_PREVIEW_ACTION; // 'create' or 'delete'
  const branchName = process.env.VERCEL_GIT_COMMIT_REF; // e.g., 'feature/new-feature'
  const vercelEnv = process.env.VERCEL_ENV; // 'preview', 'production', 'development'

  if (vercelEnv !== 'preview') {
    console.log(`Não é um ambiente de pré-visualização Vercel. Nenhuma ação do Supabase será executada.`);
    return;
  }

  if (!branchName) {
    console.error('Erro: VERCEL_GIT_COMMIT_REF não está definido. Este script deve ser executado num ambiente Vercel.');
    process.exit(1);
  }

  const safeBranchName = branchName.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
  const projectName = `preview-${safeBranchName}`;

  if (action === 'create') {
    console.log(`A processar ação 'create' para o branch de pré-visualização: ${branchName}`);
    const projectRef = createSupabaseProject(projectName);
    const { dbUrl, anonKey, serviceRoleKey } = getSupabaseProjectDetails(projectRef);

    // Output environment variables for Vercel
    // Vercel CLI pode ler variáveis de ambiente de stdout se o script for executado como parte de um build step
    // ou se for usado um comando como `vercel env add` com a saída do script.
    // Para CI/CD, é comum usar `echo "KEY=VALUE"` ou `console.log` para scripts que são executados e cujas saídas são capturadas.
    // No Vercel, para definir variáveis de ambiente dinamicamente, pode-se usar o comando `vercel env add`
    // ou, em alguns casos, a saída de um script pode ser parseada.
    // Para um script de build, a forma mais direta de passar variáveis para o ambiente de build seguinte
    // é através de um ficheiro ou de uma forma que o Vercel possa capturar.
    // No entanto, para o propósito de demonstração e para que o script seja reutilizável,
    // vamos imprimir as variáveis no formato `KEY=VALUE`.
    // O Vercel tem uma forma de capturar a saída de scripts de "pre-build" ou "post-build"
    // e usá-las como variáveis de ambiente.

    console.log(`export SUPABASE_URL=${dbUrl}`);
    console.log(`export SUPABASE_ANON_KEY=${anonKey}`);
    console.log(`export SUPABASE_SERVICE_ROLE_KEY=${serviceRoleKey}`);
    console.log(`export SUPABASE_PROJECT_REF=${projectRef}`);

  } else if (action === 'delete') {
    console.log(`A processar ação 'delete' para o branch de pré-visualização: ${branchName}`);
    // Para eliminar, precisamos de encontrar o projectRef correspondente ao projectName.
    const listProjectsCommand = `supabase projects list --org-id ${SUPABASE_ORG_ID} --json`;
    const projectsOutput = runCommand(listProjectsCommand, true);
    const projects = JSON.parse(projectsOutput);

    const targetProject = projects.find((p: any) => p.name === projectName);

    if (targetProject) {
      deleteSupabaseProject(targetProject.id); // Supabase CLI usa 'id' para projectRef na saída de list
    } else {
      console.warn(`Aviso: Nenhum projeto Supabase encontrado para o branch ${branchName} com o nome ${projectName}.`);
    }

  } else {
    console.log(`Nenhuma ação de pré-visualização do Supabase especificada (SUPABASE_PREVIEW_ACTION deve ser 'create' ou 'delete').`);
  }
}

main();
