import { useState } from 'react';
import { Search, Filter, Trophy, Calendar, FileText } from 'lucide-react';
import Pagination from '../components/Pagination';

const MOCK_DATA = Array.from({ length: 18 }, (_, i) => ({
  id: i + 1,
  nome: i % 2 === 0 ? 'Copa LIFACE Ouro' : 'Liga Cearense Sub-20',
  ano: `202${5 - Math.floor(i / 4)}`,
  categoria: i % 2 === 0 ? 'Adulto' : 'Sub-20',
  campeao: `Equipe ${i + 1}`,
  vice: `Equipe ${i + 2}`,
  artilheiro: `Atleta ${i + 1} (${Math.floor(Math.random() * 20) + 5} gols)`
}));

export default function Historico() {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Competições Realizadas (Histórico Oficial)</h1>
          <p className="text-sm text-slate-500 mt-1">Registro permanente de campeonatos encerrados. Apenas consulta.</p>
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
            placeholder="Buscar histórico..."
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <select className="block w-full sm:w-auto rounded-md border-0 py-1.5 pl-3 pr-10 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6">
            <option>Todos os Anos</option>
            <option>2025</option>
            <option>2024</option>
            <option>2023</option>
          </select>
          <button className="inline-flex w-full sm:w-auto justify-center items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
            <Filter className="-ml-0.5 h-5 w-5 text-slate-400" aria-hidden="true" />
            Filtros
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {currentItems.map((hist) => (
          <div key={hist.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{hist.nome}</h3>
                <p className="text-sm text-slate-500">{hist.categoria} • {hist.ano}</p>
              </div>
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                Arquivado
              </span>
            </div>
            <div className="mt-4 flex-1 space-y-3">
              <div className="flex items-center text-sm">
                <Trophy className="mr-2 h-4 w-4 text-amber-500" />
                <span className="font-medium text-slate-900">Campeão:</span>
                <span className="ml-2 text-slate-600">{hist.campeao}</span>
              </div>
              <div className="flex items-center text-sm">
                <Trophy className="mr-2 h-4 w-4 text-slate-400" />
                <span className="font-medium text-slate-900">Vice:</span>
                <span className="ml-2 text-slate-600">{hist.vice}</span>
              </div>
              <div className="flex items-center text-sm">
                <Trophy className="mr-2 h-4 w-4 text-amber-700" />
                <span className="font-medium text-slate-900">Artilheiro:</span>
                <span className="ml-2 text-slate-600">{hist.artilheiro}</span>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-4">
              <button className="flex-1 inline-flex justify-center items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
                <FileText className="-ml-0.5 mr-1.5 h-4 w-4 text-slate-400" />
                Estatísticas
              </button>
              <button className="flex-1 inline-flex justify-center items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
                <Calendar className="-ml-0.5 mr-1.5 h-4 w-4 text-slate-400" />
                Jogos
              </button>
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
