import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, UserPlus, X, Users } from 'lucide-react';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

export default function Equipes() {
  const [equipes, setEquipes] = useState(() => {
    const saved = localStorage.getItem('@nicolau:equipes');
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [campeonatosAtivos, setCampeonatosAtivos] = useState<any[]>([]);

  useEffect(() => {
    const caps = localStorage.getItem('@nicolau:campeonatos');
    if (caps) setCampeonatosAtivos(JSON.parse(caps));
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [equipeSelecionada, setEquipeSelecionada] = useState<any>(null);

  const [formData, setFormData] = useState({
    nome: '',
    fantasia: '',
    responsavel: '',
    contato: '',
    campeonato: '',
    taxaInscricao: 500,
    status: 'Regular'
  });

  const [elencoForm, setElencoForm] = useState<{ id: string, nome: string, documento: string, isExisting?: boolean }[]>([]);

  const addAtletaAoElenco = () => {
    setElencoForm([...elencoForm, { id: Date.now().toString(), nome: '', documento: '' }]);
  };

  const removeAtletaDoElenco = (id: string) => {
    setElencoForm(elencoForm.filter(a => a.id !== id));
  };
  
  const handleAtletaChange = (id: string, field: string, value: string) => {
    setElencoForm(elencoForm.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  useEffect(() => {
    localStorage.setItem('@nicolau:equipes', JSON.stringify(equipes));
  }, [equipes]);

  const filteredItems = equipes.filter((e: any) => 
    e.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.responsavel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.fantasia?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const currentItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const criarCobrancaAutomatica = (equipeNome: string, campeonatoNome: string, valor: number) => {
    const cobranca = {
      id: Date.now() + Math.random(),
      descricao: `Inscrição: ${equipeNome} (${campeonatoNome})`,
      vencimento: new Date().toLocaleDateString('pt-BR'),
      valor: valor,
      status: 'Atrasado', // Já cai como devendo até ele dar baixa
      tipo: 'receita'
    };
    const savedFin = localStorage.getItem('@nicolau:financeiro');
    const fin = savedFin ? JSON.parse(savedFin) : [];
    localStorage.setItem('@nicolau:financeiro', JSON.stringify([cobranca, ...fin]));
  };

  const handleCampeonatoChange = (capNome: string) => {
    const infoCap = campeonatosAtivos.find(c => c.nome === capNome);
    setFormData({ 
      ...formData, 
      campeonato: capNome, 
      taxaInscricao: infoCap ? Number(infoCap.taxaInscricao || 500) : 0 
    });
  };

  const processarAtletas = (nomeEquipe: string) => {
    const ats = JSON.parse(localStorage.getItem('@nicolau:atletas') || '[]');
    
    // Filtra os que já não são mais dessa equipe (porém os mantemos na base se o usuário não excluiu a equipe toda)
    let baseReduzida = ats.filter((a: any) => a.equipe !== nomeEquipe);
    
    const atletasSalvar = elencoForm.filter(a => a.nome.trim() !== '').map(a => ({
      id: a.isExisting ? Number(a.id) : Date.now() + Math.random(),
      nome: a.nome,
      documento: a.documento,
      posicao: 'Mapeado (Súmula)',
      equipe: nomeEquipe,
      campeonatoHeranca: formData.campeonato,
      categoria: 'Adulto',
      status: 'Regular'
    }));

    if(atletasSalvar.length > 0 || ats.length !== baseReduzida.length) {
      localStorage.setItem('@nicolau:atletas', JSON.stringify([...baseReduzida, ...atletasSalvar]));
    }
  };

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    const nova = { id: Date.now(), ...formData };
    setEquipes([nova, ...equipes]);
    
    processarAtletas(formData.nome);

    if (formData.campeonato !== '') {
      criarCobrancaAutomatica(formData.nome, formData.campeonato, formData.taxaInscricao);
      toast.success('Equipe salva e Atletas vinculados! Cobrança de inscrição gerada no Financeiro.', { duration: 5000 });
    } else {
      toast.success('Equipe e atletas salvos com sucesso!');
    }

    setFormModalOpen(false);
    resetForm();
  };

  const handleEditar = (e: React.FormEvent) => {
    e.preventDefault();
    setEquipes(equipes.map((eq: any) => eq.id === equipeSelecionada.id ? { ...eq, ...formData } : eq));
    
    processarAtletas(formData.nome);
    toast.success('Equipe atualizada e elenco vinculado com sucesso!');

    setEditModalOpen(false);
    resetForm();
  };

  const excluirEquipe = () => {
    if (confirm('Excluir esta equipe a removerá dos campeonatos ativos. Confirmar?')) {
      setEquipes(equipes.filter((eq: any) => eq.id !== equipeSelecionada.id));
      setEditModalOpen(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({ nome: '', fantasia: '', responsavel: '', contato: '', campeonato: '', taxaInscricao: 500, status: 'Regular' });
    setEquipeSelecionada(null);
    setElencoForm([]);
  };

  const abrirEditar = (equipe: any) => {
    setEquipeSelecionada(equipe);
    setFormData({
      nome: equipe.nome || '',
      fantasia: equipe.fantasia || '',
      responsavel: equipe.responsavel || '',
      contato: equipe.contato || '',
      campeonato: equipe.campeonato || '',
      taxaInscricao: 500, // Preço fixo mockado, no banco será da tebela campeonato
      status: equipe.status || 'Regular'
    });
    
    const ats = JSON.parse(localStorage.getItem('@nicolau:atletas') || '[]');
    setElencoForm(ats.filter((a: any) => a.equipe === equipe.nome).map((a: any) => ({
      id: a.id.toString(),
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
          <p className="text-sm text-slate-500 mt-1">Inscreva equipes nos campeonatos. Isto gera movimentação no Financeiro.</p>
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

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
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
            {currentItems.map((equipe: any) => (
              <tr key={equipe.id} className="hover:bg-slate-50">
                <td className="whitespace-nowrap py-4 pl-4 pr-3">
                  <div className="flex items-center">
                    <img className="h-10 w-10 flex-shrink-0 rounded-full bg-slate-100 object-cover border border-slate-200" src={`https://avatar.iran.liara.run/public/boy?username=${equipe.nome}`} referrerPolicy="no-referrer" />
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
              <select value={formData.campeonato} onChange={e => handleCampeonatoChange(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 border py-2 px-3 sm:text-sm">
                <option value="">Nenhum (Só Cadastrar)</option>
                {campeonatosAtivos.map(camp => (
                  <option key={camp.id} value={camp.nome}>{camp.nome} ({camp.categoria})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-900">Taxa de Inscrição Gerada (R$)</label>
              <input type="number" disabled value={formData.campeonato ? formData.taxaInscricao : 0} className="mt-1 block w-full rounded-md border-slate-300 bg-slate-100 text-slate-500 border py-2 px-3 sm:text-sm" />
              <p className="text-[10px] text-blue-700 mt-1">Lançamento automático no módulo Financeiro ao salvar.</p>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-bold text-slate-800 flex items-center gap-2">
                <Users className="h-5 w-5 text-slate-400" />
                Elenco da Equipe (Opcional)
              </label>
              <button 
                type="button" 
                onClick={addAtletaAoElenco} 
                className="flex items-center gap-1 text-xs font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-3 py-1.5 rounded"
              >
                <UserPlus className="h-4 w-4" /> Adicionar Atleta
              </button>
            </div>
            
            {elencoForm.length === 0 ? (
              <p className="text-xs text-slate-500 italic bg-amber-50 p-3 rounded border border-amber-100">
                Você pode registrar os jogadores depois, ou adicioná-los agora para já vinculá-los à equipe.
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
                      />
                      <input 
                        type="text" 
                        placeholder="Documento (RG/CPF)" 
                        className="block w-full text-xs rounded border-slate-300 py-1.5 px-2" 
                        value={atleta.documento}
                        onChange={e => handleAtletaChange(atleta.id, 'documento', e.target.value)}
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeAtletaDoElenco(atleta.id)}
                      className="absolute right-2 top-2 text-rose-500 hover:text-rose-700 bg-white rounded-full p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end space-x-3 mt-2">
            <button type="button" onClick={() => setFormModalOpen(false)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">Cancelar</button>
            <button type="submit" className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white">Inscrever Equipe</button>
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
                Elenco da Equipe (Opcional)
              </label>
              <button 
                type="button" 
                onClick={addAtletaAoElenco} 
                className="flex items-center gap-1 text-xs font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-3 py-1.5 rounded"
              >
                <UserPlus className="h-4 w-4" /> Adicionar Atleta
              </button>
            </div>
            
            {elencoForm.length === 0 ? (
              <p className="text-xs text-slate-500 italic bg-amber-50 p-3 rounded border border-amber-100">
                A equipe ainda não possui atletas vinculados.
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
                      />
                      <input 
                        type="text" 
                        placeholder="Documento (RG/CPF)" 
                        className="block w-full text-xs rounded border-slate-300 py-1.5 px-2" 
                        value={atleta.documento}
                        onChange={e => handleAtletaChange(atleta.id, 'documento', e.target.value)}
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeAtletaDoElenco(atleta.id)}
                      className="absolute right-2 top-2 text-rose-500 hover:text-rose-700 bg-white rounded-full p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-between mt-6 border-t border-slate-100 pt-4">
            <button type="button" onClick={excluirEquipe} className="text-rose-600 text-sm font-semibold">Excluir Registro da Equipe</button>
            <div className="space-x-3">
              <button type="button" onClick={() => setEditModalOpen(false)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">Cancelar</button>
              <button type="submit" className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white">Editar</button>
            </div>
          </div>
        </form>
      </Modal>

    </div>
  );
}
