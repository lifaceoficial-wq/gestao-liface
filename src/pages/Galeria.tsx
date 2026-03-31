import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Crown, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Galeria() {
  const [galeriaCampeoes, setGaleriaCampeoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchGaleriaCampeoes();
  }, []);

  const fetchGaleriaCampeoes = async () => {
    setLoading(true);
    try {
      const { data: championships, error } = await supabase
        .from('campeonatoS')
        .select('*')
        .eq('status', 'Encerrado')
        .order('criado_em', { ascending: false });
      
      if (error) throw error;

      const podiums: any[] = [];

      for (const camp of (championships || [])) {
        const { data: equipes } = await supabase
          .from('equipes')
          .select('*')
          .eq('championship_id', camp.id);

        const { data: jogos } = await supabase
          .from('jogos')
          .select('*')
          .eq('championship_id', camp.id)
          .in('status', ['Encerrado', 'W.O']);

        const stats: Record<string, any> = {};
        (equipes || []).forEach(eq => {
          stats[eq.nome] = { nome: eq.nome, P: 0, J: 0, V: 0, E: 0, D: 0, GP: 0, GC: 0, SG: 0 };
        });

        jogos?.forEach((jogo: any) => {
          const gA = jogo.gols_a || 0;
          const gB = jogo.gols_b || 0;
          if (stats[jogo.equipe_a_nome]) {
            stats[jogo.equipe_a_nome].J++;
            stats[jogo.equipe_a_nome].GP += gA;
            stats[jogo.equipe_a_nome].GC += gB;
            if (gA > gB) { stats[jogo.equipe_a_nome].V++; stats[jogo.equipe_a_nome].P += 3; }
            else if (gA === gB) { stats[jogo.equipe_a_nome].E++; stats[jogo.equipe_a_nome].P += 1; }
            else { stats[jogo.equipe_a_nome].D++; }
            stats[jogo.equipe_a_nome].SG = stats[jogo.equipe_a_nome].GP - stats[jogo.equipe_a_nome].GC;
          }
          if (stats[jogo.equipe_b_nome]) {
            stats[jogo.equipe_b_nome].J++;
            stats[jogo.equipe_b_nome].GP += gB;
            stats[jogo.equipe_b_nome].GC += gA;
            if (gB > gA) { stats[jogo.equipe_b_nome].V++; stats[jogo.equipe_b_nome].P += 3; }
            else if (gB === gA) { stats[jogo.equipe_b_nome].E++; stats[jogo.equipe_b_nome].P += 1; }
            else { stats[jogo.equipe_b_nome].D++; }
            stats[jogo.equipe_b_nome].SG = stats[jogo.equipe_b_nome].GP - stats[jogo.equipe_b_nome].GC;
          }
        });

        const tabela = Object.values(stats).sort((a: any, b: any) => {
          if (b.P !== a.P) return b.P - a.P;
          if (b.V !== a.V) return b.V - a.V;
          if (b.SG !== a.SG) return b.SG - a.SG;
          return b.GP - a.GP;
        });

        if (tabela.length >= 1) {
          podiums.push({
            championship: camp,
            primeiro: tabela[0],
            segundo: tabela[1] || null,
            terceiro: tabela[2] || null
          });
        }
      }

      setGaleriaCampeoes(podiums);
    } catch (err) {
      console.error('Erro ao buscar galeria:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = galeriaCampeoes.filter((p: any) => 
    p.championship.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.championship.edicao.includes(searchTerm) ||
    (p.primeiro && p.primeiro.nome.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Galeria de Campeões</h1>
          <p className="text-sm text-slate-500 mt-1"> 历史 de todos os títulos conquistados nos championships encerrados.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:flex-1 sm:max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
            placeholder="Buscar campeão, ano ou championship..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center p-12 bg-white rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500">Carregando galeria de campeões...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-slate-200">
          <Trophy className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 font-medium text-lg">Nenhum championship encerrado</p>
          <p className="text-sm text-slate-400 mt-2">Encerrar championships para ver o pódio dos campeões aqui</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredItems.map((podium: any, idx: number) => (
            <div key={idx} className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-white text-lg">{podium.championship.nome}</h3>
                  <p className="text-sm text-slate-400">{podium.championship.categoria} • {podium.championship.edicao}</p>
                </div>
                <div className="bg-white/10 px-3 py-1 rounded-full">
                  <span className="text-white text-sm font-medium">{podium.championship.periodo}</span>
                </div>
              </div>
              <div className="bg-gradient-to-b from-slate-50 to-white p-8">
                <div className="flex items-end justify-center gap-6">
                  {podium.segundo && (
                    <div className="flex flex-col items-center">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 border-4 border-gray-400 flex items-center justify-center shadow-md">
                          <Medal className="h-12 w-12 text-gray-400" />
                        </div>
                        <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gray-400 text-white text-sm font-bold px-3 py-1 rounded-full shadow">2º</span>
                      </div>
                      <p className="mt-5 font-bold text-gray-600 text-center text-lg">{podium.segundo.nome}</p>
                      <p className="text-sm text-gray-500">{podium.segundo.V} vitórias • {podium.segundo.P} pts</p>
                    </div>
                  )}
                  {podium.primeiro && (
                    <div className="flex flex-col items-center -mb-6">
                      <div className="relative">
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 border-4 border-amber-500 flex items-center justify-center shadow-xl">
                          <Crown className="h-14 w-14 text-amber-500" />
                        </div>
                        <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg">CAMPEÃO</span>
                      </div>
                      <p className="mt-5 font-black text-amber-600 text-center text-xl tracking-wide">{podium.primeiro.nome}</p>
                      <p className="text-sm text-amber-500 font-medium">{podium.primeiro.V} vitórias • {podium.primeiro.P} pts</p>
                    </div>
                  )}
                  {podium.terceiro && (
                    <div className="flex flex-col items-center">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 border-4 border-orange-400 flex items-center justify-center shadow-md">
                          <Award className="h-12 w-12 text-orange-400" />
                        </div>
                        <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-orange-400 text-white text-sm font-bold px-3 py-1 rounded-full shadow">3º</span>
                      </div>
                      <p className="mt-5 font-bold text-orange-600 text-center text-lg">{podium.terceiro.nome}</p>
                      <p className="text-sm text-orange-500">{podium.terceiro.V} vitórias • {podium.terceiro.P} pts</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
