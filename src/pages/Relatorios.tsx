import { FileText, Download, Calendar, BarChart3 } from 'lucide-react';

export default function Relatorios() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Relatório Anual Institucional</h1>
          <p className="text-sm text-slate-500 mt-1">Geração e histórico de relatórios anuais da LIFACE.</p>
        </div>
        <button className="inline-flex w-full sm:w-auto items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          <FileText className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Gerar Relatório 2026
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900 mb-4">Conteúdo do Relatório</h2>
          <ul className="space-y-4">
            {[
              { title: 'Identificação Institucional', desc: 'Dados da liga, missão, visão e valores.' },
              { title: 'Diretoria Vigente', desc: 'Membros da diretoria e cargos ocupados no ano.' },
              { title: 'Campeonatos Realizados', desc: 'Resumo de todas as competições, campeões e estatísticas.' },
              { title: 'Dados Disciplinares', desc: 'Gráficos de cartões, suspensões e multas aplicadas.' },
              { title: 'Resumo Financeiro', desc: 'Balanço anual de receitas e despesas.' },
              { title: 'Projetos e Ações Sociais', desc: 'Impacto social, número de beneficiados e parceiros.' },
              { title: 'Eventos Realizados', desc: 'Congressos, reuniões e eventos institucionais.' },
              { title: 'Mídias do Ano', desc: 'Destaques em fotos e vídeos da temporada.' },
            ].map((item, i) => (
              <li key={i} className="flex items-start">
                <div className="flex-shrink-0">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-slate-900">{item.title}</p>
                  <p className="text-sm text-slate-500">{item.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900 mb-4">Histórico de Relatórios</h2>
          <div className="space-y-4">
            {[
              { ano: '2025', data: '15/01/2026', status: 'Publicado' },
              { ano: '2024', data: '10/01/2025', status: 'Publicado' },
              { ano: '2023', data: '12/01/2024', status: 'Publicado' },
            ].map((relatorio, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-slate-100 p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center">
                  <div className="rounded-md bg-slate-100 p-2">
                    <Calendar className="h-5 w-5 text-slate-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-900">Relatório Anual {relatorio.ano}</p>
                    <p className="text-xs text-slate-500">Gerado em {relatorio.data}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                    {relatorio.status}
                  </span>
                  <button className="inline-flex items-center justify-center rounded-md bg-white p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <Download className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
