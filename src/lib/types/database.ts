export interface Database {
  public: {
    Tables: {
      modules: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          name: string
          uf: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          uf: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          uf?: string
          created_at?: string
        }
      }
      versions: {
        Row: {
          id: string
          module_id: string
          tag: string
          jira_card: string | null
          themes_folder: string | null
          version_number: string
          release_date: string | null
          script_executed: string | null
          created_at: string
        }
        Insert: {
          id?: string
          module_id: string
          tag: string
          jira_card?: string | null
          themes_folder?: string | null
          version_number: string
          release_date?: string | null
          script_executed?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          module_id?: string
          tag?: string
          jira_card?: string | null
          themes_folder?: string | null
          version_number?: string
          release_date?: string | null
          script_executed?: string | null
          created_at?: string
        }
      }
      cards: {
        Row: {
          id: string
          version_id: string
          jira_number: string
          last_update: string
        }
        Insert: {
          id?: string
          version_id: string
          jira_number: string
          last_update?: string
        }
        Update: {
          id?: string
          version_id?: string
          jira_number?: string
          last_update?: string
        }
      }
      version_clients: {
        Row: {
          id: string
          version_id: string
          client_id: string
        }
        Insert: {
          id?: string
          version_id: string
          client_id: string
        }
        Update: {
          id?: string
          version_id?: string
          client_id?: string
        }
      }
    }
  }
}