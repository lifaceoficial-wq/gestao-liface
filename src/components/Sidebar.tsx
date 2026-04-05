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

const navigation = [
  { name: 'Painel Inicial', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Campeonatos', href: '/campeonatos', icon: Trophy },
  { name: 'Jogos & Súmulas', href: '/jogos', icon: PlayCircle },
  { name: 'Equipes', href: '/equipes', icon: Users },
  { name: 'Atletas', href: '/atletas', icon: User },
  { name: 'Árbitros', href: '/arbitros', icon: Gavel },
  { name: 'Campeões', href: '/campeas', icon: Trophy },
  { name: 'Diretoria', href: '/diretoria', icon: Briefcase },
  { name: 'Suspensões', href: '/suspensoes', icon: ShieldAlert },
  { name: 'Financeiro', href: '/financeiro', icon: Wallet },
  { name: 'Vídeos e Fotos', href: '/midia', icon: ImageIcon },
  { name: 'Histórico', href: '/historico', icon: History },
  { name: 'Projeto Social', href: '/social', icon: HeartHandshake },
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
    <div className="flex h-full w-64 flex-col bg-slate-900 border-r border-slate-800">
      <div className="flex h-16 shrink-0 items-center justify-between px-6 bg-slate-950">
        <h1 className="text-xl font-bold text-white tracking-tight">LIFACE</h1>
        {onClose && (
          <button type="button" className="lg:hidden text-slate-400 hover:text-white" onClick={onClose}>
            <span className="sr-only">Close sidebar</span>
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto">
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                  'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn(
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-white',
                      'mr-3 h-5 w-5 shrink-0 transition-colors'
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="shrink-0 border-t border-slate-800 p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400 truncate flex-1" title={user?.email}>
            {user?.email || 'admin'}
          </p>
          <button
            onClick={handleSignOut}
            className="ml-2 p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-600/10 transition-colors"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
