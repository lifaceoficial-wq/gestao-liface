import React, { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

export default function Atletas() {
  const [atletas, setAtletas] = useState(() => {
    const saved = localStorage.getItem('@nicolau:atletas');
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [equipesCadastradas, setEquipesCadastradas] = useState<any[]>([]);

  useEffect(() => {
    const eqs = localStorage.getItem('@nicolau:equipes');
    if (eqs) setEquipesCadastradas(JSON.parse(eqs));
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [atletaSelecionado, setAtletaSelecionado] = useState<any>(null);

  const [formData, setFormData] = useState({
    nome: '',
    apelido: '',
    documento: '',
    posicao: '',
    equipe: '',
    campeonatoHeranca: '',
    historico: 'Limpo',
    status: 'Regular',
    taxaCarteira: 15
  });

  // Garante sincronia sempre que montar a tela
  useEffect(() => {
    const stored = localStorage.getItem('@nicolau:atletas');
    if (stored) {
      setAtletas(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('@nicolau:atletas', JSON.stringify(atletas));
  }, [atletas]);

  const filteredItems = atletas.filter((a: any) => 
    a.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.equipe.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Gatilho Financeiro
  const criarCobrancaCarteirinha = (atletaNome: string, equipeNome: string, valor: number) => {
    const cobranca = {
      id: Date.now() + Math.random(),
      descricao: `Carteira Atleta: ${atletaNome} (${equipeNome})`,
      vencimento: new Date().toLocaleDateString('pt-BR'),
      valor: valor,
      status: 'Pago', // Carteirinha geralmente paga na hora
      tipo: 'receita'
    };
    const fin = JSON.parse(localStorage.getItem('@nicolau:financeiro') || '[]');
    localStorage.setItem('@nicolau:financeiro', JSON.stringify([cobranca, ...fin]));
  };

  const handleEquipeChange = (nomeEquipeSelecionada: string) => {
    const infoEquipe = equipesCadastradas.find(e => e.nome === nomeEquipeSelecionada);
    setFormData({ 
      ...formData, 
      equipe: nomeEquipeSelecionada, 
      campeonatoHeranca: infoEquipe ? infoEquipe.campeonato : '' 
    });
  };

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    if(formData.equipe === '') { toast.error('Selecione uma equipe!'); return; }

    const novo = { id: Date.now(), ...formData };
    setAtletas([novo, ...atletas]);

    criarCobrancaCarteirinha(formData.nome, formData.equipe, formData.taxaCarteira);
    toast.success('Atleta salvo! A carteirinha de R$15.00 foi registrada como Paga no Financeiro.', { duration: 5000 });

    setFormModalOpen(false);
    resetForm();
  };

  const handleEditar = (e: React.FormEvent) => {
    e.preventDefault();
    setAtletas(atletas.map((a: any) => a.id === atletaSelecionado.id ? { ...a, ...formData } : a));
    setEditModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ nome: '', apelido: '', documento: '', posicao: '', equipe: '', campeonatoHeranca: '', historico: 'Limpo', status: 'Regular', taxaCarteira: 15 });
    setAtletaSelecionado(null);
  };

  const abrirEditar = (atleta: any) => {
    setAtletaSelecionado(atleta);
    setFormData({ ...atleta, taxaCarteira: 15 });
    setEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Inscrição de Atletas</h1>
          <p className="text-sm text-slate-500 mt-1">Vincule atletas a equipes. O campeonato será puxado automaticamente da equipe correspondente.</p>
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
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900">Atleta</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Conexão Automática (Equipe / Copas)</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Status Disciplinar</th>
              <th className="relative py-3.5 pr-4 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {currentItems.map((atleta: any) => (
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
                  <div className="text-xs text-blue-600">{atleta.campeonatoHeranca || 'Sem campeonato vinculado'}</div>
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
              <select required value={formData.equipe} onChange={e => handleEquipeChange(e.target.value)} className="mt-1 block w-full rounded border-slate-300 px-3 py-2 sm:text-sm">
                <option value="">-- Escolher Equipe --</option>
                {equipesCadastradas.map(eq => (
                  <option key={eq.id} value={eq.nome}>{eq.nome}</option>
                ))}
              </select>
            </div>
            {formData.equipe && (
              <div>
                 <label className="block text-xs font-medium text-slate-500 uppercase">2. Campeonato (Herança Automática)</label>
                 <input disabled type="text" value={formData.campeonatoHeranca || 'Nenhum campeonato nessa equipe'} className="mt-1 block w-full rounded bg-slate-200 border-slate-300 px-3 py-2 sm:text-sm text-slate-600 italic" />
              </div>
            )}
          </div>

          <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 mt-2">
            <span className="text-xs font-bold text-emerald-800">Emissão de Carteirinha (Módulo Financeiro)</span>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-sm">Taxa de Cadastro:</span>
              <span className="font-bold">R$ {formData.taxaCarteira},00</span>
            </div>
          </div>

          <div className="flex justify-end pt-4 space-x-3">
             <button type="button" onClick={() => setFormModalOpen(false)} className="px-3 py-2 text-sm border rounded">Cancelar</button>
             <button type="submit" className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Matricular Atleta</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} title="Editar Cadastro de Atleta">
         {/* Mesmo form reduzido pra edição */}
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
             <button type="button" onClick={() => {
                setAtletas(atletas.filter((a: any) => a.id !== atletaSelecionado.id));
                setEditModalOpen(false);
             }} className="text-rose-600 text-sm">Apagar</button>
             <button type="submit" className="px-3 py-2 text-sm bg-blue-600 text-white rounded">Atualizar Dados</button>
          </div>
         </form>
      </Modal>
    </div>
  );
}
