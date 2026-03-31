import React, { useState, useEffect } from 'react';
import { Plus, Search, Trophy, Users, User, Info, ChevronDown, ChevronUp, Award, Image as ImageIcon, Trash2, Crown, Medal, Star } from 'lucide-react';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

export default function Campeonatos() {
  const [campeonatos, setCampeonatos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  // Modals
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isDetalhesModalOpen, setDetalhesModalOpen] = useState(false);
  
  const [campeonatoSelecionado, setCampeonatoSelecionado] = useState<any>(null);
  const [equipesCampeonato, setEquipesCampeonato] = useState<any[]>([]);
  const [atletasCampeonato, setAtletasCampeonato] = useState<any[]>([]);
  const [jogosCampeonato, setJogosCampeonato] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    nome: '',
    categoria: 'Adulto',
    edicao: new Date().getFullYear().toString(),
    periodo: '',
    taxaInscricao: 500,
    status: 'Ativo',
    equipesSelecionadas: [] as string[]
  });

  const [historicoTab, setHistoricoTab] = useState<'geral' | 'elencos' | 'galeria' | 'proclamar'>('geral');
  const [proclamando, setProclamando] = useState<string | null>(null);
  const [expandedEquipes, setExpandedEquipes] = useState<string[]>([]);
  const [equipesDisponiveis, setEquipesDisponiveis] = useState<any[]>([]);
  const [galeriaFotos, setGaleriaFotos] = useState<any[]>([]);
  const [loadingGaleria, setLoadingGaleria] = useState(false);
  const [selectedChampionship, setSelectedChampionship] = useState<any>(null);
  const [novaFoto, setNovaFoto] = useState({ titulo: '', url: '' });

  useEffect(() => {
    fetchCampeonatos();
    fetchEquipesDisponiveis();

    const channel = supabase
      .channel('campeonatos_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campeonatos' }, () => {
        fetchCampeonatos();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchEquipesDisponiveis = async () => {
    const { data } = await supabase.from('equipes').select('*').order('nome');
    if (data) setEquipesDisponiveis(data);
  };

  const fetchCampeonatos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('campeonatos').select('*').order('criado_em', { ascending: false });
      if (error) throw error;
      setCampeonatos(data || []);
    } catch (error) {
      console.error('Erro ao buscar campeonatos:', error);
      toast.error('Erro ao carregar campeonatos');
    } finally {
      setLoading(false);
    }
  };

  const toggleEquipe = (id: string) => {
    setExpandedEquipes(prev => 
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const filteredItems = campeonatos.filter((c: any) => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.edicao.includes(searchTerm)
  );

  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const currentItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: novoCamp, error } = await supabase.from('campeonatos').insert([{
        nome: formData.nome,
        categoria: formData.categoria,
        edicao: formData.edicao,
        periodo: formData.periodo,
        taxa_inscricao: formData.taxaInscricao,
        status: formData.status
      }]).select().single();
      if (error) throw error;

      if (novoCamp && formData.equipesSelecionadas.length > 0) {
        await supabase.from('equipes')
          .update({ campeonato_id: novoCamp.id, campeonato_nome: novoCamp.nome })
          .in('id', formData.equipesSelecionadas);
      }

      toast.success('Campeonato criado com sucesso!');
      setFormModalOpen(false);
      resetForm();
      fetchCampeonatos();
      fetchEquipesDisponiveis();
    } catch (error) {
      console.error('Erro ao salvar campeonato', error);
      toast.error('Erro ao salvar campeonato.');
    }
  };

  const handleEditar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('campeonatos').update({
        nome: formData.nome,
        categoria: formData.categoria,
        edicao: formData.edicao,
        periodo: formData.periodo,
        taxa_inscricao: formData.taxaInscricao,
        status: formData.status
      }).eq('id', campeonatoSelecionado.id);
      if (error) throw error;

      await supabase.from('equipes')
        .update({ campeonato_id: null, campeonato_nome: null })
        .eq('campeonato_id', campeonatoSelecionado.id);
        
      if (formData.equipesSelecionadas.length > 0) {
        await supabase.from('equipes')
          .update({ campeonato_id: campeonatoSelecionado.id, campeonato_nome: formData.nome })
          .in('id', formData.equipesSelecionadas);
      }

      toast.success('Campeonato atualizado com sucesso!');
      setEditModalOpen(false);
      resetForm();
      fetchCampeonatos();
      fetchEquipesDisponiveis();
    } catch (error) {
      console.error('Erro ao atualizar campeonato', error);
      toast.error('Erro ao editar campeonato.');
    }
  };

  const excluirCampeonato = async () => {
    if (confirm('Tem certeza que deseja excluir este campeonato?')) {
      try {
        const { error } = await supabase.from('campeonatos').delete().eq('id', campeonatoSelecionado.id);
        if (error) throw error;
        toast.success('Campeonato excluído!');
        setEditModalOpen(false);
        resetForm();
        fetchCampeonatos();
      } catch (error) {
        console.error('Erro ao excluir', error);
        toast.error('Erro ao excluir campeonato.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      categoria: 'Adulto',
      edicao: new Date().getFullYear().toString(),
      periodo: '',
      taxaInscricao: 500,
      status: 'Ativo',
      equipesSelecionadas: []
    });
    setCampeonatoSelecionado(null);
  };

  const abrirEditar = async (campeonato: any) => {
    setCampeonatoSelecionado(campeonato);
    setFormData({
      nome: campeonato.nome,
      categoria: campeonato.categoria,
      edicao: campeonato.edicao,
      periodo: campeonato.periodo,
      taxaInscricao: campeonato.taxa_inscricao || 500,
      status: campeonato.status,
      equipesSelecionadas: []
    });
    setEditModalOpen(true);
    
    const { data: eqs } = await supabase.from('equipes').select('id').eq('campeonato_id', campeonato.id);
    if (eqs) {
      setFormData(prev => ({ ...prev, equipesSelecionadas: eqs.map(e => e.id) }));
    }
  };

  const abrirDetalhes = async (champ: any) => {
    setCampeonatoSelecionado(champ);
    setSelectedChampionship(champ);
    setHistoricoTab('geral');
    setExpandedEquipes([]);
    
    try {
      const { data: eq } = await supabase.from('equipes').select('*').eq('championship_id', champ.id);
      setEquipesCampeonato(eq || []);
      
      const eqNames = (eq || []).map(e => e.nome);
      const { data: at } = await supabase.from('atletas').select('*').in('equipe_nome', eqNames.length ? eqNames : ['_NONE_']);
      setAtletasCampeonato(at || []);

      const { data: jg } = await supabase.from('jogos').select('*').eq('championship_id', champ.id);
      setJogosCampeonato((jg || []).filter(j => j.status === 'Encerrado' || j.status === 'W.O'));
      
      setDetalhesModalOpen(true);
    } catch(err) {
      toast.error('Erro ao buscar dados do histórico');
    }
  };

  const proclamarCampeao = async (equipeNome: string, posicao: string) => {
    if (!campeonatoSelecionado) return;
    const key = `${equipeNome}-${posicao}`;
    setProclamando(key);
    try {
      const { data: existing } = await supabase
        .from('campeoes')
        .select('id')
        .eq('equipe', equipeNome)
        .eq('ano', parseInt(campeonatoSelecionado.edicao))
        .eq('posicao', posicao)
        .maybeSingle();

      if (existing) {
        toast('Já proclamado! Acesse o Hall of Fame para adicionar a foto.', { icon: 'ℹ️' });
        return;
      }

      const { error } = await supabase.from('campeoes').insert([{
        nome: equipeNome,
        equipe: equipeNome,
        categoria: campeonatoSelecionado.categoria,
        ano: parseInt(campeonatoSelecionado.edicao),
        posicao,
        foto_url: null,
      }]);
      if (error) throw error;
      toast.success(`${posicao} proclamado no Hall of Fame! ✅`);
    } catch (err: any) {
      toast.error('Erro ao proclamar: ' + err.message);
    } finally {
      setProclamando(null);
    }
  };

  const fetchGaleria = async () => {
    if (!selectedChampionship) return;
    setLoadingGaleria(true);
    try {
      const { data, error } = await supabase
        .from('galeria_campeoes')
        .select('*')
        .eq('championship_id', selectedChampionship.id)
        .order('criado_em', { ascending: false });
      if (error) throw error;
      setGaleriaFotos(data || []);
    } catch (err) {
      console.error('Erro ao buscar galeria:', err);
    } finally {
      setLoadingGaleria(false);
    }
  };

  const handleSalvarFoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChampionship) return;
    try {
      const { error } = await supabase.from('galeria_campeoes').insert([{
        championship_id: selectedChampionship.id,
        titulo: novaFoto.titulo,
        url: novaFoto.url
      }]);
      if (error) throw error;
      toast.success('Foto adicionada com sucesso!');
      setNovaFoto({ titulo: '', url: '' });
      fetchGaleria();
    } catch (err) {
      console.error('Erro ao salvar foto:', err);
      toast.error('Erro ao adicionar foto.');
    }
  };

  const handleExcluirFoto = async (id: string) => {
    if (!confirm('Deseja excluir esta foto?')) return;
    try {
      const { error } = await supabase.from('galeria_campeoes').delete().eq('id', id);
      if (error) throw error;
      toast.success('Foto excluída!');
      fetchGaleria();
    } catch (err) {
      console.error('Erro ao excluir foto:', err);
      toast.error('Erro ao excluir foto.');
    }
  };

  const handleTabChange = (tab: 'geral' | 'elencos' | 'galeria' | 'proclamar') => {
    setHistoricoTab(tab);
    if (tab === 'galeria') {
      fetchGaleria();
    }
  };

  const getClassificacao = () => {
    const stats: Record<string, any> = {};
    equipesCampeonato.forEach(eq => stats[eq.nome] = { nome: eq.nome, P: 0, J: 0, V: 0, E: 0, D: 0, GP: 0, GC: 0, SG: 0 });
    jogosCampeonato.forEach(jogo => {
      const gA = jogo.gols_a || 0; const gB = jogo.gols_b || 0;
      if(stats[jogo.equipe_a_nome]) {
        stats[jogo.equipe_a_nome].J++; stats[jogo.equipe_a_nome].GP += gA; stats[jogo.equipe_a_nome].GC += gB;
        if(gA > gB) { stats[jogo.equipe_a_nome].V++; stats[jogo.equipe_a_nome].P += 3; }
        else if(gA === gB) { stats[jogo.equipe_a_nome].E++; stats[jogo.equipe_a_nome].P += 1; }
        else { stats[jogo.equipe_a_nome].D++; }
        stats[jogo.equipe_a_nome].SG = stats[jogo.equipe_a_nome].GP - stats[jogo.equipe_a_nome].GC;
      }
      if(stats[jogo.equipe_b_nome]) {
        stats[jogo.equipe_b_nome].J++; stats[jogo.equipe_b_nome].GP += gB; stats[jogo.equipe_b_nome].GC += gA;
        if(gB > gA) { stats[jogo.equipe_b_nome].V++; stats[jogo.equipe_b_nome].P += 3; }
        else if(gB === gA) { stats[jogo.equipe_b_nome].E++; stats[jogo.equipe_b_nome].P += 1; }
        else { stats[jogo.equipe_b_nome].D++; }
        stats[jogo.equipe_b_nome].SG = stats[jogo.equipe_b_nome].GP - stats[jogo.equipe_b_nome].GC;
      }
    });
    return Object.values(stats).sort((a: any, b: any) => {
      if(b.P !== a.P) return b.P - a.P;
      if(b.V !== a.V) return b.V - a.V;
      if(b.SG !== a.SG) return b.SG - a.SG;
      return b.GP - a.GP;
    });
  };
  
  const tabelaClassificacao = getClassificacao();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Módulo: Campeonatos</h1>
          <p className="text-sm text-slate-500 mt-1">Gerencie os campeonatos da liga integrados à nuvem.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setFormModalOpen(true); }}
          className="inline-flex w-full sm:w-auto items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          Novo Campeonato
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:flex-1 sm:max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
            placeholder="Buscar campeonatos..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden min-h-[60vh]">
        {loading ? (
           <div className="text-center p-12"><p className="text-slate-500">Carregando campeonatos...</p></div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center p-12">
            <p className="text-slate-500">Nenhum campeonato encontrado.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6">Nome</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Categoria</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Ano</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Período</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Status</th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {currentItems.map((campeonato: any) => (
                <tr key={campeonato.id} className="hover:bg-slate-50 transition-colors">
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-6">{campeonato.nome}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{campeonato.categoria}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500 font-medium">{campeonato.edicao}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{campeonato.periodo}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                      campeonato.status === 'Ativo' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-slate-50 text-slate-600 ring-slate-500/10'
                    }`}>
                      {campeonato.status}
                    </span>
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => abrirDetalhes(campeonato)} className="inline-flex items-center text-emerald-600 hover:text-emerald-900 bg-emerald-50 px-2.5 py-1.5 rounded-md border border-emerald-200 hover:bg-emerald-100">
                        <Info className="h-4 w-4 mr-1" /> Histórico
                      </button>
                      <button onClick={() => abrirEditar(campeonato)} className="text-blue-600 hover:text-blue-900 bg-white px-2.5 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50">
                        Editar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={totalItems} itemsPerPage={itemsPerPage} />}
      </div>

      <Modal isOpen={isFormModalOpen} onClose={() => setFormModalOpen(false)} title="Cadastrar Novo Campeonato">
        <form onSubmit={handleSalvar} className="space-y-4">
          <div><label className="block text-sm font-medium text-slate-700">Nome</label><input required type="text" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-slate-700">Categoria</label><select value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm"><option>Adulto</option><option>Aspirante</option><option>Sub-20</option><option>Veterano</option><option>Feminino</option></select></div>
            <div><label className="block text-sm font-medium text-slate-700">Edição (Ano)</label><input required type="text" value={formData.edicao} onChange={e => setFormData({...formData, edicao: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm" /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-slate-700">Período</label><input required type="text" value={formData.periodo} onChange={e => setFormData({...formData, periodo: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm" /></div>
            <div><label className="block text-sm font-bold text-blue-700">Taxa (R$)</label><input required type="number" value={formData.taxaInscricao} onChange={e => setFormData({...formData, taxaInscricao: Number(e.target.value)})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm bg-blue-50" /></div>
            <div><label className="block text-sm font-medium text-slate-700">Status</label><select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm"><option>Ativo</option><option>Em Breve</option><option>Encerrado</option></select></div>
          </div>
          <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 mt-6">
            <button type="button" onClick={() => setFormModalOpen(false)} className="rounded-md bg-white px-3 py-2 text-sm font-semibold border hover:bg-slate-50">Cancelar</button>
            <button type="submit" className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500">Salvar</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} title="Editar Campeonato">
        <form onSubmit={handleEditar} className="space-y-4">
           <div><label className="block text-sm font-medium text-slate-700">Nome</label><input required type="text" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-slate-700">Categoria</label><select value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm"><option>Adulto</option><option>Aspirante</option><option>Sub-20</option><option>Veterano</option><option>Feminino</option></select></div>
            <div><label className="block text-sm font-medium text-slate-700">Edição (Ano)</label><input required type="text" value={formData.edicao} onChange={e => setFormData({...formData, edicao: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm" /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-slate-700">Período</label><input required type="text" value={formData.periodo} onChange={e => setFormData({...formData, periodo: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm" /></div>
            <div><label className="block text-sm font-bold text-blue-700">Taxa (R$)</label><input required type="number" value={formData.taxaInscricao} onChange={e => setFormData({...formData, taxaInscricao: Number(e.target.value)})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm bg-blue-50" /></div>
            <div><label className="block text-sm font-medium text-slate-700">Status</label><select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm"><option>Ativo</option><option>Em Breve</option><option>Encerrado</option></select></div>
          </div>
          <div className="pt-4 flex justify-between items-center border-t border-slate-100 mt-6">
            <button type="button" onClick={excluirCampeonato} className="rounded-md bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-100">Excluir</button>
            <div className="flex space-x-3">
              <button type="button" onClick={() => setEditModalOpen(false)} className="rounded-md bg-white border border-slate-300 px-3 py-2 text-sm">Cancelar</button>
              <button type="submit" className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500">Atualizar</button>
            </div>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDetalhesModalOpen} onClose={() => setDetalhesModalOpen(false)} title={`Histórico: ${campeonatoSelecionado?.nome}`} maxWidth="max-w-5xl">
        <div className="space-y-6 flex flex-col h-full">
          <div className="flex border-b border-slate-200 overflow-x-auto">
            <button type="button" className={`px-4 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${historicoTab === 'geral' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`} onClick={() => handleTabChange('geral')}>Visão Geral & Tabela</button>
            <button type="button" className={`px-4 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${historicoTab === 'elencos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`} onClick={() => handleTabChange('elencos')}>Elencos Oficiais</button>
            <button type="button" className={`px-4 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap flex items-center gap-1.5 ${historicoTab === 'galeria' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`} onClick={() => handleTabChange('galeria')}><ImageIcon className="h-4 w-4" /> Galeria</button>
            <button type="button" className={`px-4 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap flex items-center gap-1.5 ${historicoTab === 'proclamar' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500'}`} onClick={() => handleTabChange('proclamar')}><Crown className="w-4 h-4" /> Proclamar Campeões</button>
          </div>

          <div className="overflow-y-auto pr-2 custom-scrollbar min-h-[300px]">
            {historicoTab === 'geral' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center">
                    <div className="rounded-full bg-blue-100 p-3 mr-4"><Trophy className="h-6 w-6 text-blue-600" /></div>
                    <div><p className="text-sm font-medium text-blue-900">Equipes INSCRITAS</p><p className="text-2xl font-bold text-blue-700">{equipesCampeonato.length}</p></div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center">
                    <div className="rounded-full bg-emerald-100 p-3 mr-4"><Users className="h-6 w-6 text-emerald-600" /></div>
                    <div><p className="text-sm font-medium text-emerald-900">Atletas Mapeados</p><p className="text-2xl font-bold text-emerald-700">{atletasCampeonato.length}</p></div>
                  </div>
                </div>
                {equipesCampeonato.length > 0 && (
                  <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                    <div className="bg-slate-900 px-4 py-3 flex justify-between items-center text-white">
                      <h3 className="font-bold flex items-center gap-2 font-sm"><Trophy className="h-4 w-4 text-emerald-400"/> Tabela de Classificação</h3>
                    </div>
                    <div className="overflow-x-auto bg-white">
                      <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-2 text-left font-semibold text-slate-500">POS</th><th className="px-4 py-2 text-left font-semibold text-slate-500">EQUIPE</th>
                            <th className="px-4 py-2 text-center font-bold text-slate-900 bg-slate-100">P</th><th className="px-4 py-2 text-center font-semibold text-slate-500">J</th>
                            <th className="px-4 py-2 text-center font-semibold text-slate-500">V</th><th className="px-4 py-2 text-center font-semibold text-slate-500">E</th>
                            <th className="px-4 py-2 text-center font-semibold text-slate-500">D</th><th className="px-4 py-2 text-center font-semibold text-slate-500">SG</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {tabelaClassificacao.map((row: any, i) => (
                            <tr key={row.nome} className={i < 4 ? "bg-emerald-50/30" : ""}>
                              <td className="px-4 py-2 font-bold text-slate-700">{i + 1}º</td><td className="px-4 py-2 font-bold text-slate-800">{row.nome}</td>
                              <td className="px-4 py-2 text-center font-black bg-slate-50">{row.P}</td><td className="px-4 py-2 text-center text-slate-600">{row.J}</td>
                              <td className="px-4 py-2 text-center text-slate-600">{row.V}</td><td className="px-4 py-2 text-center text-slate-600">{row.E}</td>
                              <td className="px-4 py-2 text-center text-slate-600">{row.D}</td><td className="px-4 py-2 text-center text-slate-600">{row.SG}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {historicoTab === 'elencos' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-2"><Users className="h-5 w-5 text-slate-400" /> Elencos Oficiais</h3>
                {equipesCampeonato.map((equipe: any) => {
                    const jogadores = atletasCampeonato.filter((a: any) => a.equipe_id === equipe.id || a.equipe_nome === equipe.nome);
                    const isExpanded = expandedEquipes.includes(equipe.id);
                    return (
                      <div key={equipe.id} className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                        <button type="button" onClick={() => toggleEquipe(equipe.id)} className={`w-full px-4 py-3 flex justify-between items-center text-left ${isExpanded ? 'bg-blue-50 border-b border-blue-100' : 'bg-white hover:bg-slate-50'}`}>
                          <div className="flex items-center gap-3"><div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center"><Users className="h-4 w-4" /></div><h4 className="font-bold">{equipe.nome}</h4></div>
                          <div className="flex items-center gap-3"><span className="text-xs font-semibold px-3 py-1 rounded-full border bg-white">{jogadores.length} atletas</span>{isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}</div>
                        </button>
                        {isExpanded && (
                          <div className="p-4 bg-slate-50 border-t border-slate-100">
                            {jogadores.length === 0 ? <p className="text-sm text-slate-400 italic text-center py-6">Nenhum atleta cadastrado.</p> : (
                              <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {jogadores.map((jogador: any) => (
                                  <li key={jogador.id} className="flex items-start gap-2 text-sm text-slate-700 bg-white p-2.5 rounded-md border border-slate-200">
                                    <User className="h-4 w-4 text-slate-400 mt-0.5" /><span className="font-semibold">{jogador.nome}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </div>
                    );
                })}
              </div>
            )}

            {historicoTab === 'proclamar' && (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2 text-sm text-amber-800">
                  <Crown className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Baseado na classificação atual. Envie os vencedores ao Hall of Fame.</span>
                </div>
                {tabelaClassificacao.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">Nenhum jogo encerrado.</p>
                ) : (
                  <div className="space-y-3">
                    {[
                      { posicao: 'Campeão', icon: <Crown className="w-5 h-5 text-amber-500" />, bg: 'bg-amber-50 border-amber-200', idx: 0 },
                      { posicao: 'Vice-Campeão', icon: <Medal className="w-5 h-5 text-slate-400" />, bg: 'bg-slate-50 border-slate-200', idx: 1 },
                      { posicao: '3º Lugar', icon: <Star className="w-5 h-5 text-orange-400" />, bg: 'bg-orange-50 border-orange-200', idx: 2 },
                    ].map(({ posicao, icon, bg, idx }) => {
                      const equipe = tabelaClassificacao[idx];
                      if (!equipe) return null;
                      const isLoading = proclamando === `${equipe.nome}-${posicao}`;
                      return (
                        <div key={posicao} className={`flex items-center justify-between rounded-xl border p-4 ${bg}`}>
                          <div className="flex items-center gap-3">
                            {icon}
                            <div>
                              <p className="font-bold text-slate-900 text-sm">{equipe.nome}</p>
                              <p className="text-xs text-slate-500">{posicao} · {equipe.P} pts</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => proclamarCampeao(equipe.nome, posicao)}
                            className="inline-flex items-center gap-1.5 rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-60"
                          >
                            {isLoading ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Crown className="w-3 h-3" />}
                            Proclamar
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {historicoTab === 'galeria' && (
              <div className="space-y-4">
                <form onSubmit={handleSalvarFoto} className="flex flex-col sm:flex-row gap-2 bg-slate-50 p-3 rounded-lg border">
                  <div className="flex-1">
                    <input required type="text" value={novaFoto.titulo} onChange={(e) => setNovaFoto({...novaFoto, titulo: e.target.value})} className="block w-full rounded-md border-slate-300 py-1.5 px-3 border text-sm" placeholder="Título da Foto" />
                  </div>
                  <div className="flex-1">
                    <input required type="url" value={novaFoto.url} onChange={(e) => setNovaFoto({...novaFoto, url: e.target.value})} className="block w-full rounded-md border-slate-300 py-1.5 px-3 border text-sm" placeholder="URL da Imagem" />
                  </div>
                  <button type="submit" className="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 text-sm font-medium">Adicionar</button>
                </form>
                
                {loadingGaleria ? (
                  <div className="text-center py-8 text-slate-500">Carregando...</div>
                ) : galeriaFotos.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                    <ImageIcon className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">Galeria Vazia</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {galeriaFotos.map((foto: any) => (
                      <div key={foto.id} className="relative group aspect-square rounded-lg overflow-hidden border bg-slate-100">
                        <img src={foto.url} alt={foto.titulo} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button type="button" onClick={() => handleExcluirFoto(foto.id)} className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 p-2"><p className="text-white text-xs truncate">{foto.titulo}</p></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end border-t border-slate-100 mt-auto">
            <button type="button" onClick={() => setDetalhesModalOpen(false)} className="rounded-md bg-white border px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm">Fechar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
