import { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import Pagination from '../components/Pagination';

const MOCK_DATA = Array.from({ length: 150 }, (_, i) => ({
  id: i + 1,
  nome: `Atleta ${i + 1}`,
  apelido: `Apelido ${i + 1}`,
  equipe: `Equipe ${Math.floor(i / 15) + 1}`,
  campeonato: i % 2 === 0 ? 'Copa LIFACE Ouro' : 'Liga Cearense Sub-20',
  historico: i % 10 === 0 ? '1 Vermelho' : i % 5 === 0 ? '1 Amarelo' : 'Limpo',
  status: i % 10 === 0 ? 'Suspenso' : i % 8 === 0 ? 'Irregular' : 'Regular'
}));

export default function Atletas() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Inscrição de Atletas</h1>
          <p className="text-sm text-slate-500 mt-1">Gerencie os atletas e seus status disciplinares.</p>
        </div>
        <button className="inline-flex w-full sm:w-auto items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Novo Atleta
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
            placeholder="Buscar atletas..."
          />
        </div>
        <button className="inline-flex w-full sm:w-auto justify-center items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
          <Filter className="-ml-0.5 h-5 w-5 text-slate-400" aria-hidden="true" />
          Filtros
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6">Atleta</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Equipe</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Campeonato</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Histórico</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Status</th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {currentItems.map((atleta) => (
              <tr key={atleta.id}>
                <td className="whitespace-nowrap py-4 pl-4 pr-3 sm:pl-6">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      <img className="h-10 w-10 rounded-full bg-slate-100" src={`https://picsum.photos/seed/atleta${atleta.id}/100/100`} alt="" referrerPolicy="no-referrer" />
                    </div>
                    <div className="ml-4">
                      <div className="font-medium text-slate-900">{atleta.nome}</div>
                      <div className="text-slate-500">{atleta.apelido}</div>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{atleta.equipe}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{atleta.campeonato}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{atleta.historico}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                  <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                    atleta.status === 'Regular' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 
                    atleta.status === 'Irregular' ? 'bg-amber-50 text-amber-700 ring-amber-600/20' :
                    'bg-rose-50 text-rose-700 ring-rose-600/20'
                  }`}>
                    <svg className={`h-1.5 w-1.5 ${
                      atleta.status === 'Regular' ? 'fill-emerald-500' : 
                      atleta.status === 'Irregular' ? 'fill-amber-500' :
                      'fill-rose-500'
                    }`} viewBox="0 0 6 6" aria-hidden="true">
                      <circle cx={3} cy={3} r={3} />
                    </svg>
                    {atleta.status}
                  </span>
                </td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                  <a href="#" className="text-blue-600 hover:text-blue-900">Editar</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
