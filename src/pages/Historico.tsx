import { useState, useEffect } from 'react';
import { Search, Filter, Trophy, Calendar, FileText, Plus, Edit2, Trash2 } from 'lucide-react';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';

const INITIAL_MOCK_DATA = Array.from({ length: 6 }, (_, i) => ({
  id: Date.now() - i * 1000,
  nome: i % 2 === 0 ? 'Copa LIFACE Ouro' : 'Liga Cearense Sub-20',
  ano: `202${5 - Math.floor(i / 2)}`,
  categoria: i % 2 === 0 ? 'Adulto' : 'Sub-20',
  campeao: `Equipe ${i + 1}`,
  vice: `Equipe ${i + 2}`,
  artilheiro: `Atleta ${i + 1} (${Math.floor(Math.random() * 20) + 5} gols)`
}));

export default function Historico() {
  const [historico, setHistorico] = useState(() => {
    const saved = localStorage.getItem('@nicolau:historico');
    if (saved) return JSON.parse(saved);
    return INITIAL_MOCK_DATA;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterAno, setFilterAno] = useState('Todos os Anos');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  
  // Modals
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  
  const [registroSelecionado, setRegistroSelecionado] = useState<any>(null);

  const [formData, setFormData] = useState({
    nome: '',
    ano: new Date().getFullYear().toString(),
    categoria: 'Adulto',
    campeao: '',
    vice: '',
    artilheiro: ''
  });

  useEffect(() => {
    localStorage.setItem('@nicolau:historico', JSON.stringify(historico));
  }, [historico]);

  const filteredItems = historico.filter((h: any) => {
    const matchSearch = h.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        h.campeao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        h.vice.toLowerCase().includes(searchTerm.toLowerCase());
    const matchAno = filterAno === 'Todos os Anos' || h.ano === filterAno;
    return matchSearch && matchAno;
  });

  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const currentItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    const novo = {
      id: Date.now(),
      ...formData
    };
    setHistorico([novo, ...historico]);
    setFormModalOpen(false);
    resetForm();
  };

  const handleEditar = (e: React.FormEvent) => {
    e.preventDefault();
    setHistorico(historico.map((h: any) => h.id === registroSelecionado.id ? { ...h, ...formData } : h));
    setEditModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      ano: new Date().getFullYear().toString(),
      categoria: 'Adulto',
      campeao: '',
      vice: '',
      artilheiro: ''
    });
    setRegistroSelecionado(null);
  };

  const abrirEditar = (registro: any) => {
    setRegistroSelecionado(registro);
    setFormData({
      nome: registro.nome || '',
      ano: registro.ano || '',
      categoria: registro.categoria || 'Adulto',
      campeao: registro.campeao || '',
      vice: registro.vice || '',
      artilheiro: registro.artilheiro || ''
    });
    setEditModalOpen(true);
  };

  const excluirRegistro = () => {
    if (confirm('Atenção: Você está prestes a apagar um registro histórico. Confirmar exclusão?')) {
      setHistorico(historico.filter((h: any) => h.id !== registroSelecionado.id));
      setEditModalOpen(false);
      resetForm();
    }
  };

  // Gerencia a lista de anos únicos pra colocar no filtro
  const anosDisponiveis = Array.from(new Set(historico.map((h: any) => h.ano))).sort().reverse();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Competições Realizadas (Ficha Histórica)</h1>
          <p className="text-sm text-slate-500 mt-1">Registro permanente de campeonatos encerrados para pesquisa rápida.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setFormModalOpen(true); }}
          className="inline-flex w-full sm:w-auto items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Registrar Passado
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
            placeholder="Buscar por competição, campeão ou vice..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <select 
            value={filterAno}
            onChange={(e) => { setFilterAno(e.target.value); setCurrentPage(1); }}
            className="block w-full sm:w-auto rounded-md border-0 py-1.5 pl-3 pr-10 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6"
          >
            <option value="Todos os Anos">Todos os Anos</option>
            {anosDisponiveis.map((ano: any) => (
              <option key={ano} value={ano}>{ano}</option>
            ))}
          </select>
          <button 
            onClick={() => alert("Mais filtros avançados virão via Supabase!")}
            className="inline-flex w-full sm:w-auto justify-center items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
          >
            <Filter className="-ml-0.5 h-5 w-5 text-slate-400" aria-hidden="true" />
            
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredItems.length === 0 ? (
          <div className="col-span-full text-center p-12 bg-white rounded-xl border border-slate-200">
            <p className="text-slate-500">Nenhum registro histórico encontrado com estes filtros.</p>
          </div>
        ) : (
          currentItems.map((hist: any) => (
            <div key={hist.id} className="relative group rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col hover:border-blue-400 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 pr-8">{hist.nome}</h3>
                  <p className="text-sm text-slate-500">{hist.categoria} • {hist.ano}</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-500/10">
                  Arquivado
                </span>
                
                {/* Botão de edição invisível até hover */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => abrirEditar(hist)} className="p-1.5 bg-white border border-slate-200 shadow-sm rounded-md text-slate-600 hover:text-blue-600 transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-5 flex-1 space-y-3">
                <div className="flex items-center text-sm p-2 rounded-md bg-amber-50/50 border border-amber-100/50">
                  <Trophy className="mr-2 h-4 w-4 text-amber-500" />
                  <span className="font-medium text-slate-900 w-20">Campeão:</span>
                  <span className="text-slate-700 font-semibold truncate">{hist.campeao}</span>
                </div>
                <div className="flex items-center text-sm p-2">
                  <Trophy className="mr-2 h-4 w-4 text-slate-400" />
                  <span className="font-medium text-slate-900 w-20">Vice:</span>
                  <span className="text-slate-600 truncate">{hist.vice}</span>
                </div>
                <div className="flex items-center text-sm p-2">
                  <Trophy className="mr-2 h-4 w-4 text-amber-700" />
                  <span className="font-medium text-slate-900 w-20">Artilheiro:</span>
                  <span className="text-slate-600 truncate">{hist.artilheiro}</span>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-4">
                <button onClick={() => alert("Exibirá o PDF da súmula final ou estatísticas")} className="flex-1 inline-flex justify-center items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
                  <FileText className="-ml-0.5 mr-1.5 h-4 w-4 text-slate-400" />
                  Súmulas
                </button>
                <button onClick={() => abrirEditar(hist)} className="flex-1 lg:hidden inline-flex justify-center items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
                  <Edit2 className="-ml-0.5 mr-1.5 h-4 w-4 text-slate-400" />
                  Editar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      
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

      {/* MODAL - NOVO REGISTRO HISTÓRICO */}
      <Modal isOpen={isFormModalOpen} onClose={() => setFormModalOpen(false)} title="Gravar Histórico de Competição">
        <form onSubmit={handleSalvar} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Nome Oficial do Campeonato</label>
            <input required type="text" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="Ex: Copa LIFACE Outono" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Ano da Edição</label>
              <input required type="number" value={formData.ano} onChange={e => setFormData({...formData, ano: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Categoria</label>
              <input required type="text" value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="Ex: Sub-20, Adulto" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 mt-4 pt-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Equipe Campeã</label>
              <input required type="text" value={formData.campeao} onChange={e => setFormData({...formData, campeao: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Equipe Vice-Campeã</label>
              <input required type="text" value={formData.vice} onChange={e => setFormData({...formData, vice: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Destaque / Artilheiro</label>
            <input required type="text" value={formData.artilheiro} onChange={e => setFormData({...formData, artilheiro: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="Ex: Neymar (15 Gols)" />
          </div>
          <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 mt-6">
            <button type="button" onClick={() => setFormModalOpen(false)} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">Cancelar</button>
            <button type="submit" className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">Salvar nos Registros</button>
          </div>
        </form>
      </Modal>

      {/* MODAL - EDITAR REGISTRO */}
      <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} title="Corrigir Registro Histórico">
        <form onSubmit={handleEditar} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Nome Oficial do Campeonato</label>
            <input required type="text" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Ano da Edição</label>
              <input required type="number" value={formData.ano} onChange={e => setFormData({...formData, ano: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Categoria</label>
              <input required type="text" value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 mt-4 pt-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Equipe Campeã</label>
              <input required type="text" value={formData.campeao} onChange={e => setFormData({...formData, campeao: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Equipe Vice-Campeã</label>
              <input required type="text" value={formData.vice} onChange={e => setFormData({...formData, vice: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Destaque / Artilheiro</label>
            <input required type="text" value={formData.artilheiro} onChange={e => setFormData({...formData, artilheiro: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
          </div>

          <div className="pt-4 flex justify-between items-center border-t border-slate-100 mt-6">
            <button type="button" onClick={excluirRegistro} className="rounded-md bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-100 transition-colors flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Apagar Registro
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
