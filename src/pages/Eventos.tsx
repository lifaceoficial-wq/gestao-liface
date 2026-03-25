import { useState } from 'react';
import { Plus, Search, Filter, Calendar as CalendarIcon } from 'lucide-react';
import Pagination from '../components/Pagination';

const MOCK_DATA = Array.from({ length: 18 }, (_, i) => ({
  id: i + 1,
  nome: `Evento ${i + 1}`,
  tipo: i % 2 === 0 ? 'LIFACE' : 'Parceiro',
  instituicao: i % 2 !== 0 ? 'Federação Cearense' : undefined,
  data: `1${i % 9 + 1} Jun 2026`,
  local: `Local ${i + 1}`,
  categoria: i % 3 === 0 ? 'Reunião' : i % 2 === 0 ? 'Capacitação' : 'Cerimônia',
  status: i % 4 === 0 ? 'Realizado' : i % 3 === 0 ? 'Cancelado' : 'Programado'
}));

export default function Eventos() {
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Eventos LIFACE e Parceiros</h1>
          <p className="text-sm text-slate-500 mt-1">Gerencie eventos institucionais, reuniões e parcerias.</p>
        </div>
        <button className="inline-flex w-full sm:w-auto items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Novo Evento
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
            placeholder="Buscar eventos..."
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <select className="block w-full sm:w-auto rounded-md border-0 py-1.5 pl-3 pr-10 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6">
            <option>Todos os Tipos</option>
            <option>LIFACE</option>
            <option>Parceiro</option>
          </select>
          <button className="inline-flex w-full sm:w-auto justify-center items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
            <Filter className="-ml-0.5 h-5 w-5 text-slate-400" aria-hidden="true" />
            Filtros
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {currentItems.map((evento) => (
          <div key={evento.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className="rounded-md bg-blue-50 p-2">
                  <CalendarIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-base font-medium text-slate-900">{evento.nome}</h3>
                  <p className="text-xs text-slate-500">{evento.tipo} {evento.instituicao ? `• ${evento.instituicao}` : ''}</p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex-1 space-y-2">
              <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Data:</span> {evento.data}</p>
              <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Local:</span> {evento.local}</p>
              <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Categoria:</span> {evento.categoria}</p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
              <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                evento.status === 'Realizado' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 
                evento.status === 'Programado' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' :
                'bg-slate-50 text-slate-600 ring-slate-500/10'
              }`}>
                {evento.status}
              </span>
              <button className="text-sm font-medium text-blue-600 hover:text-blue-500">Editar</button>
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
