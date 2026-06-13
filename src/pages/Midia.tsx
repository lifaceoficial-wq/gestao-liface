import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Image as ImageIcon, Video, MoreVertical, Edit2, Trash2, X, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

const INITIAL_MOCK_DATA = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  titulo: i % 3 === 0 ? `Ocorrência - Jogo ${i + 10}` : `Álbum Final ${i + 1}`,
  tipo: i % 4 === 0 ? 'video' : 'foto',
  itens: Math.floor(Math.random() * 50) + 1,
  data: `1${i % 9 + 1} Jun 2026`,
  badge: i % 3 === 0 ? 'Disciplinar' : 'Evento'
}));

export default function Midia() {
  const [midias, setMidias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('Todos');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  // Modals
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  
  const [midiaSelecionada, setMidiaSelecionada] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [viewerAlbum, setViewerAlbum] = useState<any>(null);
  const [viewerIndex, setViewerIndex] = useState<number>(0);

  const [formData, setFormData] = useState<{
    titulo: string; tipo: string; itens: number; data: string; badge: string; coverUrl: string; urls: string[];
  }>({
    titulo: '',
    tipo: 'foto',
    itens: 1,
    data: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
    badge: 'Nenhum',
    coverUrl: '',
    urls: []
  });

  useEffect(() => {
    fetchMidias();
  }, []);

  const fetchMidias = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('midias').select('*').order('criado_em', { ascending: false });
      if (error) throw error;
      setMidias(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao buscar mídias');
    } finally {
      setLoading(false);
    }
  };

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

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.from('midias').insert([{
        titulo: formData.titulo,
        tipo: formData.tipo,
        itens: formData.itens,
        data: formData.data,
        badge: formData.badge === 'Nenhum' ? null : formData.badge,
        cover_url: formData.coverUrl,
        urls: formData.urls
      }]).select();

      if (error) throw error;
      
      if (data && data.length > 0) {
        const novo = { ...data[0], coverUrl: data[0].cover_url };
        setMidias([novo, ...midias]);
      } else {
        fetchMidias(); // Recarrega se o select não retornar os dados (ex: regras de RLS)
      }
      
      setFormModalOpen(false);
      resetForm();
      toast.success('Álbum salvo!');
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao salvar álbum: ' + err.message);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    
    try {
      const uploadedUrls: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;
        
        const { error: uploadError } = await supabase.storage.from('midias').upload(filePath, file);

        if (uploadError) {
          console.warn('Erro Storage:', uploadError);
          toast.error(`Falha ao subir arquivo. Verifique se o bucket "midias" existe e é Público no Supabase.`);
          // Ainda vamos usar o blob apenas para preview antes de salvar, mas no banco ficará quebrado se recarregar
          const localUrl = URL.createObjectURL(file);
          uploadedUrls.push(localUrl);
        } else {
          const { data: { publicUrl } } = supabase.storage.from('midias').getPublicUrl(filePath);
          uploadedUrls.push(publicUrl);
        }
      }

      setFormData({
        ...formData, 
        itens: files.length, 
        tipo: files[0].type.startsWith('video') ? 'video' : 'foto',
        coverUrl: uploadedUrls[0] || '',
        urls: uploadedUrls
      });
      toast.success(`${files.length} arquivo(s) carregado(s)!`);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao processar o upload.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.from('midias').update({
        titulo: formData.titulo,
        tipo: formData.tipo,
        itens: formData.itens,
        badge: formData.badge === 'Nenhum' ? null : formData.badge,
        cover_url: formData.coverUrl,
        urls: formData.urls
      }).eq('id', midiaSelecionada.id).select();

      if (error) throw error;

      if (data && data.length > 0) {
        const atualizado = { ...data[0], coverUrl: data[0].cover_url };
        setMidias(midias.map((m: any) => m.id === midiaSelecionada.id ? atualizado : m));
      } else {
        fetchMidias();
      }
      
      setEditModalOpen(false);
      resetForm();
      toast.success('Álbum atualizado!');
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao atualizar álbum: ' + err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      tipo: 'foto',
      itens: 1,
      data: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
      badge: 'Nenhum',
      coverUrl: '',
      urls: []
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
      badge: midia.badge || 'Nenhum',
      coverUrl: midia.coverUrl || midia.cover_url || '',
      urls: midia.urls || []
    });
    setEditModalOpen(true);
  };

  const excluirMidia = async () => {
    if (midiaSelecionada && confirm('Deseja excluir este álbum?')) {
      try {
        const { error } = await supabase.from('midias').delete().eq('id', midiaSelecionada.id);
        if (error) throw error;

        setMidias(midias.filter((m: any) => m.id !== midiaSelecionada.id));
        setEditModalOpen(false);
        resetForm();
        toast.success('Álbum excluído!');
      } catch (err) {
        console.error(err);
        toast.error('Erro ao excluir álbum');
      }
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

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <div className="col-span-full flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="col-span-full text-center p-12 bg-white rounded-xl border border-slate-200">
            <p className="text-slate-500">Nenhuma mídia encontrada com estes filtros.</p>
          </div>
        ) : (
          currentItems.map((album: any) => (
            <div key={album.id} className="group relative rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col">
              <div 
                className="aspect-w-16 aspect-h-10 bg-slate-100 relative cursor-pointer overflow-hidden"
                onClick={() => { setViewerAlbum(album); setViewerIndex(0); }}
              >
                <img 
                  src={album.coverUrl || album.cover_url || `https://picsum.photos/seed/album${album.id}/400/225`} 
                  alt={album.titulo}  
                  onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x400/e2e8f0/475569?text=M%C3%ADdia+Indispon%C3%ADvel' }}
                  className="object-cover w-full h-56 transform group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                
                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-colors flex items-center justify-center">
                  <Maximize2 className="text-white opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 drop-shadow-md" />
                </div>

                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
                
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white drop-shadow-md">
                  <div className="flex items-center gap-1.5">
                    {album.tipo === 'foto' ? <ImageIcon className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                    <span className="text-xs font-semibold tracking-wide uppercase">{album.tipo}</span>
                  </div>
                  <span className="text-xs font-medium bg-white/20 backdrop-blur-sm px-2 py-1 rounded-md">{album.itens} {album.itens === 1 ? 'item' : 'itens'}</span>
                </div>
                
                {album.badge && (
                  <div className="absolute top-3 right-3 shadow-sm z-10">
                    <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold text-white shadow-sm tracking-wide ${
                      album.badge === 'Disciplinar' ? 'bg-rose-600/90 backdrop-blur-sm' : 'bg-emerald-600/90 backdrop-blur-sm'
                    }`}>
                      {album.badge}
                    </span>
                  </div>
                )}
                
                {/* Botão flutuante de editar que aparece no hover (apenas desktop) ou é fixo no mobile */}
                <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button 
                    onClick={(e) => { e.stopPropagation(); abrirEditar(album); }} 
                    className="p-2 bg-white/90 backdrop-blur-sm shadow-md rounded-lg text-slate-700 hover:text-blue-600 hover:bg-white transition-all"
                    title="Editar Álbum"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-4 flex justify-between items-start flex-1 flex-col">
                <div className="w-full">
                  <h3 className="text-base font-bold text-slate-900 leading-tight line-clamp-2" title={album.titulo}>{album.titulo}</h3>
                  <p className="mt-2 text-xs font-medium text-slate-500 uppercase tracking-wider">{album.data}</p>
                </div>
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

      {/* LIGHTBOX VIEWER PARA FOTOS PROFISSIONAIS E CARROSSEL */}
      {viewerAlbum && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/95 backdrop-blur-md p-4 sm:p-8 transition-opacity duration-300"
          onClick={() => setViewerAlbum(null)}
        >
          {/* Botão Fechar */}
          <button 
            className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors z-50"
            onClick={(e) => { e.stopPropagation(); setViewerAlbum(null); }}
          >
            <X className="w-8 h-8" />
          </button>
          
          {/* Setas de Navegação */}
          {viewerAlbum.urls && viewerAlbum.urls.length > 1 && (
            <>
              <button 
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 text-white/70 hover:text-white bg-black/20 hover:bg-black/50 rounded-full transition-colors z-50"
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setViewerIndex(prev => prev > 0 ? prev - 1 : viewerAlbum.urls.length - 1);
                }}
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              
              <button 
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 text-white/70 hover:text-white bg-black/20 hover:bg-black/50 rounded-full transition-colors z-50"
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setViewerIndex(prev => prev < viewerAlbum.urls.length - 1 ? prev + 1 : 0);
                }}
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          {/* Imagem Atual */}
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            <img 
              src={(viewerAlbum.urls && viewerAlbum.urls.length > 0) ? viewerAlbum.urls[viewerIndex] : (viewerAlbum.coverUrl || viewerAlbum.cover_url || `https://picsum.photos/seed/album${viewerAlbum.id}/800/600`)} 
              alt={`Visualização ${viewerIndex + 1}`} 
              onError={(e) => { e.currentTarget.src = 'https://placehold.co/800x600/1e293b/94a3b8?text=M%C3%ADdia+Indispon%C3%ADvel' }}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl ring-1 ring-white/10"
              onClick={(e) => e.stopPropagation()} 
            />
            
            {/* Indicador de Quantidade */}
            {viewerAlbum.urls && viewerAlbum.urls.length > 1 && (
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-white/80 font-medium tracking-widest text-sm bg-black/30 px-4 py-1.5 rounded-full">
                {viewerIndex + 1} / {viewerAlbum.urls.length}
              </div>
            )}
          </div>
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
          
          <div className="mt-4 relative border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer">
            <input 
              type="file" 
              multiple 
              accept="image/*,video/*"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
            />
            {isUploading ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <span className="text-sm font-medium text-blue-600">Enviando mídia...</span>
              </div>
            ) : formData.coverUrl ? (
              <div className="text-center">
                <img src={formData.coverUrl} className="h-16 object-cover rounded-md mx-auto mb-2 border border-slate-200 shadow-sm" alt="Preview" />
                <span className="text-sm font-medium text-emerald-600">Mídia anexada com sucesso!</span>
                <span className="block text-xs mt-1 text-slate-400">Clique para substituir</span>
              </div>
            ) : (
              <div className="text-center">
                <ImageIcon className="w-8 h-8 mb-2 text-slate-400 mx-auto" />
                <span className="text-sm font-medium">Clique para escolher arquivos ou arraste aqui</span>
                <span className="block text-xs mt-1">PNG, JPG, MP4 até 50MB</span>
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 mt-6">
            <button type="button" onClick={() => setFormModalOpen(false)} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={isUploading} className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50">Salvar Álbum</button>
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
