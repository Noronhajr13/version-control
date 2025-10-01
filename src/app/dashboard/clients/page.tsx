'use client';

import { useQuery } from '@tanstack/react-query';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Users, Package, Calendar, Download, Edit, Trash2, Plus, MapPin, Building2 } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { DownloadButton } from '@/components/ui/DownloadButton';
import { DeleteClientButton } from './DeleteClientButton';

interface ClientWithVersions {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  uf: string;
  created_at: string;
  version_clients: VersionClient[];
}

interface VersionClient {
  id: string;
  version_id: string;
  client_id: string;
  versions: {
    id: string;
    version_number: string;
    tag: string;
    release_date: string;
    file_path?: string;
    modules?: {
      name: string;
    };
  };
}

export default function ClientsPage() {
  const supabase = createClientComponentClient();
  
  // Buscar clientes com suas versões instaladas usando version_clients
  const { data: clients, isLoading, error } = useQuery({
    queryKey: ['clients-with-versions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          version_clients(
            id,
            version_id,
            client_id,
            versions(
              id,
              version_number,
              tag,
              release_date,
              file_path,
              modules(name)
            )
          )
        `)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    }
  });

  // Transformar dados para o formato esperado
  const clientsWithVersions: ClientWithVersions[] = clients?.map(client => ({
    id: client.id,
    name: client.name,
    email: client.email,
    phone: client.phone,
    uf: client.uf,
    created_at: client.created_at,
    version_clients: client.version_clients || []
  })) || [];

  const getStatusColor = (hasVersions: boolean) => {
    return hasVersions 
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 dark:text-red-400">
        Erro ao carregar clientes: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Clientes
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Gerencie clientes e suas versões instaladas
          </p>
        </div>
        <Link href="/dashboard/clients/new">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Novo Cliente
          </Button>
        </Link>
      </div>

      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total de Clientes
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {clientsWithVersions.length}
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Com Versões
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {clientsWithVersions.filter(c => c.version_clients.length > 0).length}
              </p>
            </div>
            <Package className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total de Instalações
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {clientsWithVersions.reduce((sum, client) => sum + client.version_clients.length, 0)}
              </p>
            </div>
            <Download className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
        </Card>
      </div>

      {/* Lista de Clientes */}
      {clientsWithVersions.length === 0 ? (
        <EmptyState
          icon={<Users className="w-12 h-12" />}
          title="Nenhum cliente encontrado"
          description="Comece adicionando seu primeiro cliente."
          actionLabel="Adicionar Cliente"
          actionHref="/dashboard/clients/new"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {clientsWithVersions.map((client) => (
            <Card key={client.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
              {/* Header do Card */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {client.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <MapPin className="w-4 h-4" />
                        {client.uf}
                      </div>
                    </div>
                  </div>
                  
                  <Badge variant={client.version_clients.length > 0 ? "success" : "default"}>
                    {client.version_clients.length} {client.version_clients.length === 1 ? 'versão' : 'versões'}
                  </Badge>
                </div>

                {/* Versões instaladas */}
                {client.version_clients.length === 0 ? (
                  <div className="text-center py-4">
                    <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Nenhuma versão instalada
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {client.version_clients.map((versionClient) => (
                      <div
                        key={versionClient.id}
                        className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-blue-500" />
                            <span className="font-medium text-gray-900 dark:text-white">
                              {versionClient.versions.modules?.name || 'Módulo não especificado'}
                            </span>
                          </div>
                          <Badge variant="outline">
                            v{versionClient.versions.version_number}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(versionClient.versions.release_date)}
                            </div>
                            {versionClient.versions.tag && (
                              <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                                {versionClient.versions.tag}
                              </div>
                            )}
                          </div>
                          
                          {versionClient.versions.file_path && (
                            <DownloadButton
                              fileUrl={versionClient.versions.file_path}
                              fileName={`${versionClient.versions.modules?.name || 'version'}-v${versionClient.versions.version_number}.zip`}
                              versionNumber={versionClient.versions.version_number}
                              className="text-xs"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer do Card - Ações */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Criado em {formatDate(client.created_at)}
                </div>
                
                <div className="flex gap-2">
                  <Link href={`/dashboard/clients/${client.id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </Link>
                  <DeleteClientButton clientId={client.id} clientName={client.name} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}