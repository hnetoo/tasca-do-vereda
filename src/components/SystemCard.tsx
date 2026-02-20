import React from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface SystemCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  color?: string; // e.g., "blue", "red", "emerald"
}

export const SystemCard: React.FC<SystemCardProps> = ({ 
  title, 
  description, 
  icon: Icon, 
  href,
  color = "blue" 
}) => {
  const colorClasses = {
    blue: "bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white",
    red: "bg-red-500/10 text-red-500 group-hover:bg-red-500 group-hover:text-white",
    emerald: "bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white",
    amber: "bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-white",
    purple: "bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white",
    slate: "bg-slate-500/10 text-slate-500 group-hover:bg-slate-500 group-hover:text-white",
  }[color] || "bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white";

  return (
    <Link 
      href={href}
      className="group flex flex-col items-center p-6 bg-slate-900/50 border border-white/5 rounded-2xl hover:border-white/10 hover:bg-slate-800 transition-all duration-300"
    >
      <div className={`p-4 rounded-xl mb-4 transition-colors duration-300 ${colorClasses}`}>
        <Icon size={32} />
      </div>
      <h3 className="text-lg font-bold text-white mb-2 text-center">{title}</h3>
      <p className="text-xs text-slate-400 text-center leading-relaxed">{description}</p>
    </Link>
  );
};
