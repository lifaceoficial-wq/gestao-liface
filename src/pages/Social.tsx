import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, HeartHandshake, Users, Target, Edit2, Trash2 } from 'lucide-react';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';

const INITIAL_MOCK_DATA = Array.from({ length: 6 }, (_, i) => ({
  id: Date.now() - i * 1000,
  nome: `Visita ao Orfanato ${i + 1}`,
  tipo: i % 2 === 0 ? 'Projeto Contínuo' : 'Ação Pontual',
  publico: 'Crianças Carentes',
  beneficiados: Math.floor(Math.random() * 100) + 20,
  local: `Bairro ${i + 1}`,
  status: i === 0 ? 'Planejado' : i % 2 === 0 ? 'Em andamento' : 'Concluído'
}));

export default function Social() {
  const [projetos, setProjetos] = useState(() => {
    const saved = localStorage.getItem('@nicolau:social');
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('Todos');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  // Modals
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  
  const [itemSelecionado, setItemSelecionado] = useState<any>(null);

  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'Ação Pontual',
    publico: '',
    beneficiados: 0,
    local: '',
    status: 'Planejado'
  });

  useEffect(() => {
    localStorage.setItem('@nicolau:social', JSON.stringify(projetos));
  }, [projetos]);

  const filteredItems = projetos.filter((p: any) => {
    const matchSearch = p.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        p.local.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchTipo = true;
    if (filterTipo === 'Projetos') matchTipo = p.tipo === 'Projeto Contínuo';
    if (filterTipo === 'Ações Pontuais') matchTipo = p.tipo === 'Ação Pontual';
    
    return matchSearch && matchTipo;
  });

  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const currentItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Cálculos dinâmicos
  const ativosCount = projetos.filter((p: any) => p.status === 'Em andamento').length;
  const realizadosCount = projetos.filter((p: any) => p.status === 'Concluído').length;
  const beneficiadosTotal = projetos.reduce((acc: number, p: any) => acc + (Number(p.beneficiados) || 0), 0);

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    const novo = {
      id: Date.now(),
      ...formData
    };
    setProjetos([novo, ...projetos]);
    setFormModalOpen(false);
    resetForm();
  };

  const handleEditar = (e: React.FormEvent) => {
    e.preventDefault();
    setProjetos(projetos.map((p: any) => p.id === itemSelecionado.id ? { ...p, ...formData } : p));
    setEditModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      tipo: 'Ação Pontual',
      publico: '',
      beneficiados: 0,
      local: '',
      status: 'Planejado'
    });
    setItemSelecionado(null);
  };

  const abrirNovaAcao = () => {
    resetForm();
    setFormData({ ...formData, tipo: 'Ação Pontual' });
    setFormModalOpen(true);
  };

  const abrirNovoProjeto = () => {
    resetForm();
    setFormData({ ...formData, tipo: 'Projeto Contínuo' });
    setFormModalOpen(true);
  };

  const abrirEditar = (item: any) => {
    setItemSelecionado(item);
    setFormData({
      nome: item.nome || '',
      tipo: item.tipo || 'Ação Pontual',
      publico: item.publico || '',
      beneficiados: item.beneficiados || 0,
      local: item.local || '',
      status: item.status || 'Planejado'
    });
    setEditModalOpen(true);
  };

  const excluirItem = () => {
    if (confirm('Tem certeza que deseja apagar este projeto/ação?')) {
      setProjetos(projetos.filter((p: any) => p.id !== itemSelecionado.id));
      setEditModalOpen(false);
      resetForm();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Projeto Social LIFACE</h1>
          <p className="text-sm text-slate-500 mt-1">Gerencie projetos e ações sociais pontuais.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button 
            onClick={abrirNovaAcao}
            className="inline-flex w-full sm:w-auto items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Nova Ação Pontual
          </button>
          <button 
            onClick={abrirNovoProjeto}
            className="inline-flex w-full sm:w-auto items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Novo Projeto
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-md bg-blue-50 p-3">
              <HeartHandshake className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-500">Ações em Andamento</p>
              <p className="text-2xl font-semibold text-slate-900">{ativosCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-md bg-emerald-50 p-3">
              <Users className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-500">Pessoas Beneficiadas</p>
              <p className="text-2xl font-semibold text-slate-900">{beneficiadosTotal}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-md bg-amber-50 p-3">
              <Target className="h-6 w-6 text-amber-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-500">Ações Concluídas</p>
              <p className="text-2xl font-semibold text-slate-900">{realizadosCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:flex-1 sm:max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-slate-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            placeholder="Buscar por nome ou local..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <select 
            value={filterTipo}
            onChange={(e) => { setFilterTipo(e.target.value); setCurrentPage(1); }}
            className="block w-full sm:w-auto rounded-md border-0 py-1.5 pl-3 pr-10 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6"
          >
            <option value="Todos">Todos os Tipos</option>
            <option value="Projetos">Projetos Contínuos</option>
            <option value="Ações Pontuais">Ações Pontuais</option>
          </select>
          <button 
            onClick={() => alert("Mais filtros virão na integração.")}
            className="inline-flex w-full sm:w-auto justify-center items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
          >
            <Filter className="-ml-0.5 h-5 w-5 text-slate-400" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="text-center p-12">
            <p className="text-slate-500">Nenhum projeto social encontrado.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6">Nome da Iniciativa</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Tipo</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Público</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Local</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Status</th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {currentItems.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-6">{item.nome}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                      item.tipo === 'Projeto Contínuo' ? 'bg-indigo-50 text-indigo-700 ring-indigo-600/20' : 'bg-purple-50 text-purple-700 ring-purple-600/20'
                    }`}>
                      {item.tipo}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                    {item.publico} <span className="text-xs font-semibold text-emerald-600 ml-1">({item.beneficiados} pessoas)</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{item.local}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                      item.status === 'Em andamento' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' : 
                      item.status === 'Concluído' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' :
                      'bg-slate-100 text-slate-600 ring-slate-500/10'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <button onClick={() => abrirEditar(item)} className="text-slate-600 hover:text-blue-600 bg-white px-2 py-1 rounded-md border border-slate-200 hover:bg-blue-50 flex items-center gap-1 ml-auto">
                      <Edit2 className="h-4 w-4" /> Editar
                    </button>
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

      {/* MODAL - NOVA AÇÃO/PROJETO */}
      <Modal isOpen={isFormModalOpen} onClose={() => setFormModalOpen(false)} title="Cadastrar Nova Iniciativa">
        <form onSubmit={handleSalvar} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Nome da Iniciativa</label>
            <input required type="text" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="Ex: Doação de Chuteiras" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Tipo</label>
              <select value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                <option>Ação Pontual</option>
                <option>Projeto Contínuo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Status</label>
              <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                <option>Planejado</option>
                <option>Em andamento</option>
                <option>Concluído</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Público-Alvo</label>
              <input required type="text" value={formData.publico} onChange={e => setFormData({...formData, publico: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="Ex: Crianças de 8-12 Anos" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Qtde. Estimada de Pessoas</label>
              <input required type="number" min="0" value={formData.beneficiados} onChange={e => setFormData({...formData, beneficiados: parseInt(e.target.value) || 0})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Local / Bairro</label>
            <input required type="text" value={formData.local} onChange={e => setFormData({...formData, local: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="Ex: Areninha da Vila" />
          </div>
          <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 mt-6">
            <button type="button" onClick={() => setFormModalOpen(false)} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">Cancelar</button>
            <button type="submit" className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">Criar Iniciativa</button>
          </div>
        </form>
      </Modal>

      {/* MODAL - EDITAR INICIATIVA */}
      <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} title="Editar Iniciativa">
        <form onSubmit={handleEditar} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Nome da Iniciativa</label>
            <input required type="text" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Tipo</label>
              <select value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                <option>Ação Pontual</option>
                <option>Projeto Contínuo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Status</label>
              <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                <option>Planejado</option>
                <option>Em andamento</option>
                <option>Concluído</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Público-Alvo</label>
              <input required type="text" value={formData.publico} onChange={e => setFormData({...formData, publico: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Qtde. Beneficiados</label>
              <input required type="number" min="0" value={formData.beneficiados} onChange={e => setFormData({...formData, beneficiados: parseInt(e.target.value) || 0})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Local / Bairro</label>
            <input required type="text" value={formData.local} onChange={e => setFormData({...formData, local: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
          </div>

          <div className="pt-4 flex justify-between items-center border-t border-slate-100 mt-6">
            <button type="button" onClick={excluirItem} className="rounded-md bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-100 transition-colors flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Apagar Projeto
            </button>
            <div className="flex space-x-3">
              <button type="button" onClick={() => setEditModalOpen(false)} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">Cancelar</button>
              <button type="submit" className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">Salvar Alterações</button>
            </div>
          </div>
        </form>
      </Modal>

    </div>
  );
}
