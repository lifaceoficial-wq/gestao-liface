import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Trophy, Users, User, ShieldAlert,
  Wallet, Image as ImageIcon, HeartHandshake,
  Calendar, FileText, Gavel, Briefcase, X, PlayCircle, LogOut
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../contexts/AuthContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const menuItems = [
  { name: 'Painel', href: '/dashboard', icon: LayoutDashboard, color: 'text-slate-600' },
  { name: 'Campeonatos', href: '/campeonato', icon: Trophy, color: 'text-amber-500' },
  { name: 'Jogos', href: '/jogos', icon: PlayCircle, color: 'text-emerald-500' },
  { name: 'Equipes', href: '/equipes', icon: Users, color: 'text-blue-500' },
  { name: 'Atletas', href: '/atletas', icon: User, color: 'text-indigo-500' },
  { name: 'Árbitros', href: '/arbitros', icon: Gavel, color: 'text-purple-500' },
  { name: 'Suspensões', href: '/suspensoes', icon: ShieldAlert, color: 'text-red-500' },
  { name: 'Financeiro', href: '/financeiro', icon: Wallet, color: 'text-green-500' },
  { name: 'Diretoria', href: '/diretoria', icon: Briefcase, color: 'text-slate-500' },
  { name: 'Mídia', href: '/midia', icon: ImageIcon, color: 'text-pink-500' },
  { name: 'Eventos', href: '/eventos', icon: Calendar, color: 'text-cyan-500' },
  { name: 'Social', href: '/social', icon: HeartHandshake, color: 'text-rose-500' },
  { name: 'Relatórios', href: '/relatorios', icon: FileText, color: 'text-orange-500' },
];

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-full w-16 lg:w-56 flex-col bg-white border-r border-slate-200">
      {/* Logo */}
      <div className="flex h-14 items-center justify-center lg:justify-start lg:px-4 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
          <Trophy className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <span className="hidden lg:block ml-2 text-sm font-bold text-slate-800">LIFACE</span>
        {onClose && (
          <button
            type="button"
            className="lg:hidden ml-auto text-slate-400 hover:text-slate-600 p-1"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Menu - Ícones coloridos */}
      <div className="flex-1 overflow-y-auto py-3">
        <nav className="px-2 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-center lg:justify-start gap-3 px-2 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'bg-slate-100'
                    : 'hover:bg-slate-50'
                )
              }
            >
              <item.icon className={cn('w-5 h-5', item.color)} strokeWidth={2} />
              <span className="hidden lg:block text-sm text-slate-700">
                {item.name}
              </span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-slate-100">
        <button
          onClick={handleSignOut}
          className="flex items-center justify-center lg:justify-start gap-2 w-full px-2 py-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="hidden lg:block text-sm">Sair</span>
        </button>
      </div>
    </div>
  );
}