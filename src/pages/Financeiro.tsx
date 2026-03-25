import { useState } from 'react';
import { Plus, Search, Filter, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import Pagination from '../components/Pagination';

const MOCK_DATA = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  descricao: i % 3 === 0 ? 'Multa Disciplinar' : 'Taxa de Inscrição',
  equipe: `Equipe ${Math.floor(i / 2) + 1}`,
  vencimento: `1${i % 9 + 1}/06/2026`,
  valor: i % 3 === 0 ? 'R$ 150,00' : 'R$ 800,00',
  status: i % 5 === 0 ? 'Atrasado' : i % 3 === 0 ? 'Pendente' : 'Pago'
}));

export default function Financeiro() {
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Módulo Financeiro</h1>
          <p className="text-sm text-slate-500 mt-1">Controle de taxas de inscrição, multas e pagamentos.</p>
        </div>
        <button className="inline-flex w-full sm:w-auto items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Nova Cobrança
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-md bg-emerald-50 p-3">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-500">Receitas (Mês)</p>
              <p className="text-2xl font-semibold text-slate-900">R$ 12.450</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-md bg-rose-50 p-3">
              <TrendingDown className="h-6 w-6 text-rose-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-500">Inadimplência</p>
              <p className="text-2xl font-semibold text-slate-900">R$ 1.250</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-md bg-blue-50 p-3">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-500">Saldo em Caixa</p>
              <p className="text-2xl font-semibold text-slate-900">R$ 45.800</p>
            </div>
          </div>
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
            placeholder="Buscar lançamentos..."
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
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6">Descrição</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Equipe/Pessoa</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Vencimento</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Valor</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Status</th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {currentItems.map((lancamento) => (
              <tr key={lancamento.id}>
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-6">{lancamento.descricao}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{lancamento.equipe}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{lancamento.vencimento}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-slate-900">{lancamento.valor}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                    lancamento.status === 'Pago' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 
                    lancamento.status === 'Pendente' ? 'bg-amber-50 text-amber-700 ring-amber-600/20' :
                    'bg-rose-50 text-rose-700 ring-rose-600/20'
                  }`}>
                    {lancamento.status}
                  </span>
                </td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                  <a href="#" className="text-blue-600 hover:text-blue-900">Baixar</a>
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
