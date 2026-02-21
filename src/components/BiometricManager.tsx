import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { BiometricDevice } from '@/types';
import { 
  Smartphone, Plus, Trash2, Edit, CheckCircle, XCircle, 
  RefreshCw, Wifi, Activity, Save, X 
} from 'lucide-react';

export const BiometricManager = () => {
  const { biometricDevices, registerBiometricDevice, removeBiometricDevice, updateBiometricDevice, addNotification } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<BiometricDevice | null>(null);
  const [formData, setFormData] = useState<Partial<BiometricDevice>>({
    name: '',
    ipAddress: '',
    port: 4370,
    type: 'ZKTECO',
    location: 'Entrada Principal'
  });

  const handleOpenModal = (device?: BiometricDevice) => {
    if (device) {
      setEditingDevice(device);
      setFormData(device);
    } else {
      setEditingDevice(null);
      setFormData({
        name: '',
        ipAddress: '',
        port: 4370,
        type: 'ZKTECO',
        location: 'Entrada Principal'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.ipAddress) {
      addNotification('error', 'Preencha os campos obrigatórios');
      return;
    }

    try {
      if (editingDevice) {
        updateBiometricDevice({
          ...editingDevice,
          ...formData as BiometricDevice,
          updatedAt: new Date().toISOString()
        });
        addNotification('success', 'Dispositivo atualizado com sucesso');
      } else {
        const newDevice: BiometricDevice = {
          ...formData as BiometricDevice,
          id: crypto.randomUUID(),
          status: 'OFFLINE',
          lastSync: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        registerBiometricDevice(newDevice);
        addNotification('success', 'Dispositivo registado com sucesso');
      }
      setIsModalOpen(false);
    } catch (error) {
      addNotification('error', 'Erro ao salvar dispositivo');
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover este dispositivo?')) {
      removeBiometricDevice(id);
      addNotification('success', 'Dispositivo removido');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-bold text-white uppercase text-xs tracking-widest flex items-center gap-2">
            <Smartphone size={16} className="text-blue-500" />
            Dispositivos Registados
          </h4>
          <p className="text-[10px] text-slate-500 mt-1">Gestão de leitores biométricos e terminais de ponto</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-blue-500/20 flex items-center gap-2"
        >
          <Plus size={14} /> Novo Dispositivo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {biometricDevices.map(device => (
          <div key={device.id} className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 group hover:border-blue-500/30 transition-all">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${device.status === 'ONLINE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                  <Activity size={18} />
                </div>
                <div>
                  <h5 className="font-bold text-white text-sm">{device.name}</h5>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                    <Wifi size={10} /> {device.ipAddress}:{device.port}
                  </div>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleOpenModal(device)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                  <Edit size={14} />
                </button>
                <button onClick={() => handleDelete(device.id)} className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-3 border-t border-white/5">
              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${
                device.status === 'ONLINE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
              }`}>
                {device.status}
              </span>
              <span className="text-[10px] text-slate-500">
                Última Sync: {device.lastSync ? new Date(device.lastSync).toLocaleTimeString() : 'Nunca'}
              </span>
            </div>
          </div>
        ))}

        {biometricDevices.length === 0 && (
          <div className="col-span-1 md:col-span-2 py-8 text-center border-2 border-dashed border-white/5 rounded-2xl">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Nenhum dispositivo configurado</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-800/50">
              <h3 className="font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Smartphone size={18} className="text-blue-500" />
                {editingDevice ? 'Editar Dispositivo' : 'Novo Dispositivo'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Nome do Dispositivo</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:border-blue-500 outline-none transition-colors"
                  placeholder="Ex: Relógio Entrada"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Endereço IP</label>
                  <input 
                    type="text" 
                    value={formData.ipAddress}
                    onChange={e => setFormData({...formData, ipAddress: e.target.value})}
                    className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm font-mono focus:border-blue-500 outline-none transition-colors"
                    placeholder="192.168.1.201"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Porta</label>
                  <input 
                    type="number" 
                    value={formData.port}
                    onChange={e => setFormData({...formData, port: parseInt(e.target.value)})}
                    className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm font-mono focus:border-blue-500 outline-none transition-colors"
                    placeholder="4370"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Localização</label>
                <input 
                  type="text" 
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                  className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:border-blue-500 outline-none transition-colors"
                  placeholder="Ex: Entrada Funcionários"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-slate-700 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-blue-600 transition-all shadow-glow flex items-center justify-center gap-2"
                >
                  <Save size={14} /> Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
