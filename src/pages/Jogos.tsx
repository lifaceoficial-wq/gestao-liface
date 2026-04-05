import React, { useState, useEffect } from 'react';
import { Plus, Search, ShieldAlert, Trophy, PlayCircle, Clock, CheckCircle, XCircle, Calendar as CalendarIcon, Pencil, FileText, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function Jogos() {
  const [jogos, setJogos] = useState<any[]>([]);
  const [campeonatos, setCampeonatos] = useState<any[]>([]);
  const [equipes, setEquipes] = useState<any[]>([]);
  const [atletas, setAtletas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [filtroCamp, setFiltroCamp] = useState('');
  
  // Modal de Novo Jogo
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    campeonato_nome: '',
    rodada: '1ª Rodada',
    data: '',
    hora: '',
    quadra: '',
    equipe_a_nome: '',
    equipe_b_nome: ''
  });

  // Modal de Sumula
  const [isSumulaModalOpen, setSumulaModalOpen] = useState(false);
  const [jogoSumula, setJogoSumula] = useState<any>(null);
  
  // Estado local da sumula
  const [sumulaPlacarA, setSumulaPlacarA] = useState(0);
  const [sumulaPlacarB, setSumulaPlacarB] = useState(0);
  const [eventosSumula, setEventosSumula] = useState<any[]>([]);
  const [novoEvento, setNovoEvento] = useState({ equipe: '', jogador: '', tipo: 'Gol', tempo: '' });

  // Modal de Editar Jogo
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [jogoEditando, setJogoEditando] = useState<any>(null);
  const [editData, setEditData] = useState({
    data: '',
    hora: '',
    quadra: '',
    rodada: '',
    equipe_a_nome: '',
    equipe_b_nome: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Campeonatos
      const { data: camps } = await supabase.from('campeonatos').select('*');
      if (camps) setCampeonatos(camps);

      // Fetch Equipes
      const { data: eqs } = await supabase.from('equipes').select('*');
      if (eqs) setEquipes(eqs);

      // Fetch Atletas
      const { data: atls } = await supabase.from('atletas').select('*');
      if (atls) setAtletas(atls);

      // Fetch Jogos with eventos
      const { data: jgs, error } = await supabase
        .from('jogos')
        .select(`
          *,
          eventos:eventos_jogo(*)
        `)
        .order('data', { ascending: false });

      if (error) throw error;
      setJogos(jgs || []);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao buscar dados.');
    } finally {
      setLoading(false);
    }
  };

  const equipesFiltradasCamp = equipes.filter(e => e.campeonato_nome === formData.campeonato_nome);

  const handleSalvarJogo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.equipe_a_nome === formData.equipe_b_nome) {
      toast.error('O time A não pode ser igual ao time B!');
      return;
    }

    const campeonato = campeonatos.find(c => c.nome === formData.campeonato_nome);
    const equipeA = equipes.find(eq => eq.nome === formData.equipe_a_nome);
    const equipeB = equipes.find(eq => eq.nome === formData.equipe_b_nome);

    if (!campeonato || !equipeA || !equipeB) {
      toast.error('Dados de campeonato ou equipes inválidos!');
      return;
    }

    try {
      const { error } = await supabase.from('jogos').insert([{
        campeonato_id: campeonato.id,
        campeonato_nome: campeonato.nome,
        equipe_a_id: equipeA.id,
        equipe_a_nome: equipeA.nome,
        equipe_b_id: equipeB.id,
        equipe_b_nome: equipeB.nome,
        rodada: formData.rodada,
        data: formData.data,
        hora: formData.hora,
        quadra: formData.quadra,
        status: 'Agendado',
        gols_a: 0,
        gols_b: 0
      }]);

      if (error) throw error;

      toast.success('Partida agendada com sucesso!');
      setFormModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao agendar partida.');
    }
  };

  const abrirSumula = (jogo: any) => {
    setJogoSumula(jogo);
    setSumulaPlacarA(jogo.gols_a || 0);
    setSumulaPlacarB(jogo.gols_b || 0);
    setEventosSumula(jogo.eventos || []);
    setNovoEvento({ equipe: jogo.equipe_a_nome, jogador: '', tipo: 'Gol', tempo: '' });
    setSumulaModalOpen(true);
  };

  const adicionarEvento = async () => {
    if (!novoEvento.jogador || !novoEvento.tempo) {
      toast.error('Preencha jogador e tempo do evento');
      return;
    }
    
    try {
      const eventoToInsert = {
        jogo_id: jogoSumula.id,
        equipe: novoEvento.equipe,
        jogador: novoEvento.jogador,
        tipo: novoEvento.tipo,
        tempo: novoEvento.tempo
      };

      const { data: evData, error } = await supabase.from('eventos_jogo').insert([eventoToInsert]).select().single();
      if (error) throw error;

      // Auto incrementa placar se for gol (apenas local por enquanto, salvará ao encerrar)
      if(novoEvento.tipo === 'Gol') {
        if(novoEvento.equipe === jogoSumula.equipe_a_nome) setSumulaPlacarA(prev => prev + 1);
        else setSumulaPlacarB(prev => prev + 1);
      }

      setEventosSumula([...eventosSumula, evData]);
      setNovoEvento({ ...novoEvento, jogador: '', tempo: '' });
      toast.success(`${novoEvento.tipo} registrado aos ${novoEvento.tempo}!`);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao registrar evento.');
    }
  };

  const excluirEvento = async (id: string, evento: any) => {
    try {
      const { error } = await supabase.from('eventos_jogo').delete().eq('id', id);
      if (error) throw error;

      setEventosSumula(eventosSumula.filter(e => e.id !== id));
      if(evento.tipo === 'Gol') {
        if(evento.equipe === jogoSumula.equipe_a_nome) setSumulaPlacarA(prev => Math.max(0, prev - 1));
        else setSumulaPlacarB(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao excluir evento.');
    }
  };

  const salvarSumula = async () => {
    try {
      const { error: jogoErr } = await supabase.from('jogos').update({
        jogos_a: sumulaPlacarA,
        jogos_b: sumulaPlacarB
      }).eq('id', jogoSumula.id);

      if (jogoErr) throw jogoErr;
      toast.success('Súmula atualizada!');
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar súmula.');
    }
  };

  const encerrarSumula = async () => {
    if(!confirm('Tem certeza que deseja encerrar esta súmula? Após encerrar, você ainda poderá editar eventos aqui.')) return;

    try {
      // 1. Atualizar Jogo
      const { error: jogoErr } = await supabase.from('jogos').update({
        gols_a: sumulaPlacarA,
        gols_b: sumulaPlacarB,
        status: 'Encerrado'
      }).eq('id', jogoSumula.id);

      if (jogoErr) throw jogoErr;

      // 2. GATILHO FUTSAL: Disparar suspensões automáticas
      for (const ev of eventosSumula) {
        if (ev.tipo === 'Vermelho') {
          await supabase.from('suspensoes').insert([{
            infrator: ev.jogador,
            equipe: ev.equipe,
            campeonato: jogoSumula.campeonato_nome,
            motivo: `Cartão Vermelho direto na partida ${jogoSumula.equipe_a_nome} x ${jogoSumula.equipe_b_nome} (${new Date(jogoSumula.data).toLocaleDateString()})`,
            data_fato: jogoSumula.data,
            penas: 'Suspensão Automática - 1 Jogo',
            status: 'Suspenso',
            multa_valor: 30
          }]);
          toast.error(`ATENÇÃO: ${ev.jogador} recebeu Vermelho e já foi lançado no Tribunal!`);
        } else if (ev.tipo === 'Amarelo') {
          // Precisamos contar amarelos do jogador neste campeonato
          // Todos os eventos_jogo desse campeonato
          const queryJogosCamp = jogos.filter(j => j.campeonato_nome === jogoSumula.campeonato_nome).map(j => j.id);
          let yellowCount = 1; // Já conta o current
          
          if (queryJogosCamp.length > 0) {
            const { data: allEvs } = await supabase
              .from('eventos_jogo')
              .select('*')
              .in('jogo_id', queryJogosCamp)
              .eq('jogador', ev.jogador)
              .eq('tipo', 'Amarelo');
              
            if (allEvs) yellowCount = allEvs.length; // O count real (pois o evento current já está no banco)
          }

          if (yellowCount > 0 && yellowCount % 3 === 0) {
            await supabase.from('suspensoes').insert([{
              infrator: ev.jogador,
              equipe: ev.equipe,
              campeonato: jogoSumula.campeonato_nome,
              motivo: `Acúmulo de 3 Cartões Amarelos na data ${new Date(jogoSumula.data).toLocaleDateString()}`,
              data_fato: jogoSumula.data,
              penas: 'Suspensão Automática - 1 Jogo',
              status: 'Suspenso',
              multa_valor: 0
            }]);
            toast.error(`ATENÇÃO: ${ev.jogador} tomou o 3º AMARELO e foi suspenso automaticamente!`);
          }
        }
      }

      toast.success('Jogo Finalizado e Classificação Computada!');
      setSumulaModalOpen(false);
      fetchData(); // Recarrega os dados com as mudanças
    } catch (err) {
      console.error(err);
      toast.error('Erro ao encerrar a súmula.');
    }
  };

  const abrirEditarJogo = (jogo: any) => {
    setJogoEditando(jogo);
    setEditData({
      data: jogo.data || '',
      hora: jogo.hora || '',
      quadra: jogo.quadra || '',
      rodada: jogo.rodada || '',
      equipe_a_nome: jogo.equipe_a_nome || '',
      equipe_b_nome: jogo.equipe_b_nome || ''
    });
    setEditModalOpen(true);
  };

  const salvarEdicaoJogo = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading('Atualizando jogo...');
    try {
      const { error } = await supabase.from('jogos').update({
        data: editData.data,
        hora: editData.hora,
        quadra: editData.quadra,
        rodada: editData.rodada,
        equipe_a_nome: editData.equipe_a_nome,
        equipe_b_nome: editData.equipe_b_nome
      }).eq('id', jogoEditando.id);

      if (error) throw error;
      toast.success('Jogo atualizado com sucesso!', { id: loadingToast });
      setEditModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error('Erro ao atualizar: ' + err.message, { id: loadingToast });
    }
  };

  const excluirJogo = async (jogo: any) => {
    if (!confirm(`Excluir permanentemente o jogo ${jogo.equipe_a_nome} x ${jogo.equipe_b_nome}? Esta ação não pode ser desfeita.`)) return;

    const loadingToast = toast.loading('Excluindo jogo...');
    try {
      const { error: eventosErr } = await supabase.from('eventos_jogo').delete().eq('jogo_id', jogo.id);
      if (eventosErr) throw eventosErr;

      const { error } = await supabase.from('jogos').delete().eq('id', jogo.id);
      if (error) throw error;

      toast.success('Jogo excluído com sucesso!', { id: loadingToast });
      fetchData();
    } catch (err: any) {
      toast.error('Erro ao excluir: ' + err.message, { id: loadingToast });
    }
  };

  const aplicarWO = async (jogo: any, timeVencedorNome: string) => {
    if(!confirm(`Aplicar W.O com vitória para ${timeVencedorNome}? O outro time será punido no financeiro.`)) return;

    try {
      const golsA = timeVencedorNome === jogo.equipe_a_nome ? 3 : 0;
      const golsB = timeVencedorNome === jogo.equipe_b_nome ? 3 : 0;
      const timePerdedor = timeVencedorNome === jogo.equipe_a_nome ? jogo.equipe_b_nome : jogo.equipe_a_nome;

      // 1. Update Game
      const { error: wErr } = await supabase.from('jogos').update({
        gols_a: golsA,
        gols_b: golsB,
        status: 'W.O'
      }).eq('id', jogo.id);

      if (wErr) throw wErr;

      // 2. Multa Financeiro
      await supabase.from('financeiro').insert([{
        descricao: `Multa por W.O - Equipe: ${timePerdedor} (${jogo.campeonato_nome})`,
        equipe: timePerdedor,
        vencimento: new Date(jogo.data).toLocaleDateString('pt-BR'),
        valor: 200,
        status: 'Pendente',
        tipo: 'receita'
      }]);

      toast.success(`W.O aplicado. Multa de R$200 enviada ao financeiro da equipe ${timePerdedor}.`);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao aplicar W.O.');
    }
  };

  const gerarSumulaPDF = async (jogo: any) => {
    try {
       // Buscar eventos mais atualizados do banco
       const { data: eventos } = await supabase.from('eventos_jogo').select('*').eq('jogo_id', jogo.id);
       
       const printWindow = window.open('', '_blank');
       if (!printWindow) return;

       let eventosHtml = '<p style="color: #6B7280; font-size: 14px; font-style: italic;">Nenhum evento registrado nesta partida.</p>';
       
       if (eventos && eventos.length > 0) {
         const linhas = eventos.sort((a: any, b: any) => a.tempo.localeCompare(b.tempo)).map((ev: any) => {
           let tipoFormated = ev.tipo === 'Gol' ? '⚽ GOL' : ev.tipo === 'Amarelo' ? '🟨 Amarelo' : '🟥 Vermelho';
           return '<tr><td><strong>' + ev.tempo + '</strong></td><td>' + ev.equipe + '</td><td>' + ev.jogador + '</td><td>' + tipoFormated + '</td></tr>';
         }).join('');
         
         eventosHtml = `
            <table>
              <thead>
                <tr>
                  <th style="width: 15%;">Tempo</th>
                  <th style="width: 25%;">Equipe</th>
                  <th style="width: 40%;">Jogador</th>
                  <th style="width: 20%;">Evento</th>
                </tr>
              </thead>
              <tbody>
                ${linhas}
              </tbody>
            </table>
         `;
       }

       const htmlContent = `
        <html>
          <head>
            <title>Súmula - ${jogo.equipe_a_nome} x ${jogo.equipe_b_nome}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; color: #111827; }
              .header { text-align: center; border-bottom: 2px solid #111827; padding-bottom: 20px; margin-bottom: 30px; }
              .title { font-size: 24px; font-weight: bold; text-transform: uppercase; }
              .subtitle { font-size: 14px; color: #4B5563; margin-top: 5px; }
              .scoreboard { display: flex; justify-content: center; align-items: center; margin-bottom: 40px; background: #F3F4F6; padding: 20px; border-radius: 12px; }
              .team { width: 40%; text-align: center; font-size: 20px; font-weight: bold; }
              .score { width: 20%; text-align: center; font-size: 36px; font-weight: 900; }
              .section-title { font-size: 16px; font-weight: bold; border-bottom: 1px solid #E5E7EB; padding-bottom: 8px; margin-top: 30px; margin-bottom: 15px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              th, td { border: 1px solid #E5E7EB; padding: 10px; text-align: left; font-size: 14px; }
              th { background-color: #F9FAFB; }
              .signatures { display: flex; justify-content: space-around; margin-top: 80px; }
              .signature-box { text-align: center; width: 30%; }
              .signature-line { border-top: 1px solid #111827; margin-bottom: 8px; width: 200px; margin-left: auto; margin-right: auto;}
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">SÚMULA OFICIAL DE PARTIDA</div>
              <div class="subtitle">${jogo.campeonato_nome} - ${jogo.rodada}</div>
              <div class="subtitle">Data: ${new Date(jogo.data).toLocaleDateString('pt-BR')} às ${jogo.hora} | Local: ${jogo.quadra}</div>
            </div>

            <div class="scoreboard">
              <div class="team">${jogo.equipe_a_nome}</div>
              <div class="score">${jogo.gols_a} x ${jogo.gols_b}</div>
              <div class="team">${jogo.equipe_b_nome}</div>
            </div>

            <div class="section-title">CRONOLOGIA DE EVENTOS (LANCE-A-LANCE)</div>
            ${eventosHtml}

            <div class="signatures">
              <div class="signature-box">
                <div class="signature-line"></div>
                <div style="font-size: 14px; font-weight: bold;">Árbitro Principal</div>
              </div>
              <div class="signature-box">
                <div class="signature-line"></div>
                <div style="font-size: 14px; font-weight: bold;">Capitão - ${jogo.equipe_a_nome}</div>
              </div>
              <div class="signature-box">
                <div class="signature-line"></div>
                <div style="font-size: 14px; font-weight: bold;">Capitão - ${jogo.equipe_b_nome}</div>
              </div>
            </div>

            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  window.close();
                }, 500);
              }
            </script>
          </body>
        </html>
       `;
       printWindow.document.write(htmlContent);
       printWindow.document.close();

    } catch(err) {
      toast.error('Erro ao gerar súmula.');
      console.error(err);
    }
  };

  const jogosFiltrados = filtroCamp 
    ? jogos.filter(j => j.campeonato_nome === filtroCamp)
    : jogos;

  // Elencos disponiveis current equipe na sumula
  const elencoNovoEvento = atletas.filter(a => a.equipe_nome === novoEvento.equipe);

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

      {loading ? (
        <div className="text-center p-12 bg-white rounded-xl border border-slate-200">
           <p className="text-slate-500 font-medium">Carregando jogos da nuvem...</p>
        </div>
      ) : (
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
                  <span className="flex items-center gap-2"><Trophy className="h-4 w-4 text-amber-500"/> {jogo.rodada} • {jogo.campeonato_nome}</span>
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
                      <h3 className="font-bold text-slate-900 text-lg sm:text-xl truncate" title={jogo.equipe_a_nome}>{jogo.equipe_a_nome}</h3>
                    </div>
                    <div className="px-4 text-center">
                      <div className="text-3xl font-black text-slate-900 tracking-tighter bg-slate-100 px-4 py-2 rounded-lg">
                        {jogo.gols_a} <span className="text-slate-300 mx-1">x</span> {jogo.gols_b}
                      </div>
                    </div>
                    <div className="text-center flex-1">
                      <h3 className="font-bold text-slate-900 text-lg sm:text-xl truncate" title={jogo.equipe_b_nome}>{jogo.equipe_b_nome}</h3>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-center text-xs text-slate-500 bg-slate-50 rounded-md py-2 border border-slate-100">
                    <span className="flex items-center gap-1 mx-2"><CalendarIcon className="h-3 w-3" /> {new Date(jogo.data).toLocaleDateString('pt-BR')} • {jogo.hora}</span>
                    <span className="flex items-center gap-1 mx-2"><LocationIcon className="h-3 w-3" /> {jogo.quadra}</span>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 flex gap-2 border-t border-slate-100">
                  {jogo.status === 'Agendado' && (
                    <>
                      <button onClick={() => abrirSumula(jogo)} className="flex-1 flex justify-center items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500 shadow-sm">
                        <PlayCircle className="h-4 w-4" /> Preencher Súmula
                      </button>
                      <button onClick={() => aplicarWO(jogo, jogo.equipe_a_nome)} className="px-3 py-2 text-sm font-semibold text-rose-700 bg-rose-100 rounded-md hover:bg-rose-200">W.O {jogo.equipe_a_nome}</button>
                      <button onClick={() => aplicarWO(jogo, jogo.equipe_b_nome)} className="px-3 py-2 text-sm font-semibold text-rose-700 bg-rose-100 rounded-md hover:bg-rose-200">W.O {jogo.equipe_b_nome}</button>
                      <button onClick={() => excluirJogo(jogo)} className="px-3 py-2 text-sm font-semibold text-rose-700 bg-rose-100 rounded-md hover:bg-rose-200 flex items-center gap-1" title="Excluir Jogo">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  {jogo.status === 'Encerrado' && (
                    <button onClick={() => abrirSumula(jogo)} className="flex-1 flex justify-center items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 shadow-sm">
                      <Pencil className="h-4 w-4" /> Editar Súmula
                    </button>
                  )}
                  {jogo.status !== 'Agendado' && (
                    <>
                      <button onClick={() => gerarSumulaPDF(jogo)} className="flex-1 flex justify-center items-center gap-2 rounded-md bg-white border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm">
                        <FileText className="h-4 w-4" /> Visualizar Súmula (PDF)
                      </button>
                      <button onClick={() => abrirEditarJogo(jogo)} className="px-3 py-2 text-sm font-semibold text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 flex items-center gap-1">
                        <Pencil className="h-4 w-4" /> Editar
                      </button>
                      <button onClick={() => excluirJogo(jogo)} className="px-3 py-2 text-sm font-semibold text-rose-700 bg-rose-100 rounded-md hover:bg-rose-200 flex items-center gap-1">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <Modal isOpen={isFormModalOpen} onClose={() => setFormModalOpen(false)} title="Agendar Partida Futsal">
        <form onSubmit={handleSalvarJogo} className="space-y-4">
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 text-sm text-amber-800 flex items-start gap-2 mb-4">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <p><strong>Atenção:</strong> Vínculos automáticos exigem que as equipes já estejam cadastradas num campeonato ativo.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Campeonato</label>
            <select required value={formData.campeonato_nome} onChange={e => setFormData({...formData, campeonato_nome: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm">
              <option value="">Selecione...</option>
              {campeonatos.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Time Mandante</label>
              <select required value={formData.equipe_a_nome} onChange={e => setFormData({...formData, equipe_a_nome: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm">
                <option value="">Selecione...</option>
                {equipesFiltradasCamp.map(e => <option key={e.id} value={e.nome}>{e.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Time Visitante</label>
              <select required value={formData.equipe_b_nome} onChange={e => setFormData({...formData, equipe_b_nome: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm">
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

      {/* EDITAR JOGO MODAL */}
      <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} title="Editar Jogo">
        <form onSubmit={salvarEdicaoJogo} className="space-y-4">
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 text-sm text-amber-800 flex items-start gap-2">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <p>Edite os dados do jogo. Os times não podem ser alterados após a súmula ser preenchida.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Data</label>
              <input required type="date" value={editData.data} onChange={e => setEditData({...editData, data: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Hora</label>
              <input required type="time" value={editData.hora} onChange={e => setEditData({...editData, hora: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Rodada / Fase</label>
              <input required type="text" value={editData.rodada} onChange={e => setEditData({...editData, rodada: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Quadra (Local)</label>
              <input required type="text" value={editData.quadra} onChange={e => setEditData({...editData, quadra: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Time Mandante</label>
              <input disabled value={editData.equipe_a_nome} className="mt-1 block w-full rounded-md border-slate-300 bg-slate-100 py-2 px-3 border shadow-sm text-slate-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Time Visitante</label>
              <input disabled value={editData.equipe_b_nome} className="mt-1 block w-full rounded-md border-slate-300 bg-slate-100 py-2 px-3 border shadow-sm text-slate-500" />
            </div>
          </div>
          <div className="pt-4 flex justify-between border-t border-slate-100">
            <button type="button" onClick={() => { setEditModalOpen(false); excluirJogo(jogoEditando); }} className="rounded-md bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 ring-1 ring-inset ring-rose-200 hover:bg-rose-100 flex items-center gap-1">
              <Trash2 className="h-4 w-4" /> Excluir Jogo
            </button>
            <div className="flex gap-3">
              <button type="button" onClick={() => setEditModalOpen(false)} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300">Cancelar</button>
              <button type="submit" className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">Salvar Alterações</button>
            </div>
          </div>
        </form>
      </Modal>

      {/* SÚMULA MODAL */}
      <Modal isOpen={isSumulaModalOpen} onClose={() => setSumulaModalOpen(false)} title={`Súmula: ${jogoSumula?.equipe_a_nome} x ${jogoSumula?.equipe_b_nome}`}>
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500"></div>
            <div className="flex justify-between items-center text-white">
              <div className="text-center w-1/3">
                <span className="block text-sm text-slate-400 mb-1 lg:text-lg uppercase select-none">{jogoSumula?.equipe_a_nome}</span>
                <span className="text-5xl font-black">{sumulaPlacarA}</span>
              </div>
              <div className="text-center w-1/3 text-slate-500 text-2xl font-black font-mono">X</div>
              <div className="text-center w-1/3">
                <span className="block text-sm text-slate-400 mb-1 lg:text-lg uppercase select-none">{jogoSumula?.equipe_b_nome}</span>
                <span className="text-5xl font-black">{sumulaPlacarB}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border text-sm border-slate-200 rounded-xl p-4 shadow-sm">
            <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Clock className="h-4 w-4 text-emerald-600"/> Lançar Evento Lance-a-Lance</h4>
            <div className="flex flex-col sm:flex-row gap-2 items-end">
              <div className="w-full sm:w-1/4">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Equipe</label>
                <select value={novoEvento.equipe} onChange={e => setNovoEvento({...novoEvento, equipe: e.target.value, jogador: ''})} className="block w-full rounded-md border-slate-300 py-1.5 px-2 border shadow-sm">
                  <option value={jogoSumula?.equipe_a_nome}>{jogoSumula?.equipe_a_nome}</option>
                  <option value={jogoSumula?.equipe_b_nome}>{jogoSumula?.equipe_b_nome}</option>
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
            {eventosSumula.length === 0 ? <p className="text-xs text-slate-400 italic">Nenhum evento registrado no Supabase.</p> : (
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
            <button onClick={() => setSumulaModalOpen(false)} className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-700 border hover:bg-slate-50">Fechar</button>
            {jogoSumula?.status === 'Encerrado' ? (
              <button onClick={salvarSumula} className="flex items-center gap-2 rounded-md bg-blue-600 px-6 py-2 text-sm font-bold text-white hover:bg-blue-500 shadow-md">
                <CheckCircle className="h-5 w-5" /> SALVAR ALTERAÇÕES
              </button>
            ) : (
              <button onClick={encerrarSumula} className="flex items-center gap-2 rounded-md bg-emerald-600 px-6 py-2 text-sm font-bold text-white hover:bg-emerald-500 shadow-md">
                <CheckCircle className="h-5 w-5" /> ASSINAR E ENCERRAR SÚMULA
              </button>
            )}
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
