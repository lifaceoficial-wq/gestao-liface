import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, BarChart3, Plus } from 'lucide-react';
import Modal from '../components/Modal';

export default function Relatorios() {
  const [relatorios, setRelatorios] = useState(() => {
    const saved = localStorage.getItem('@nicolau:relatorios');
    if (saved) return JSON.parse(saved);
    return [
      { id: 1, ano: '2025', data: '15/01/2026', status: 'Publicado' },
      { id: 2, ano: '2024', data: '10/01/2025', status: 'Publicado' },
      { id: 3, ano: '2023', data: '12/01/2024', status: 'Publicado' }
    ];
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ano, setAno] = useState('');

  useEffect(() => {
    localStorage.setItem('@nicolau:relatorios', JSON.stringify(relatorios));
  }, [relatorios]);

  const gerarRelatorio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ano) return;
    
    // Verifica se já existe para este ano
    if (relatorios.some((r: any) => r.ano === ano)) {
      alert(`O relatório para o ano inteiro de ${ano} já foi gerado e consta no histórico.`);
      return;
    }

    const novo = {
      id: Date.now(),
      ano,
      data: new Date().toLocaleDateString('pt-BR'),
      status: 'Gerado (Rascunho)' // Só pra brincar com status diferente
    };

    setRelatorios([novo, ...relatorios].sort((a, b) => parseInt(b.ano) - parseInt(a.ano)));
    setIsModalOpen(false);
    setAno('');
  };

  const fazerDownload = (anoDownload: string) => {
    alert(`O Supabase em breve irá gerar um PDF real de 30 páginas consolidando atletas, árbitros, súmulas e dados financeiros do ano inteiro de ${anoDownload}.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Gerador de Relatório Anual (LIFACE)</h1>
          <p className="text-sm text-slate-500 mt-1">Este módulo varre todo o banco de dados para criar um PDF executivo da temporada.</p>
        </div>
        <button 
          onClick={() => { setAno(new Date().getFullYear().toString()); setIsModalOpen(true); }}
          className="inline-flex w-full sm:w-auto items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Executar Compilação
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">O que o sistema coleta automaticamente?</h2>
          <ul className="space-y-4 pt-2">
            {[
              { title: 'Identificação Institucional e Diretoria', desc: 'Dados da liga e diretores vigentes que você cadastrou no sistema.' },
              { title: 'Campeonatos (Ficha Histórica)', desc: 'Campeões, vices, artilheiros e detalhes da temporada.' },
              { title: 'Tribunal Disciplinar (Suspensões)', desc: 'Ata dos julgamentos, atletas punidos e status da dívida moral/financeira.' },
              { title: 'Balanço Financeiro DRE', desc: 'Aquele painel Financeiro vira um extrato no PDF (Receitas vs Taxas).' },
              { title: 'Projetos e Ações Sociais', desc: 'Consolidação de quantas pessoas foram beneficiadas no ano em seus projetos.' },
              { title: 'Eventos Realizados', desc: 'Histórico de capacitações e confraternizações que ocorreram.' },
            ].map((item, i) => (
              <li key={i} className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-bold text-slate-900">{item.title}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{item.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col h-full">
          <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Acervo Documental (Arquivos PDF)</h2>
          <div className="space-y-3 flex-1 overflow-auto max-h-[600px] pr-2">
            {relatorios.length === 0 ? (
              <div className="text-center p-8 bg-slate-50 rounded-lg">
                <p className="text-slate-500 text-sm">Nenhum relatório compilado ainda.</p>
              </div>
            ) : (
              relatorios.map((relatorio: any) => (
                <div key={relatorio.id} className="group flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 hover:border-blue-400 hover:shadow-sm transition-all">
                  <div className="flex items-center">
                    <div className="rounded-md bg-blue-50 p-2.5 group-hover:bg-blue-100 transition-colors">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-bold text-slate-900">Relatório Consolidado LIFACE - {relatorio.ano}</p>
                      <p className="text-xs text-slate-500 flex items-center mt-1">
                        <Calendar className="w-3 h-3 mr-1 inline" /> Extraído no sistema dia {relatorio.data}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`hidden sm:inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ring-1 ring-inset ${
                      relatorio.status === 'Publicado' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-amber-50 text-amber-700 ring-amber-600/20'
                    }`}>
                      {relatorio.status}
                    </span>
                    <button 
                      onClick={() => fazerDownload(relatorio.ano)}
                      className="inline-flex items-center justify-center rounded-md bg-white p-2 border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      title="Baixar PDF Arquivado"
                    >
                      <Download className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Compilar Dados da Temporada">
        <form onSubmit={gerarRelatorio} className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg flex gap-3 text-blue-800 text-sm border border-blue-100">
            <BarChart3 className="shrink-0 w-5 h-5 text-blue-600" />
            <p>
              Esta ação varrerá os dados de todos os outros 9 módulos deste dashboard (Atletas, Árbitros, Financeiro, etc) 
              correspondentes ao ano selecionado e gerará um <b>Documento Oficial</b> imutável.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Qual Ano Base do Relatório?</label>
            <input 
              required 
              type="number" 
              min="2000" 
              max="2099" 
              value={ano} 
              onChange={e => setAno(e.target.value)} 
              className="mt-1 block w-full rounded-md border-slate-300 py-2 px-3 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" 
              placeholder="Ex: 2026" 
            />
          </div>
          <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 mt-6">
            <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">Cancelar</button>
            <button type="submit" className="flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">
              Gerar Relatório {ano && `- ${ano}`}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
