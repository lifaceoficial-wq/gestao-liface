import React, { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

const formatPhone = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1');
};

const formatCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

const validateCPF = (cpf: string) => {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf === '') return false;
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  
  let add = 0;
  for (let i = 0; i < 9; i++) add += parseInt(cpf.charAt(i)) * (10 - i);
  let rev = 11 - (add % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cpf.charAt(9))) return false;
  
  add = 0;
  for (let i = 0; i < 10; i++) add += parseInt(cpf.charAt(i)) * (11 - i);
  rev = 11 - (add % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cpf.charAt(10))) return false;
  
  return true;
};

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
    telefone: '',
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

    const channel = supabase
      .channel('atletas_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'atletas' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
    if (!formData.documento || !validateCPF(formData.documento)) {
      toast.error('CPF inválido! Por favor, insira um CPF válido.');
      return;
    }
    
    // Verifica duplicidade usando o array "atletas" em memória - APENAS para a MESMA equipe
    const isDuplicate = atletas.some(a => a.documento === formData.documento && a.equipe_id === formData.equipe_id);
    if (isDuplicate) {
      toast.error('Este CPF já está cadastrado NESTA mesma equipe!');
      return;
    }

    const loadingToast = toast.loading('Salvando atleta...');
    try {
    const payload = {
      nome: formData.nome,
      apelido: formData.apelido,
      documento: formData.documento,
      telefone: formData.telefone,
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
    
    if (!formData.documento || !validateCPF(formData.documento)) {
      toast.error('CPF inválido! Por favor, insira um CPF válido.');
      return;
    }
    
    const isDuplicate = atletas.some(a => a.documento === formData.documento && a.equipe_id === (formData.equipe_id || atletaSelecionado.equipe_id) && a.id !== atletaSelecionado.id);
    if (isDuplicate) {
      toast.error('Este CPF já está cadastrado NESTA equipe em outro atleta!');
      return;
    }

    const loadingToast = toast.loading('Atualizando atleta...');
    try {
    const payload = {
      nome: formData.nome,
      documento: formData.documento,
      telefone: formData.telefone,
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
    setFormData({ nome: '', apelido: '', documento: '', telefone: '', posicao: '', equipe_id: '', equipe_nome: '', campeonato_heranca: '', historico: 'Limpo', status: 'Regular', taxaCarteira: 15 });
    setAtletaSelecionado(null);
  };

  const abrirEditar = (atleta: any) => {
    setAtletaSelecionado(atleta);
    setFormData({ 
      ...atleta, 
      telefone: atleta.telefone || '',
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

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm min-h-[60vh]">
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
                      <div className="font-medium text-slate-900">{atleta.nome} {atleta.documento ? `(CPF: ${atleta.documento})` : ''}</div>
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
                    <div className="flex items-center justify-end gap-2">
                      {atleta.telefone && (
                        <a href={`whatsapp://send?phone=55${atleta.telefone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-emerald-600 hover:text-emerald-700 p-1.5 rounded-md hover:bg-emerald-50" title="WhatsApp">
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                          </svg>
                        </a>
                      )}
                      <button onClick={() => abrirEditar(atleta)} className="text-blue-600 bg-white px-3 py-1 rounded border border-slate-200">Editar</button>
                    </div>
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
              <label className="block text-sm font-medium text-slate-700">CPF</label>
              <input required type="text" placeholder="000.000.000-00" value={formData.documento} onChange={e => setFormData({...formData, documento: formatCPF(e.target.value)})} className="mt-1 block w-full rounded border-slate-300 px-3 py-2 border shadow-sm sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Telefone / WhatsApp</label>
              <input type="text" placeholder="(00) 00000-0000" value={formData.telefone} onChange={e => setFormData({...formData, telefone: formatPhone(e.target.value)})} className="mt-1 block w-full rounded border-slate-300 px-3 py-2 border shadow-sm sm:text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
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
              <label className="text-sm">CPF</label>
              <input required type="text" placeholder="000.000.000-00" value={formData.documento} onChange={e => setFormData({...formData, documento: formatCPF(e.target.value)})} className="block w-full rounded border-slate-300 px-3 py-2 sm:text-sm border" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm">Telefone / WhatsApp</label>
              <input type="text" placeholder="(00) 00000-0000" value={formData.telefone} onChange={e => setFormData({...formData, telefone: formatPhone(e.target.value)})} className="block w-full rounded border-slate-300 px-3 py-2 sm:text-sm border" />
            </div>
            <div>
              <label className="text-sm">Posição</label>
              <input type="text" value={formData.posicao} onChange={e => setFormData({...formData, posicao: e.target.value})} className="block w-full rounded border-slate-300 px-3 py-2 sm:text-sm border" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
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
