'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/forms/ConfirmDialog';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/contexts/AuthContextBasic';

interface DeleteModuleButtonProps {
  moduleId: string;
  moduleName: string;
}

export default function DeleteModuleButton({ moduleId, moduleName }: DeleteModuleButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { user, role } = useAuth();

  // Só admin pode deletar
  if (role !== 'admin') {
    return null;
  }

  const handleDelete = async () => {
    if (!user) return;

    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', moduleId);

      if (error) {
        console.error('Erro ao deletar módulo:', error);
        alert('Erro ao deletar módulo');
        return;
      }

      router.push('/modules');
      router.refresh();
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao deletar módulo');
    } finally {
      setIsDeleting(false);
      setIsOpen(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        disabled={isDeleting}
      >
        {isDeleting ? 'Deletando...' : 'Deletar'}
      </Button>
      
      <ConfirmDialog
        isOpen={isOpen}
        onCancel={() => setIsOpen(false)}
        onConfirm={handleDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja deletar o módulo "${moduleName}"? Esta ação não pode ser desfeita.`}
        variant="danger"
      />
    </>
  );
}