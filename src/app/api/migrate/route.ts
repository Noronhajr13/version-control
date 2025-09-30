import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const { command } = await request.json()
    
    const results = []
    
    if (command === 'check_tables') {
      // Verificar estrutura completa das tabelas
      const { data: tables, error } = await supabase
        .from('information_schema.columns')
        .select('table_name, column_name, data_type, is_nullable, column_default')
        .eq('table_schema', 'public')
        .in('table_name', ['user_profiles', 'versions', 'clients', 'modules'])
        .order('table_name, ordinal_position')
      
      results.push({
        action: 'check_tables_structure',
        success: !error,
        data: tables,
        error: error?.message
      })
    }
    
    if (command === 'check_data') {
      // Verificar dados atuais
      const tables = ['user_profiles', 'versions', 'clients', 'modules']
      
      for (const table of tables) {
        try {
          const { data, error, count } = await supabase
            .from(table)
            .select('*', { count: 'exact' })
            .limit(5)
          
          results.push({
            action: `check_data_${table}`,
            success: !error,
            data: { count, sample: data },
            error: error?.message
          })
        } catch (err) {
          results.push({
            action: `check_data_${table}`,
            success: false,
            data: null,
            error: err instanceof Error ? err.message : 'Erro desconhecido'
          })
        }
      }
    }
    
    if (command === 'check_users') {
      // Verificar usuários atuais
      const { data: users, error } = await supabase
        .from('user_profiles')
        .select('*')
      
      results.push({
        action: 'check_users',
        success: !error,
        data: users,
        error: error?.message
      })
    }
    
    if (command === 'check_auth_users') {
      // Verificar usuários no auth
      const { data: authUsers, error } = await supabase.auth.admin.listUsers()
      
      results.push({
        action: 'check_auth_users',
        success: !error,
        data: authUsers.users?.map(u => ({ id: u.id, email: u.email, created_at: u.created_at })),
        error: error?.message
      })
    }
    
    if (command === 'create_admin') {
      // Tentar criar usuário admin
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          id: '00000000-0000-0000-0000-000000000001', // ID temporário
          email: 'noronhajr_13@hotmail.com',
          display_name: 'Admin Principal',
          role: 'admin',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
      
      results.push({
        action: 'create_admin',
        success: !error,
        data,
        error: error?.message
      })
    }
    
    return NextResponse.json({
      success: true,
      results
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}