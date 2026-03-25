import { useState } from 'react';
import { Plus, Search, Filter, AlertTriangle } from 'lucide-react';
import Pagination from '../components/Pagination';

const MOCK_DATA = Array.from({ length: 35 }, (_, i) => ({
  id: i + 1,
  infrator: i % 4 === 0 ? `Equipe ${i + 1} (Equipe)` : `Atleta ${i + 1} (Atleta)`,
  tipo: i % 3 === 0 ? 'Julgamento' : i % 5 === 0 ? 'Financeira' : 'Automática',
  motivo: i % 3 === 0 ? 'Agressão' : i % 5 === 0 ? 'Atraso na Taxa' : 'Cartão Vermelho Direto',
  penalidade: i % 3 === 0 ? 'Multa + Perda de Mando' : i % 5 === 0 ? 'Multa R$ 200,00' : '1 Jogo',
  status: i % 2 === 0 ? 'Ativa' : 'Cumprida'
}));

export default function Suspensoes() {
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Suspensões e Sanções</h1>
          <p className="text-sm text-slate-500 mt-1">Gerencie suspensões de atletas e equipes, e sanções aplicadas.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button className="inline-flex w-full sm:w-auto items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Nova Sanção
          </button>
          <button className="inline-flex w-full sm:w-auto items-center justify-center rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2">
            <AlertTriangle className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Suspender Equipe
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:flex-1 sm:max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-slate-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            placeholder="Buscar suspensões..."
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <select className="block w-full sm:w-auto rounded-md border-0 py-1.5 pl-3 pr-10 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6">
            <option>Todos os Tipos</option>
            <option>Atletas</option>
            <option>Equipes</option>
          </select>
          <button className="inline-flex w-full sm:w-auto justify-center items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
            <Filter className="-ml-0.5 h-5 w-5 text-slate-400" aria-hidden="true" />
            Filtros
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6">Infrator</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Tipo</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Motivo</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Penalidade</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Status</th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {currentItems.map((suspensao) => (
              <tr key={suspensao.id}>
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-6">{suspensao.infrator}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{suspensao.tipo}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{suspensao.motivo}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{suspensao.penalidade}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                    suspensao.status === 'Ativa' ? 'bg-rose-50 text-rose-700 ring-rose-600/20' : 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                  }`}>
                    {suspensao.status}
                  </span>
                </td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                  <a href="#" className="text-blue-600 hover:text-blue-900">Detalhes</a>
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
