import React, { useState, useEffect } from 'react';
import { Plus, Search, AlertTriangle } from 'lucide-react';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

export default function Suspensoes() {
  const [suspensoes, setSuspensoes] = useState(() => {
    const saved = localStorage.getItem('@nicolau:suspensoes');
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [infratoresList, setInfratoresList] = useState<any[]>([]);

  useEffect(() => {
    // Mescla atletas e equipes para ser o universo alvo de infratores
    const atletas = JSON.parse(localStorage.getItem('@nicolau:atletas') || '[]');
    const equipes = JSON.parse(localStorage.getItem('@nicolau:equipes') || '[]');
    const mapa = [
      ...atletas.map((a: any) => ({ nome: a.nome, tipo_origem: 'Atleta', id_origem: a.id })),
      ...equipes.map((e: any) => ({ nome: e.nome, tipo_origem: 'Equipe', id_origem: e.id }))
    ];
    setInfratoresList(mapa);
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [isFormModalOpen, setFormModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    infrator: '', // O nome selecionado
    tipo: 'Automática', // Automatizada pelo sistema vs Julgamento
    motivo: '',
    jogosSuspensos: 1,
    multaValor: 0,
    status: 'Ativa'
  });

  useEffect(() => {
    localStorage.setItem('@nicolau:suspensoes', JSON.stringify(suspensoes));
  }, [suspensoes]);

  const criarMultaFinanceira = (infrator: string, motivo: string, valor: number) => {
    const cobranca = {
      id: Date.now() + Math.random(),
      descricao: `MULTA: ${infrator} - ${motivo}`,
      vencimento: new Date().toLocaleDateString('pt-BR'),
      valor: valor,
      status: 'Debito Bloqueador', // Um status ficticio especial que acusa bloqueio
      tipo: 'receita'
    };
    const fin = JSON.parse(localStorage.getItem('@nicolau:financeiro') || '[]');
    localStorage.setItem('@nicolau:financeiro', JSON.stringify([cobranca, ...fin]));
  };

  const suspenderAtletaNaOrigem = (infratorNome: string) => {
    // Altera o status do Atleta ou Equipe verdadeira no outro banco.
    let foiAchado = false;
    // Tenta no banco de atletas:
    const atletas = JSON.parse(localStorage.getItem('@nicolau:atletas') || '[]');
    const ats = atletas.map((a: any) => {
      if(a.nome === infratorNome) { foiAchado = true; return {...a, status: 'Suspenso'}; }
      return a;
    });
    if(foiAchado) localStorage.setItem('@nicolau:atletas', JSON.stringify(ats));

    if(!foiAchado) { // Tenta nas Equipes
       const equipes = JSON.parse(localStorage.getItem('@nicolau:equipes') || '[]');
       const eqs = equipes.map((e: any) => {
         if(e.nome === infratorNome) { return {...e, status: 'SuspensaRegras'}; }
         return e;
       });
       localStorage.setItem('@nicolau:equipes', JSON.stringify(eqs));
    }
  };

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    if(formData.infrator === '') { toast.error("Selecione um infrator"); return; }
    
    // Regrava a formatação pra UI do card baseada nas entradas
    const penaltyString = formData.multaValor > 0 
      ? `${formData.jogosSuspensos} Jogos + Multa R$${formData.multaValor}` 
      : `${formData.jogosSuspensos} Jogos (Sem Multa)`;

    const nova = {
      id: Date.now(),
      infrator: formData.infrator,
      tipo: formData.tipo,
      motivo: formData.motivo,
      penalidade: penaltyString,
      status: formData.status
    };

    // Aplica no Financeiro se tiver grana envolvida
    if(formData.multaValor > 0) {
      criarMultaFinanceira(formData.infrator, formData.motivo, formData.multaValor);
    }

    // Aplica alteracao de Modulo!
    if(formData.status === 'Ativa') {
      suspenderAtletaNaOrigem(formData.infrator);
    }

    setSuspensoes([nova, ...suspensoes]);
    
    toast.success(`Punição Aplicada! \n1. Alterou status disciplinar para SUSPENSO.\n${formData.multaValor > 0 ? "2. Gerou dívida no Financeiro para bloqueio!" : ""}`, { duration: 6000 });
    
    setFormModalOpen(false);
    resetForm();
  };

  const resetForm = () => setFormData({ infrator: '', tipo: 'Automática', motivo: '', jogosSuspensos: 1, multaValor: 0, status: 'Ativa' });

  const filteredItems = suspensoes.filter((s: any) => 
    s.infrator?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.motivo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tribunal & Suspensões</h1>
          <p className="text-sm text-slate-500 mt-1">Ao penalizar alguém, o status dele bloqueia no banco de dados geral e gera multa automática.</p>
        </div>
        <button onClick={() => { resetForm(); setFormModalOpen(true); }} className="inline-flex items-center justify-center rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 shadow-sm">
          <AlertTriangle className="-ml-1 mr-2 h-5 w-5" /> Iniciar Processo/Sanção
        </button>
      </div>

      <div className="flex bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-full">
          <Search className="absolute left-3 top-2 h-5 w-5 text-slate-400" />
          <input type="text" className="block w-full rounded-md border-0 py-1.5 pl-10 ring-1 ring-inset ring-slate-300 focus:ring-blue-600 sm:text-sm" placeholder="Buscar infrator..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
         {filteredItems.map((s: any) => (
            <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm border-l-4 border-l-rose-500 hover:shadow-md transition-shadow">
               <h3 className="font-bold text-slate-900 text-lg mb-1">{s.infrator}</h3>
               <span className="text-xs bg-slate-100 text-slate-600 px-2 flex items-center mb-4 rounded-md w-fit ring-1 ring-slate-200">{s.tipo}</span>
               
               <p className="text-sm text-slate-600 mb-2"><b>Motivo:</b> {s.motivo}</p>
               <p className="text-sm text-rose-800 bg-rose-50 p-2 rounded border border-rose-100 mb-4 font-semibold"><b>PENA:</b> {s.penalidade}</p>
               
               <div className="flex justify-between items-center text-sm border-t border-slate-100 pt-3">
                 <span className={`font-bold ${s.status === 'Ativa' ? 'text-rose-600' : 'text-emerald-600'}`}>{s.status}</span>
                 {s.status === 'Ativa' && <button className="text-blue-600 hover:underline">Resolver Dívida</button>}
               </div>
            </div>
         ))}
      </div>

      <Modal isOpen={isFormModalOpen} onClose={() => setFormModalOpen(false)} title="Nova Penalidade Relacional">
        <form onSubmit={handleSalvar} className="space-y-4">
          
          <div className="bg-rose-50 p-3 rounded-lg border border-rose-100 mb-4">
            <label className="block text-sm font-bold text-rose-900">Selecione o Infrator do Banco de Dados</label>
            <select required value={formData.infrator} onChange={e => setFormData({...formData, infrator: e.target.value})} className="mt-2 block w-full rounded-md border-slate-300 px-3 py-2 sm:text-sm border">
               <option value="">-- Buscar Cadastro --</option>
               {infratoresList.map((inf, i) => (
                 <option key={i} value={inf.nome}>{inf.nome} ({inf.tipo_origem})</option>
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
             Ao aplicar, o componente atualizará o status disciplinar dessa entidade bloqueando-a de jogar. Se houver multa &gt; R$0, irá estourar uma cobrança de bloqueio no Financeiro.
          </p>

          <div className="pt-2 flex justify-end space-x-3">
            <button type="button" onClick={() => setFormModalOpen(false)} className="rounded-md bg-white border border-slate-300 px-3 py-2 text-sm">Cancelar</button>
            <button type="submit" className="rounded-md bg-rose-600 px-4 py-2 text-sm text-white hover:bg-rose-700 shadow-sm font-bold">Autuar Infrator Vínculado</button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
