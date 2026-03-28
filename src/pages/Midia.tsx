import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Image as ImageIcon, Video, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';

const INITIAL_MOCK_DATA = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  titulo: i % 3 === 0 ? `Ocorrência - Jogo ${i + 10}` : `Álbum Final ${i + 1}`,
  tipo: i % 4 === 0 ? 'video' : 'foto',
  itens: Math.floor(Math.random() * 50) + 1,
  data: `1${i % 9 + 1} Jun 2026`,
  badge: i % 3 === 0 ? 'Disciplinar' : 'Evento'
}));

export default function Midia() {
  const [midias, setMidias] = useState(() => {
    const saved = localStorage.getItem('@nicolau:midia');
    if (saved) return JSON.parse(saved);
    return INITIAL_MOCK_DATA;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('Todos');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  // Modals
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  
  const [midiaSelecionada, setMidiaSelecionada] = useState<any>(null);

  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'foto',
    itens: 1,
    data: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
    badge: 'Nenhum'
  });

  useEffect(() => {
    localStorage.setItem('@nicolau:midia', JSON.stringify(midias));
  }, [midias]);

  const filteredItems = midias.filter((m: any) => {
    const matchSearch = m.titulo.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchType = true;
    if (filterType === 'Fotos') matchType = m.tipo === 'foto';
    if (filterType === 'Vídeos') matchType = m.tipo === 'video';
    if (filterType === 'Ocorrências') matchType = m.badge === 'Disciplinar';
    
    return matchSearch && matchType;
  });

  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const currentItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    const nova = {
      id: Date.now(),
      ...formData,
      badge: formData.badge === 'Nenhum' ? undefined : formData.badge
    };
    setMidias([nova, ...midias]);
    setFormModalOpen(false);
    resetForm();
  };

  const handleEditar = (e: React.FormEvent) => {
    e.preventDefault();
    setMidias(midias.map((m: any) => m.id === midiaSelecionada.id ? { 
      ...m, ...formData, badge: formData.badge === 'Nenhum' ? undefined : formData.badge 
    } : m));
    setEditModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      tipo: 'foto',
      itens: 1,
      data: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
      badge: 'Nenhum'
    });
    setMidiaSelecionada(null);
  };

  const abrirEditar = (midia: any) => {
    setMidiaSelecionada(midia);
    setFormData({
      titulo: midia.titulo || '',
      tipo: midia.tipo || 'foto',
      itens: midia.itens || 1,
      data: midia.data || '',
      badge: midia.badge || 'Nenhum'
    });
    setEditModalOpen(true);
  };

  const excluirMidia = () => {
    if (confirm('Tem certeza que deseja apagar este álbum/mídia? (Os arquivos seriam removidos do servidor)')) {
      setMidias(midias.filter((m: any) => m.id !== midiaSelecionada.id));
      setEditModalOpen(false);
      resetForm();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mídia e Arquivos</h1>
          <p className="text-sm text-slate-500 mt-1">Galeria de mídia, organização por campeonato e ocorrências.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setFormModalOpen(true); }}
          className="inline-flex w-full sm:w-auto items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Fazer Upload / Novo Álbum
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
            placeholder="Buscar por título do álbum..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <select 
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
            className="block w-full sm:w-auto rounded-md border-0 py-1.5 pl-3 pr-10 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6"
          >
            <option value="Todos">Todos os Tipos</option>
            <option value="Fotos">Apenas Fotos</option>
            <option value="Vídeos">Apenas Vídeos</option>
            <option value="Ocorrências">Ocorrências</option>
          </select>
          <button 
            onClick={() => alert("Mais filtros avançados virão via Supabase!")}
            className="inline-flex w-full sm:w-auto justify-center items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
          >
            <Filter className="-ml-0.5 h-5 w-5 text-slate-400" aria-hidden="true" />
            
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredItems.length === 0 ? (
          <div className="col-span-full text-center p-12 bg-white rounded-xl border border-slate-200">
            <p className="text-slate-500">Nenhum álbum ou mídia encontrada.</p>
          </div>
        ) : (
          currentItems.map((album: any) => (
            <div key={album.id} className="group relative rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-w-16 aspect-h-9 bg-slate-100 relative">
                <img 
                  src={`https://picsum.photos/seed/album${album.id}/400/225`} 
                  alt={album.titulo} 
                  className="object-cover w-full h-48"
                  referrerPolicy="no-referrer"
                />
                
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-900/80 to-transparent" />
                
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                  {album.tipo === 'foto' ? <ImageIcon className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                  <span className="text-xs font-medium">{album.itens} {album.itens === 1 ? 'item' : 'itens'}</span>
                </div>
                
                {album.badge && (
                  <div className="absolute top-3 right-3 shadow-sm">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium text-white shadow-sm ${
                      album.badge === 'Disciplinar' ? 'bg-rose-600' : 'bg-emerald-600'
                    }`}>
                      {album.badge}
                    </span>
                  </div>
                )}
                
                {/* Botão flutuante de editar que aparece no hover (apenas desktop) ou é fixo no mobile */}
                <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => abrirEditar(album)} className="p-1.5 bg-white/90 backdrop-blur-sm shadow-sm rounded-md text-slate-700 hover:text-blue-600 transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-4 flex justify-between items-start">
                <div className="overflow-hidden">
                  <h3 className="text-sm font-semibold text-slate-900 truncate" title={album.titulo}>{album.titulo}</h3>
                  <p className="mt-1 text-xs text-slate-500">{album.data}</p>
                </div>
                <button onClick={() => abrirEditar(album)} className="sm:hidden p-1 text-slate-400 hover:text-blue-600">
                  <MoreVertical className="w-4 h-4" />
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

      {/* MODAL - NOVO ÁLBUM */}
      <Modal isOpen={isFormModalOpen} onClose={() => setFormModalOpen(false)} title="Enviar Nova Mídia / Álbum">
        <form onSubmit={handleSalvar} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Título / Assunto</label>
            <input required type="text" value={formData.titulo} onChange={e => setFormData({...formData, titulo: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="Ex: Fotos Final Copão" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Tipo da Mídia</label>
              <select value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                <option value="foto">Galeria de Fotos</option>
                <option value="video">Vídeo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Quantidade de Itens</label>
              <input type="number" min="1" value={formData.itens} onChange={e => setFormData({...formData, itens: parseInt(e.target.value) || 1 })} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Data do Ocorrido/Evento</label>
              <input required type="text" value={formData.data} onChange={e => setFormData({...formData, data: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Marcador (Badge)</label>
              <select value={formData.badge} onChange={e => setFormData({...formData, badge: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                <option value="Nenhum">Nenhum</option>
                <option value="Disciplinar">Caso Disciplinar</option>
                <option value="Evento">Evento Público</option>
                <option value="Comercial">Ação Comercial</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4 border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => alert("Upload real desativado no momento. Supabase Storage assumirá isso.")}>
            <ImageIcon className="w-8 h-8 mb-2 text-slate-400" />
            <span className="text-sm font-medium">Clique para escolher arquivos ou arraste aqui</span>
            <span className="text-xs mt-1">PNG, JPG, MP4 até 50MB</span>
          </div>

          <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 mt-6">
            <button type="button" onClick={() => setFormModalOpen(false)} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">Cancelar</button>
            <button type="submit" className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">Salvar Álbum</button>
          </div>
        </form>
      </Modal>

      {/* MODAL - EDITAR ÁLBUM */}
      <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} title="Editar Informações do Álbum">
        <form onSubmit={handleEditar} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Título / Assunto</label>
            <input required type="text" value={formData.titulo} onChange={e => setFormData({...formData, titulo: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Tipo da Mídia</label>
              <select value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                <option value="foto">Galeria de Fotos</option>
                <option value="video">Vídeo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Quantidade de Itens</label>
              <input type="number" min="1" value={formData.itens} onChange={e => setFormData({...formData, itens: parseInt(e.target.value) || 1 })} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Data do Ocorrido/Evento</label>
              <input required type="text" value={formData.data} onChange={e => setFormData({...formData, data: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Marcador (Badge)</label>
              <select value={formData.badge} onChange={e => setFormData({...formData, badge: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                <option value="Nenhum">Nenhum</option>
                <option value="Disciplinar">Caso Disciplinar</option>
                <option value="Evento">Evento Público</option>
                <option value="Comercial">Ação Comercial</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-between items-center border-t border-slate-100 mt-6">
            <button type="button" onClick={excluirMidia} className="rounded-md bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-100 transition-colors flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Apagar Álbum
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
