import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

const INITIAL_MOCK_DATA = Array.from({ length: 5 }, (_, i) => ({
  id: i + 1,
  nome: `Membro Diretoria ${i + 1}`,
  cargo: i === 0 ? 'Presidente' : i === 1 ? 'Vice-Presidente' : i % 3 === 0 ? 'Diretor Financeiro' : 'Diretor Técnico',
  periodo: '2025-2027',
  contato: `(85) 9${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
  permissoes: i < 2 ? 'Total' : i % 3 === 0 ? 'Financeiro' : 'Campeonatos'
}));

export default function Diretoria() {
  const [diretoria, setDiretoria] = useState(() => {
    const saved = localStorage.getItem('@nicolau:diretoria');
    if (saved) return JSON.parse(saved);
    return INITIAL_MOCK_DATA;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  // Modals
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  
  const [membroSelecionado, setMembroSelecionado] = useState<any>(null);

  const [formData, setFormData] = useState({
    nome: '',
    cargo: 'Diretor Geral',
    periodo: '2025-2027',
    contato: '',
    permissoes: 'Total'
  });

  useEffect(() => {
    localStorage.setItem('@nicolau:diretoria', JSON.stringify(diretoria));
  }, [diretoria]);

  const filteredItems = diretoria.filter((d: any) => 
    d.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.cargo.toLowerCase().includes(searchTerm.toLowerCase())
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
    setDiretoria([novo, ...diretoria]);
    setFormModalOpen(false);
    resetForm();
  };

  const handleEditar = (e: React.FormEvent) => {
    e.preventDefault();
    setDiretoria(diretoria.map((d: any) => d.id === membroSelecionado.id ? { ...d, ...formData } : d));
    setEditModalOpen(false);
    resetForm();
  };

  const excluirMembro = () => {
    if (confirm('Tem certeza que deseja excluir este membro da diretoria?')) {
      setDiretoria(diretoria.filter((d: any) => d.id !== membroSelecionado.id));
      setEditModalOpen(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      cargo: 'Diretor Geral',
      periodo: '2025-2027',
      contato: '',
      permissoes: 'Total'
    });
    setMembroSelecionado(null);
  };

  const abrirEditar = (membro: any) => {
    setMembroSelecionado(membro);
    setFormData({
      nome: membro.nome || '',
      cargo: membro.cargo || '',
      periodo: membro.periodo || '',
      contato: membro.contato || '',
      permissoes: membro.permissoes || 'Total'
    });
    setEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Diretoria LIFACE</h1>
          <p className="text-sm text-slate-500 mt-1">Membros da diretoria e permissões.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setFormModalOpen(true); }}
          className="inline-flex w-full sm:w-auto items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Novo Membro
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
            placeholder="Buscar membros ou cargos..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <button 
          onClick={() => toast("Filtros avançados (Backend)", { icon: 'ℹ️' })}
          className="inline-flex w-full sm:w-auto justify-center items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
        >
          <Filter className="-ml-0.5 h-5 w-5 text-slate-400" aria-hidden="true" />
          Filtros
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        {filteredItems.length === 0 ? (
          <div className="text-center p-12">
            <p className="text-slate-500">Nenhum membro da diretoria encontrado.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6">Nome</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Cargo</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Período</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Contato</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Permissões</th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 whitespace-nowrap text-right">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {currentItems.map((membro: any) => (
                <tr key={membro.id} className="hover:bg-slate-50 transition-colors">
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 sm:pl-6">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <img className="h-10 w-10 rounded-full bg-slate-100 object-cover border border-slate-200" src={`https://avatar.iran.liara.run/public/boy?username=${membro.nome}`} alt="" referrerPolicy="no-referrer" />
                      </div>
                      <div className="ml-4">
                        <div className="font-medium text-slate-900">{membro.nome}</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-slate-800">{membro.cargo}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{membro.periodo}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{membro.contato}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/20">
                      {membro.permissoes}
                    </span>
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <button onClick={() => abrirEditar(membro)} className="text-blue-600 hover:text-blue-900 bg-white px-3 py-1 rounded-md border border-slate-200 hover:bg-slate-50">
                      Editar
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

      {/* MODAL - NOVO MEMBRO */}
      <Modal isOpen={isFormModalOpen} onClose={() => setFormModalOpen(false)} title="Cadastrar Integrante">
        <form onSubmit={handleSalvar} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-slate-700">Nome Completo</label>
              <input required type="text" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-slate-700">Cargo</label>
              <input required type="text" value={formData.cargo} onChange={e => setFormData({...formData, cargo: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-slate-700">Período de Gestão</label>
              <input required type="text" value={formData.periodo} onChange={e => setFormData({...formData, periodo: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="Ex: 2024-2026" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-slate-700">Contato (Telefone/Email)</label>
              <input required type="text" value={formData.contato} onChange={e => setFormData({...formData, contato: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Nível de Permissão no Sistema</label>
            <select value={formData.permissoes} onChange={e => setFormData({...formData, permissoes: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
              <option>Total</option>
              <option>Financeiro</option>
              <option>Campeonatos</option>
              <option>Equipes/Atletas</option>
              <option>Apenas Leitura</option>
            </select>
          </div>
          <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 mt-6">
            <button type="button" onClick={() => setFormModalOpen(false)} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">Cancelar</button>
            <button type="submit" className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">Salvar Integrante</button>
          </div>
        </form>
      </Modal>

      {/* MODAL - EDITAR MEMBRO */}
      <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} title="Editar Integrante">
        <form onSubmit={handleEditar} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-slate-700">Nome Completo</label>
              <input required type="text" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-slate-700">Cargo</label>
              <input required type="text" value={formData.cargo} onChange={e => setFormData({...formData, cargo: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-slate-700">Período de Gestão</label>
              <input required type="text" value={formData.periodo} onChange={e => setFormData({...formData, periodo: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-slate-700">Contato</label>
              <input required type="text" value={formData.contato} onChange={e => setFormData({...formData, contato: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Nível de Permissão no Sistema</label>
            <select value={formData.permissoes} onChange={e => setFormData({...formData, permissoes: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
              <option>Total</option>
              <option>Financeiro</option>
              <option>Campeonatos</option>
              <option>Equipes/Atletas</option>
              <option>Apenas Leitura</option>
            </select>
          </div>
          <div className="pt-4 flex justify-between items-center border-t border-slate-100 mt-6">
            <button type="button" onClick={excluirMembro} className="rounded-md bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-100 transition-colors">
              Excluir Integrante
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
