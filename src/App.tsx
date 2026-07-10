import { useState, useRef } from 'react';
import type { ChangeEvent } from 'react';
import {
    FileCode,
    Download,
    Upload,
    Plus,
    Trash2,
    Info,
    Settings,
    FileText,
    FileJson,
    Zap,
} from 'lucide-react';
import type { DamFile } from './types/dam.ts';
import { DEFAULT_DAM_FILE } from './types/dam.ts';
import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function App() {
    const [damFile, setDamFile] = useState<DamFile>(DEFAULT_DAM_FILE);
    const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'info'>(
        'edit',
    );
    const fileInputRef = useRef<HTMLInputElement>(null);

    const updateMetadata = (
        key: keyof DamFile['metadata'],
        value: string,
    ): void => {
        setDamFile((prev) => ({
            ...prev,
            metadata: { ...prev.metadata, [key]: value },
        }));
    };

    const updateContent = (key: string, value: string): void => {
        setDamFile((prev) => ({
            ...prev,
            content: { ...prev.content, [key]: value },
        }));
    };

    const addContentField = (): void => {
        const key = `field_${Object.keys(damFile.content).length + 1}`;
        updateContent(key, '');
    };

    const removeContentField = (key: string): void => {
        const newContent = { ...damFile.content };
        delete newContent[key];
        setDamFile((prev) => ({ ...prev, content: newContent }));
    };

    const handleDownload = (): void => {
        const blob = new Blob([JSON.stringify(damFile, null, 2)], {
            type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${
            damFile.metadata.description.replace(/\s+/g, '_').toLowerCase() ||
            'file'
        }.dam`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleUpload = (event: ChangeEvent<HTMLInputElement>): void => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const result = e.target?.result;
                if (typeof result !== 'string') return;
                const json: unknown = JSON.parse(result);
                if (
                    typeof json === 'object' &&
                    json !== null &&
                    'format' in json &&
                    (json as Record<string, unknown>).format === 'DAM'
                ) {
                    setDamFile(json as DamFile);
                } else {
                    alert('Not a valid .dam file');
                }
            } catch {
                alert('Error parsing .dam file');
            }
        };
        reader.readAsText(file);
    };

    const renderEditor = () => (
        <div className="space-y-6 animate-fadeIn">
            <section className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-400" /> File
                    Metadata
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs uppercase tracking-wider text-neutral-500 font-bold">
                            Author
                        </label>
                        <input
                            value={damFile.metadata.author}
                            onChange={(e) =>
                                updateMetadata('author', e.target.value)
                            }
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs uppercase tracking-wider text-neutral-500 font-bold">
                            Version
                        </label>
                        <input
                            value={damFile.version}
                            disabled
                            className="w-full bg-neutral-950/50 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-500 cursor-not-allowed"
                        />
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                        <label className="text-xs uppercase tracking-wider text-neutral-500 font-bold">
                            Description
                        </label>
                        <textarea
                            value={damFile.metadata.description}
                            onChange={(e) =>
                                updateMetadata('description', e.target.value)
                            }
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 h-20 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all resize-none"
                        />
                    </div>
                </div>
            </section>

            <section className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <FileCode className="w-5 h-5 text-indigo-400" /> Data
                        Content
                    </h2>
                    <button
                        onClick={addContentField}
                        className="text-xs flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all"
                    >
                        <Plus className="w-3.5 h-3.5" /> Add Field
                    </button>
                </div>
                <div className="space-y-3">
                    {Object.entries(damFile.content).map(([key, value]) => (
                        <div key={key} className="flex gap-3 group">
                            <input
                                value={key}
                                readOnly
                                className="w-1/3 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-400 font-mono"
                            />
                            <input
                                value={String(value)}
                                onChange={(e) =>
                                    updateContent(key, e.target.value)
                                }
                                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                            />
                            <button
                                onClick={() => removeContentField(key)}
                                className="p-2 text-neutral-500 hover:text-red-400 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    {Object.keys(damFile.content).length === 0 && (
                        <div className="text-center py-8 border-2 border-dashed border-neutral-800 rounded-xl">
                            <p className="text-neutral-500 text-sm">
                                No data fields yet. Click &quot;Add Field&quot;
                                above.
                            </p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );

    const renderPreview = () => (
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden animate-fadeIn">
            <div className="bg-neutral-800/50 px-4 py-2 border-b border-neutral-700 flex items-center justify-between">
                <span className="text-xs font-mono text-neutral-400">
                    export.dam
                </span>
                <button
                    onClick={() => {
                        void navigator.clipboard.writeText(
                            JSON.stringify(damFile, null, 2),
                        );
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                    Copy Content
                </button>
            </div>
            <pre className="p-6 text-sm font-mono overflow-auto max-h-[600px] text-indigo-300 whitespace-pre-wrap">
                {JSON.stringify(damFile, null, 2)}
            </pre>
        </div>
    );

    const renderSpec = () => (
        <div className="space-y-6 animate-fadeIn">
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-8 space-y-6">
                <h2 className="text-2xl font-bold">The .dam Specification</h2>
                <p className="text-neutral-400 leading-relaxed">
                    The .dam (Data Asset Metadata) format is a proposal for a
                    unified metadata-first container. It uses JSON under the
                    hood, identified by the .dam extension.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 hover:border-indigo-500/30 transition-colors">
                        <h3 className="font-semibold text-indigo-400 mb-2">
                            Structure
                        </h3>
                        <p className="text-sm text-neutral-500">
                            JSON-based for maximum compatibility and ease of
                            parsing across all platforms.
                        </p>
                    </div>
                    <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 hover:border-indigo-500/30 transition-colors">
                        <h3 className="font-semibold text-indigo-400 mb-2">
                            Identification
                        </h3>
                        <p className="text-sm text-neutral-500">
                            {
                                'Includes a mandatory "format": "DAM" field as a digital signature.'
                            }
                        </p>
                    </div>
                </div>
            </div>
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-8">
                <h3 className="font-semibold mb-4 text-indigo-400">
                    Quick Start Parser
                </h3>
                <pre className="p-4 bg-black rounded-xl text-xs text-indigo-300 overflow-auto">
                    {[
                        'function parseDam(content) {',
                        '  const data = JSON.parse(content);',
                        "  if (data.format !== 'DAM') throw 'Invalid Format';",
                        '  return data.content;',
                        '}',
                    ].join('\n')}
                </pre>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-indigo-500/30">
            <header className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-md sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-indigo-600 p-2 rounded-lg">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg tracking-tight">
                                DAM Studio
                            </h1>
                            <p className="text-xs text-neutral-400">
                                Data Asset Metadata v1.0
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 transition-colors text-sm border border-neutral-700"
                        >
                            <Upload className="w-4 h-4" /> Import .dam
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".dam"
                            onChange={handleUpload}
                        />
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-2 px-4 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 transition-colors text-sm font-medium shadow-lg shadow-indigo-900/20"
                        >
                            <Download className="w-4 h-4" /> Export .dam
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex gap-1 p-1 bg-neutral-900 rounded-xl w-fit mb-8 border border-neutral-800">
                    {(['edit', 'preview', 'info'] as const).map((tab) => {
                        const labels = {
                            edit: 'Editor',
                            preview: 'Raw Format',
                            info: 'Spec',
                        } as const;
                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    'flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all',
                                    activeTab === tab
                                        ? 'bg-neutral-800 text-white shadow-sm'
                                        : 'text-neutral-400 hover:text-neutral-200',
                                )}
                            >
                                {tab === 'edit' && (
                                    <Settings className="w-4 h-4" />
                                )}
                                {tab === 'preview' && (
                                    <FileCode className="w-4 h-4" />
                                )}
                                {tab === 'info' && <Info className="w-4 h-4" />}
                                {labels[tab]}
                            </button>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        {activeTab === 'edit' && renderEditor()}
                        {activeTab === 'preview' && renderPreview()}
                        {activeTab === 'info' && renderSpec()}
                    </div>

                    <aside className="space-y-6">
                        <div className="bg-indigo-600 rounded-2xl p-6 text-white overflow-hidden relative group">
                            <div className="relative z-10">
                                <h3 className="font-bold text-xl mb-1">
                                    Export Ready
                                </h3>
                                <p className="text-indigo-100 text-sm mb-4">
                                    Your .dam file is optimized and ready.
                                </p>
                                <button
                                    onClick={handleDownload}
                                    className="w-full py-2.5 bg-white text-indigo-600 rounded-xl font-bold text-sm shadow-xl active:scale-95 transition-transform"
                                >
                                    Download .dam
                                </button>
                            </div>
                            <Zap className="absolute -bottom-4 -right-4 w-32 h-32 text-indigo-500 opacity-20 group-hover:scale-110 transition-transform" />
                        </div>

                        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                            <h3 className="font-semibold mb-4 text-xs uppercase tracking-wider text-neutral-500">
                                File Statistics
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-neutral-400">
                                        Total Fields
                                    </span>
                                    <span className="font-mono text-indigo-400">
                                        {Object.keys(damFile.content).length}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-neutral-400">
                                        JSON Size
                                    </span>
                                    <span className="font-mono text-indigo-400">
                                        {(
                                            JSON.stringify(damFile).length /
                                            1024
                                        ).toFixed(2)}{' '}
                                        KB
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-neutral-400">
                                        Format
                                    </span>
                                    <span className="font-mono text-indigo-400">
                                        v{damFile.version}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <Plus className="w-4 h-4 text-indigo-400" />{' '}
                                Quick Add
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    'schema',
                                    'token',
                                    'id',
                                    'timestamp',
                                    'config',
                                ].map((label) => (
                                    <button
                                        key={label}
                                        onClick={() => updateContent(label, '')}
                                        className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 rounded-md text-xs text-neutral-300 transition-colors capitalize"
                                    >
                                        + {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </aside>
                </div>
            </main>

            <footer className="border-t border-neutral-800 py-12 mt-12 text-center md:text-left">
                <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6 text-neutral-500">
                    <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5" />
                        <span className="text-sm">
                            &copy; 2024 DAM File Foundation.
                        </span>
                    </div>
                    <div className="flex items-center gap-6">
                        <FileJson className="w-5 h-5" />
                        <a
                            href="#"
                            className="text-sm hover:text-white transition-colors"
                        >
                            Spec
                        </a>
                        <a
                            href="#"
                            className="text-sm hover:text-white transition-colors"
                        >
                            Tools
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
