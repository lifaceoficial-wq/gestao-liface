import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Trophy, Users, AlertTriangle, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const [campeonatosCount, setCampeonatosCount] = useState(0);
  const [equipesCount, setEquipesCount] = useState(0);
  const [suspensoesCount, setSuspensoesCount] = useState(0);
  const [pendenciasTotal, setPendenciasTotal] = useState(0);
  const [eventosRecentes, setEventosRecentes] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Campeonatos Ativos
      const { count: campCount } = await supabase
        .from('campeonatos')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Ativo');
      setCampeonatosCount(campCount || 0);

      // 2. Equipes
      const { count: eqCount } = await supabase
        .from('equipes')
        .select('*', { count: 'exact', head: true });
      setEquipesCount(eqCount || 0);

      // 3. Suspensões Ativas
      const { count: suspCount } = await supabase
        .from('suspensoes')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Suspenso');
      setSuspensoesCount(suspCount || 0);

      // 4. Pendências Financeiras
      const { data: finData } = await supabase
        .from('financeiro')
        .select('valor')
        .eq('status', 'Pendente');
      
      const totalPendente = (finData || []).reduce((acc, curr) => acc + Number(curr.valor), 0);
      setPendenciasTotal(totalPendente);

      // Eventos (Futuro: substituir por uma tabela de eventos/acoes_sociais quando for criada.
      // Por enquanto vamos tentar buscar do localstorage pra nao quebrar nada caso vc ja tenha criado,
      // ou apenas omitir). Como migramos tudo, se for criar depois no supabase, criaremos tabela.
      const eventos = JSON.parse(localStorage.getItem('@nicolau:eventos') || '[]');
      setEventosRecentes(eventos.slice(0, 3));

      // 5. Chart Data
      // Para o chart de cartões / suspensoes: pegamos os cartões (eventos_jogo)
      const { count: cartoesCount } = await supabase
        .from('eventos_jogo')
        .select('*', { count: 'exact', head: true })
        .in('tipo', ['Amarelo', 'Vermelho']);
      
      if (!cartoesCount && !suspCount && totalPendente === 0) {
        setChartData([]);
      } else {
        setChartData([
          { 
            name: 'Métricas Globais', 
            cartoes: cartoesCount || 0, 
            suspensoes: suspCount || 0, 
            multas: totalPendente 
          }
        ]);
      }
    } catch (err) {
      console.error('Erro ao buscar dados do dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

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
              <p className="text-2xl font-semibold text-slate-900">
                {loading ? '...' : campeonatosCount}
              </p>
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
              <p className="text-2xl font-semibold text-slate-900">
                {loading ? '...' : equipesCount}
              </p>
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
              <p className="text-2xl font-semibold text-slate-900">
                {loading ? '...' : suspensoesCount}
              </p>
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
              <p className="text-2xl font-semibold text-slate-900">
                {loading ? '...' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pendenciasTotal)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900 mb-4">Estatísticas Disciplinares</h2>
          <div className="h-72">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-slate-400 text-sm">Carregando dados da nuvem...</p>
              </div>
            ) : chartData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-slate-400 text-sm">Sem dados disciplinares para exibir.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="cartoes" name="Cartões/Faltas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="suspensoes" name="Suspensões" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900 mb-4">Ações Sociais e Eventos</h2>
          <div className="space-y-4">
            {eventosRecentes.length === 0 ? (
              <p className="text-slate-500 text-sm italic">Nenhum evento futuro cadastrado.</p>
            ) : (
              eventosRecentes.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-slate-900">{item.nome}</p>
                    <p className="text-sm text-slate-500">{item.tipo || 'Evento'} • {item.data}</p>
                  </div>
                  <span className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                    item.status === 'Concluído' ? "bg-emerald-100 text-emerald-800" :
                    item.status === 'Em andamento' ? "bg-blue-100 text-blue-800" :
                    "bg-slate-100 text-slate-800"
                  )}>
                    {item.status || 'Planejado'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}
