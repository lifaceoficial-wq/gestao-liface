import React, { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

export default function Atletas() {
  const [atletas, setAtletas] = useState<any[]>([]);
  const [equipesCadastradas, setEquipesCadastradas] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [isLoading, setIsLoading] = useState(true);

  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [atletaSelecionado, setAtletaSelecionado] = useState<any>(null);

  const [formData, setFormData] = useState({
    nome: '',
    apelido: '',
    documento: '',
    posicao: '',
    equipe_id: '',
    equipe_nome: '',
    campeonato_heranca: '',
    historico: 'Limpo',
    status: 'Regular',
    taxaCarteira: 15
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch equipes
      const { data: eqs, error: eqError } = await supabase.from('equipes').select('*').order('nome');
      if (eqError) throw eqError;
      setEquipesCadastradas(eqs || []);

      // Fetch atletas
      const { data: ats, error: atError } = await supabase.from('atletas').select('*').order('nome');
      if (atError) throw atError;
      
      // Mapear propriedades para compatibilidade com o layout
      const formattedAts = (ats || []).map(a => ({
        ...a,
        equipe: a.equipe_nome,
        taxaCarteira: a.taxa_carteira
      }));
      setAtletas(formattedAts);
    } catch (error: any) {
      toast.error('Erro ao buscar dados: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredItems = atletas.filter((a: any) => 
    a.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.equipe?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const criarCobrancaCarteirinha = async (atletaNome: string, equipeNome: string, valor: number) => {
    try {
      await supabase.from('financeiro').insert([{
        descricao: `Carteira Atleta: ${atletaNome} (${equipeNome})`,
        equipe: equipeNome,
        vencimento: new Date().toLocaleDateString('pt-BR'),
        valor: valor,
        status: 'Pago',
        tipo: 'receita'
      }]);
    } catch (error) {
      console.error('Erro ao gerar cobrança automática:', error);
    }
  };

  const handleEquipeChange = (equipeIdStr: string) => {
    const infoEquipe = equipesCadastradas.find(e => e.id === equipeIdStr);
    if (!infoEquipe) return;
    setFormData({ 
      ...formData, 
      equipe_id: infoEquipe.id,
      equipe_nome: infoEquipe.nome,
      campeonato_heranca: infoEquipe.campeonato_nome || '' 
    });
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!formData.equipe_id) { toast.error('Selecione uma equipe!'); return; }

    const loadingToast = toast.loading('Salvando atleta...');
    try {
      const payload = {
        nome: formData.nome,
        apelido: formData.apelido,
        documento: formData.documento,
        posicao: formData.posicao,
        equipe_id: formData.equipe_id,
        equipe_nome: formData.equipe_nome,
        campeonato_heranca: formData.campeonato_heranca,
        historico: formData.historico,
        status: formData.status,
        taxa_carteira: formData.taxaCarteira
      };

      const { data, error } = await supabase.from('atletas').insert([payload]).select();
      if (error) throw error;
      
      if (data && data[0]) {
        const newAtleta = {
           ...data[0],
           equipe: data[0].equipe_nome,
           taxaCarteira: data[0].taxa_carteira
        };
        setAtletas([newAtleta, ...atletas]);
      }

      await criarCobrancaCarteirinha(formData.nome, formData.equipe_nome, formData.taxaCarteira);
      
      toast.success('Atleta salvo no Supabase! A carteirinha foi registrada como Paga no Financeiro.', { id: loadingToast });
      setFormModalOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message, { id: loadingToast });
    }
  };

  const handleEditar = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading('Atualizando atleta...');
    try {
      const payload = {
        nome: formData.nome,
        documento: formData.documento,
        posicao: formData.posicao,
        status: formData.status
      };

      const { error } = await supabase.from('atletas').update(payload).eq('id', atletaSelecionado.id);
      if (error) throw error;

      setAtletas(atletas.map((a: any) => a.id === atletaSelecionado.id ? { ...a, ...payload } : a));
      toast.success('Atleta atualizado!', { id: loadingToast });

      setEditModalOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error('Erro ao atualizar: ' + error.message, { id: loadingToast });
    }
  };

  const excluirAtleta = async () => {
    const loadingToast = toast.loading('Excluindo atleta...');
    try {
      const { error } = await supabase.from('atletas').delete().eq('id', atletaSelecionado.id);
      if (error) throw error;
      
      setAtletas(atletas.filter((a: any) => a.id !== atletaSelecionado.id));
      toast.success('Atleta excluído do Supabase!', { id: loadingToast });
      setEditModalOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error('Erro: ' + error.message, { id: loadingToast });
    }
  };

  const resetForm = () => {
    setFormData({ nome: '', apelido: '', documento: '', posicao: '', equipe_id: '', equipe_nome: '', campeonato_heranca: '', historico: 'Limpo', status: 'Regular', taxaCarteira: 15 });
    setAtletaSelecionado(null);
  };

  const abrirEditar = (atleta: any) => {
    setAtletaSelecionado(atleta);
    setFormData({ 
      ...atleta, 
      equipe_id: atleta.equipe_id || '',
      equipe_nome: atleta.equipe_nome || atleta.equipe || '',
      taxaCarteira: atleta.taxa_carteira || 15 
    });
    setEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Inscrição de Atletas</h1>
          <p className="text-sm text-slate-500 mt-1">Vincule atletas a equipes. Dados agora salvos na nuvem (Supabase).</p>
        </div>
        <button onClick={() => { resetForm(); setFormModalOpen(true); }} className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <Plus className="-ml-1 mr-2 w-5 h-5" /> Novo Atleta
        </button>
      </div>

      <div className="flex bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-full">
          <Search className="absolute left-3 top-2 h-5 w-5 text-slate-400" />
          <input type="text" className="block w-full rounded-md border-0 py-1.5 pl-10 ring-1 ring-inset ring-slate-300 focus:ring-blue-600 sm:text-sm" placeholder="Buscar atleta ou equipe..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Caregando atletas do banco de dados...</div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900">Atleta</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Equipe / Campeonato</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Status Disciplinar</th>
                <th className="relative py-3.5 pr-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-sm text-slate-500">Nenhum atleta encontrado.</td>
                </tr>
              ) : currentItems.map((atleta: any) => (
                <tr key={atleta.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 flex items-center gap-3">
                    <img className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200" src={`https://avatar.iran.liara.run/public/boy?username=${atleta.nome.replace(' ', '')}`} referrerPolicy="no-referrer" />
                    <div>
                      <div className="font-medium text-slate-900">{atleta.nome} {atleta.documento ? `(Doc: ${atleta.documento})` : ''}</div>
                      <div className="text-slate-500 text-xs">{atleta.apelido || atleta.posicao || 'Sem apelido/posição'}</div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4">
                    <div className="text-sm font-bold text-slate-800">{atleta.equipe}</div>
                    <div className="text-xs text-blue-600">{atleta.campeonato_heranca || 'Sem campeonato vinculado'}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset ${
                        atleta.status === 'Regular' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 
                        atleta.status === 'Suspenso' ? 'bg-rose-50 text-rose-700 ring-rose-600/20' : 'bg-amber-50 text-amber-700 ring-amber-600/20'
                      }`}>
                        {atleta.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap py-4 pr-4 text-right">
                    <button onClick={() => abrirEditar(atleta)} className="text-blue-600 bg-white px-3 py-1 rounded border border-slate-200">Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={isFormModalOpen} onClose={() => setFormModalOpen(false)} title="Cadastrar Atleta Oficial">
        <form onSubmit={handleSalvar} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Nome Completo</label>
              <input required type="text" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="mt-1 block w-full rounded border-slate-300 px-3 py-2 border shadow-sm sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Apelido (Súmula)</label>
              <input type="text" value={formData.apelido} onChange={e => setFormData({...formData, apelido: e.target.value})} className="mt-1 block w-full rounded border-slate-300 px-3 py-2 border shadow-sm sm:text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Documento (RG/CPF)</label>
              <input type="text" value={formData.documento} onChange={e => setFormData({...formData, documento: e.target.value})} className="mt-1 block w-full rounded border-slate-300 px-3 py-2 border shadow-sm sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Posição</label>
              <input type="text" placeholder="Goleiro, Fixo, Ala..." value={formData.posicao} onChange={e => setFormData({...formData, posicao: e.target.value})} className="mt-1 block w-full rounded border-slate-300 px-3 py-2 border shadow-sm sm:text-sm" />
            </div>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mt-2 space-y-3">
            <h3 className="text-sm font-bold text-slate-800">Vínculos Relacionais</h3>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase">1. Selecione a Equipe Existente</label>
              <select required value={formData.equipe_id} onChange={e => handleEquipeChange(e.target.value)} className="mt-1 block w-full rounded border-slate-300 px-3 py-2 sm:text-sm">
                <option value="">-- Escolher Equipe --</option>
                {equipesCadastradas.map(eq => (
                  <option key={eq.id} value={eq.id}>{eq.nome}</option>
                ))}
              </select>
            </div>
            {formData.equipe_id && (
              <div>
                 <label className="block text-xs font-medium text-slate-500 uppercase">2. Campeonato (Herança Automática)</label>
                 <input disabled type="text" value={formData.campeonato_heranca || 'Nenhum campeonato nessa equipe'} className="mt-1 block w-full rounded bg-slate-200 border-slate-300 px-3 py-2 sm:text-sm text-slate-600 italic" />
              </div>
            )}
          </div>

          <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 mt-2">
            <span className="text-xs font-bold text-emerald-800">Emissão de Carteirinha (Financeiro na Nuvem)</span>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-sm">Taxa de Cadastro:</span>
              <span className="font-bold">R$ {formData.taxaCarteira},00</span>
            </div>
          </div>

          <div className="flex justify-end pt-4 space-x-3">
             <button type="button" onClick={() => setFormModalOpen(false)} className="px-3 py-2 text-sm border rounded">Cancelar</button>
             <button type="submit" disabled={isLoading} className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">Matricular Atleta</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} title="Editar Cadastro de Atleta">
         <form onSubmit={handleEditar} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm">Nome Completo</label>
              <input required type="text" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="block w-full rounded border-slate-300 px-3 py-2 sm:text-sm border" />
            </div>
            <div>
              <label className="text-sm">Documento</label>
              <input type="text" value={formData.documento} onChange={e => setFormData({...formData, documento: e.target.value})} className="block w-full rounded border-slate-300 px-3 py-2 sm:text-sm border" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm">Posição</label>
              <input type="text" value={formData.posicao} onChange={e => setFormData({...formData, posicao: e.target.value})} className="block w-full rounded border-slate-300 px-3 py-2 sm:text-sm border" />
            </div>
            <div>
              <label className="text-sm">Status Disciplinar</label>
              <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="block w-full rounded border-slate-300 px-3 py-2 sm:text-sm border">
                <option>Regular</option>
                <option>Irregular</option>
                <option>Suspenso</option>
              </select>
            </div>
          </div>
          <div className="flex justify-between pt-4">
             <button type="button" onClick={excluirAtleta} className="text-rose-600 text-sm font-semibold">Apagar Atleta</button>
             <div className="space-x-3">
               <button type="button" onClick={() => setEditModalOpen(false)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">Cancelar</button>
               <button type="submit" className="px-3 py-2 text-sm bg-blue-600 text-white rounded">Atualizar Dados</button>
             </div>
          </div>
         </form>
      </Modal>
    </div>
  );
}
