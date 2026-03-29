import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, DollarSign, TrendingUp, TrendingDown, Edit2 } from 'lucide-react';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function Financeiro() {
  const [financeiro, setFinanceiro] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    fetchFinanceiro();
  }, []);

  const fetchFinanceiro = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('financeiro').select('*').order('criado_em', { ascending: false });
      if (error) throw error;
      setFinanceiro(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao buscar dados financeiros');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = financeiro.filter((f: any) => {
    const matchSearch = f.descricao.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       f.equipe.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'Todos' || f.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const currentItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const parseValor = (str: any) => parseFloat(str) || 0;
  const receitas = financeiro.filter((f: any) => f.status === 'Pago').reduce((acc: number, f: any) => acc + parseValor(f.valor), 0);
  const inadimplencia = financeiro.filter((f: any) => f.status === 'Atrasado' || f.status === 'Debito Bloqueador' || f.status === 'Pendente').reduce((acc: number, f: any) => acc + parseValor(f.valor), 0);
  const formatMoney = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('financeiro').insert([{
        descricao: formData.descricao,
        equipe: formData.equipe,
        vencimento: formData.vencimento,
        valor: parseValor(formData.valor),
        status: formData.status,
        tipo: 'receita'
      }]);
      if (error) throw error;
      toast.success('Cobrança lançada com sucesso!');
      setFormModalOpen(false);
      resetForm();
      fetchFinanceiro();
    } catch (err) {
      toast.error('Erro ao salvar cobrança.');
    }
  };

  const handleEditar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('financeiro').update({
        descricao: formData.descricao,
        equipe: formData.equipe,
        vencimento: formData.vencimento,
        valor: parseValor(formData.valor),
        status: formData.status
      }).eq('id', lancamentoSelecionado.id);
      if (error) throw error;
      toast.success('Editado com sucesso!');
      setEditModalOpen(false);
      resetForm();
      fetchFinanceiro();
    } catch (err) {
      toast.error('Erro ao editar.');
    }
  };

  const resetForm = () => {
    setFormData({ descricao: '', equipe: '', vencimento: '', valor: '', status: 'Pendente' });
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

  const excluirLancamento = async () => {
    if (window.confirm('Tem certeza que deseja apagar este lançamento?')) {
      try {
        const { error } = await supabase.from('financeiro').delete().eq('id', lancamentoSelecionado.id);
        if (error) throw error;
        toast.success('Apagado com sucesso!');
        setEditModalOpen(false);
        fetchFinanceiro();
      } catch (err) {
        toast.error('Erro ao apagar.');
      }
    }
  };

  const darBaixa = async (lancamento: any) => {
    if (window.confirm('Confirmar o recebimento deste lançamento?')) {
      try {
        const { error } = await supabase.from('financeiro').update({ status: 'Pago' }).eq('id', lancamento.id);
        if (error) throw error;
        toast.success('Lançamento baixado com sucesso!');
        fetchFinanceiro();
      } catch (err) {
        toast.error('Erro ao baixar.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Módulo Financeiro</h1>
          <p className="text-sm text-slate-500 mt-1">Conectado e sincronizado via Nuvem (Supabase).</p>
        </div>
        <button onClick={() => { resetForm(); setFormModalOpen(true); }} className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700">
          <Plus className="-ml-1 mr-2 h-5 w-5" /> Nova Cobrança
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex items-center">
          <div className="rounded-md bg-emerald-50 p-3"><TrendingUp className="h-6 w-6 text-emerald-600" /></div>
          <div className="ml-4"><p className="text-sm font-medium text-slate-500">Receitas (Pagas)</p><p className="text-2xl font-semibold text-slate-900">{formatMoney(receitas)}</p></div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex items-center">
          <div className="rounded-md bg-rose-50 p-3"><TrendingDown className="h-6 w-6 text-rose-600" /></div>
          <div className="ml-4"><p className="text-sm font-medium text-slate-500">A Receber / Inadimplência</p><p className="text-2xl font-semibold text-slate-900">{formatMoney(inadimplencia)}</p></div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex items-center">
          <div className="rounded-md bg-blue-50 p-3"><DollarSign className="h-6 w-6 text-blue-600" /></div>
          <div className="ml-4"><p className="text-sm font-medium text-slate-500">Saldo em Caixa</p><p className="text-2xl font-semibold text-slate-900">{formatMoney(receitas)}</p></div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-2 h-5 w-5 text-slate-400" />
          <input type="text" className="block w-full rounded-md border-0 py-1.5 pl-10 ring-1 ring-inset ring-slate-300 focus:ring-blue-600 sm:text-sm" placeholder="Buscar por descrição ou equipe..." value={searchTerm} onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}} />
        </div>
        <div className="flex gap-2">
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }} className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 ring-1 ring-inset ring-slate-300 focus:ring-blue-600 sm:text-sm">
            <option value="Todos">Todos os Status</option><option value="Pago">Pago</option><option value="Pendente">Pendente</option><option value="Atrasado">Atrasado</option><option value="Debito Bloqueador">Multas Disciplinares</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
            <div className="text-center p-12"><p className="text-slate-500">Carregando dados financeiros...</p></div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center p-12"><p className="text-slate-500">Nenhum lançamento financeiro encontrado.</p></div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900">Descrição</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Equipe/Pessoa</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Vencimento</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Valor</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Status</th>
                <th className="py-3.5 pl-3 pr-4 text-right text-sm font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {currentItems.map((l: any) => (
                <tr key={l.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900">{l.descricao}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{l.equipe}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{l.vencimento}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-slate-900">{formatMoney(parseValor(l.valor))}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ring-1 ${l.status === 'Pago' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-rose-50 text-rose-700 ring-rose-600/20'}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap py-4 pr-4 pl-3 text-right text-sm font-medium flex justify-end gap-2">
                     {l.status !== 'Pago' && <button onClick={() => darBaixa(l)} className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded">Baixar</button>}
                     <button onClick={() => abrirEditar(l)} className="text-slate-600 border px-2 py-1 rounded bg-white"><Edit2 className="h-4 w-4"/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={totalItems} itemsPerPage={itemsPerPage} />}
      </div>

      <Modal isOpen={isFormModalOpen} onClose={() => setFormModalOpen(false)} title="Nova Cobrança / Receita">
        <form onSubmit={handleSalvar} className="space-y-4">
          <div><label className="block text-sm font-medium text-slate-700">Descrição</label><input required type="text" value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} className="mt-1 block w-full rounded border px-3 py-2" /></div>
          <div><label className="block text-sm font-medium text-slate-700">Entidade (Equipe ou Pessoa)</label><input required type="text" value={formData.equipe} onChange={e => setFormData({...formData, equipe: e.target.value})} className="mt-1 block w-full rounded border px-3 py-2" /></div>
          <div className="grid grid-cols-2 gap-4">
             <div><label className="block text-sm font-medium text-slate-700">Valor (R$)</label><input required type="number" step="0.01" value={formData.valor} onChange={e => setFormData({...formData, valor: e.target.value})} className="mt-1 block w-full rounded border px-3 py-2" /></div>
             <div><label className="block text-sm font-medium text-slate-700">Status</label><select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="mt-1 block w-full rounded border px-3 py-2"><option>Pendente</option><option>Pago</option><option>Atrasado</option></select></div>
          </div>
          <div><label className="block text-sm font-medium text-slate-700">Vencimento (Data)</label><input required type="text" value={formData.vencimento} onChange={e => setFormData({...formData, vencimento: e.target.value})} className="mt-1 block w-full rounded border px-3 py-2" /></div>
          <div className="pt-4 flex justify-end space-x-3"><button type="button" onClick={() => setFormModalOpen(false)} className="px-4 py-2 border rounded">Cancelar</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Salvar</button></div>
        </form>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} title="Editar Lançamento">
        <form onSubmit={handleEditar} className="space-y-4">
          <div><label className="block text-sm font-medium text-slate-700">Descrição</label><input required type="text" value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} className="mt-1 block w-full rounded border px-3 py-2" /></div>
          <div><label className="block text-sm font-medium text-slate-700">Entidade (Equipe ou Pessoa)</label><input required type="text" value={formData.equipe} onChange={e => setFormData({...formData, equipe: e.target.value})} className="mt-1 block w-full rounded border px-3 py-2" /></div>
          <div className="grid grid-cols-2 gap-4">
             <div><label className="block text-sm font-medium text-slate-700">Valor (R$)</label><input required type="number" step="0.01" value={formData.valor} onChange={e => setFormData({...formData, valor: e.target.value})} className="mt-1 block w-full rounded border px-3 py-2" /></div>
             <div><label className="block text-sm font-medium text-slate-700">Status</label><select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="mt-1 block w-full rounded border px-3 py-2"><option>Pendente</option><option>Pago</option><option>Atrasado</option><option value="Debito Bloqueador">Bloqueador</option></select></div>
          </div>
          <div><label className="block text-sm font-medium text-slate-700">Vencimento (Data)</label><input required type="text" value={formData.vencimento} onChange={e => setFormData({...formData, vencimento: e.target.value})} className="mt-1 block w-full rounded border px-3 py-2" /></div>
          <div className="pt-4 flex justify-between space-x-3"><button type="button" onClick={excluirLancamento} className="px-4 py-2 border bg-rose-50 text-rose-700 rounded">Excluir</button><div className="flex gap-2"><button type="button" onClick={() => setEditModalOpen(false)} className="px-4 py-2 border rounded">Cancelar</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Atualizar</button></div></div>
        </form>
      </Modal>

    </div>
  );
}
