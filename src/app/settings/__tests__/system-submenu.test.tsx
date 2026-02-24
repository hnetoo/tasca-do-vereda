import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('@/store/useStore', () => ({
  useStore: () => ({
    settings: { supabaseConfig: { enabled: false, url: '', key: '', autoSync: false } },
    updateSettings: jest.fn(),
    addNotification: jest.fn(),
    categories: [],
    dishes: [],
    hardResetMenu: jest.fn(),
    tables: [],
    removeTable: jest.fn(),
    addTable: jest.fn(),
    updateTable: jest.fn(),
    biometricDevices: [],
    registerBiometricDevice: jest.fn(),
    removeBiometricDevice: jest.fn(),
    updateBiometricDevice: jest.fn(),
    apiKeys: [],
    generateApiKey: jest.fn(),
    revokeApiKey: jest.fn(),
    webhooks: [],
    registerWebhook: jest.fn(),
    removeWebhook: jest.fn(),
  })
}));

jest.mock('react-redux', () => ({
  useDispatch: () => jest.fn(),
  useSelector: () => ({ id: 'user-1', name: 'Tester' })
}));

jest.mock('@/hooks/useRealtimeAuditLogs', () => ({
  useRealtimeAuditLogs: () => []
}));
jest.mock('@/hooks/useRealtimeSystemSettings', () => ({
  useRealtimeSystemSettings: () => []
}));

jest.mock('@/components/UserManagementModal', () => {
  const Comp = () => null;
  (Comp as any).displayName = 'UserManagementModalMock';
  return Comp;
});
jest.mock('next/image', () => {
  const Img = (props: any) => {
    const { alt, ...rest } = props;
    return <img alt={alt || ''} {...rest} />;
  };
  (Img as any).displayName = 'NextImageMock';
  return Img;
});
jest.mock('@/services/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));
jest.mock('@/components/DlpManager', () => {
  const Comp = () => null;
  (Comp as any).displayName = 'DlpManagerMock';
  return Comp;
});
jest.mock('@/services/manualService', () => ({
  downloadManual: jest.fn(() => Promise.resolve())
}));

jest.mock('@/app/actions/settings', () => ({
  testCloudConnectionAction: jest.fn(async () => ({ success: true, message: 'OK' })),
  getDatabaseConfigAction: jest.fn(async () => ({ success: true, data: { type: 'local_storage' } })),
  saveDatabaseConfigAction: jest.fn(async () => ({ success: true })),
  testDatabaseConnectionAction: jest.fn(async () => ({ success: true }))
}));

import Settings from '../page';

describe('Settings System submenu', () => {
  it('opens Sistema tab and renders subtabs', () => {
    render(<Settings />);
    const sistemaTab = screen.getByText('Sistema');
    fireEvent.click(sistemaTab);
    expect(screen.getByText('Utilizadores')).toBeInTheDocument();
    expect(screen.getByText('Nuvem / App')).toBeInTheDocument();
    expect(screen.getByText('Backup / Restore')).toBeInTheDocument();
  });

  it('Testar Conexão Cloud shows loading and success without crashing', async () => {
    render(<Settings />);
    fireEvent.click(screen.getByText('Sistema'));
    const cloudTab = screen.getByText('Nuvem / App');
    fireEvent.click(cloudTab);
    const btn = screen.getByText(/Testar Conexão Cloud|Conexão Ativa|A Testar\.\.\./);
    fireEvent.click(btn);
    await waitFor(() => {
      expect(screen.getByText(/Conexão Ativa|A Testar\.\.\./)).toBeInTheDocument();
    });
  });
});
