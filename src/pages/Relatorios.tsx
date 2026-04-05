import React, { useState, useEffect, useRef } from 'react';
import { FileText, Download, Calendar, BarChart3, Plus, Upload, Trash2, Loader2 } from 'lucide-react';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Relatorios() {
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [ano, setAno] = useState('');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [tabUpload, setTabUpload] = useState<'gerar' | 'enviar'>('gerar');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDocumentos();

    const channel = supabase
      .channel('documentos_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documentos' }, () => {
        fetchDocumentos();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDocumentos = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('documentos').select('*').order('criado_em', { ascending: false });
      if (error) throw error;
      setDocumentos(data || []);
    } catch (error: any) {
      toast.error('Erro ao buscar documentos: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const gerarPDF = async (anoSelecionado: string) => {
    setIsGenerating(true);
    try {
      const [
        { data: atletas },
        { data: equipes },
        { data: campeonatos },
        { data: arbitros },
        { data: financeiro },
        { data: diretoria },
        { data: suspensoes },
        { data: campeoes },
      ] = await Promise.all([
        supabase.from('atletas').select('*'),
        supabase.from('equipes').select('*'),
        supabase.from('campeonatos').select('*'),
        supabase.from('arbitros').select('*'),
        supabase.from('financeiro').select('*'),
        supabase.from('diretoria').select('*'),
        supabase.from('suspensoes').select('*'),
        supabase.from('campeoes').select('*'),
      ]);

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Capa
      doc.setFontSize(28);
      doc.setTextColor(30, 58, 138);
      doc.text('LIFACE', pageWidth / 2, 60, { align: 'center' });
      doc.setFontSize(18);
      doc.setTextColor(71, 85, 105);
      doc.text(`Relatório Anual - ${anoSelecionado}`, pageWidth / 2, 75, { align: 'center' });
      doc.setFontSize(12);
      doc.setTextColor(100, 116, 139);
      doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, 85, { align: 'center' });
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(1);
      doc.line(40, 95, pageWidth - 40, 95);

      // 1. Diretoria
      doc.addPage();
      doc.setFontSize(16);
      doc.setTextColor(30, 58, 138);
      doc.text('1. Diretoria', 14, 20);
      if (diretoria && diretoria.length > 0) {
        autoTable(doc, {
          startY: 28,
          head: [['Nome', 'Cargo', 'Contato']],
          body: diretoria.map((d: any) => [d.nome || '-', d.cargo || '-', d.contato || '-']),
          theme: 'grid',
          headStyles: { fillColor: [30, 58, 138] },
          styles: { fontSize: 9 },
        });
      } else {
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text('Nenhum membro da diretoria cadastrado.', 14, 30);
      }

      // 2. Campeonatos
      doc.addPage();
      doc.setFontSize(16);
      doc.setTextColor(30, 58, 138);
      doc.text('2. Campeonatos', 14, 20);
      if (campeonatos && campeonatos.length > 0) {
        autoTable(doc, {
          startY: 28,
          head: [['Nome', 'Categoria', 'Edição', 'Período', 'Status']],
          body: campeonatos.map((c: any) => [c.nome || '-', c.categoria || '-', c.edicao || '-', c.periodo || '-', c.status || '-']),
          theme: 'grid',
          headStyles: { fillColor: [30, 58, 138] },
          styles: { fontSize: 9 },
        });
      } else {
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text('Nenhum campeonato cadastrado.', 14, 30);
      }

      // 3. Equipes
      doc.addPage();
      doc.setFontSize(16);
      doc.setTextColor(30, 58, 138);
      doc.text('3. Equipes Participantes', 14, 20);
      if (equipes && equipes.length > 0) {
        autoTable(doc, {
          startY: 28,
          head: [['Nome', 'Fantasia', 'Responsável', 'Contato', 'Status']],
          body: equipes.map((e: any) => [e.nome || '-', e.fantasia || '-', e.responsavel || '-', e.contato || '-', e.status || '-']),
          theme: 'grid',
          headStyles: { fillColor: [30, 58, 138] },
          styles: { fontSize: 9 },
        });
      } else {
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text('Nenhuma equipe cadastrada.', 14, 30);
      }

      // 4. Atletas
      doc.addPage();
      doc.setFontSize(16);
      doc.setTextColor(30, 58, 138);
      doc.text('4. Atletas Inscritos', 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Total: ${atletas?.length || 0} atletas`, 14, 28);
      if (atletas && atletas.length > 0) {
        autoTable(doc, {
          startY: 34,
          head: [['Nome', 'Apelido', 'Posição', 'Equipe', 'Status']],
          body: atletas.map((a: any) => [a.nome || '-', a.apelido || '-', a.posicao || '-', a.equipe_nome || '-', a.status || '-']),
          theme: 'grid',
          headStyles: { fillColor: [30, 58, 138] },
          styles: { fontSize: 8 },
        });
      }

      // 5. Árbitros
      doc.addPage();
      doc.setFontSize(16);
      doc.setTextColor(30, 58, 138);
      doc.text('5. Árbitros', 14, 20);
      if (arbitros && arbitros.length > 0) {
        autoTable(doc, {
          startY: 28,
          head: [['Nome', 'Função', 'Contato', 'Avaliação']],
          body: arbitros.map((a: any) => [a.nome || '-', a.funcao || '-', a.contato || '-', a.avaliacao || '-']),
          theme: 'grid',
          headStyles: { fillColor: [30, 58, 138] },
          styles: { fontSize: 9 },
        });
      } else {
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text('Nenhum árbitro cadastrado.', 14, 30);
      }

      // 6. Suspensões
      doc.addPage();
      doc.setFontSize(16);
      doc.setTextColor(30, 58, 138);
      doc.text('6. Tribunal Disciplinar - Suspensões', 14, 20);
      if (suspensoes && suspensoes.length > 0) {
        autoTable(doc, {
          startY: 28,
          head: [['Atleta', 'Motivo', 'Jogos', 'Status']],
          body: suspensoes.map((s: any) => [s.atleta_nome || s.atleta || '-', s.motivo || '-', s.jogos || '-', s.status || '-']),
          theme: 'grid',
          headStyles: { fillColor: [30, 58, 138] },
          styles: { fontSize: 9 },
        });
      } else {
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text('Nenhuma suspensão registrada.', 14, 30);
      }

      // 7. Financeiro
      doc.addPage();
      doc.setFontSize(16);
      doc.setTextColor(30, 58, 138);
      doc.text('7. Balanço Financeiro', 14, 20);
      if (financeiro && financeiro.length > 0) {
        const receitas = financeiro.filter((f: any) => f.tipo === 'receita');
        const despesas = financeiro.filter((f: any) => f.tipo === 'despesa');
        const totalRec = receitas.reduce((sum: number, f: any) => sum + (parseFloat(f.valor) || 0), 0);
        const totalDesp = despesas.reduce((sum: number, f: any) => sum + (parseFloat(f.valor) || 0), 0);

        doc.setFontSize(11);
        doc.setTextColor(16, 185, 129);
        doc.text(`Total Receitas: R$ ${totalRec.toFixed(2)}`, 14, 32);
        doc.setTextColor(239, 68, 68);
        doc.text(`Total Despesas: R$ ${totalDesp.toFixed(2)}`, 14, 40);
        doc.setTextColor(30, 58, 138);
        doc.setFontSize(12);
        doc.text(`Saldo: R$ ${(totalRec - totalDesp).toFixed(2)}`, 14, 50);

        autoTable(doc, {
          startY: 58,
          head: [['Descrição', 'Tipo', 'Valor', 'Status']],
          body: financeiro.map((f: any) => [f.descricao || '-', f.tipo || '-', `R$ ${parseFloat(f.valor || 0).toFixed(2)}`, f.status || '-']),
          theme: 'grid',
          headStyles: { fillColor: [30, 58, 138] },
          styles: { fontSize: 9 },
        });
      } else {
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text('Nenhum registro financeiro.', 14, 30);
      }

      // 8. Campeões
      doc.addPage();
      doc.setFontSize(16);
      doc.setTextColor(30, 58, 138);
      doc.text('8. Campeões', 14, 20);
      if (campeoes && campeoes.length > 0) {
        autoTable(doc, {
          startY: 28,
          head: [['Nome', 'Equipe', 'Categoria', 'Ano']],
          body: campeoes.map((c: any) => [c.nome || '-', c.equipe || '-', c.categoria || '-', c.ano || '-']),
          theme: 'grid',
          headStyles: { fillColor: [30, 58, 138] },
          styles: { fontSize: 9 },
        });
      } else {
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text('Nenhum campeão registrado.', 14, 30);
      }

      // Gerar blob
      const pdfBlob = doc.output('blob');
      const fileName = `relatorio_liface_${anoSelecionado}.pdf`;

      // Upload para storage
      const { error: uploadError } = await supabase.storage
        .from('documentos')
        .upload(fileName, pdfBlob, { contentType: 'application/pdf' });

      if (uploadError) throw uploadError;

      // Salvar no banco
      const { error: dbError } = await supabase.from('documentos').insert([{
        nome: `Relatório Consolidado LIFACE - ${anoSelecionado}`,
        ano: anoSelecionado,
        arquivo_nome: fileName,
        arquivo_path: fileName,
        status: 'Publicado'
      }]);

      if (dbError) throw dbError;

      // Download automático
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Relatório gerado e baixado com sucesso!');
      setIsModalOpen(false);
    } catch (error: any) {
      toast.error('Erro ao gerar relatório: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arquivo || !ano) return;

    setUploading(true);
    try {
      const fileExt = arquivo.name.split('.').pop();
      const fileName = `doc_${ano}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('documentos')
        .upload(fileName, arquivo);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from('documentos').insert([{
        nome: arquivo.name.replace(/\.[^/.]+$/, ''),
        ano,
        arquivo_nome: arquivo.name,
        arquivo_path: fileName,
        status: 'Publicado'
      }]);

      if (dbError) throw dbError;

      toast.success('Documento enviado com sucesso!');
      setIsModalOpen(false);
      setAno('');
      setArquivo(null);
    } catch (error: any) {
      toast.error('Erro ao enviar: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('documentos')
        .download(doc.arquivo_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.arquivo_nome;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error('Erro ao baixar: ' + error.message);
    }
  };

  const handleDelete = async (doc: any) => {
    if (!confirm('Excluir este documento permanentemente?')) return;

    try {
      const { error: storageError } = await supabase.storage
        .from('documentos')
        .remove([doc.arquivo_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase.from('documentos').delete().eq('id', doc.id);
      if (dbError) throw dbError;

      toast.success('Documento excluído!');
    } catch (error: any) {
      toast.error('Erro ao excluir: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Acervo Documental</h1>
          <p className="text-sm text-slate-500 mt-1">Gere relatórios automáticos ou envie documentos PDF.</p>
        </div>
        <button 
          onClick={() => { setAno(new Date().getFullYear().toString()); setIsModalOpen(true); }}
          className="inline-flex w-full sm:w-auto items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          Novo Documento
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">O que o relatório inclui?</h2>
          <ul className="space-y-4 pt-2">
            {[
              { title: 'Identificação Institucional e Diretoria', desc: 'Dados da liga e diretores vigentes.' },
              { title: 'Campeonatos (Ficha Histórica)', desc: 'Todas as competições da temporada.' },
              { title: 'Equipes Participantes', desc: 'Lista completa de equipes e responsáveis.' },
              { title: 'Atletas Inscritos', desc: 'Todos os atletas vinculados a equipes.' },
              { title: 'Árbitros', desc: 'Escalação e avaliações.' },
              { title: 'Tribunal Disciplinar', desc: 'Suspensões e punições aplicadas.' },
              { title: 'Balanço Financeiro DRE', desc: 'Receitas, despesas e saldo.' },
              { title: 'Campeões', desc: 'Histórico de campeões por categoria.' },
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
          <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Documentos Disponíveis</h2>
          <div className="space-y-3 flex-1 overflow-auto max-h-[600px] pr-2">
            {isLoading ? (
              <div className="text-center p-8 text-slate-500">Carregando documentos...</div>
            ) : documentos.length === 0 ? (
              <div className="text-center p-8 bg-slate-50 rounded-lg">
                <p className="text-slate-500 text-sm">Nenhum documento disponível.</p>
              </div>
            ) : (
              documentos.map((doc) => (
                <div key={doc.id} className="group flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 hover:border-blue-400 hover:shadow-sm transition-all">
                  <div className="flex items-center">
                    <div className="rounded-md bg-blue-50 p-2.5 group-hover:bg-blue-100 transition-colors">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-bold text-slate-900">{doc.nome}</p>
                      <p className="text-xs text-slate-500 flex items-center mt-1">
                        <Calendar className="w-3 h-3 mr-1 inline" /> {new Date(doc.criado_em).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleDownload(doc)}
                      className="inline-flex items-center justify-center rounded-md bg-white p-2 border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors"
                      title="Baixar"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(doc)}
                      className="inline-flex items-center justify-center rounded-md bg-white p-2 border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Documento">
        <div className="space-y-4">
          <div className="flex border-b border-slate-200">
            <button
              className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${tabUpload === 'gerar' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              onClick={() => setTabUpload('gerar')}
            >
              Gerar Relatório Automático
            </button>
            <button
              className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${tabUpload === 'enviar' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              onClick={() => setTabUpload('enviar')}
            >
              Enviar Arquivo
            </button>
          </div>

          {tabUpload === 'gerar' ? (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg flex gap-3 text-blue-800 text-sm border border-blue-100">
                <BarChart3 className="shrink-0 w-5 h-5 text-blue-600" />
                <p>
                  O sistema irá compilar todos os dados (atletas, equipes, financeiro, etc.) e gerar um PDF completo.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Ano Base</label>
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
                <button 
                  onClick={() => gerarPDF(ano)}
                  disabled={isGenerating || !ano}
                  className="flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando...</> : `Gerar Relatório ${ano}`}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Ano Base</label>
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
              <div>
                <label className="block text-sm font-medium text-slate-700">Arquivo</label>
                <div 
                  className="mt-1 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 p-6 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 text-slate-400 mb-2" />
                  <p className="text-sm text-slate-500">
                    {arquivo ? arquivo.name : 'Clique para selecionar'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">PDF, DOC, DOCX</p>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={e => setArquivo(e.target.files?.[0] || null)}
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">Cancelar</button>
                <button 
                  type="submit" 
                  disabled={uploading || !arquivo}
                  className="flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
}
