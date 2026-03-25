import { useState } from 'react';
import { Plus, Search, Filter, Image as ImageIcon, Video } from 'lucide-react';
import Pagination from '../components/Pagination';

const MOCK_DATA = Array.from({ length: 36 }, (_, i) => ({
  id: i + 1,
  titulo: i % 3 === 0 ? `Ocorrência - Jogo ${i + 10}` : `Álbum ${i + 1}`,
  tipo: i % 4 === 0 ? 'video' : 'foto',
  itens: Math.floor(Math.random() * 200) + 1,
  data: `1${i % 9 + 1} Jun 2026`,
  badge: i % 3 === 0 ? 'Disciplinar' : undefined
}));

export default function Midia() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  
  const totalItems = MOCK_DATA.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  const currentItems = MOCK_DATA.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Vídeos e Fotos</h1>
          <p className="text-sm text-slate-500 mt-1">Galeria de mídia, organização por campeonato e ocorrências.</p>
        </div>
        <button className="inline-flex w-full sm:w-auto items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Fazer Upload
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
            placeholder="Buscar álbuns ou arquivos..."
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <select className="block w-full sm:w-auto rounded-md border-0 py-1.5 pl-3 pr-10 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6">
            <option>Todos os Tipos</option>
            <option>Fotos</option>
            <option>Vídeos</option>
            <option>Ocorrências</option>
          </select>
          <button className="inline-flex w-full sm:w-auto justify-center items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
            <Filter className="-ml-0.5 h-5 w-5 text-slate-400" aria-hidden="true" />
            Filtros
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {currentItems.map((album) => (
          <div key={album.id} className="group relative rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="aspect-w-16 aspect-h-9 bg-slate-100 relative">
              <img 
                src={`https://picsum.photos/seed/album${album.id}/400/225`} 
                alt={album.titulo} 
                className="object-cover w-full h-48"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                {album.tipo === 'foto' ? <ImageIcon className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                <span className="text-xs font-medium">{album.itens} {album.itens === 1 ? 'item' : 'itens'}</span>
              </div>
              {album.badge && (
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center rounded-full bg-rose-600 px-2 py-1 text-xs font-medium text-white">
                    {album.badge}
                  </span>
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="text-sm font-medium text-slate-900 truncate">{album.titulo}</h3>
              <p className="mt-1 text-xs text-slate-500">{album.data}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
        />
      </div>
    </div>
  );
}
