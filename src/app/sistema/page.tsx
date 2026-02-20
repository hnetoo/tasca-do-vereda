'use client';

import React from 'react';
import HorizontalNavbar from '../../components/HorizontalNavbar';

const SistemaPage = () => {
  const sistemaSubmenus = [
    { path: '/sistema/geral', label: 'Geral' },
    { path: '/sistema/utilizadores', label: 'Utilizadores' },
    { path: '/sistema/sistema-health', label: 'Saúde do Sistema' },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <HorizontalNavbar menuItems={sistemaSubmenus} basePath="/sistema" />
      <div className="flex flex-col items-center justify-center flex-1 p-4">
        <h1 className="text-4xl font-bold text-primary mb-4">Página do Sistema</h1>
        <p className="text-lg text-gray-600">
          Esta é a página dedicada às configurações e funcionalidades do sistema.
        </p>
        <p className="text-md text-gray-500 mt-2">
          Em breve, aqui você encontrará a navegação horizontal para os submenus relacionados.
        </p>
      </div>
    </div>
  );
};

export default SistemaPage;
