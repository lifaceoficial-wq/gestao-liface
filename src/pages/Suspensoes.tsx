import React, { useState, useEffect } from 'react';
import { Plus, Search, AlertTriangle } from 'lucide-react';
import Modal from '../components/Modal';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function Suspensoes() {
  const [suspensoes, setSuspensoes] = useState<any[]>([]);
  const [infratoresList, setInfratoresList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [isFormModalOpen, setFormModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<'atletas' | 'equipes'>('atletas');

  const [formData, setFormData] = useState({
    infrator: '', 
    tipo: 'Automática', 
    motivo: '',
    jogosSuspensos: 1,
    multaValor: 0,
    status: 'Ativa'
  });

  useEffect(() => {
    fetchDados();
  }, []);

  const fetchDados = async () => {
    try {
      setLoading(true);
      // Busca suspensoes
      const { data: s, error: sErr } = await supabase.from('suspensoes').select('*').order('criado_em', { ascending: false });
      if (sErr) throw sErr;
      setSuspensoes(s || []);

      // Constroi lista de infratores
      const { data: at_raw } = await supabase.from('atletas').select('nome, id');
      const { data: eq_raw } = await supabase.from('equipes').select('nome, id');
      
      const mapa = [
        ...(at_raw || []).map(a => ({ nome: a.nome, tipo_origem: 'Atleta', id_origem: a.id })),
        ...(eq_raw || []).map(e => ({ nome: e.nome, tipo_origem: 'Equipe', id_origem: e.id }))
      ];
      setInfratoresList(mapa);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao buscar dados do tribunal');
    } finally {
      setLoading(false);
    }
  };

  const suspenderAtletaNaOrigem = async (infratorNome: string, tabOrigem: 'atletas' | 'equipes') => {
    try {
      if (tabOrigem === 'atletas') {
        await supabase.from('atletas').update({ status: 'Suspenso' }).eq('nome', infratorNome);
      } else {
        // Suspensão da Equipe
        await supabase.from('equipes').update({ status: 'SuspensaRegras' }).eq('nome', infratorNome);
        // Cascata: Suspensão de todos os atletas vinculados a esta equipe
        await supabase.from('atletas').update({ status: 'Suspenso' }).eq('equipe_nome', infratorNome);
      }
    } catch(err) {
      console.error('Falha ao atualizar status na origem', err);
    }
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if(formData.infrator === '') { toast.error("Selecione um infrator"); return; }
    
    const penaltyString = formData.multaValor > 0 
      ? `${formData.jogosSuspensos} Jogos + Multa R$${formData.multaValor}` 
      : `${formData.jogosSuspensos} Jogos (Sem Multa)`;

    try {
      // 1. Salvar Suspensão
      const { error } = await supabase.from('suspensoes').insert([{
        infrator: formData.infrator,
        equipe: 'Julgamento Direto', // default fallback
        campeonato: 'Todos',
        motivo: formData.motivo,
        penas: penaltyString,
        multa_valor: formData.multaValor || 0,
        status: formData.status
      }]);
      if (error) throw error;

      // 2. Multa financeira (Opcional)
      if (formData.multaValor > 0) {
        await supabase.from('financeiro').insert([{
          descricao: `MULTA DISCIPLINAR: ${formData.infrator} - ${formData.motivo}`,
          equipe: formData.infrator,
          vencimento: new Date().toLocaleDateString('pt-BR'),
          valor: formData.multaValor,
          status: 'Debito Bloqueador',
          tipo: 'receita'
        }]);
      }

      // 3. Atualizar Entidade Associada (Cascata para equipes e atletas da equipe)
      if (formData.status === 'Ativa') {
        await suspenderAtletaNaOrigem(formData.infrator, activeTab);
      }

      toast.success('Punição Aplicada e sincronizada na nuvem!');
      setFormModalOpen(false);
      resetForm();
      fetchDados();
    } catch (error) {
      console.error('Erro ao salvar no tribunal:', error);
      toast.error('Erro ao aplicar punição');
    }
  };

  const resetForm = () => setFormData({ infrator: '', tipo: 'Automática', motivo: '', jogosSuspensos: 1, multaValor: 0, status: 'Ativa' });

  const suspensoesFiltradas = suspensoes.filter((s: any) => {
    const isNameMatch = s.infrator?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        s.motivo?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Identificar de onde o infrator veio para separar as abas
    const infratorData = infratoresList.find(i => i.nome === s.infrator);
    // Se não achar na lista, tenta deduzir pelo tipo de aba, mas o ideal é que ache.
    // Assumimos "Atleta" por padrão para registros legados, se não encontrados.
    const suspType = infratorData ? infratorData.tipo_origem : 'Atleta';
    
    const isTabMatch = activeTab === 'atletas' ? suspType === 'Atleta' : suspType === 'Equipe';
    
    return isNameMatch && isTabMatch;
  });

  const infratoresAtivosParaModal = infratoresList.filter(i => 
    activeTab === 'atletas' ? i.tipo_origem === 'Atleta' : i.tipo_origem === 'Equipe'
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tribunal & Suspensões</h1>
          <p className="text-sm text-slate-500 mt-1">Status bloqueante conectado ao banco de dados geral em Nuvem.</p>
        </div>
        <button onClick={() => { resetForm(); setFormModalOpen(true); }} className="inline-flex items-center justify-center rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 shadow-sm">
          <AlertTriangle className="-ml-1 mr-2 h-5 w-5" /> Iniciar Processo de {activeTab === 'atletas' ? 'Atleta' : 'Equipe'}
        </button>
      </div>

      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('atletas')}
          className={`px-4 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'atletas' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Suspensão de Atletas
        </button>
        <button 
          onClick={() => setActiveTab('equipes')}
          className={`px-4 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'equipes' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Suspensão de Equipes
        </button>
      </div>

      <div className="flex bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-full">
          <Search className="absolute left-3 top-2 h-5 w-5 text-slate-400" />
          <input type="text" className="block w-full rounded-md border-0 py-1.5 pl-10 ring-1 ring-inset ring-slate-300 focus:ring-blue-600 sm:text-sm" placeholder="Buscar infrator..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="text-center p-12 bg-white rounded-xl border"><p className="text-slate-500">Carregando processos...</p></div>
      ) : suspensoesFiltradas.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-xl border">
          <AlertTriangle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Nenhuma suspensão de {activeTab === 'atletas' ? 'atleta' : 'equipe'} encontrada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
           {suspensoesFiltradas.map((s: any) => (
              <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm border-l-4 border-l-rose-500 hover:shadow-md transition-shadow">
                 <h3 className="font-bold text-slate-900 text-lg mb-1">{s.infrator}</h3>
                 <span className="text-xs bg-slate-100 text-slate-600 px-2 flex items-center mb-4 rounded-md w-fit ring-1 ring-slate-200">Processo</span>
                 
                 <p className="text-sm text-slate-600 mb-2"><b>Motivo:</b> {s.motivo}</p>
                 <p className="text-sm text-rose-800 bg-rose-50 p-2 rounded border border-rose-100 mb-4 font-semibold"><b>PENA:</b> {s.penas}</p>
                 
                 <div className="flex justify-between items-center text-sm border-t border-slate-100 pt-3">
                   <span className={`font-bold ${s.status === 'Ativa' ? 'text-rose-600' : 'text-emerald-600'}`}>{s.status}</span>
                 </div>
              </div>
           ))}
        </div>
      )}

      <Modal isOpen={isFormModalOpen} onClose={() => setFormModalOpen(false)} title="Nova Penalidade Relacional">
        <form onSubmit={handleSalvar} className="space-y-4">
          <div className="bg-rose-50 p-3 rounded-lg border border-rose-100 mb-4">
            <label className="block text-sm font-bold text-rose-900">Selecione o Infrator da Nuvem ({activeTab === 'atletas' ? 'Atleta' : 'Equipe'})</label>
            <select required value={formData.infrator} onChange={e => setFormData({...formData, infrator: e.target.value})} className="mt-2 block w-full rounded-md border-slate-300 px-3 py-2 sm:text-sm border">
               <option value="">-- Buscar Cadastro --</option>
               {infratoresAtivosParaModal.map((inf, i) => (
                 <option key={i} value={inf.nome}>{inf.nome}</option>
               ))}
            </select>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Motivo (Súmula)</label>
              <input required type="text" value={formData.motivo} onChange={e => setFormData({...formData, motivo: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 border py-2 px-3 sm:text-sm" placeholder="Ex: Agressão ao árbitro" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Jogos Afastado</label>
              <input type="number" min="0" value={formData.jogosSuspensos} onChange={e => setFormData({...formData, jogosSuspensos: parseInt(e.target.value) || 0})} className="mt-1 block w-full rounded-md border-slate-300 border py-2 px-3 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-bold text-rose-700">Multa Financeira Acoplada (R$)</label>
              <input type="number" min="0" value={formData.multaValor} onChange={e => setFormData({...formData, multaValor: parseInt(e.target.value) || 0})} className="mt-1 block w-full rounded-md border-rose-300 bg-rose-50 border py-2 px-3 sm:text-sm text-rose-900 font-bold" />
            </div>
          </div>
          <p className="text-xs text-slate-500 italic border-t border-slate-100 pt-3">
             Ao aplicar, atualizaremos a entidade em nuvem. 
             {activeTab === 'equipes' && " CUIDADO: Suspender uma equipe suspenderá automaticamente TODOS os seus atletas."}
             {formData.multaValor > 0 && " Será emitido um débito bloqueante automático no Financeiro."}
          </p>
          <div className="pt-2 flex justify-end space-x-3">
            <button type="button" onClick={() => setFormModalOpen(false)} className="rounded-md bg-white border border-slate-300 px-3 py-2 text-sm">Cancelar</button>
            <button type="submit" className="rounded-md bg-rose-600 px-4 py-2 text-sm text-white hover:bg-rose-700 font-bold">Autuar Infrator na Nuvem</button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
