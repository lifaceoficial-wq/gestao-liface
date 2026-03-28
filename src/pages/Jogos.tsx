import React, { useState, useEffect } from 'react';
import { Plus, Search, ShieldAlert, Trophy, PlayCircle, Clock, CheckCircle, XCircle, Calendar as CalendarIcon } from 'lucide-react';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

export default function Jogos() {
  const [jogos, setJogos] = useState<any[]>(() => {
    const saved = localStorage.getItem('@nicolau:jogos');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [campeonatos, setCampeonatos] = useState<any[]>([]);
  const [equipes, setEquipes] = useState<any[]>([]);
  const [atletas, setAtletas] = useState<any[]>([]);

  useEffect(() => {
    setCampeonatos(JSON.parse(localStorage.getItem('@nicolau:campeonatos') || '[]'));
    setEquipes(JSON.parse(localStorage.getItem('@nicolau:equipes') || '[]'));
    setAtletas(JSON.parse(localStorage.getItem('@nicolau:atletas') || '[]'));
  }, []);

  useEffect(() => {
    localStorage.setItem('@nicolau:jogos', JSON.stringify(jogos));
  }, [jogos]);

  const [filtroCamp, setFiltroCamp] = useState('');
  
  // Modal de Novo Jogo
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    campeonato: '',
    rodada: '1ª Rodada',
    data: '',
    hora: '',
    quadra: '',
    equipeA: '',
    equipeB: ''
  });

  // Modal de Sumula
  const [isSumulaModalOpen, setSumulaModalOpen] = useState(false);
  const [jogoSumula, setJogoSumula] = useState<any>(null);
  
  // Estado local da sumula
  const [sumulaPlacarA, setSumulaPlacarA] = useState(0);
  const [sumulaPlacarB, setSumulaPlacarB] = useState(0);
  const [eventosSumula, setEventosSumula] = useState<any[]>([]);
  const [novoEvento, setNovoEvento] = useState({ equipe: '', jogador: '', tipo: 'Gol', tempo: '' });

  const equipesFiltradasCamp = equipes.filter(e => e.campeonato === formData.campeonato);

  const handleSalvarJogo = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.equipeA === formData.equipeB) {
      toast.error('O time A não pode ser igual ao time B!');
      return;
    }
    const novo = {
      id: Date.now(),
      ...formData,
      status: 'Agendado',
      golsA: 0,
      golsB: 0,
      eventos: []
    };
    setJogos([novo, ...jogos]);
    toast.success('Partida agendada com sucesso!');
    setFormModalOpen(false);
  };

  const abrirSumula = (jogo: any) => {
    setJogoSumula(jogo);
    setSumulaPlacarA(jogo.golsA || 0);
    setSumulaPlacarB(jogo.golsB || 0);
    setEventosSumula(jogo.eventos || []);
    setNovoEvento({ equipe: jogo.equipeA, jogador: '', tipo: 'Gol', tempo: '' });
    setSumulaModalOpen(true);
  };

  const adicionarEvento = () => {
    if (!novoEvento.jogador || !novoEvento.tempo) {
      toast.error('Preencha jogador e tempo do evento');
      return;
    }
    
    // Auto incrementa placar se for gol
    if(novoEvento.tipo === 'Gol') {
      if(novoEvento.equipe === jogoSumula.equipeA) setSumulaPlacarA(prev => prev + 1);
      else setSumulaPlacarB(prev => prev + 1);
    }

    setEventosSumula([...eventosSumula, { id: Date.now(), ...novoEvento }]);
    // Reset inputs
    setNovoEvento({ ...novoEvento, jogador: '', tempo: '' });
    toast.success(`${novoEvento.tipo} registrado aos ${novoEvento.tempo}!`);
  };

  const excluirEvento = (id: number, evento: any) => {
    setEventosSumula(eventosSumula.filter(e => e.id !== id));
    if(evento.tipo === 'Gol') {
      if(evento.equipe === jogoSumula.equipeA) setSumulaPlacarA(prev => Math.max(0, prev - 1));
      else setSumulaPlacarB(prev => Math.max(0, prev - 1));
    }
  };

  const encerrarSumula = () => {
    if(confirm('Tem certeza que deseja encerrar esta súmula? Não poderá mais alterar dados na interface simplificada.')) {
      const updatedMatch = {
        ...jogoSumula,
        golsA: sumulaPlacarA,
        golsB: sumulaPlacarB,
        eventos: eventosSumula,
        status: 'Encerrado'
      };

      const todosJogosAtualizados = jogos.map(j => j.id === updatedMatch.id ? updatedMatch : j);
      setJogos(todosJogosAtualizados);

      // GATILHO FUTSAL: Disparar suspensões automáticas
      const suspensoes = JSON.parse(localStorage.getItem('@nicolau:suspensoes') || '[]');
      let salvouSusp = false;

      eventosSumula.forEach(ev => {
        if(ev.tipo === 'Vermelho') {
          suspensoes.push({
            id: Date.now() + Math.random(),
            infrator: ev.jogador,
            equipe: ev.equipe,
            campeonato: updatedMatch.campeonato,
            motivo: `Cartão Vermelho direto na partida ${updatedMatch.equipeA} x ${updatedMatch.equipeB} (${updatedMatch.data})`,
            dataFato: updatedMatch.data,
            penas: 'Suspensão Automática - 1 Jogo',
            status: 'Suspenso',
            multaValor: 30 // Taxa de vermelho
          });
          salvouSusp = true;
          toast.error(`ATENÇÃO: ${ev.jogador} recebeu Vermelho e já foi lançado no Tribunal!`, { duration: 6000 });
        }
        if(ev.tipo === 'Amarelo') {
          // Conta amarelos neste campeonato (incluindo o que acabou de tomar)
          let yellowCount = 0;
          todosJogosAtualizados.filter(j => j.campeonato === updatedMatch.campeonato).forEach(pm => {
            pm.eventos.forEach((pe: any) => {
              if(pe.jogador === ev.jogador && pe.tipo === 'Amarelo') yellowCount++;
            });
          });

          if(yellowCount > 0 && yellowCount % 3 === 0) {
            suspensoes.push({
              id: Date.now() + Math.random(),
              infrator: ev.jogador,
              equipe: ev.equipe,
              campeonato: updatedMatch.campeonato,
              motivo: `Acúmulo de 3 Cartões Amarelos na data ${updatedMatch.data}`,
              dataFato: updatedMatch.data,
              penas: 'Suspensão Automática - 1 Jogo',
              status: 'Suspenso',
              multaValor: 0
            });
            salvouSusp = true;
            toast.error(`ATENÇÃO: ${ev.jogador} tomou o 3º AMARELO e foi suspenso automaticamente!`, { duration: 6000 });
          }
        }
      });

      if(salvouSusp) {
        localStorage.setItem('@nicolau:suspensoes', JSON.stringify(suspensoes));
      }

      toast.success('Jogo Finalizado e Classificação Computada!');
      setSumulaModalOpen(false);
    }
  };

  const aplicarWO = (jogo: any, timeVencedor: string) => {
    if(confirm(`Aplicar W.O com vitória para ${timeVencedor}? O outro time será punido no financeiro.`)) {
      const updatedMatch = {
        ...jogo,
        golsA: timeVencedor === jogo.equipeA ? 3 : 0,
        golsB: timeVencedor === jogo.equipeB ? 3 : 0,
        eventos: [],
        status: 'W.O'
      };
      setJogos(jogos.map(j => j.id === updatedMatch.id ? updatedMatch : j));
      
      const timePerdedor = timeVencedor === jogo.equipeA ? jogo.equipeB : jogo.equipeA;
      // GATILHO W.O
      const financeiro = JSON.parse(localStorage.getItem('@nicolau:financeiro') || '[]');
      financeiro.push({
        id: Date.now(),
        tipo: 'RECEITA',
        descricao: `Multa por W.O - Equipe: ${timePerdedor} (${jogo.campeonato})`,
        valor: 200,
        data: jogo.data,
        status: 'Pendente'
      });
      localStorage.setItem('@nicolau:financeiro', JSON.stringify(financeiro));
      toast.success(`W.O aplicado. Multa de R$200 enviada ao financeiro da equipe ${timePerdedor}.`);
    }
  };

  const jogosFiltrados = filtroCamp 
    ? jogos.filter(j => j.campeonato === filtroCamp)
    : jogos;

  // Elencos disponiveis current equipe na sumula
  const elencoNovoEvento = atletas.filter(a => a.equipe === novoEvento.equipe);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Súmulas & Partidas</h1>
          <p className="text-sm text-slate-500 mt-1">Organize as rodadas, eventos lance-a-lance e encerramento de jogos de Futsal.</p>
        </div>
        <button 
          onClick={() => setFormModalOpen(true)}
          className="inline-flex w-full sm:w-auto items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          Agendar Partida
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
        <select 
          value={filtroCamp} 
          onChange={e => setFiltroCamp(e.target.value)}
          className="block w-full max-w-sm rounded-md border-0 py-2 pl-3 pr-10 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-emerald-600 sm:text-sm sm:leading-6"
        >
          <option value="">Selecione o Campeonato para ver Tabela de Jogos</option>
          {campeonatos.map(c => (
            <option key={c.id} value={c.nome}>{c.nome}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {jogosFiltrados.length === 0 ? (
          <div className="col-span-1 lg:col-span-2 text-center p-12 bg-white rounded-xl border border-slate-200">
            <Trophy className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Nenhuma partida registrada neste filtro.</p>
          </div>
        ) : (
          jogosFiltrados.map(jogo => (
            <div key={jogo.id} className="bg-white border flex flex-col justify-between border-slate-200 rounded-xl overflow-hidden shadow-sm hover:border-emerald-200 transition-colors">
              <div className="bg-slate-50 border-b border-slate-100 p-3 flex justify-between items-center text-sm font-medium text-slate-600">
                <span className="flex items-center gap-2"><Trophy className="h-4 w-4 text-amber-500"/> {jogo.rodada} • {jogo.campeonato}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  jogo.status === 'Agendado' ? 'bg-amber-100 text-amber-800' :
                  jogo.status === 'Encerrado' ? 'bg-emerald-100 text-emerald-800' :
                  'bg-rose-100 text-rose-800'
                }`}>
                  {jogo.status}
                </span>
              </div>
              <div className="p-5">
                <div className="flex justify-between items-center">
                  <div className="text-center flex-1">
                    <h3 className="font-bold text-slate-900 text-lg sm:text-xl truncate" title={jogo.equipeA}>{jogo.equipeA}</h3>
                  </div>
                  <div className="px-4 text-center">
                    <div className="text-3xl font-black text-slate-900 tracking-tighter bg-slate-100 px-4 py-2 rounded-lg">
                      {jogo.golsA} <span className="text-slate-300 mx-1">x</span> {jogo.golsB}
                    </div>
                  </div>
                  <div className="text-center flex-1">
                    <h3 className="font-bold text-slate-900 text-lg sm:text-xl truncate" title={jogo.equipeB}>{jogo.equipeB}</h3>
                  </div>
                </div>
                <div className="mt-4 flex justify-center text-xs text-slate-500 bg-slate-50 rounded-md py-2 border border-slate-100">
                  <span className="flex items-center gap-1 mx-2"><CalendarIcon className="h-3 w-3" /> {jogo.data} • {jogo.hora}</span>
                  <span className="flex items-center gap-1 mx-2"><LocationIcon className="h-3 w-3" /> {jogo.quadra}</span>
                </div>
              </div>
              <div className="p-3 bg-slate-50 flex gap-2 border-t border-slate-100">
                {jogo.status === 'Agendado' && (
                  <>
                    <button onClick={() => abrirSumula(jogo)} className="flex-1 flex justify-center items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500 shadow-sm">
                      <PlayCircle className="h-4 w-4" /> Preencher Súmula
                    </button>
                    <button onClick={() => aplicarWO(jogo, jogo.equipeA)} className="px-3 py-2 text-sm font-semibold text-rose-700 bg-rose-100 rounded-md hover:bg-rose-200">W.O {jogo.equipeA}</button>
                    <button onClick={() => aplicarWO(jogo, jogo.equipeB)} className="px-3 py-2 text-sm font-semibold text-rose-700 bg-rose-100 rounded-md hover:bg-rose-200">W.O {jogo.equipeB}</button>
                  </>
                )}
                {jogo.status !== 'Agendado' && (
                  <button onClick={() => toast.success("Súmula PDF será gerada via Supabase.")} className="flex-1 flex justify-center items-center gap-2 rounded-md bg-white border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm">
                    Visualizar Súmula (PDF)
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isFormModalOpen} onClose={() => setFormModalOpen(false)} title="Agendar Partida Futsal">
        <form onSubmit={handleSalvarJogo} className="space-y-4">
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 text-sm text-amber-800 flex items-start gap-2 mb-4">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <p><strong>Atenção:</strong> Vínculos automáticos exigem que as equipes já estejam cadastradas num campeonato ativo.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Campeonato</label>
            <select required value={formData.campeonato} onChange={e => setFormData({...formData, campeonato: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm">
              <option value="">Selecione...</option>
              {campeonatos.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Time Mandante</label>
              <select required value={formData.equipeA} onChange={e => setFormData({...formData, equipeA: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm">
                <option value="">Selecione...</option>
                {equipesFiltradasCamp.map(e => <option key={e.id} value={e.nome}>{e.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Time Visitante</label>
              <select required value={formData.equipeB} onChange={e => setFormData({...formData, equipeB: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm">
                <option value="">Selecione...</option>
                {equipesFiltradasCamp.map(e => <option key={e.id} value={e.nome}>{e.nome}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Data</label>
              <input required type="date" value={formData.data} onChange={e => setFormData({...formData, data: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Hora</label>
              <input required type="time" value={formData.hora} onChange={e => setFormData({...formData, hora: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Rodada / Fase</label>
              <input required type="text" placeholder="Ex: Semifinal" value={formData.rodada} onChange={e => setFormData({...formData, rodada: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Quadra (Local)</label>
              <input required type="text" placeholder="Quadra Central" value={formData.quadra} onChange={e => setFormData({...formData, quadra: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm" />
            </div>
          </div>
          <div className="pt-4 flex justify-end">
            <button type="button" onClick={() => setFormModalOpen(false)} className="mr-3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300">Cancelar</button>
            <button type="submit" className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500">Agendar Jogo</button>
          </div>
        </form>
      </Modal>

      {/* SÚMULA MODAL */}
      <Modal isOpen={isSumulaModalOpen} onClose={() => setSumulaModalOpen(false)} title={`Súmula: ${jogoSumula?.equipeA} x ${jogoSumula?.equipeB}`}>
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500"></div>
            <div className="flex justify-between items-center text-white">
              <div className="text-center w-1/3">
                <span className="block text-sm text-slate-400 mb-1 lg:text-lg uppercase select-none">{jogoSumula?.equipeA}</span>
                <span className="text-5xl font-black">{sumulaPlacarA}</span>
              </div>
              <div className="text-center w-1/3 text-slate-500 text-2xl font-black font-mono">X</div>
              <div className="text-center w-1/3">
                <span className="block text-sm text-slate-400 mb-1 lg:text-lg uppercase select-none">{jogoSumula?.equipeB}</span>
                <span className="text-5xl font-black">{sumulaPlacarB}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border text-sm border-slate-200 rounded-xl p-4 shadow-sm">
            <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Clock className="h-4 w-4 text-emerald-600"/> Lançar Evento Lance a Lance</h4>
            <div className="flex flex-col sm:flex-row gap-2 items-end">
              <div className="w-full sm:w-1/4">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Equipe</label>
                <select value={novoEvento.equipe} onChange={e => setNovoEvento({...novoEvento, equipe: e.target.value, jogador: ''})} className="block w-full rounded-md border-slate-300 py-1.5 px-2 border shadow-sm">
                  <option value={jogoSumula?.equipeA}>{jogoSumula?.equipeA}</option>
                  <option value={jogoSumula?.equipeB}>{jogoSumula?.equipeB}</option>
                </select>
              </div>
              <div className="w-full sm:w-1/3">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Jogador <span className="text-red-500">*</span></label>
                <select value={novoEvento.jogador} onChange={e => setNovoEvento({...novoEvento, jogador: e.target.value})} className="block w-full rounded-md border-slate-300 py-1.5 px-2 border shadow-sm">
                  <option value="">Selecione...</option>
                  {elencoNovoEvento.map(a => <option key={a.id} value={a.nome}>{a.nome} (Nº {a.camisa || '-'})</option>)}
                </select>
              </div>
              <div className="w-full sm:w-1/4">
                <label className="block text-xs font-semibold text-slate-600 mb-1">O que aconteceu?</label>
                <select value={novoEvento.tipo} onChange={e => setNovoEvento({...novoEvento, tipo: e.target.value})} className="block w-full rounded-md border-slate-300 py-1.5 px-2 border shadow-sm font-semibold">
                  <option value="Gol">⚽ GOL !</option>
                  <option value="Amarelo">🟨 Cartão Amarelo</option>
                  <option value="Vermelho">🟥 Cartão Vermelho</option>
                </select>
              </div>
              <div className="w-full sm:w-1/5">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tempo <span className="text-red-500">*</span></label>
                <input type="text" placeholder="Ex: 12:30" value={novoEvento.tempo} onChange={e => setNovoEvento({...novoEvento, tempo: e.target.value})} className="block w-full rounded-md border-slate-300 py-1.5 px-2 border shadow-sm text-center" />
              </div>
              <button disabled={!novoEvento.jogador || !novoEvento.tempo} onClick={adicionarEvento} className="w-full sm:w-auto mt-2 sm:mt-0 px-4 py-1.5 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 disabled:opacity-50">Add</button>
            </div>
          </div>

          <div className="max-h-52 overflow-y-auto">
            <h4 className="font-bold text-slate-800 text-sm mb-2 border-b pb-1">Cronologia da Partida</h4>
            {eventosSumula.length === 0 ? <p className="text-xs text-slate-400 italic">Nenhum evento registrado.</p> : (
              <ul className="space-y-2">
                {eventosSumula.map((ev: any) => (
                  <li key={ev.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-md border border-slate-100 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-500 font-bold bg-white px-2 py-0.5 rounded border border-slate-200">{ev.tempo}</span>
                      <span className="font-medium text-slate-800">{ev.jogador}</span>
                      <span className="text-slate-400 text-xs">({ev.equipe})</span>
                      {ev.tipo === 'Gol' && <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-xs">⚽ Gol</span>}
                      {ev.tipo === 'Amarelo' && <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full text-xs">🟨 Amarelo</span>}
                      {ev.tipo === 'Vermelho' && <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full text-xs">🟥 Vermelho</span>}
                    </div>
                    <button onClick={() => excluirEvento(ev.id, ev)} className="text-rose-500 hover:text-rose-700 p-1"><XCircle className="h-4 w-4" /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="pt-4 flex justify-between border-t border-slate-100">
            <button onClick={() => setSumulaModalOpen(false)} className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-700 border hover:bg-slate-50">Abandonar sem salvar</button>
            <button onClick={encerrarSumula} className="flex items-center gap-2 rounded-md bg-emerald-600 px-6 py-2 text-sm font-bold text-white hover:bg-emerald-500 shadow-md">
              <CheckCircle className="h-5 w-5" /> ASSINAR E ENCERRAR SÚMULA
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}

// Icon helper since lucide doesn't have a specific map pin
function LocationIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>;
}
