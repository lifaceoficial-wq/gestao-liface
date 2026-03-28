import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Star, DollarSign } from 'lucide-react';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

// Mock data base fallback caso o usuário não tenha nada no localStorage
const INITIAL_MOCK_DATA = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  nome: `Árbitro ${i + 1}`,
  funcao: i % 3 === 0 ? 'Anotador/Cronometrista' : i % 2 === 0 ? 'Árbitra Auxiliar' : 'Árbitro Principal',
  contato: `(85) 9${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
  avaliacao: (Math.random() * (5 - 3.5) + 3.5).toFixed(1)
}));

export default function Arbitros() {
  const [arbitros, setArbitros] = useState(() => {
    const saved = localStorage.getItem('@nicolau:arbitros');
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Estados dos modais
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentValor, setPaymentValor] = useState(100);
  
  const [arbitroSelecionado, setArbitroSelecionado] = useState<any>(null);

  // Estados do formulário de criação/edição
  const [formData, setFormData] = useState({ nome: '', funcao: 'Árbitro Principal', contato: '' });

  // Salva no localStorage sempre que 'arbitros' mudar para simular o banco de dados
  useEffect(() => {
    localStorage.setItem('@nicolau:arbitros', JSON.stringify(arbitros));
  }, [arbitros]);

  // Filtra por busca e ajusta a paginação
  const filteredItems = arbitros.filter((a: any) => 
    a.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.funcao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const currentItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    const novoArbitro = {
      id: Date.now(),
      nome: formData.nome,
      funcao: formData.funcao,
      contato: formData.contato,
      avaliacao: '0.0' // Começa sem avaliação
    };
    setArbitros([novoArbitro, ...arbitros]);
    setFormModalOpen(false);
    resetForm();
  };

  const handleEditar = (e: React.FormEvent) => {
    e.preventDefault();
    setArbitros(arbitros.map((a: any) => 
      a.id === arbitroSelecionado.id ? { ...a, ...formData } : a
    ));
    setEditModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ nome: '', funcao: 'Árbitro Principal', contato: '' });
    setArbitroSelecionado(null);
  }

  const abrirPerfil = (arbitro: any) => {
    setArbitroSelecionado(arbitro);
    setProfileModalOpen(true);
  };

  const abrirEdicao = () => {
    setFormData({
      nome: arbitroSelecionado.nome,
      funcao: arbitroSelecionado.funcao,
      contato: arbitroSelecionado.contato
    });
    setProfileModalOpen(false);
    setEditModalOpen(true);
  };

  const excluirArbitro = () => {
    if (confirm('Tem certeza que deseja recindir o cadastro deste árbitro?')) {
      setArbitros(arbitros.filter((a: any) => a.id !== arbitroSelecionado.id));
      setProfileModalOpen(false);
      resetForm();
    }
  };

  const lancarPagamento = (e: React.FormEvent) => {
    e.preventDefault();
    const desp = {
      id: Date.now(),
      descricao: `Pgto Árbitro: ${arbitroSelecionado.nome}`,
      vencimento: new Date().toLocaleDateString('pt-BR'),
      valor: paymentValor,
      status: 'Pago',
      tipo: 'despesa'
    };
    const f = JSON.parse(localStorage.getItem('@nicolau:financeiro') || '[]');
    localStorage.setItem('@nicolau:financeiro', JSON.stringify([desp, ...f]));
    toast.success(`Pagamento de R$${paymentValor} lançado como DESPESA no Financeiro.`, { duration: 4000 });
    setPaymentModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Árbitros</h1>
          <p className="text-sm text-slate-500 mt-1">Cadastro e avaliação do quadro de arbitragem.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setFormModalOpen(true); }}
          className="inline-flex w-full sm:w-auto items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Novo Árbitro
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
            placeholder="Buscar árbitros por nome ou função..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Retorna a primeira página ao buscar
            }}
          />
        </div>
        <button 
          onClick={() => toast('Filtros avançados serão implementados posteriormente via Supabase.', { icon: 'ℹ️' })}
          className="inline-flex w-full sm:w-auto justify-center items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
        >
          <Filter className="-ml-0.5 h-5 w-5 text-slate-400" aria-hidden="true" />
          Filtros
        </button>
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500">Nenhum árbitro encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {currentItems.map((arbitro: any) => (
            <div key={arbitro.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col hover:border-blue-400 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <img className="h-12 w-12 rounded-full bg-slate-100 object-cover border border-slate-200" src={`https://avatar.iran.liara.run/public/boy?username=${arbitro.nome}`} alt="" referrerPolicy="no-referrer" />
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-slate-900">{arbitro.nome}</h3>
                    <p className="text-sm text-slate-500">{arbitro.funcao}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex-1">
                <p className="text-sm text-slate-600">Contato: {arbitro.contato}</p>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                  <span className="ml-1.5 text-sm font-medium text-slate-900">{arbitro.avaliacao}</span>
                  <span className="ml-1 text-sm text-slate-500">/ 5.0</span>
                </div>
                <button 
                  onClick={() => abrirPerfil(arbitro)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500 hover:underline"
                >
                  Ver Perfil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
          />
        </div>
      )}

      {/* Modal - Novo Árbitro */}
      <Modal isOpen={isFormModalOpen} onClose={() => setFormModalOpen(false)} title="Cadastrar Novo Árbitro">
        <form onSubmit={handleSalvar} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Nome</label>
            <input 
              required
              type="text" 
              value={formData.nome}
              onChange={e => setFormData({...formData, nome: e.target.value})}
              className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Ex: João Silva" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Função</label>
            <select 
              value={formData.funcao}
              onChange={e => setFormData({...formData, funcao: e.target.value})}
              className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option>Árbitro Principal</option>
              <option>Árbitra Auxiliar</option>
              <option>Anotador/Cronometrista</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Contato</label>
            <input 
              required
              type="text" 
              value={formData.contato}
              onChange={e => setFormData({...formData, contato: e.target.value})}
              className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Ex: (85) 99999-9999" 
            />
          </div>
          <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 mt-6">
            <button type="button" onClick={() => setFormModalOpen(false)} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">Cancelar</button>
            <button type="submit" className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">Salvar Árbitro</button>
          </div>
        </form>
      </Modal>

      {/* Modal - Ver Perfil */}
      <Modal isOpen={isProfileModalOpen} onClose={() => setProfileModalOpen(false)} title="Perfil do Árbitro">
        {arbitroSelecionado && (
          <div className="space-y-4">
            <div className="flex items-center space-x-4 mb-6">
              <img className="h-16 w-16 rounded-full bg-slate-100 object-cover border border-slate-200" src={`https://avatar.iran.liara.run/public/boy?username=${arbitroSelecionado.nome}`} alt="" />
              <div>
                <h3 className="text-xl font-bold text-slate-900">{arbitroSelecionado.nome}</h3>
                <p className="text-blue-600 font-medium">{arbitroSelecionado.funcao}</p>
              </div>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-lg space-y-3 border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500">Contato:</span>
                <span className="font-medium text-slate-900">{arbitroSelecionado.contato}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Avaliação Geral:</span>
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-amber-400 fill-amber-400 mr-1" />
                  <span className="font-bold text-slate-900">{arbitroSelecionado.avaliacao}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-6 flex justify-between items-center">
               <button 
                  onClick={excluirArbitro}
                  className="rounded-md bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-100 transition-colors duration-200"
                >
                  Excluir Desligar
                </button>
                <div className="flex space-x-3">
                  <button 
                    onClick={() => { setProfileModalOpen(false); setPaymentModalOpen(true); }}
                    className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-600 border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center"
                  >
                    <DollarSign className="w-4 h-4 mr-1"/> Pagar Salário/Jogo
                  </button>
                  <button 
                    onClick={abrirEdicao}
                    className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-blue-600 border border-blue-200 hover:bg-blue-50 transition-colors"
                  >
                    Editar Dados
                  </button>
                </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal - Editar Árbitro */}
      <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} title="Editar Árbitro">
        <form onSubmit={handleEditar} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Nome</label>
            <input 
              required
              type="text" 
              value={formData.nome}
              onChange={e => setFormData({...formData, nome: e.target.value})}
              className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Função</label>
            <select 
              value={formData.funcao}
              onChange={e => setFormData({...formData, funcao: e.target.value})}
              className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option>Árbitro Principal</option>
              <option>Árbitra Auxiliar</option>
              <option>Anotador/Cronometrista</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Contato</label>
            <input 
              required
              type="text" 
              value={formData.contato}
              onChange={e => setFormData({...formData, contato: e.target.value})}
              className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 mt-6">
            <button type="button" onClick={() => setEditModalOpen(false)} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">Cancelar</button>
            <button type="submit" className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">Atualizar</button>
          </div>
        </form>
      </Modal>

      {/* Modal - Lançar Pagamento */}
      <Modal isOpen={isPaymentModalOpen} onClose={() => setPaymentModalOpen(false)} title="Lançar Pagamento Financeiro">
        <form onSubmit={lancarPagamento} className="space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700">
             Você está lançando uma <b>saída (despesa)</b> no módulo Financeiro referente ao trabalho do árbitro <b>{arbitroSelecionado?.nome}</b>.
          </div>
          <div>
             <label className="block text-sm font-medium text-slate-700">Valor Pago (R$)</label>
             <input required type="number" min="1" value={paymentValor} onChange={e => setPaymentValor(Number(e.target.value))} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm sm:text-sm" />
          </div>
          <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 mt-6">
            <button type="button" onClick={() => setPaymentModalOpen(false)} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">Cancelar</button>
            <button type="submit" className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500">Confirmar Pagamento</button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
