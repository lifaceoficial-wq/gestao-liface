import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Trophy, Users, User, Info, ChevronDown, ChevronUp } from 'lucide-react';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

const INITIAL_MOCK_DATA = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  nome: `Campeonato Municipal ${i + 1}`,
  categoria: i % 2 === 0 ? 'Adulto' : 'Sub-20',
  edicao: `202${i % 6 + 1}`,
  periodo: 'Jan - Jun',
  taxaInscricao: 500,
  status: i % 3 === 0 ? 'Encerrado' : 'Ativo'
}));

export default function Campeonatos() {
  const [campeonatos, setCampeonatos] = useState(() => {
    const saved = localStorage.getItem('@nicolau:campeonatos');
    if (saved) return JSON.parse(saved);
    return [];
  });

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
    status: 'Ativo'
  });

  const [historicoTab, setHistoricoTab] = useState<'geral' | 'elencos'>('geral');
  const [expandedEquipes, setExpandedEquipes] = useState<number[]>([]);

  const toggleEquipe = (id: number) => {
    setExpandedEquipes(prev => 
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    localStorage.setItem('@nicolau:campeonatos', JSON.stringify(campeonatos));
  }, [campeonatos]);

  const filteredItems = campeonatos.filter((c: any) => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.edicao.includes(searchTerm)
  );

  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const currentItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    const novo = {
      id: Date.now(),
      ...formData
    };
    setCampeonatos([novo, ...campeonatos]);
    setFormModalOpen(false);
    resetForm();
  };

  const handleEditar = (e: React.FormEvent) => {
    e.preventDefault();
    setCampeonatos(campeonatos.map((c: any) => c.id === campeonatoSelecionado.id ? { ...c, ...formData } : c));
    setEditModalOpen(false);
    resetForm();
  };

  const excluirCampeonato = () => {
    if (confirm('Tem certeza que deseja excluir este campeonato?')) {
      setCampeonatos(campeonatos.filter((c: any) => c.id !== campeonatoSelecionado.id));
      setEditModalOpen(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      categoria: 'Adulto',
      edicao: new Date().getFullYear().toString(),
      periodo: '',
      taxaInscricao: 500,
      status: 'Ativo'
    });
    setCampeonatoSelecionado(null);
  };

  const abrirEditar = (campeonato: any) => {
    setCampeonatoSelecionado(campeonato);
    setFormData({
      nome: campeonato.nome,
      categoria: campeonato.categoria,
      edicao: campeonato.edicao,
      periodo: campeonato.periodo,
      taxaInscricao: campeonato.taxaInscricao || 500,
      status: campeonato.status
    });
    setEditModalOpen(true);
  };

  const abrirDetalhes = (campeonato: any) => {
    setCampeonatoSelecionado(campeonato);
    setHistoricoTab('geral');
    setExpandedEquipes([]);
    
    // Buscar equipes eletas do localStorage pra relacionar
    const eq = JSON.parse(localStorage.getItem('@nicolau:equipes') || '[]');
    const at = JSON.parse(localStorage.getItem('@nicolau:atletas') || '[]');
    
    // Equipes que estão neste campeonato
    const eqscamp = eq.filter((e: any) => e.campeonato === campeonato.nome);
    setEquipesCampeonato(eqscamp);
    
    // Atletas que estão nestas equipes
    const nomesEquipes = eqscamp.map((e: any) => e.nome);
    const atscamp = at.filter((a: any) => nomesEquipes.includes(a.equipe));
    setAtletasCampeonato(atscamp);

    const jg = JSON.parse(localStorage.getItem('@nicolau:jogos') || '[]');
    setJogosCampeonato(jg.filter((j: any) => j.campeonato === campeonato.nome && (j.status === 'Encerrado' || j.status === 'W.O')));

    setDetalhesModalOpen(true);
  };

  const getClassificacao = () => {
    const stats: Record<string, any> = {};
    equipesCampeonato.forEach(eq => stats[eq.nome] = { nome: eq.nome, P: 0, J: 0, V: 0, E: 0, D: 0, GP: 0, GC: 0, SG: 0 });
    jogosCampeonato.forEach(jogo => {
      const gA = jogo.golsA || 0; const gB = jogo.golsB || 0;
      if(stats[jogo.equipeA]) {
        stats[jogo.equipeA].J++; stats[jogo.equipeA].GP += gA; stats[jogo.equipeA].GC += gB;
        if(gA > gB) { stats[jogo.equipeA].V++; stats[jogo.equipeA].P += 3; }
        else if(gA === gB) { stats[jogo.equipeA].E++; stats[jogo.equipeA].P += 1; }
        else { stats[jogo.equipeA].D++; }
        stats[jogo.equipeA].SG = stats[jogo.equipeA].GP - stats[jogo.equipeA].GC;
      }
      if(stats[jogo.equipeB]) {
        stats[jogo.equipeB].J++; stats[jogo.equipeB].GP += gB; stats[jogo.equipeB].GC += gA;
        if(gB > gA) { stats[jogo.equipeB].V++; stats[jogo.equipeB].P += 3; }
        else if(gB === gA) { stats[jogo.equipeB].E++; stats[jogo.equipeB].P += 1; }
        else { stats[jogo.equipeB].D++; }
        stats[jogo.equipeB].SG = stats[jogo.equipeB].GP - stats[jogo.equipeB].GC;
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
          <p className="text-sm text-slate-500 mt-1">Gerencie os campeonatos da liga.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setFormModalOpen(true); }}
          className="inline-flex w-full sm:w-auto items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Novo Campeonato
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:flex-1 sm:max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-slate-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            placeholder="Buscar por nome, categoria ou edição..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <button 
          onClick={() => toast('Filtros avançados (Backend)', { icon: 'ℹ️' })}
          className="inline-flex w-full sm:w-auto justify-center items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
        >
          <Filter className="-ml-0.5 h-5 w-5 text-slate-400" aria-hidden="true" />
          Filtros
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="text-center p-12">
            <p className="text-slate-500">Nenhum campeonato encontrado.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6">Nome do Campeonato</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Categoria</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Ano/Edição</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Período</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Status</th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 whitespace-nowrap text-right">
                  Ações
                </th>
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
                      <button onClick={() => abrirDetalhes(campeonato)} className="inline-flex items-center text-emerald-600 hover:text-emerald-900 bg-emerald-50 px-2.5 py-1.5 rounded-md border border-emerald-200 hover:bg-emerald-100 transition-colors">
                        <Info className="h-4 w-4 mr-1" />
                        Histórico
                      </button>
                      <button onClick={() => abrirEditar(campeonato)} className="inline-flex items-center text-blue-600 hover:text-blue-900 bg-white px-2.5 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 transition-colors">
                        Editar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
          />
        )}
      </div>

      {/* MODAL - NOVO CAMPEONATO */}
      <Modal isOpen={isFormModalOpen} onClose={() => setFormModalOpen(false)} title="Cadastrar Novo Campeonato">
        <form onSubmit={handleSalvar} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Nome</label>
            <input required type="text" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="Ex: Copa da Liga" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Categoria</label>
              <select value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                <option>Adulto</option>
                <option>Aspirante</option>
                <option>Sub-20</option>
                <option>Veterano</option>
                <option>Feminino</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Edição (Ano)</label>
              <input required type="text" value={formData.edicao} onChange={e => setFormData({...formData, edicao: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="Ex: 2025" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Período</label>
              <input required type="text" value={formData.periodo} onChange={e => setFormData({...formData, periodo: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="Ex: Jan - Dez" />
            </div>
            <div>
              <label className="block text-sm font-bold text-blue-700">Taxa Inscrição (R$)</label>
              <input required type="number" value={formData.taxaInscricao} onChange={e => setFormData({...formData, taxaInscricao: Number(e.target.value)})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-blue-50" placeholder="R$" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Status Inicial</label>
              <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                <option>Ativo</option>
                <option>Em Breve</option>
                <option>Encerrado</option>
              </select>
            </div>
          </div>
          <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 mt-6">
            <button type="button" onClick={() => setFormModalOpen(false)} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">Cancelar</button>
            <button type="submit" className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">Salvar Campeonato</button>
          </div>
        </form>
      </Modal>

      {/* MODAL - EDITAR CAMPEONATO */}
      <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} title="Editar Campeonato">
        <form onSubmit={handleEditar} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Nome</label>
            <input required type="text" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Categoria</label>
              <select value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                <option>Adulto</option>
                <option>Aspirante</option>
                <option>Sub-20</option>
                <option>Veterano</option>
                <option>Feminino</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Edição (Ano)</label>
              <input required type="text" value={formData.edicao} onChange={e => setFormData({...formData, edicao: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Período</label>
              <input required type="text" value={formData.periodo} onChange={e => setFormData({...formData, periodo: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-bold text-blue-700">Taxa Inscrição (R$)</label>
              <input required type="number" value={formData.taxaInscricao} onChange={e => setFormData({...formData, taxaInscricao: Number(e.target.value)})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-blue-50" placeholder="R$" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Status</label>
              <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                <option>Ativo</option>
                <option>Em Breve</option>
                <option>Encerrado</option>
              </select>
            </div>
          </div>
          
          <div className="pt-4 flex justify-between items-center border-t border-slate-100 mt-6">
            <button type="button" onClick={excluirCampeonato} className="rounded-md bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-100 transition-colors">
              Excluir
            </button>
            <div className="flex space-x-3">
              <button type="button" onClick={() => setEditModalOpen(false)} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">Cancelar</button>
              <button type="submit" className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">Atualizar</button>
            </div>
          </div>
        </form>
      </Modal>

      {/* MODAL - HISTORICO E DETALHES */}
      <Modal 
        isOpen={isDetalhesModalOpen} 
        onClose={() => setDetalhesModalOpen(false)} 
        title={`Histórico: ${campeonatoSelecionado?.nome}`}
        maxWidth="max-w-5xl"
      >
        <div className="space-y-6 flex flex-col h-full">
          {/* Menu de Tabs */}
          <div className="flex border-b border-slate-200">
            <button 
              type="button"
              className={`px-4 py-3 font-semibold text-sm transition-colors border-b-2 ${historicoTab === 'geral' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
              onClick={() => setHistoricoTab('geral')}
            >
              Visão Geral & Tabela
            </button>
            <button 
              type="button"
              className={`px-4 py-3 font-semibold text-sm transition-colors border-b-2 ${historicoTab === 'elencos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
              onClick={() => setHistoricoTab('elencos')}
            >
              Elencos Oficiais
            </button>
          </div>

          {/* TAB 1: VISÃO GERAL */}
          {historicoTab === 'geral' && (
            <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
              {/* Dashboard Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center">
                  <div className="rounded-full bg-blue-100 p-3 mr-4">
                    <Trophy className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-900">Equipes INSCRITAS</p>
                    <p className="text-2xl font-bold text-blue-700">{equipesCampeonato.length}</p>
                  </div>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center">
                  <div className="rounded-full bg-emerald-100 p-3 mr-4">
                    <Users className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-emerald-900">Atletas Mapeados</p>
                    <p className="text-2xl font-bold text-emerald-700">{atletasCampeonato.length}</p>
                  </div>
                </div>
              </div>

              {equipesCampeonato.length > 0 && (
                <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm mb-6">
                  <div className="bg-slate-900 px-4 py-3 flex justify-between items-center text-white">
                    <h3 className="font-bold flex items-center gap-2"><Trophy className="h-4 w-4 text-emerald-400"/> Tabela de Classificação Atualizada</h3>
                  </div>
                  <div className="overflow-x-auto bg-white">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-2 text-left font-semibold text-slate-500">POS</th>
                          <th className="px-4 py-2 text-left font-semibold text-slate-500">EQUIPE</th>
                          <th className="px-4 py-2 text-center font-bold text-slate-900 bg-slate-100">P</th>
                          <th className="px-4 py-2 text-center font-semibold text-slate-500">J</th>
                          <th className="px-4 py-2 text-center font-semibold text-slate-500">V</th>
                          <th className="px-4 py-2 text-center font-semibold text-slate-500">E</th>
                          <th className="px-4 py-2 text-center font-semibold text-slate-500">D</th>
                          <th className="px-4 py-2 text-center font-semibold text-slate-500">SG</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {tabelaClassificacao.map((row: any, i) => (
                          <tr key={row.nome} className={i < 4 ? "bg-emerald-50/30" : ""}>
                            <td className="px-4 py-2 font-bold text-slate-700">{i + 1}º</td>
                            <td className="px-4 py-2 font-bold text-slate-800">{row.nome}</td>
                            <td className="px-4 py-2 text-center font-black bg-slate-50">{row.P}</td>
                            <td className="px-4 py-2 text-center text-slate-600">{row.J}</td>
                            <td className="px-4 py-2 text-center text-slate-600">{row.V}</td>
                            <td className="px-4 py-2 text-center text-slate-600">{row.E}</td>
                            <td className="px-4 py-2 text-center text-slate-600">{row.D}</td>
                            <td className="px-4 py-2 text-center text-slate-600">{row.SG}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ELENCOS (ACORDEÃO) */}
          {historicoTab === 'elencos' && (
            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-slate-400" />
                Elencos Oficiais do Campeonato
              </h3>
              
              {equipesCampeonato.length === 0 ? (
                <div className="text-center py-6 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-slate-500">Nenhuma equipe confirmada neste campeonato ainda.</p>
                </div>
              ) : (
                equipesCampeonato.map((equipe: any) => {
                  const jogadores = atletasCampeonato.filter((a: any) => a.equipe === equipe.nome);
                  const isExpanded = expandedEquipes.includes(equipe.id);

                  return (
                    <div key={equipe.id} className="border border-slate-200 rounded-lg overflow-hidden shadow-sm transition-all duration-200">
                      <button 
                        type="button"
                        onClick={() => toggleEquipe(equipe.id)}
                        className={`w-full px-4 py-3 flex justify-between items-center text-left transition-colors ${isExpanded ? 'bg-blue-50 border-b border-blue-100' : 'bg-white hover:bg-slate-50'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${isExpanded ? 'bg-blue-200' : 'bg-slate-100'}`}>
                            <Users className={`h-4 w-4 ${isExpanded ? 'text-blue-700' : 'text-slate-500'}`} />
                          </div>
                          <h4 className={`font-bold text-base ${isExpanded ? 'text-blue-900' : 'text-slate-800'}`}>{equipe.nome}</h4>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full shadow-sm border ${isExpanded ? 'bg-white border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600'}`}>
                            {jogadores.length} atleta{jogadores.length !== 1 && 's'}
                          </span>
                          {isExpanded ? <ChevronUp className="h-5 w-5 text-blue-600" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                        </div>
                      </button>
                      
                      {isExpanded && (
                        <div className="p-4 bg-slate-50 border-t border-slate-100">
                          {jogadores.length === 0 ? (
                            <p className="text-sm text-slate-400 italic text-center py-6 bg-white rounded border border-slate-100">Nenhum atleta cadastrado nesta equipe.</p>
                          ) : (
                            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              {jogadores.map((jogador: any) => (
                                <li key={jogador.id} className="flex flex-col text-sm text-slate-700 bg-white p-2.5 rounded-md border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all">
                                  <div className="flex items-start gap-2">
                                    <User className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                                    <span className="font-semibold text-slate-800 break-words leading-tight">{jogador.nome}</span>
                                  </div>
                                  <span className="text-xs text-slate-500 ml-6 flex gap-1.5 items-center mt-1">
                                    <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">{jogador.posicao || 'Posição N/A'}</span>
                                    {jogador.documento && (<span className="opacity-70 text-[10px]">&bull; DOC: {jogador.documento.slice(-4)}</span>)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}
          
          <div className="pt-4 flex justify-end border-t border-slate-100">
            <button type="button" onClick={() => setDetalhesModalOpen(false)} className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
              Fechar
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
