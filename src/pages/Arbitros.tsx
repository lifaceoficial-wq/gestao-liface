import { useState } from 'react';
import { Plus, Search, Filter, Star } from 'lucide-react';
import Pagination from '../components/Pagination';

const MOCK_DATA = Array.from({ length: 24 }, (_, i) => ({
  id: i + 1,
  nome: `Árbitro ${i + 1}`,
  funcao: i % 3 === 0 ? 'Anotador/Cronometrista' : i % 2 === 0 ? 'Árbitra Auxiliar' : 'Árbitro Principal',
  contato: `(85) 9${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
  avaliacao: (Math.random() * (5 - 3.5) + 3.5).toFixed(1)
}));

export default function Arbitros() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Árbitros</h1>
          <p className="text-sm text-slate-500 mt-1">Cadastro e avaliação do quadro de arbitragem.</p>
        </div>
        <button className="inline-flex w-full sm:w-auto items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
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
            placeholder="Buscar árbitros..."
          />
        </div>
        <button className="inline-flex w-full sm:w-auto justify-center items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
          <Filter className="-ml-0.5 h-5 w-5 text-slate-400" aria-hidden="true" />
          Filtros
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {currentItems.map((arbitro) => (
          <div key={arbitro.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <img className="h-12 w-12 rounded-full bg-slate-100" src={`https://picsum.photos/seed/arbitro${arbitro.id}/100/100`} alt="" referrerPolicy="no-referrer" />
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
              <button className="text-sm font-medium text-blue-600 hover:text-blue-500">Ver Perfil</button>
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
