import React, { useState, useEffect } from 'react';
import { Plus, Search, UserPlus, X, Users } from 'lucide-react';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

export default function Equipes() {
  const [equipes, setEquipes] = useState<any[]>([]);
  const [campeonatosAtivos, setCampeonatosAtivos] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [isLoading, setIsLoading] = useState(true);

  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [equipeSelecionada, setEquipeSelecionada] = useState<any>(null);

  const [formData, setFormData] = useState({
    nome: '',
    fantasia: '',
    responsavel: '',
    contato: '',
    campeonato_id: '',
    campeonato_nome: '',
    taxaInscricao: 500,
    status: 'Regular'
  });

  const [elencoForm, setElencoForm] = useState<{ id: string, nome: string, documento: string, isExisting?: boolean }[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch campeonatos
      const { data: caps, error: capError } = await supabase.from('campeonatos').select('*');
      if (capError) throw capError;
      setCampeonatosAtivos(caps || []);

      // 2. Fetch equipes
      const { data: eqs, error: eqError } = await supabase.from('equipes').select('*').order('nome');
      if (eqError) throw eqError;
      
      const formattedEqs = (eqs || []).map(e => ({
        ...e,
        campeonato: e.campeonato_nome
      }));
      setEquipes(formattedEqs);
    } catch (error: any) {
      toast.error('Erro ao buscar equipes: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const addAtletaAoElenco = () => {
    setElencoForm([...elencoForm, { id: Date.now().toString(), nome: '', documento: '' }]);
  };

  const removeAtletaDoElenco = (id: string) => {
    setElencoForm(elencoForm.filter(a => a.id !== id));
  };
  
  const handleAtletaChange = (id: string, field: string, value: string) => {
    setElencoForm(elencoForm.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const filteredItems = equipes.filter((e: any) => 
    e.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (e.responsavel && e.responsavel.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (e.fantasia && e.fantasia.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const currentItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const criarCobrancaAutomatica = async (equipeNome: string, campeonatoNome: string, valor: number) => {
    try {
      await supabase.from('financeiro').insert([{
        descricao: `Inscrição: ${equipeNome} (${campeonatoNome})`,
        equipe: equipeNome,
        vencimento: new Date().toLocaleDateString('pt-BR'),
        valor: valor,
        status: 'Atrasado',
        tipo: 'receita'
      }]);
    } catch (error) {
      console.error('Erro ao criar cobranca', error);
    }
  };

  const handleCampeonatoChange = (campId: string) => {
    const infoCap = campeonatosAtivos.find(c => c.id === campId);
    if (!infoCap) return;
    setFormData({ 
      ...formData, 
      campeonato_id: infoCap.id,
      campeonato_nome: infoCap.nome,
      taxaInscricao: Number(infoCap.taxa_inscricao || 500) 
    });
  };

  const processarAtletas = async (equipeId: string, equipeNome: string) => {
    const atletasSalvar = elencoForm
      .filter(a => a.nome.trim() !== '' && !a.isExisting)
      .map(a => ({
        nome: a.nome,
        documento: a.documento,
        posicao: 'Mapeado (Súmula)',
        equipe_id: equipeId,
        equipe_nome: equipeNome,
        campeonato_heranca: formData.campeonato_nome,
        status: 'Regular',
        taxa_carteira: 15
      }));

    if(atletasSalvar.length > 0) {
      await supabase.from('atletas').insert(atletasSalvar);
      // Cobranca atletas nao cobramos em lote para nao travar.
    }
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading('Salvando equipe...');
    
    try {
      const payload = {
        nome: formData.nome,
        fantasia: formData.fantasia,
        responsavel: formData.responsavel,
        contato: formData.contato,
        campeonato_id: formData.campeonato_id || null,
        campeonato_nome: formData.campeonato_nome || null,
        taxa_inscricao: formData.taxaInscricao,
        status: formData.status
      };

      const { data, error } = await supabase.from('equipes').insert([payload]).select();
      if (error) throw error;

      if (data && data[0]) {
        await processarAtletas(data[0].id, data[0].nome);

        // Atualiza a grid
        setEquipes([{...data[0], campeonato: data[0].campeonato_nome}, ...equipes]);

        // Gerar cobranca se vinculado campeonato
        if (payload.campeonato_id) {
          await criarCobrancaAutomatica(payload.nome, payload.campeonato_nome!, payload.taxa_inscricao);
          toast.success('Equipe e atletas salvos! Cobrança gerada no Financeiro.', { id: loadingToast });
        } else {
          toast.success('Equipe cadastrada (Sem campeonato = sem cobrança).', { id: loadingToast });
        }
      }

      setFormModalOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message, { id: loadingToast });
    }
  };

  const handleEditar = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading('Atualizando equipe...');
    
    try {
      const payload = {
        nome: formData.nome,
        fantasia: formData.fantasia,
        responsavel: formData.responsavel,
        contato: formData.contato,
        status: formData.status
      };

      const { error } = await supabase.from('equipes').update(payload).eq('id', equipeSelecionada.id);
      if (error) throw error;
      
      // Salvar os novos atletas de elenco que o usuario registrou agora
      await processarAtletas(equipeSelecionada.id, formData.nome);

      setEquipes(equipes.map((eq: any) => eq.id === equipeSelecionada.id ? { ...eq, ...payload } : eq));
      toast.success('Equipe atualizada com sucesso!', { id: loadingToast });

      setEditModalOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error('Erro ao atualizar: ' + error.message, { id: loadingToast });
    }
  };

  const excluirEquipe = async () => {
    if (confirm('Excluir esta equipe a removerá dos campeonatos ativos. Confirmar?')) {
      const loadingToast = toast.loading('Excluindo equipe e seus atletas associados...');
      try {
        const { error } = await supabase.from('equipes').delete().eq('id', equipeSelecionada.id);
        if (error) throw error;
        
        setEquipes(equipes.filter((eq: any) => eq.id !== equipeSelecionada.id));
        toast.success('Equipe excluída!', { id: loadingToast });
        
        setEditModalOpen(false);
        resetForm();
      } catch (error: any) {
        toast.error('Erro ao excluir: ' + error.message, { id: loadingToast });
      }
    }
  };

  const resetForm = () => {
    setFormData({ nome: '', fantasia: '', responsavel: '', contato: '', campeonato_id: '', campeonato_nome: '', taxaInscricao: 500, status: 'Regular' });
    setEquipeSelecionada(null);
    setElencoForm([]);
  };

  const abrirEditar = async (equipe: any) => {
    setEquipeSelecionada(equipe);
    setFormData({
      nome: equipe.nome || '',
      fantasia: equipe.fantasia || '',
      responsavel: equipe.responsavel || '',
      contato: equipe.contato || '',
      campeonato_id: equipe.campeonato_id || '',
      campeonato_nome: equipe.campeonato_nome || '',
      taxaInscricao: equipe.taxa_inscricao || 500,
      status: equipe.status || 'Regular'
    });
    
    // Buscar elenco já cadastrado no banco pra essa equipe:
    const { data: ats } = await supabase.from('atletas').select('id, nome, documento').eq('equipe_id', equipe.id);
    setElencoForm((ats || []).map((a: any) => ({
      id: a.id,
      nome: a.nome,
      documento: a.documento || '',
      isExisting: true
    })));

    setEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Inscrição de Equipes</h1>
          <p className="text-sm text-slate-500 mt-1">Inscreva equipes em campeonatos em nuvem (Supabase).</p>
        </div>
        <button onClick={() => { resetForm(); setFormModalOpen(true); }} className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <Plus className="-ml-1 mr-2 h-5 w-5" /> Nova Equipe
        </button>
      </div>

      <div className="flex bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input type="text" className="block w-full rounded-md border-0 py-1.5 pl-10 ring-1 ring-inset ring-slate-300 focus:ring-blue-600 sm:text-sm" placeholder="Buscar equipes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm min-h-[60vh]">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Caregando equipes do banco de dados...</div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900">Equipe</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Responsável</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Contato</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Competição</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Status</th>
                <th className="relative py-3.5 pr-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-slate-500">Nenhuma equipe encontrada.</td>
                </tr>
              ) : currentItems.map((equipe: any) => (
                <tr key={equipe.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap py-4 pl-4 pr-3">
                    <div className="flex items-center">
                      <img className="h-10 w-10 flex-shrink-0 rounded-full bg-slate-100 object-cover border border-slate-200" src={`https://avatar.iran.liara.run/public/boy?username=${equipe.nome.replace(' ', '')}`} referrerPolicy="no-referrer" />
                      <div className="ml-4">
                        <div className="font-medium text-slate-900">{equipe.nome}</div>
                        <div className="text-slate-500 text-xs">{equipe.fantasia}</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{equipe.responsavel}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{equipe.contato}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-blue-700">{equipe.campeonato || 'Nenhum'}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md ring-1 ring-inset ${
                      equipe.status === 'Regular' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-rose-50 text-rose-700 ring-rose-600/20'
                    }`}>{equipe.status}</span>
                  </td>
                  <td className="relative whitespace-nowrap py-4 pr-4 text-right">
                    <button onClick={() => abrirEditar(equipe)} className="text-blue-600 bg-white px-3 py-1 rounded-md border border-slate-200 hover:bg-slate-50">Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={isFormModalOpen} onClose={() => setFormModalOpen(false)} title="Cadastrar & Inscrever Nova Equipe">
        <form onSubmit={handleSalvar} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Nome Oficial</label>
              <input required type="text" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 border py-2 px-3 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Nome Fantasia / Apelido</label>
              <input type="text" value={formData.fantasia} onChange={e => setFormData({...formData, fantasia: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 border py-2 px-3 sm:text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 mt-2 pt-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Responsável (Dirigente)</label>
              <input required type="text" value={formData.responsavel} onChange={e => setFormData({...formData, responsavel: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 border py-2 px-3 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Contato / WhatsApp</label>
              <input required type="text" value={formData.contato} onChange={e => setFormData({...formData, contato: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 border py-2 px-3 sm:text-sm" placeholder="(85) 90000-0000" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 bg-blue-50/50 p-3 rounded-lg border border-blue-100 mt-2">
            <div>
              <label className="block text-sm font-bold text-blue-900">Vincular a Campeonato Ativo</label>
              <select value={formData.campeonato_id} onChange={e => handleCampeonatoChange(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 border py-2 px-3 sm:text-sm">
                <option value="">Nenhum (Só Cadastrar)</option>
                {campeonatosAtivos.map(camp => (
                  <option key={camp.id} value={camp.id}>{camp.nome} ({camp.categoria})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-900">Taxa Inscrição Sincronizada (R$)</label>
              <input type="number" disabled value={formData.campeonato_id ? formData.taxaInscricao : 0} className="mt-1 block w-full rounded-md border-slate-300 bg-slate-100 text-slate-500 border py-2 px-3 sm:text-sm" />
              <p className="text-[10px] text-blue-700 mt-1">Lançamento automático no Financeiro.</p>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-bold text-slate-800 flex items-center gap-2">
                <Users className="h-5 w-5 text-slate-400" />
                Matricular Elenco Expresso (Opcional)
              </label>
              <button 
                type="button" 
                onClick={addAtletaAoElenco} 
                className="flex items-center gap-1 text-xs font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-3 py-1.5 rounded"
              >
                <UserPlus className="h-4 w-4" /> Add Linha
              </button>
            </div>
            
            {elencoForm.length === 0 ? (
              <p className="text-xs text-slate-500 italic bg-amber-50 p-3 rounded border border-amber-100">
                Lembrete: Você pode registrar o elenco mais tarde pelo menu 'Atletas'.
              </p>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {elencoForm.map((atleta, index) => (
                  <div key={atleta.id} className="flex gap-2 items-start bg-slate-50 p-2 rounded-md border border-slate-200 shadow-sm relative pr-8">
                    <span className="text-xs font-bold text-slate-400 absolute left-2 top-4">#{index+1}</span>
                    <div className="flex-1 ml-6 space-y-2">
                      <input 
                        required
                        type="text" 
                        placeholder="Nome Completo do Atleta" 
                        className="block w-full text-sm rounded border-slate-300 py-1.5 px-2" 
                        value={atleta.nome}
                        onChange={e => handleAtletaChange(atleta.id, 'nome', e.target.value)}
                        readOnly={atleta.isExisting}
                      />
                      <input 
                        type="text" 
                        placeholder="Documento (RG/CPF)" 
                        className="block w-full text-xs rounded border-slate-300 py-1.5 px-2" 
                        value={atleta.documento}
                        onChange={e => handleAtletaChange(atleta.id, 'documento', e.target.value)}
                        readOnly={atleta.isExisting}
                      />
                    </div>
                    {!atleta.isExisting && (
                      <button 
                        type="button" 
                        onClick={() => removeAtletaDoElenco(atleta.id)}
                        className="absolute right-2 top-2 text-rose-500 hover:text-rose-700 bg-white rounded-full p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end space-x-3 mt-2">
            <button type="button" onClick={() => setFormModalOpen(false)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">Cancelar</button>
            <button type="submit" disabled={isLoading} className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white disabled:opacity-50">Inscrever Equipe</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} title="Editar Equipe">
        <form onSubmit={handleEditar} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Nome Oficial</label>
              <input required type="text" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 border py-2 px-3 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Nome Fantasia / Apelido</label>
              <input type="text" value={formData.fantasia} onChange={e => setFormData({...formData, fantasia: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 border py-2 px-3 sm:text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Responsável (Dirigente)</label>
              <input required type="text" value={formData.responsavel} onChange={e => setFormData({...formData, responsavel: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 border py-2 px-3 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Contato / WhatsApp</label>
              <input required type="text" value={formData.contato} onChange={e => setFormData({...formData, contato: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 border py-2 px-3 sm:text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Status Vigente</label>
            <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 border py-2 px-3 sm:text-sm">
                <option>Regular</option>
                <option>Irregular</option>
                <option>SuspensaRegras</option>
            </select>
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-bold text-slate-800 flex items-center gap-2">
                <Users className="h-5 w-5 text-slate-400" />
                Matricular Elenco Expresso (Opcional)
              </label>
              <button 
                type="button" 
                onClick={addAtletaAoElenco} 
                className="flex items-center gap-1 text-xs font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-3 py-1.5 rounded"
              >
                <UserPlus className="h-4 w-4" /> Add Linha
              </button>
            </div>
            
            {elencoForm.length === 0 ? (
              <p className="text-xs text-slate-500 italic bg-amber-50 p-3 rounded border border-amber-100">
                A equipe não possui elenco vinculado.
              </p>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {elencoForm.map((atleta, index) => (
                  <div key={atleta.id} className="flex gap-2 items-start bg-slate-50 p-2 rounded-md border border-slate-200 shadow-sm relative pr-8">
                    <span className="text-xs font-bold text-slate-400 absolute left-2 top-4">#{index+1}</span>
                    <div className="flex-1 ml-6 space-y-2">
                      <input 
                        required
                        type="text" 
                        placeholder="Nome Completo do Atleta" 
                        className={`block w-full text-sm rounded border-slate-300 py-1.5 px-2 ${atleta.isExisting ? 'bg-slate-200' : ''}`} 
                        value={atleta.nome}
                        onChange={e => handleAtletaChange(atleta.id, 'nome', e.target.value)}
                        readOnly={atleta.isExisting}
                      />
                      <input 
                        type="text" 
                        placeholder="Documento (RG/CPF)" 
                        className={`block w-full text-xs rounded border-slate-300 py-1.5 px-2 ${atleta.isExisting ? 'bg-slate-200' : ''}`} 
                        value={atleta.documento}
                        onChange={e => handleAtletaChange(atleta.id, 'documento', e.target.value)}
                        readOnly={atleta.isExisting}
                      />
                    </div>
                    {!atleta.isExisting && (
                      <button 
                        type="button" 
                        onClick={() => removeAtletaDoElenco(atleta.id)}
                        className="absolute right-2 top-2 text-rose-500 hover:text-rose-700 bg-white rounded-full p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-between mt-6 border-t border-slate-100 pt-4">
            <button type="button" onClick={excluirEquipe} className="text-rose-600 text-sm font-semibold">Excluir Registo da Equipe</button>
            <div className="space-x-3">
              <button type="button" onClick={() => setEditModalOpen(false)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">Cancelar</button>
              <button type="submit" disabled={isLoading} className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white disabled:opacity-50">Salvar Mudanças</button>
            </div>
          </div>
        </form>
      </Modal>

    </div>
  );
}
