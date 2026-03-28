import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Calendar as CalendarIcon, Edit2, Trash2 } from 'lucide-react';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

const INITIAL_MOCK_DATA = Array.from({ length: 6 }, (_, i) => ({
  id: Date.now() - i * 1000,
  nome: `Evento Oficial LIFACE ${i + 1}`,
  tipo: i % 2 === 0 ? 'LIFACE' : 'Parceiro',
  instituicao: i % 2 !== 0 ? 'Prefeitura' : '',
  data: `1${i % 9 + 1} Junho 2026`,
  local: `Auditório ${i + 1}`,
  categoria: i === 0 ? 'Cerimônia' : i % 2 === 0 ? 'Capacitação' : 'Reunião',
  status: i === 0 ? 'Programado' : i % 2 === 0 ? 'Realizado' : 'Cancelado'
}));

export default function Eventos() {
  const [eventos, setEventos] = useState(() => {
    const saved = localStorage.getItem('@nicolau:eventos');
    if (saved) return JSON.parse(saved);
    return INITIAL_MOCK_DATA;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('Todos os Tipos');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  
  // Modals
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [eventoSelecionado, setEventoSelecionado] = useState<any>(null);

  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'LIFACE',
    instituicao: '',
    data: '',
    local: '',
    categoria: 'Reunião',
    status: 'Programado'
  });

  useEffect(() => {
    localStorage.setItem('@nicolau:eventos', JSON.stringify(eventos));
  }, [eventos]);

  const filteredItems = eventos.filter((e: any) => {
    const matchSearch = e.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        e.local.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchTipo = true;
    if (filterTipo === 'LIFACE') matchTipo = e.tipo === 'LIFACE';
    if (filterTipo === 'Parceiro') matchTipo = e.tipo === 'Parceiro';
    
    return matchSearch && matchTipo;
  });

  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const currentItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    const novo = {
      id: Date.now(),
      ...formData
    };
    setEventos([novo, ...eventos]);
    setFormModalOpen(false);
    resetForm();
  };

  const handleEditar = (e: React.FormEvent) => {
    e.preventDefault();
    setEventos(eventos.map((ev: any) => ev.id === eventoSelecionado.id ? { ...ev, ...formData } : ev));
    setEditModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      tipo: 'LIFACE',
      instituicao: '',
      data: new Date().toLocaleDateString('pt-BR'),
      local: '',
      categoria: 'Reunião',
      status: 'Programado'
    });
    setEventoSelecionado(null);
  };

  const abrirEditar = (evento: any) => {
    setEventoSelecionado(evento);
    setFormData({
      nome: evento.nome || '',
      tipo: evento.tipo || 'LIFACE',
      instituicao: evento.instituicao || '',
      data: evento.data || '',
      local: evento.local || '',
      categoria: evento.categoria || 'Reunião',
      status: evento.status || 'Programado'
    });
    setEditModalOpen(true);
  };

  const excluirEvento = () => {
    if (confirm('Atenção: Tem certeza que deseja excluir permanentemente este evento/festa?')) {
      setEventos(eventos.filter((ev: any) => ev.id !== eventoSelecionado.id));
      setEditModalOpen(false);
      resetForm();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Eventos LIFACE e Parceiros</h1>
          <p className="text-sm text-slate-500 mt-1">Gerencie eventos institucionais, confraternizações, reuniões e parcerias.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setFormModalOpen(true); }}
          className="inline-flex w-full sm:w-auto items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Novo Evento
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
            <option value="Todos os Tipos">Todos os Tipos</option>
            <option value="LIFACE">LIFACE (Interno)</option>
            <option value="Parceiro">Parceiros (Externo)</option>
          </select>
          <button 
            onClick={() => alert('Em breve outros filtros')}
            className="inline-flex w-full sm:w-auto justify-center items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
          >
            <Filter className="-ml-0.5 h-5 w-5 text-slate-400" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredItems.length === 0 ? (
          <div className="col-span-full text-center p-12 bg-white rounded-xl border border-slate-200">
            <p className="text-slate-500">Nenhum evento localizado com estes filtros.</p>
          </div>
        ) : (
          currentItems.map((evento: any) => (
            <div key={evento.id} className="group relative rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col hover:border-blue-300 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className={`rounded-md p-2 ${evento.tipo === 'LIFACE' ? 'bg-blue-50' : 'bg-purple-50'}`}>
                    <CalendarIcon className={`h-5 w-5 ${evento.tipo === 'LIFACE' ? 'text-blue-600' : 'text-purple-600'}`} />
                  </div>
                  <div className="ml-3 pr-8">
                    <h3 className="text-base font-medium text-slate-900 line-clamp-1" title={evento.nome}>{evento.nome}</h3>
                    <p className="text-xs text-slate-500">{evento.tipo} {evento.instituicao ? `• ${evento.instituicao}` : ''}</p>
                  </div>
                </div>
              </div>
              <div className="mt-5 flex-1 space-y-3">
                <div className="flex justify-between bg-slate-50 p-2 rounded text-sm">
                  <span className="font-medium text-slate-900">Data e Hora:</span>
                  <span className="text-slate-600 text-right">{evento.data}</span>
                </div>
                <div className="flex justify-between bg-slate-50 p-2 rounded text-sm">
                  <span className="font-medium text-slate-900">Local:</span>
                  <span className="text-slate-600 text-right line-clamp-1" title={evento.local}>{evento.local}</span>
                </div>
                <div className="flex justify-between bg-slate-50 p-2 rounded text-sm">
                  <span className="font-medium text-slate-900">Tipo/Categoria:</span>
                  <span className="text-slate-600 text-right">{evento.categoria}</span>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                  evento.status === 'Realizado' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 
                  evento.status === 'Programado' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' :
                  'bg-rose-50 text-rose-700 ring-rose-600/20'
                }`}>
                  {evento.status}
                </span>
                
                <button onClick={() => abrirEditar(evento)} className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-blue-50">
                  <Edit2 className="w-4 h-4" /> Editar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
          />
        </div>
      )}

      {/* MODAL CRIAR/EDITAR ESTÁ REUTILIZANDO O MESMO FORMATO PARA POUPAR ESPACO */}
      {(isFormModalOpen || isEditModalOpen) && (
        <Modal 
          isOpen={isFormModalOpen || isEditModalOpen} 
          onClose={() => { setFormModalOpen(false); setEditModalOpen(false); }} 
          title={isEditModalOpen ? "Editar Evento Institucional" : "Programar Novo Evento"}
        >
          <form onSubmit={isEditModalOpen ? handleEditar : handleSalvar} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Nome da Festa/Evento</label>
              <input required type="text" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="Ex: Festa de Fim de Ano LIFACE" />
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 mt-4 pt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Organização</label>
                <select value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                  <option value="LIFACE">LIFACE (Interno)</option>
                  <option value="Parceiro">Parceiros (Externo)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Nome do Parceiro/Instituição</label>
                <input type="text" disabled={formData.tipo === 'LIFACE'} value={formData.instituicao} onChange={e => setFormData({...formData, instituicao: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-slate-100 disabled:text-slate-400" placeholder="Apenas se for Parceiro..." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Categoria do Evento</label>
                <select value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                  <option>Reunião</option>
                  <option>Capacitação/Palestra</option>
                  <option>Cerimônia Oficial</option>
                  <option>Congresso</option>
                  <option>Festa/Confraternização</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Status</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                  <option>Programado</option>
                  <option>Realizado</option>
                  <option>Cancelado</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 mt-4 pt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Data e Hora (Referência)</label>
                <input required type="text" value={formData.data} onChange={e => setFormData({...formData, data: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="Ex: 15/Dez às 20h" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Espaço/Local</label>
                <input required type="text" value={formData.local} onChange={e => setFormData({...formData, local: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="Ex: Clube de Sargentos" />
              </div>
            </div>

            <div className="pt-4 flex justify-between items-center border-t border-slate-100 mt-6">
              {isEditModalOpen ? (
                <button type="button" onClick={excluirEvento} className="rounded-md bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-100 transition-colors flex items-center gap-2">
                  <Trash2 className="w-4 h-4" /> Cancelar/Apagar
                </button>
              ) : <div></div>}
              
              <div className="flex space-x-3">
                <button type="button" onClick={() => { setFormModalOpen(false); setEditModalOpen(false); }} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">Fechar</button>
                <button type="submit" className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">
                  {isEditModalOpen ? 'Salvar Edição' : 'Programar Evento'}
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
