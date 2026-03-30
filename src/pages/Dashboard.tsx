import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Trophy, Users, AlertTriangle, DollarSign, MapPin, Calendar, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const [campeonatosCount, setCampeonatosCount] = useState(0);
  const [equipesCount, setEquipesCount] = useState(0);
  const [suspensoesCount, setSuspensoesCount] = useState(0);
  const [pendenciasTotal, setPendenciasTotal] = useState(0);
  const [jogosFuturos, setJogosFuturos] = useState<any[]>([]);
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

      // Próximos Jogos (apenas futuros)
      const hoje = new Date().toISOString().split('T')[0];
      const { data: proxJogos } = await supabase
        .from('jogos')
        .select('*')
        .eq('status', 'Agendado')
        .gte('data', hoje)
        .order('data', { ascending: true })
        .order('hora', { ascending: true })
        .limit(4);
      setJogosFuturos(proxJogos || []);

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

        {/* Próximos Jogos */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-slate-900 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-emerald-600" /> Próximos Jogos
            </h2>
            <Link to="/jogos" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
              Ver todos <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {jogosFuturos.length === 0 ? (
              <p className="text-slate-500 text-sm italic">Nenhum jogo agendado no momento.</p>
            ) : (
              jogosFuturos.map((jogo: any) => {
                const timeIndicator = getTimeIndicator(jogo.data);
                return (
                  <div key={jogo.id} className="relative overflow-hidden rounded-lg border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{jogo.campeonato_nome}</span>
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{jogo.rodada}</span>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${timeIndicator.color}`}>
                        {timeIndicator.text}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 text-right">
                        <span className="font-bold text-slate-800 text-sm truncate block max-w-[120px] ml-auto">{jogo.equipe_a_nome}</span>
                      </div>
                      <div className="mx-3 flex items-center gap-2">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span className="text-xs font-medium text-slate-600">{jogo.hora}</span>
                      </div>
                      <div className="flex-1 text-left">
                        <span className="font-bold text-slate-800 text-sm truncate block max-w-[120px] mr-auto">{jogo.equipe_b_nome}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-start mt-2 pt-2 border-t border-slate-100 gap-4">
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="h-3 w-3" />
                        {jogo.quadra}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Calendar className="h-3 w-3" />
                        {new Date(jogo.data).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                      </div>
                    </div>
                  </div>
                );
              })
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

function getTimeIndicator(dataStr: string) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const jogoData = new Date(dataStr);
  jogoData.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((jogoData.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return { text: 'Hoje', color: 'bg-red-500 text-white' };
  if (diffDays === 1) return { text: 'Amanhã', color: 'bg-orange-500 text-white' };
  if (diffDays <= 7) return { text: `Em ${diffDays} dias`, color: 'bg-blue-500 text-white' };
  return { text: jogoData.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), color: 'bg-slate-200 text-slate-700' };
}
