import { useState, useEffect } from 'react';
import { Plus, Search, Filter, DollarSign, TrendingUp, TrendingDown, Edit2 } from 'lucide-react';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';

const INITIAL_MOCK_DATA = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  descricao: i % 3 === 0 ? 'Multa Disciplinar' : 'Taxa de Inscrição',
  equipe: `Equipe ${Math.floor(i / 2) + 1}`,
  vencimento: `1${i % 9 + 1}/06/2026`,
  valor: i % 3 === 0 ? '150.00' : '800.00',
  status: i % 5 === 0 ? 'Atrasado' : i % 3 === 0 ? 'Pendente' : 'Pago'
}));

export default function Financeiro() {
  const [financeiro, setFinanceiro] = useState(() => {
    const saved = localStorage.getItem('@nicolau:financeiro');
    if (saved) return JSON.parse(saved);
    return INITIAL_MOCK_DATA;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  // Modals
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  
  const [lancamentoSelecionado, setLancamentoSelecionado] = useState<any>(null);

  const [formData, setFormData] = useState({
    descricao: '',
    equipe: '',
    vencimento: '',
    valor: '',
    status: 'Pendente'
  });

  useEffect(() => {
    localStorage.setItem('@nicolau:financeiro', JSON.stringify(financeiro));
  }, [financeiro]);

  const filteredItems = financeiro.filter((f: any) => {
    const matchSearch = f.descricao.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       f.equipe.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'Todos' || f.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const currentItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Cálculos dinâmicos
  const parseValor = (str: string) => parseFloat(str) || 0;
  const receitas = financeiro.filter((f: any) => f.status === 'Pago').reduce((acc: number, f: any) => acc + parseValor(f.valor), 0);
  const inadimplencia = financeiro.filter((f: any) => f.status === 'Atrasado').reduce((acc: number, f: any) => acc + parseValor(f.valor), 0);
  const formatMoney = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    const novo = {
      id: Date.now(),
      ...formData
    };
    setFinanceiro([novo, ...financeiro]);
    setFormModalOpen(false);
    resetForm();
  };

  const handleEditar = (e: React.FormEvent) => {
    e.preventDefault();
    setFinanceiro(financeiro.map((f: any) => f.id === lancamentoSelecionado.id ? { ...f, ...formData } : f));
    setEditModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      descricao: '',
      equipe: '',
      vencimento: '',
      valor: '',
      status: 'Pendente'
    });
    setLancamentoSelecionado(null);
  };

  const abrirEditar = (lancamento: any) => {
    setLancamentoSelecionado(lancamento);
    setFormData({
      descricao: lancamento.descricao || '',
      equipe: lancamento.equipe || '',
      vencimento: lancamento.vencimento || '',
      valor: lancamento.valor || '',
      status: lancamento.status || 'Pendente'
    });
    setEditModalOpen(true);
  };

  const excluirLancamento = () => {
    if (confirm('Tem certeza que deseja apagar este lançamento (Essa ação não pode ser desfeita)?')) {
      setFinanceiro(financeiro.filter((f: any) => f.id !== lancamentoSelecionado.id));
      setEditModalOpen(false);
      resetForm();
    }
  };

  const darBaixa = (lancamento: any) => {
    if (confirm('Confirmar o recebimento deste lançamento?')) {
      setFinanceiro(financeiro.map((f: any) => f.id === lancamento.id ? { ...f, status: 'Pago' } : f));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Módulo Financeiro</h1>
          <p className="text-sm text-slate-500 mt-1">Controle de taxas de inscrição, multas e pagamentos.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setFormModalOpen(true); }}
          className="inline-flex w-full sm:w-auto items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Nova Cobrança
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-md bg-emerald-50 p-3">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-500">Receitas (Pagas)</p>
              <p className="text-2xl font-semibold text-slate-900">{formatMoney(receitas)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-md bg-rose-50 p-3">
              <TrendingDown className="h-6 w-6 text-rose-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-500">Inadimplência</p>
              <p className="text-2xl font-semibold text-slate-900">{formatMoney(inadimplencia)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-md bg-blue-50 p-3">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-500">Saldo em Caixa</p>
              <p className="text-2xl font-semibold text-slate-900">{formatMoney(receitas)}</p>
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
            placeholder="Buscar por descrição ou equipe..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="flex gap-2">
          <select 
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            className="block w-full sm:w-auto rounded-md border-0 py-1.5 pl-3 pr-10 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-blue-600 sm:text-sm"
          >
            <option value="Todos">Todos os Status</option>
            <option value="Pago">Pago</option>
            <option value="Pendente">Pendente</option>
            <option value="Atrasado">Atrasado</option>
          </select>
          <button 
            onClick={() => alert("Mais filtros avançados virão via Supabase!")}
            className="inline-flex w-full sm:w-auto justify-center items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
          >
            <Filter className="-ml-0.5 h-5 w-5 text-slate-400" aria-hidden="true" />
            
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="text-center p-12">
            <p className="text-slate-500">Nenhum lançamento financeiro encontrado.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6">Descrição</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Equipe/Pessoa</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Vencimento</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Valor</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Status</th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 whitespace-nowrap text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {currentItems.map((lancamento: any) => (
                <tr key={lancamento.id} className="hover:bg-slate-50 transition-colors">
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-6">{lancamento.descricao}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{lancamento.equipe}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{lancamento.vencimento}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-slate-900">{formatMoney(parseValor(lancamento.valor))}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ring-1 ring-inset ${
                      lancamento.status === 'Pago' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 
                      lancamento.status === 'Pendente' ? 'bg-amber-50 text-amber-700 ring-amber-600/20' :
                      'bg-rose-50 text-rose-700 ring-rose-600/20'
                    }`}>
                      {lancamento.status}
                    </span>
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <div className="flex items-center justify-end gap-2">
                       {lancamento.status !== 'Pago' && (
                        <button onClick={() => darBaixa(lancamento)} className="text-emerald-600 hover:text-emerald-900 bg-emerald-50 px-3 py-1 rounded-md border border-emerald-200 hover:bg-emerald-100 flex items-center">
                          Baixar
                        </button>
                       )}
                      <button onClick={() => abrirEditar(lancamento)} className="text-slate-600 hover:text-slate-900 bg-white px-2 py-1 rounded-md border border-slate-200 hover:bg-slate-50 flex items-center">
                        <Edit2 className="h-4 w-4" />
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

      {/* MODAL - NOVA COBRANÇA */}
      <Modal isOpen={isFormModalOpen} onClose={() => setFormModalOpen(false)} title="Nova Cobrança / Receita">
        <form onSubmit={handleSalvar} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Descrição</label>
            <input required type="text" value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="Ex: Multa por Atraso" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Entidade (Equipe ou Pessoa)</label>
            <input required type="text" value={formData.equipe} onChange={e => setFormData({...formData, equipe: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="Ex: Real Madrid FC" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Valor (R$)</label>
              <input required type="number" step="0.01" value={formData.valor} onChange={e => setFormData({...formData, valor: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="Ex: 150.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Status</label>
              <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                <option>Pendente</option>
                <option>Pago</option>
                <option>Atrasado</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Vencimento (Data)</label>
            <input required type="text" value={formData.vencimento} onChange={e => setFormData({...formData, vencimento: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="Ex: 10/10/2026" />
          </div>
          <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 mt-6">
            <button type="button" onClick={() => setFormModalOpen(false)} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">Cancelar</button>
            <button type="submit" className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">Emitir Cobrança</button>
          </div>
        </form>
      </Modal>

      {/* MODAL - EDITAR COBRANÇA */}
      <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} title="Editar Lançamento">
        <form onSubmit={handleEditar} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Descrição</label>
            <input required type="text" value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Entidade (Equipe ou Pessoa)</label>
            <input required type="text" value={formData.equipe} onChange={e => setFormData({...formData, equipe: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Valor (R$)</label>
              <input required type="number" step="0.01" value={formData.valor} onChange={e => setFormData({...formData, valor: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Status</label>
              <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                <option>Pendente</option>
                <option>Pago</option>
                <option>Atrasado</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Vencimento (Data)</label>
            <input required type="text" value={formData.vencimento} onChange={e => setFormData({...formData, vencimento: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
          </div>
          <div className="pt-4 flex justify-between items-center border-t border-slate-100 mt-6">
            <button type="button" onClick={excluirLancamento} className="rounded-md bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-100 transition-colors">
              Apagar Lançamento
            </button>
            <div className="flex space-x-3">
              <button type="button" onClick={() => setEditModalOpen(false)} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">Cancelar</button>
              <button type="submit" className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">Salvar Modificações</button>
            </div>
          </div>
        </form>
      </Modal>

    </div>
  );
}
