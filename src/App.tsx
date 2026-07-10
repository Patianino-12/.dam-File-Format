import { useState, useRef, useCallback } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import {
    FileCode,
    Download,
    Upload,
    Trash2,
    Info,
    FileText,
    FileJson,
    Zap,
    Paperclip,
    Image,
    File,
    X,
    Eye,
} from 'lucide-react';
import type { DamFile, DamAttachment } from './types/dam.ts';
import { DEFAULT_DAM_FILE, serializeDam, parseDam } from './types/dam.ts';
import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getMimeType(fileName: string, browserType: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const map: Record<string, string> = {
        // Images
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        svg: 'image/svg+xml',
        ico: 'image/x-icon',
        bmp: 'image/bmp',
        // Documents
        pdf: 'application/pdf',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        xls: 'application/vnd.ms-excel',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ppt: 'application/vnd.ms-powerpoint',
        pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        // Text / Code
        txt: 'text/plain',
        md: 'text/markdown',
        html: 'text/html',
        htm: 'text/html',
        css: 'text/css',
        js: 'text/javascript',
        ts: 'text/typescript',
        tsx: 'text/typescript',
        jsx: 'text/javascript',
        json: 'application/json',
        xml: 'text/xml',
        csv: 'text/csv',
        yaml: 'text/yaml',
        yml: 'text/yaml',
        py: 'text/x-python',
        rb: 'text/x-ruby',
        go: 'text/x-go',
        rs: 'text/x-rust',
        java: 'text/x-java',
        c: 'text/x-c',
        cpp: 'text/x-c++',
        h: 'text/x-c',
        sh: 'text/x-shellscript',
        bat: 'text/x-batch',
        sql: 'text/x-sql',
        // Archives
        zip: 'application/zip',
        tar: 'application/x-tar',
        gz: 'application/gzip',
        rar: 'application/vnd.rar',
        '7z': 'application/x-7z-compressed',
        // Audio
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        ogg: 'audio/ogg',
        flac: 'audio/flac',
        // Video
        mp4: 'video/mp4',
        webm: 'video/webm',
        avi: 'video/x-msvideo',
        mov: 'video/quicktime',
        // Fonts
        woff: 'font/woff',
        woff2: 'font/woff2',
        ttf: 'font/ttf',
        otf: 'font/otf',
    };
    return (
        map[ext] ||
        (browserType && browserType !== 'application/octet-stream'
            ? browserType
            : 'application/octet-stream')
    );
}

function isTextMime(type: string): boolean {
    return (
        type.startsWith('text/') ||
        type === 'application/json' ||
        type === 'application/xml'
    );
}

function getFileIcon(type: string) {
    if (type.startsWith('image/')) return Image;
    return File;
}

export default function App() {
    const [damFile, setDamFile] = useState<DamFile>({
        ...DEFAULT_DAM_FILE,
        created: new Date().toISOString(),
    });
    const [activeTab, setActiveTab] = useState<'write' | 'preview' | 'info'>(
        'write',
    );
    const [previewAttachment, setPreviewAttachment] =
        useState<DamAttachment | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const attachInputRef = useRef<HTMLInputElement>(null);

    const handleDownload = (): void => {
        const output = serializeDam(damFile);
        const blob = new Blob([output], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeName =
            damFile.title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase() ||
            'file';
        a.download = `${safeName}.dam`;
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
            const result = e.target?.result;
            if (typeof result !== 'string') return;
            const parsed = parseDam(result);
            if (parsed) {
                setDamFile(parsed);
            } else {
                alert('Not a valid .dam file');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    const addFiles = useCallback((files: FileList | File[]) => {
        const fileArray = Array.from(files);
        for (const file of fileArray) {
            if (file.size > 10 * 1024 * 1024) {
                alert(`${file.name} is too large (max 10 MB).`);
                continue;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target?.result;
                if (typeof dataUrl !== 'string') return;
                // strip the data:...;base64, prefix
                const base64 = dataUrl.split(',')[1] || '';
                const correctedType = getMimeType(file.name, file.type);
                const attachment: DamAttachment = {
                    name: file.name,
                    type: correctedType,
                    data: base64,
                    size: file.size,
                };
                setDamFile((prev) => ({
                    ...prev,
                    attachments: [...prev.attachments, attachment],
                }));
            };
            reader.readAsDataURL(file);
        }
    }, []);

    const removeAttachment = (index: number): void => {
        setDamFile((prev) => ({
            ...prev,
            attachments: prev.attachments.filter((_, i) => i !== index),
        }));
    };

    const handleAttachInput = (event: ChangeEvent<HTMLInputElement>): void => {
        if (event.target.files) addFiles(event.target.files);
        event.target.value = '';
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files.length > 0) {
            addFiles(e.dataTransfer.files);
        }
    };

    const rawPreview = serializeDam(damFile);

    // ── Render sections ──

    const renderWriter = () => (
        <div className="space-y-6 animate-fadeIn">
            {/* Title & Author */}
            <section className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-400" /> Document
                    Info
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs uppercase tracking-wider text-neutral-500 font-bold">
                            Title
                        </label>
                        <input
                            value={damFile.title}
                            onChange={(e) =>
                                setDamFile((p) => ({
                                    ...p,
                                    title: e.target.value,
                                }))
                            }
                            placeholder="My Document"
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs uppercase tracking-wider text-neutral-500 font-bold">
                            Author
                        </label>
                        <input
                            value={damFile.author}
                            onChange={(e) =>
                                setDamFile((p) => ({
                                    ...p,
                                    author: e.target.value,
                                }))
                            }
                            placeholder="Your name"
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                        />
                    </div>
                </div>
            </section>

            {/* Body / Main Content */}
            <section className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileCode className="w-5 h-5 text-indigo-400" /> Content
                </h2>
                <textarea
                    value={damFile.body}
                    onChange={(e) =>
                        setDamFile((p) => ({ ...p, body: e.target.value }))
                    }
                    placeholder="Write anything here — this is exactly what appears when you open the .dam file..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 min-h-[240px] focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all resize-y font-mono text-sm leading-relaxed"
                />
            </section>

            {/* Attachments */}
            <section className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Paperclip className="w-5 h-5 text-indigo-400" />{' '}
                        Attachments
                    </h2>
                    <button
                        onClick={() => attachInputRef.current?.click()}
                        className="text-xs flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all"
                    >
                        <Paperclip className="w-3.5 h-3.5" /> Add Files
                    </button>
                    <input
                        type="file"
                        ref={attachInputRef}
                        className="hidden"
                        multiple
                        onChange={handleAttachInput}
                    />
                </div>

                {/* Drop Zone */}
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                        'border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer',
                        isDragging
                            ? 'border-indigo-500 bg-indigo-500/10'
                            : 'border-neutral-700 hover:border-neutral-600',
                    )}
                    onClick={() => attachInputRef.current?.click()}
                >
                    <Image className="w-8 h-8 mx-auto mb-2 text-neutral-500" />
                    <p className="text-neutral-400 text-sm">
                        Drag &amp; drop images or files here, or click to browse
                    </p>
                    <p className="text-neutral-600 text-xs mt-1">
                        Max 10 MB per file
                    </p>
                </div>

                {/* Attachment List */}
                {damFile.attachments.length > 0 && (
                    <div className="mt-4 space-y-2">
                        {damFile.attachments.map((att, i) => {
                            const Icon = getFileIcon(att.type);
                            const isImage = att.type.startsWith('image/');
                            const isText = isTextMime(att.type);
                            return (
                                <div
                                    key={`${att.name}-${i}`}
                                    className="bg-neutral-950 rounded-lg overflow-hidden"
                                >
                                    <div className="flex items-center gap-3 px-3 py-2">
                                        {isImage ? (
                                            <img
                                                src={`data:${att.type};base64,${att.data}`}
                                                alt={att.name}
                                                className="w-10 h-10 rounded object-cover border border-neutral-800"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded bg-neutral-800 flex items-center justify-center shrink-0">
                                                <Icon className="w-5 h-5 text-neutral-400" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-neutral-200 truncate">
                                                {att.name}
                                            </p>
                                            <p className="text-xs text-neutral-500">
                                                {att.type} &middot;{' '}
                                                {formatBytes(att.size)}
                                            </p>
                                        </div>
                                        {(isImage || isText) && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setPreviewAttachment(att);
                                                }}
                                                className="p-1.5 text-neutral-500 hover:text-indigo-400 transition-colors"
                                                title="Preview"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => {
                                                const blob = new Blob(
                                                    [
                                                        Uint8Array.from(
                                                            atob(att.data),
                                                            (c) =>
                                                                c.charCodeAt(0),
                                                        ),
                                                    ],
                                                    { type: att.type },
                                                );
                                                const url =
                                                    URL.createObjectURL(blob);
                                                const a =
                                                    document.createElement('a');
                                                a.href = url;
                                                a.download = att.name;
                                                a.click();
                                                URL.revokeObjectURL(url);
                                            }}
                                            className="p-1.5 text-neutral-500 hover:text-indigo-400 transition-colors"
                                            title="Download original"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => removeAttachment(i)}
                                            className="p-1.5 text-neutral-500 hover:text-red-400 transition-colors"
                                            title="Remove"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );

    const renderPreview = () => (
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden animate-fadeIn">
            <div className="bg-neutral-800/50 px-4 py-2 border-b border-neutral-700 flex items-center justify-between">
                <span className="text-xs font-mono text-neutral-400">
                    {damFile.title
                        .replace(/[^a-zA-Z0-9_-]/g, '_')
                        .toLowerCase() || 'file'}
                    .dam
                </span>
                <button
                    onClick={() => {
                        void navigator.clipboard.writeText(rawPreview);
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                    Copy
                </button>
            </div>
            <pre className="p-6 text-sm font-mono overflow-auto max-h-[600px] text-neutral-300 whitespace-pre-wrap leading-relaxed">
                {rawPreview}
            </pre>
        </div>
    );

    const renderSpec = () => (
        <div className="space-y-6 animate-fadeIn">
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-8 space-y-6">
                <h2 className="text-2xl font-bold">The .dam Format</h2>
                <p className="text-neutral-400 leading-relaxed">
                    A .dam file is a human-readable text file. When you open it
                    in any text editor, you see your content — not machine
                    noise. Metadata lives in a small header, and attached files
                    are base64-encoded at the bottom.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800">
                        <h3 className="font-semibold text-indigo-400 mb-2">
                            Human-Readable
                        </h3>
                        <p className="text-sm text-neutral-500">
                            Open any .dam in Notepad and read your content
                            immediately.
                        </p>
                    </div>
                    <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800">
                        <h3 className="font-semibold text-indigo-400 mb-2">
                            Attachments
                        </h3>
                        <p className="text-sm text-neutral-500">
                            Images and files are embedded as base64 at the end
                            of the file.
                        </p>
                    </div>
                    <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800">
                        <h3 className="font-semibold text-indigo-400 mb-2">
                            Portable
                        </h3>
                        <p className="text-sm text-neutral-500">
                            One single file contains everything — text and
                            assets bundled together.
                        </p>
                    </div>
                </div>
            </div>
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-8">
                <h3 className="font-semibold mb-4 text-indigo-400">
                    File Structure
                </h3>
                <pre className="p-4 bg-black rounded-xl text-xs text-indigo-300 overflow-auto leading-relaxed">
                    {[
                        '===DAM v1.0===',
                        'title: My Document',
                        'author: Jane Doe',
                        'created: 2024-06-15T12:00:00.000Z',
                        '==============',
                        '',
                        'This is the actual content you wrote.',
                        'It appears exactly like this when you open the file.',
                        '',
                        '===ATTACHMENTS===',
                        '[photo.jpg|image/jpeg|45230]',
                        '/9j/4AAQSkZJRg...(base64 data)...',
                        '===END===',
                    ].join('\n')}
                </pre>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-indigo-500/30">
            {/* Attachment Preview Modal */}
            {previewAttachment && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setPreviewAttachment(null)}
                >
                    <div
                        className="relative max-w-3xl w-full max-h-[80vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setPreviewAttachment(null)}
                            className="absolute -top-3 -right-3 bg-neutral-800 rounded-full p-1.5 hover:bg-neutral-700 transition-colors z-10"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        {previewAttachment.type.startsWith('image/') ? (
                            <img
                                src={`data:${previewAttachment.type};base64,${previewAttachment.data}`}
                                alt={previewAttachment.name}
                                className="max-w-full max-h-[75vh] rounded-xl border border-neutral-700 object-contain mx-auto"
                            />
                        ) : isTextMime(previewAttachment.type) ? (
                            <pre className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 text-sm text-neutral-300 font-mono overflow-auto max-h-[75vh] whitespace-pre-wrap">
                                {atob(previewAttachment.data)}
                            </pre>
                        ) : (
                            <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-12 text-center">
                                <File className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                                <p className="text-neutral-400">
                                    Preview not available for this file type.
                                </p>
                            </div>
                        )}
                        <p className="text-center text-sm text-neutral-400 mt-3">
                            {previewAttachment.name} &middot;{' '}
                            {formatBytes(previewAttachment.size)}
                        </p>
                    </div>
                </div>
            )}

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
                            <Upload className="w-4 h-4" /> Open .dam
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
                            <Download className="w-4 h-4" /> Save .dam
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex gap-1 p-1 bg-neutral-900 rounded-xl w-fit mb-8 border border-neutral-800">
                    {(['write', 'preview', 'info'] as const).map((tab) => {
                        const labels = {
                            write: 'Write',
                            preview: 'Raw Preview',
                            info: 'Format Spec',
                        } as const;
                        const icons = {
                            write: FileText,
                            preview: FileCode,
                            info: Info,
                        } as const;
                        const TabIcon = icons[tab];
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
                                <TabIcon className="w-4 h-4" />
                                {labels[tab]}
                            </button>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        {activeTab === 'write' && renderWriter()}
                        {activeTab === 'preview' && renderPreview()}
                        {activeTab === 'info' && renderSpec()}
                    </div>

                    <aside className="space-y-6">
                        <div className="bg-indigo-600 rounded-2xl p-6 text-white overflow-hidden relative group">
                            <div className="relative z-10">
                                <h3 className="font-bold text-xl mb-1">
                                    Save as .dam
                                </h3>
                                <p className="text-indigo-100 text-sm mb-4">
                                    Your content + attachments bundled into one
                                    portable file.
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
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-neutral-400">
                                        Title
                                    </span>
                                    <span className="font-mono text-indigo-400 truncate max-w-[140px]">
                                        {damFile.title || '—'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-neutral-400">
                                        Body Length
                                    </span>
                                    <span className="font-mono text-indigo-400">
                                        {damFile.body.length} chars
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-neutral-400">
                                        Attachments
                                    </span>
                                    <span className="font-mono text-indigo-400">
                                        {damFile.attachments.length}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-neutral-400">
                                        Total Size
                                    </span>
                                    <span className="font-mono text-indigo-400">
                                        {formatBytes(rawPreview.length)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                            <h3 className="font-semibold mb-3 text-sm">
                                What gets saved?
                            </h3>
                            <ul className="text-xs text-neutral-500 space-y-2">
                                <li className="flex items-start gap-2">
                                    <span className="text-indigo-400 mt-0.5">
                                        ✓
                                    </span>
                                    Your title, author, and timestamp
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-indigo-400 mt-0.5">
                                        ✓
                                    </span>
                                    Everything you write in the body — appears
                                    as-is in the file
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-indigo-400 mt-0.5">
                                        ✓
                                    </span>
                                    All attached images &amp; files (base64
                                    encoded)
                                </li>
                            </ul>
                        </div>
                    </aside>
                </div>
            </main>

            <footer className="border-t border-neutral-800 py-12 mt-12 text-center md:text-left">
                <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6 text-neutral-500">
                    <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5" />
                        <span className="text-sm">
                            &copy; 2024 DAM File Format.
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
