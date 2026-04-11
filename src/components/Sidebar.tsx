import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Trophy, Users, User, ShieldAlert,
  Wallet, Image as ImageIcon, History, HeartHandshake,
  Calendar, FileText, Gavel, Briefcase, X, PlayCircle, LogOut
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../contexts/AuthContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const menuSections = [
  {
    title: 'Principal',
    items: [
      { name: 'Painel', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Campeonatos', href: '/campeonato', icon: Trophy },
      { name: 'Jogos', href: '/jogos', icon: PlayCircle },
    ]
  },
  {
    title: 'Participantes',
    items: [
      { name: 'Equipes', href: '/equipes', icon: Users },
      { name: 'Atletas', href: '/atletas', icon: User },
      { name: 'Árbitros', href: '/arbitros', icon: Gavel },
    ]
  },
  {
    title: 'Administração',
    items: [
      { name: 'Suspensões', href: '/suspensoes', icon: ShieldAlert },
      { name: 'Financeiro', href: '/financeiro', icon: Wallet },
      { name: 'Diretoria', href: '/diretoria', icon: Briefcase },
    ]
  },
  {
    title: 'Extras',
    items: [
      { name: 'Mídia', href: '/midia', icon: ImageIcon },
      { name: 'Eventos', href: '/eventos', icon: Calendar },
      { name: 'Social', href: '/social', icon: HeartHandshake },
      { name: 'Relatórios', href: '/relatorios', icon: FileText },
    ]
  }
];

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-full w-64 flex-col bg-gradient-to-b from-slate-950 to-slate-900 border-r border-white/5">
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center px-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Trophy className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-base font-bold text-white">LIFACE</span>
        </div>
        {onClose && (
          <button
            type="button"
            className="lg:hidden ml-auto text-slate-500 hover:text-white"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Menu */}
      <div className="flex-1 overflow-y-auto py-3 px-2">
        {menuSections.map((section) => (
          <div key={section.title} className="mb-4">
            <p className="px-2 mb-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              {section.title}
            </p>
            <nav className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-all',
                      isActive
                        ? 'bg-blue-600/15 text-blue-400 font-medium'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    )
                  }
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="shrink-0 p-3 border-t border-white/5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 truncate">
            {user?.email?.split('@')[0] || 'admin'}
          </span>
          <button
            onClick={handleSignOut}
            className="p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="Sair"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}