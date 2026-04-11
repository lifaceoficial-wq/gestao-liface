import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Trophy, Users, User, ShieldAlert,
  Wallet, Image as ImageIcon, History, HeartHandshake,
  Calendar, FileText, Gavel, Briefcase, X, PlayCircle, LogOut, Crown
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../contexts/AuthContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navigation = [
  { name: 'Painel Inicial', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Campeonatos', href: '/campeonatos', icon: Trophy },
  { name: 'Jogos & Súmulas', href: '/jogos', icon: PlayCircle },
  { name: 'Equipes', href: '/equipes', icon: Users },
  { name: 'Atletas', href: '/atletas', icon: User },
  { name: 'Árbitros', href: '/arbitros', icon: Gavel },
  { name: 'Campeões', href: '/campeas', icon: Crown },
  { name: 'Diretoria', href: '/diretoria', icon: Briefcase },
  { name: 'Suspensões', href: '/suspensoes', icon: ShieldAlert },
  { name: 'Financeiro', href: '/financeiro', icon: Wallet },
  { name: 'Mídia', href: '/midia', icon: ImageIcon },
  { name: 'Histórico', href: '/historico', icon: History },
  { name: 'Social', href: '/social', icon: HeartHandshake },
  { name: 'Eventos', href: '/eventos', icon: Calendar },
  { name: 'Relatórios', href: '/relatorios', icon: FileText },
];

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-full w-64 flex-col bg-gradient-to-b from-slate-950 to-slate-900 border-r border-white/10">
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            LIFACE
          </h1>
        </div>
        {onClose && (
          <button
            type="button"
            className="lg:hidden ml-auto text-slate-400 hover:text-white transition-colors"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto py-4">
        <nav className="flex-1 px-3 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-blue-400 border border-blue-500/20 shadow-lg shadow-blue-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 hover:shadow-lg'
                )
              }
            >
              <item.icon
                className={cn(
                  'h-4 w-4 transition-colors',
                  'group-hover:scale-110'
                )}
              />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="shrink-0 border-t border-white/10 p-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
            {user?.email?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">
              Admin
            </p>
            <p className="text-xs text-slate-400 truncate">
              {user?.email || 'admin'}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
