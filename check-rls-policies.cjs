const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRLSPolicies() {
  try {
    console.log('Checking RLS policies and permissions for user_creations table...');
    
    // Check current permissions using SQL query
    const { data: permissions, error: permError } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT grantee, table_name, privilege_type 
          FROM information_schema.role_table_grants 
          WHERE table_schema = 'public' 
          AND table_name = 'user_creations' 
          AND grantee IN ('anon', 'authenticated') 
          ORDER BY table_name, grantee;
        `
      });
    
    if (permError) {
      console.log('Error checking permissions:', permError);
    } else {
      console.log('Current permissions:', permissions);
    }
    
    // Check if RLS is enabled
    const { data: rlsStatus, error: rlsError } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT schemaname, tablename, rowsecurity 
          FROM pg_tables 
          WHERE schemaname = 'public' 
          AND tablename = 'user_creations';
        `
      });
    
    if (rlsError) {
      console.log('Error checking RLS status:', rlsError);
    } else {
      console.log('RLS Status:', rlsStatus);
    }
    
    // Try to query the table directly to see what happens
    console.log('\nTesting direct table access...');
    const { data: testData, error: testError } = await supabase
      .from('user_creations')
      .select('*')
      .limit(5);
    
    if (testError) {
      console.log('Error accessing table:', testError);
    } else {
      console.log('Table access successful, found', testData?.length || 0, 'records');
    }
    
  } catch (err) {
    console.error('Exception:', err.message);
  }
}

checkRLSPolicies();