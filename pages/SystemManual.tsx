import React, { useState } from 'react';
import { Book, Shield, User } from 'lucide-react';
import { MANUAL_UTILIZADOR, MANUAL_ADMIN } from '../data/manuals';
import { useStore } from '../store/useStore';

const SystemManual = () => {
  const { currentUser } = useStore();
  const [activeTab, setActiveTab] = useState<'user' | 'admin'>('user');

  // Simple Markdown-like parser for basic formatting
  const renderContent = (content: string) => {
    return content.split('\n').map((line, index) => {
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-3xl font-bold text-white mb-6 mt-8 border-b border-white/10 pb-2">{line.replace('# ', '')}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-2xl font-semibold text-primary mb-4 mt-6">{line.replace('## ', '')}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={index} className="text-xl font-medium text-white/90 mb-3 mt-4">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('* ')) {
        return (
          <div key={index} className="flex items-start gap-2 mb-2 ml-4">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
            <p className="text-slate-300">
              {line.replace('* ', '').split('**').map((part, i) => 
                i % 2 === 1 ? <strong key={i} className="text-white font-bold">{part}</strong> : part
              )}
            </p>
          </div>
        );
      }
      if (line.match(/^\d+\. /)) {
         return (
            <div key={index} className="flex items-start gap-2 mb-2 ml-4">
               <span className="text-primary font-bold min-w-[20px]">{line.split('.')[0]}.</span>
               <p className="text-slate-300">
                  {line.replace(/^\d+\. /, '').split('**').map((part, i) => 
                     i % 2 === 1 ? <strong key={i} className="text-white font-bold">{part}</strong> : part
                  )}
               </p>
            </div>
         );
      }
      if (line.trim() === '') {
        return <div key={index} className="h-2" />;
      }
      return (
        <p key={index} className="text-slate-300 mb-2 leading-relaxed">
          {line.split('**').map((part, i) => 
            i % 2 === 1 ? <strong key={i} className="text-white font-bold">{part}</strong> : part
          )}
        </p>
      );
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/50">
      <div className="p-6 border-b border-white/10 flex items-center justify-between backdrop-blur-md bg-slate-900/50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-glow">
            <Book size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Manual do Sistema</h1>
            <p className="text-slate-400">Documentação e guias de uso</p>
          </div>
        </div>

        <div className="flex bg-black/40 rounded-xl p-1 border border-white/5">
          <button
            onClick={() => setActiveTab('user')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg transition-all font-medium ${
              activeTab === 'user' 
                ? 'bg-primary text-black shadow-glow' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <User size={18} />
            Manual do Utilizador
          </button>
          
          {['ADMIN', 'GERENTE'].includes(currentUser?.role || '') && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg transition-all font-medium ${
                activeTab === 'admin' 
                  ? 'bg-primary text-black shadow-glow' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Shield size={18} />
              Manual de Admin
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto bg-slate-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
          <div className="p-10">
            {activeTab === 'user' ? renderContent(MANUAL_UTILIZADOR) : renderContent(MANUAL_ADMIN)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemManual;
