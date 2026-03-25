import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Trophy, Users, AlertTriangle, DollarSign } from 'lucide-react';

const data = [
  { name: 'Jan', cartoes: 40, suspensoes: 24, multas: 2400 },
  { name: 'Fev', cartoes: 30, suspensoes: 13, multas: 2210 },
  { name: 'Mar', cartoes: 20, suspensoes: 98, multas: 2290 },
  { name: 'Abr', cartoes: 27, suspensoes: 39, multas: 2000 },
  { name: 'Mai', cartoes: 18, suspensoes: 48, multas: 2181 },
  { name: 'Jun', cartoes: 23, suspensoes: 38, multas: 2500 },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Painel Inicial</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Stats Cards */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-md bg-blue-50 p-3">
              <Trophy className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-500">Campeonatos Ativos</p>
              <p className="text-2xl font-semibold text-slate-900">3</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-md bg-emerald-50 p-3">
              <Users className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-500">Equipes Cadastradas</p>
              <p className="text-2xl font-semibold text-slate-900">42</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-md bg-amber-50 p-3">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-500">Atletas Suspensos</p>
              <p className="text-2xl font-semibold text-slate-900">12</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-md bg-rose-50 p-3">
              <DollarSign className="h-6 w-6 text-rose-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-500">Pendências Financeiras</p>
              <p className="text-2xl font-semibold text-slate-900">R$ 1.250</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900 mb-4">Estatísticas Disciplinares</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="cartoes" name="Cartões" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="suspensoes" name="Suspensões" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900 mb-4">Ações Sociais e Eventos</h2>
          <div className="space-y-4">
            {[
              { title: 'Doação de Alimentos', date: '15 Jun 2026', type: 'Ação Social', status: 'Concluído' },
              { title: 'Clínica de Futsal Sub-15', date: '22 Jun 2026', type: 'Evento', status: 'Em andamento' },
              { title: 'Reunião de Arbitragem', date: '01 Jul 2026', type: 'Evento', status: 'Planejado' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium text-slate-900">{item.title}</p>
                  <p className="text-sm text-slate-500">{item.type} • {item.date}</p>
                </div>
                <span className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                  item.status === 'Concluído' ? "bg-emerald-100 text-emerald-800" :
                  item.status === 'Em andamento' ? "bg-blue-100 text-blue-800" :
                  "bg-slate-100 text-slate-800"
                )}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}
