const fs = require('fs');
const path = './src/services/database/operations.ts';
let content = fs.readFileSync(path, 'utf8');

// 1. Imports
content = content.replace("import { executeQuery, selectQuery } from './connection';", "import { supabase as supabaseClientPromise } from './connection';");
content = content.replace("import { db } from '@/db';", "");
content = content.replace("import { dishes, menuCategories } from '@/db/schema';", "");

// Add Supabase types if not present
if (!content.includes("@supabase/supabase-js")) {
    content = content.replace("import 'server-only';", "import 'server-only';\nimport { SupabaseClient } from '@supabase/supabase-js';\nimport { Database } from '@/types/supabase';");
}

// 2. Add Helpers
const helpers = `
const executeQuery = async (supabase: SupabaseClient<Database>, sql: string, params?: any[]) => {
    // If params are provided, we might need to handle them. 
    // For now, we pass sql directly as previous implementation likely built the string.
    // If execute_sql supports params, we would pass them.
    const { error } = await supabase.rpc('execute_sql', { sql_query: sql });
    if (error) throw error;
};

const selectQuery = async <T>(supabase: SupabaseClient<Database>, sql: string, params?: any[]): Promise<T[]> => {
    const { data, error } = await supabase.rpc('execute_sql', { sql_query: sql });
    if (error) throw error;
    return data as T[];
};
`;

// Insert helpers before databaseOperations export
// Check if helpers already exist to avoid duplication if run multiple times
if (!content.includes("const executeQuery = async")) {
    content = content.replace("export const databaseOperations = {", helpers + "\nexport const databaseOperations = {");
}

// 3. Update _handleDatabaseOperation definition
content = content.replace(
    /_handleDatabaseOperation:\s*async\s*<T>\(operation:\s*\(\)\s*=>\s*Promise<T>/, 
    "_handleDatabaseOperation: async <T>(operation: (supabase: SupabaseClient<Database>) => Promise<T>"
);

// 4. Update _handleDatabaseOperation body to inject client
// Look for "const data = await operation();"
content = content.replace(
    "const data = await operation();", 
    "const client = await supabaseClientPromise;\n      const data = await operation(client);"
);

// 5. Update calls to _handleDatabaseOperation
content = content.replace(/_handleDatabaseOperation\(async \(\) =>/g, "_handleDatabaseOperation(async (supabase) =>");

// 6. Update executeQuery calls
// Use a regex that matches executeQuery( but not const executeQuery =
content = content.replace(/(?<!const )executeQuery\(/g, "executeQuery(supabase, ");

// 7. Update selectQuery calls
// Use a regex that matches selectQuery(...) or selectQuery<...>(...) but not definition
content = content.replace(/(?<!const )selectQuery(<[^>]+>)?\(/g, (match, generic) => {
    return `selectQuery${generic || ''}(supabase, `;
});

fs.writeFileSync(path, content);
console.log('Migration done');
