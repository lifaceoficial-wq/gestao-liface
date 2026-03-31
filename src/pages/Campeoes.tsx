import React, { useState, useEffect } from 'react';
import { Plus, Search, Trophy, Crown, Star, Edit2, Trash2, ImageOff, Medal } from 'lucide-react';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

const CATEGORIAS = ['Adulto', 'Master', 'Sub-15', 'Sub-17', 'Sub-20', 'Feminino'];
const POSICOES = ['Campeão', 'Vice-Campeão', '3º Lugar'];

const CATEGORIA_COLORS: Record<string, string> = {
  'Adulto':   'bg-blue-100 text-blue-700 ring-blue-600/20',
  'Master':   'bg-orange-100 text-orange-700 ring-orange-600/20',
  'Sub-15':   'bg-green-100 text-green-700 ring-green-600/20',
  'Sub-17':   'bg-teal-100 text-teal-700 ring-teal-600/20',
  'Sub-20':   'bg-sky-100 text-sky-700 ring-sky-600/20',
  'Feminino': 'bg-pink-100 text-pink-700 ring-pink-600/20',
};

const POSICAO_ICONS: Record<string, React.ReactNode> = {
  'Campeão':       <Crown className="w-3.5 h-3.5" />,
  'Vice-Campeão':  <Medal className="w-3.5 h-3.5" />,
  '3º Lugar':      <Star className="w-3.5 h-3.5" />,
};

const POSICAO_COLORS: Record<string, string> = {
  'Campeão':      'bg-amber-400 text-amber-900',
  'Vice-Campeão': 'bg-slate-300 text-slate-800',
  '3º Lugar':     'bg-orange-200 text-orange-900',
};

type FormData = {
  nome: string;
  equipe: string;
  categoria: string;
  ano: number;
  posicao: string;
  foto_url: string;
};

const emptyForm = (): FormData => ({
  nome: '',
  equipe: '',
  categoria: 'Adulto',
  ano: new Date().getFullYear(),
  posicao: 'Campeão',
  foto_url: '',
});

export default function Campeoes() {
  const [campeas, setCampeoes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [campeaSelecionado, setCampeaoSelecionado] = useState<any>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm());

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('campeas_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campeoes' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('campeoes')
        .select('*')
        .order('ano', { ascending: false });
      if (error) throw error;
      setCampeoes(data || []);
    } catch (error: any) {
      toast.error('Erro ao buscar dados: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = campeas.filter((c: any) =>
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.equipe.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(c.ano).includes(searchTerm)
  );

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('campeoes').insert([formData]);
      if (error) throw error;
      setFormModalOpen(false);
      setFormData(emptyForm());
      toast.success('Campeão cadastrado!');
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    }
  };

  const handleEditar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('campeoes')
        .update(formData)
        .eq('id', campeaSelecionado.id);
      if (error) throw error;
      setEditModalOpen(false);
      toast.success('Campeão atualizado!');
    } catch (error: any) {
      toast.error('Erro ao atualizar: ' + error.message);
    }
  };

  const handleExcluir = async (id: string) => {
    if (!confirm('Excluir este campeão?')) return;
    try {
      const { error } = await supabase.from('campeoes').delete().eq('id', id);
      if (error) throw error;
      toast.success('Campeão excluído!');
    } catch (error: any) {
      toast.error('Erro ao excluir: ' + error.message);
    }
  };

  const abrirEditar = (c: any) => {
    setCampeaoSelecionado(c);
    setFormData({
      nome:      c.nome,
      equipe:    c.equipe,
      categoria: c.categoria,
      ano:       c.ano,
      posicao:   c.posicao || 'Campeão',
      foto_url:  c.foto_url || '',
    });
    setEditModalOpen(true);
  };

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .card-entry {
          animation: fadeUp 0.45s ease both;
        }
        .champ-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 40px -10px rgba(245,158,11,0.25), 0 8px 20px -8px rgba(0,0,0,0.12);
        }
        .champ-card {
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
      `}</style>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Crown className="w-6 h-6 text-amber-500" />
              Hall of Fame
            </h1>
          </div>
          <button
            id="btn-novo-campea"
            onClick={() => { setFormData(emptyForm()); setFormModalOpen(true); }}
            className="inline-flex items-center justify-center rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 transition-colors"
          >
            <Plus className="-ml-1 mr-2 w-5 h-5" /> Novo Campeão
          </button>
        </div>

        {/* Search */}
        <div className="flex bg-white p-4 rounded-xl border border-slate-200">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              className="block w-full rounded-md border-0 py-1.5 pl-10 ring-1 ring-inset ring-slate-300 focus:ring-amber-500 sm:text-sm"
              placeholder="Buscar campeão, equipe ou ano..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Gallery */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-slate-100 animate-pulse h-64" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
            <Trophy className="w-14 h-14 opacity-30" />
            <p className="text-base font-medium">Nenhum campeão encontrado.</p>
            <p className="text-sm">Cadastre o primeiro campeão clicando em "Novo Campeão".</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filtered.map((c: any, idx: number) => (
              <div
                key={c.id}
                className="champ-card card-entry bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                {/* Card Top - Photo / Trophy */}
                <div className="relative bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 h-44 flex items-center justify-center overflow-hidden">
                  {/* Ano watermark */}
                  <span className="absolute inset-0 flex items-center justify-center text-7xl font-black text-white/20 select-none pointer-events-none">
                    {c.ano}
                  </span>

                  {/* Foto ou ícone */}
                  {c.foto_url ? (
                    <img
                      src={c.foto_url}
                      alt={c.nome}
                      className="w-24 h-24 rounded-full object-cover ring-4 ring-white/60 shadow-lg z-10"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-white/20 ring-4 ring-white/40 flex items-center justify-center z-10 backdrop-blur-sm">
                      <Trophy className="w-12 h-12 text-white" />
                    </div>
                  )}

                  {/* Posição badge */}
                  <span className={`absolute top-3 left-3 inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${POSICAO_COLORS[c.posicao] || 'bg-amber-400 text-amber-900'}`}>
                    {POSICAO_ICONS[c.posicao]}
                    {c.posicao || 'Campeão'}
                  </span>

                  {/* Badge sem foto */}
                  {!c.foto_url && (
                    <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-white/90 text-orange-600 shadow-sm">
                      📷 Sem foto
                    </span>
                  )}

                  {/* Ações */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      id={`btn-editar-${c.id}`}
                      onClick={() => abrirEditar(c)}
                      className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors shadow"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                    </button>
                    <button
                      id={`btn-excluir-${c.id}`}
                      onClick={() => handleExcluir(c.id)}
                      className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center hover:bg-red-100 transition-colors shadow"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                </div>

                {/* Card Bottom - Info */}
                <div className="p-4 flex flex-col gap-2 flex-1 group">
                  <div>
                    <p className="font-bold text-slate-900 text-sm leading-tight line-clamp-1">{c.nome}</p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{c.equipe}</p>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${CATEGORIA_COLORS[c.categoria] || 'bg-slate-100 text-slate-700 ring-slate-600/20'}`}>
                      {c.categoria}
                    </span>
                    <span className="text-xs font-bold text-amber-600">{c.ano}</span>
                  </div>

                  {/* Botões visíveis no hover (via group) */}
                  <div className="flex gap-1 overflow-hidden max-h-0 group-hover:max-h-10 transition-all duration-200">
                    <button
                      onClick={() => abrirEditar(c)}
                      className="flex-1 text-xs py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleExcluir(c.id)}
                      className="flex-1 text-xs py-1 rounded-md bg-red-50 hover:bg-red-100 text-red-600 font-medium transition-colors"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Total */}
        {!isLoading && filtered.length > 0 && (
          <p className="text-xs text-slate-400 text-center">
            {filtered.length} campeão{filtered.length !== 1 ? 'ões' : ''} no Hall of Fame
          </p>
        )}
      </div>

      {/* Modal Cadastro */}
      <Modal isOpen={isFormModalOpen} onClose={() => setFormModalOpen(false)} title="Cadastrar Novo Campeão">
        <CampeaoForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSalvar}
          submitLabel="Cadastrar Campeão"
        />
      </Modal>

      {/* Modal Edição */}
      <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} title="Editar Campeão">
        <CampeaoForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleEditar}
          submitLabel="Salvar Alterações"
        />
      </Modal>
    </>
  );
}

function FotoUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem válida.');
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { data, error } = await supabase.storage
        .from('campeoes')
        .upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage
        .from('campeoes')
        .getPublicUrl(data.path);
      onChange(publicUrl);
      toast.success('Foto enviada!');
    } catch (err: any) {
      toast.error('Erro no upload: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items) as DataTransferItem[];
    const item = items.find(i => i.type.startsWith('image/'));
    if (item) { const f = item.getAsFile(); if (f) uploadFile(f); }
  };


  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) uploadFile(f); }}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onPaste={handlePaste}
        onClick={() => inputRef.current?.click()}
        onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-150 select-none outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${dragOver ? 'border-amber-400 bg-amber-50 scale-[1.01]' : 'border-slate-300 bg-slate-50 hover:border-amber-400 hover:bg-amber-50'}`}
      >
        {uploading ? (
          <>
            <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
            <p className="text-xs text-slate-500">Enviando foto...</p>
          </>
        ) : value ? (
          <>
            <img src={value} alt="preview" className="w-20 h-20 rounded-full object-cover ring-4 ring-amber-400 shadow-md" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <p className="text-xs text-slate-500">Clique, arraste ou cole (<kbd className="bg-slate-100 px-1 rounded">Ctrl+V</kbd>) para trocar</p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Adicionar foto</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Arraste, clique para selecionar ou cole com <kbd className="bg-slate-100 px-1 rounded text-xs">Ctrl+V</kbd>
              </p>
            </div>
          </>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); }} onClick={e => e.stopPropagation()} />
      </div>
      {value && (
        <button type="button" onClick={() => onChange('')} className="text-xs text-red-500 hover:text-red-700 underline">
          Remover foto
        </button>
      )}
    </div>
  );
}

function CampeaoForm({
  formData,
  setFormData,
  onSubmit,
  submitLabel,
}: {
  formData: FormData;
  setFormData: (d: FormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel: string;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">

        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Foto</label>
          <FotoUpload value={formData.foto_url} onChange={url => setFormData({ ...formData, foto_url: url })} />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700">Nome</label>
          <input type="text" required value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700">Equipe</label>
          <input type="text" required value={formData.equipe} onChange={e => setFormData({ ...formData, equipe: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Categoria</label>
          <select value={formData.categoria} onChange={e => setFormData({ ...formData, categoria: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
            {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Posição</label>
          <select value={formData.posicao} onChange={e => setFormData({ ...formData, posicao: e.target.value })} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
            {POSICOES.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Ano</label>
          <input type="number" required min={1900} max={2100} value={formData.ano} onChange={e => setFormData({ ...formData, ano: parseInt(e.target.value) || new Date().getFullYear() })} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
        </div>

      </div>

      <button type="submit" className="w-full rounded-md bg-amber-500 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition-colors">
        {submitLabel}
      </button>
    </form>
  );
}
