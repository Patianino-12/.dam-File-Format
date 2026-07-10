import { useState, useRef, useCallback, useEffect } from 'react';
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
    Lock,
    Unlock,
    Tag,
    Clock,
    Shield,
    Hash,
    BookOpen,
} from 'lucide-react';
import { marked } from 'marked';
import type { DamFile, DamAttachment, DamHistoryEntry } from './types/dam.ts';
import {
    createDefaultDamFile,
    serializeDam,
    parseDam,
    computeAttachmentChecksum,
    DAM_VERSION,
    DAM_MIME,
} from './types/dam.ts';
import { encrypt, decrypt } from './utils/crypto.ts';
import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
    containsProfanity,
    findProfanity,
    censorText,
} from './utils/profanity.ts';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
function formatBytes(b: number) {
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(1) + ' MB';
}

const MIME_MAP: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    bmp: 'image/bmp',
    ico: 'image/x-icon',
    pdf: 'application/pdf',
    txt: 'text/plain',
    md: 'text/markdown',
    html: 'text/html',
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
    go: 'text/x-go',
    rs: 'text/x-rust',
    java: 'text/x-java',
    c: 'text/x-c',
    cpp: 'text/x-c++',
    sh: 'text/x-shellscript',
    sql: 'text/x-sql',
    zip: 'application/zip',
    mp3: 'audio/mpeg',
    mp4: 'video/mp4',
    wav: 'audio/wav',
};
function getMimeType(name: string, browser: string) {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    return (
        MIME_MAP[ext] ||
        (browser && browser !== 'application/octet-stream'
            ? browser
            : 'application/octet-stream')
    );
}
function isTextMime(t: string) {
    return t.startsWith('text/') || t === 'application/json';
}
function getFileIcon(t: string) {
    return t.startsWith('image/') ? Image : File;
}

// ── Markdown setup ──
marked.setOptions({ breaks: true, gfm: true });

export default function App() {
    const [damFile, setDamFile] = useState<DamFile>(createDefaultDamFile());
    const [activeTab, setActiveTab] = useState<
        'write' | 'markdown' | 'preview' | 'history' | 'info'
    >('write');
    const [previewAtt, setPreviewAtt] = useState<DamAttachment | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [warnings, setWarnings] = useState<Record<string, string>>({});
    const [rawPreview, setRawPreview] = useState('');
    const [tagInput, setTagInput] = useState('');
    // Encryption
    const [showEncDialog, setShowEncDialog] = useState(false);
    const [encPassword, setEncPassword] = useState('');
    const [decPassword, setDecPassword] = useState('');
    const [showDecDialog, setShowDecDialog] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const attachInputRef = useRef<HTMLInputElement>(null);

    // Recompute raw preview when file changes
    useEffect(() => {
        let cancelled = false;
        serializeDam(damFile).then((r) => {
            if (!cancelled) setRawPreview(r);
        });
        return () => {
            cancelled = true;
        };
    }, [damFile]);

    // ── Profanity ──
    const validateField = (field: string, value: string) => {
        const bad = findProfanity(value);
        if (bad.length > 0) {
            setWarnings((p) => ({
                ...p,
                [field]: `Inappropriate: ${bad.map((w) => censorText(w)).join(', ')}`,
            }));
        } else {
            setWarnings((p) => {
                const n = { ...p };
                delete n[field];
                return n;
            });
        }
    };
    const updateField = (field: keyof DamFile, value: string) => {
        validateField(field, value);
        setDamFile((p) => ({ ...p, [field]: value }));
    };
    const canSave =
        !containsProfanity(damFile.title) &&
        !containsProfanity(damFile.author) &&
        !containsProfanity(damFile.body);

    // ── History helper ──
    const addHistory = (action: string, summary: string) => {
        const entry: DamHistoryEntry = {
            timestamp: new Date().toISOString(),
            action,
            summary,
        };
        setDamFile((p) => ({ ...p, history: [...p.history, entry] }));
    };

    // ── Tags ──
    const addTag = () => {
        const t = tagInput.trim().toLowerCase();
        if (t && !damFile.tags.includes(t)) {
            setDamFile((p) => ({ ...p, tags: [...p.tags, t] }));
            addHistory('tag_added', `Tag "${t}" added`);
        }
        setTagInput('');
    };
    const removeTag = (tag: string) => {
        setDamFile((p) => ({ ...p, tags: p.tags.filter((x) => x !== tag) }));
    };

    // ── Download ──
    const handleDownload = async () => {
        if (!canSave) {
            alert('Remove inappropriate language before saving.');
            return;
        }
        setIsSaving(true);
        try {
            addHistory('saved', 'File exported as .dam');
            let output = await serializeDam(damFile);

            if (damFile.encrypted && encPassword) {
                output =
                    '===DAM-ENCRYPTED===\n' +
                    (await encrypt(output, encPassword));
            }

            const blob = new Blob([output], { type: DAM_MIME });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${damFile.title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase() || 'file'}.dam`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } finally {
            setIsSaving(false);
        }
    };

    // ── Upload ──
    const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            const result = e.target?.result;
            if (typeof result !== 'string') return;

            if (result.startsWith('===DAM-ENCRYPTED===')) {
                const encData = result.replace('===DAM-ENCRYPTED===\n', '');
                setShowDecDialog(true);
                // Store encrypted data temporarily
                (window as unknown as Record<string, string>).__damEncData =
                    encData;
                return;
            }

            const parsed = parseDam(result);
            if (parsed) {
                parsed.history.push({
                    timestamp: new Date().toISOString(),
                    action: 'imported',
                    summary: 'File imported',
                });
                setDamFile(parsed);
            } else {
                alert('Not a valid .dam file');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    const handleDecrypt = async () => {
        const encData = (window as unknown as Record<string, string>)
            .__damEncData;
        if (!encData || !decPassword) return;
        const plain = await decrypt(encData, decPassword);
        if (!plain) {
            alert('Wrong password or corrupt file.');
            return;
        }
        const parsed = parseDam(plain);
        if (parsed) {
            parsed.encrypted = true;
            parsed.history.push({
                timestamp: new Date().toISOString(),
                action: 'decrypted',
                summary: 'File decrypted and imported',
            });
            setDamFile(parsed);
            setShowDecDialog(false);
            setDecPassword('');
        } else {
            alert('Decryption succeeded but file is invalid.');
        }
    };

    // ── Attachments ──
    const addFiles = useCallback((files: FileList | File[]) => {
        for (const file of Array.from(files)) {
            if (file.size > 10 * 1024 * 1024) {
                alert(`${file.name} too large (10 MB max).`);
                continue;
            }
            const reader = new FileReader();
            reader.onload = async (e) => {
                const dataUrl = e.target?.result;
                if (typeof dataUrl !== 'string') return;
                const base64 = dataUrl.split(',')[1] || '';
                const checksum = await computeAttachmentChecksum(base64);
                const att: DamAttachment = {
                    name: file.name,
                    type: getMimeType(file.name, file.type),
                    data: base64,
                    size: file.size,
                    checksum,
                    compressed: false,
                };
                setDamFile((p) => ({
                    ...p,
                    attachments: [...p.attachments, att],
                    history: [
                        ...p.history,
                        {
                            timestamp: new Date().toISOString(),
                            action: 'attachment_added',
                            summary: `Added ${file.name}`,
                        },
                    ],
                }));
            };
            reader.readAsDataURL(file);
        }
    }, []);

    const removeAttachment = (i: number) => {
        const name = damFile.attachments[i]?.name || 'file';
        setDamFile((p) => ({
            ...p,
            attachments: p.attachments.filter((_, idx) => idx !== i),
            history: [
                ...p.history,
                {
                    timestamp: new Date().toISOString(),
                    action: 'attachment_removed',
                    summary: `Removed ${name}`,
                },
            ],
        }));
    };

    const handleAttachInput = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) addFiles(e.target.files);
        e.target.value = '';
    };
    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };
    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };
    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
    };

    // ── Rendered markdown ──
    const renderedMarkdown = marked.parse(
        damFile.body || '*Nothing written yet...*',
    ) as string;

    // ═══════════════ RENDER SECTIONS ═══════════════

    const renderWriter = () => (
        <div className="space-y-6 animate-fadeIn">
            {/* Title / Author / Description */}
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
                                updateField('title', e.target.value)
                            }
                            placeholder="My Document"
                            className={cn(
                                'w-full bg-neutral-950 border rounded-lg px-3 py-2 outline-none transition-all',
                                warnings.title
                                    ? 'border-red-500/60 focus:ring-2 focus:ring-red-500/40'
                                    : 'border-neutral-800 focus:ring-2 focus:ring-indigo-500/50',
                            )}
                        />
                        {warnings.title && (
                            <p className="text-xs text-red-400">
                                ⚠ {warnings.title}
                            </p>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs uppercase tracking-wider text-neutral-500 font-bold">
                            Author
                        </label>
                        <input
                            value={damFile.author}
                            onChange={(e) =>
                                updateField('author', e.target.value)
                            }
                            placeholder="Your name"
                            className={cn(
                                'w-full bg-neutral-950 border rounded-lg px-3 py-2 outline-none transition-all',
                                warnings.author
                                    ? 'border-red-500/60 focus:ring-2 focus:ring-red-500/40'
                                    : 'border-neutral-800 focus:ring-2 focus:ring-indigo-500/50',
                            )}
                        />
                        {warnings.author && (
                            <p className="text-xs text-red-400">
                                ⚠ {warnings.author}
                            </p>
                        )}
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                        <label className="text-xs uppercase tracking-wider text-neutral-500 font-bold">
                            Description
                        </label>
                        <input
                            value={damFile.description}
                            onChange={(e) =>
                                updateField('description', e.target.value)
                            }
                            placeholder="Brief description..."
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                        />
                    </div>
                </div>
            </section>

            {/* Tags */}
            <section className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Tag className="w-5 h-5 text-indigo-400" /> Tags
                </h2>
                <div className="flex gap-2 mb-3">
                    <input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                addTag();
                            }
                        }}
                        placeholder="Add a tag..."
                        className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                    <button
                        onClick={addTag}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-medium transition-colors"
                    >
                        Add
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {damFile.tags.map((tag) => (
                        <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs text-indigo-300"
                        >
                            #{tag}
                            <button
                                onClick={() => removeTag(tag)}
                                className="hover:text-red-400 transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                    {damFile.tags.length === 0 && (
                        <span className="text-xs text-neutral-600">
                            No tags yet
                        </span>
                    )}
                </div>
            </section>

            {/* Body */}
            <section className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <FileCode className="w-5 h-5 text-indigo-400" /> Content{' '}
                        <span className="text-xs text-neutral-500 font-normal">
                            (supports Markdown)
                        </span>
                    </h2>
                    {warnings.body && (
                        <span className="text-xs text-red-400">
                            ⚠ Inappropriate language
                        </span>
                    )}
                </div>
                <textarea
                    value={damFile.body}
                    onChange={(e) => updateField('body', e.target.value)}
                    placeholder="Write here — supports **Markdown** formatting..."
                    className={cn(
                        'w-full bg-neutral-950 border rounded-xl px-4 py-3 min-h-[240px] outline-none transition-all resize-y font-mono text-sm leading-relaxed',
                        warnings.body
                            ? 'border-red-500/60 focus:ring-2 focus:ring-red-500/40'
                            : 'border-neutral-800 focus:ring-2 focus:ring-indigo-500/50',
                    )}
                />
            </section>

            {/* Encryption toggle */}
            <section className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-indigo-400" />
                        <div>
                            <h3 className="font-semibold text-sm">
                                AES-256 Encryption
                            </h3>
                            <p className="text-xs text-neutral-500">
                                Password-protect this .dam file
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            if (damFile.encrypted) {
                                setDamFile((p) => ({ ...p, encrypted: false }));
                                setEncPassword('');
                                addHistory(
                                    'encryption_disabled',
                                    'Encryption turned off',
                                );
                            } else {
                                setShowEncDialog(true);
                            }
                        }}
                        className={cn(
                            'px-4 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5',
                            damFile.encrypted
                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700',
                        )}
                    >
                        {damFile.encrypted ? (
                            <>
                                <Lock className="w-3.5 h-3.5" /> Encrypted
                            </>
                        ) : (
                            <>
                                <Unlock className="w-3.5 h-3.5" /> Not encrypted
                            </>
                        )}
                    </button>
                </div>
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
                        Drag &amp; drop files here
                    </p>
                    <p className="text-neutral-600 text-xs mt-1">
                        Max 10 MB &middot; Gzip compressed &middot; SHA-256
                        verified
                    </p>
                </div>
                {damFile.attachments.length > 0 && (
                    <div className="mt-4 space-y-2">
                        {damFile.attachments.map((att, i) => {
                            const Icon = getFileIcon(att.type);
                            const isImg = att.type.startsWith('image/');
                            const isTxt = isTextMime(att.type);
                            return (
                                <div
                                    key={`${att.name}-${i}`}
                                    className="bg-neutral-950 rounded-lg overflow-hidden"
                                >
                                    <div className="flex items-center gap-3 px-3 py-2">
                                        {isImg ? (
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
                                                {att.checksum && (
                                                    <span
                                                        className="ml-1 text-neutral-600"
                                                        title={`SHA-256: ${att.checksum}`}
                                                    >
                                                        <Hash className="w-3 h-3 inline" />
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                        {(isImg || isTxt) && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setPreviewAtt(att);
                                                }}
                                                className="p-1.5 text-neutral-500 hover:text-indigo-400 transition-colors"
                                                title="Preview"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => {
                                                const b = new Blob(
                                                    [
                                                        Uint8Array.from(
                                                            atob(att.data),
                                                            (c) =>
                                                                c.charCodeAt(0),
                                                        ),
                                                    ],
                                                    { type: att.type },
                                                );
                                                const u =
                                                    URL.createObjectURL(b);
                                                const a =
                                                    document.createElement('a');
                                                a.href = u;
                                                a.download = att.name;
                                                a.click();
                                                URL.revokeObjectURL(u);
                                            }}
                                            className="p-1.5 text-neutral-500 hover:text-indigo-400 transition-colors"
                                            title="Download"
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

    const renderMarkdown = () => (
        <div className="animate-fadeIn bg-neutral-900 rounded-2xl border border-neutral-800 p-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" /> Markdown
                Preview
            </h2>
            <div
                className="prose prose-invert prose-indigo max-w-none prose-sm prose-headings:font-bold prose-a:text-indigo-400 prose-code:bg-neutral-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-black prose-pre:border prose-pre:border-neutral-800"
                dangerouslySetInnerHTML={{ __html: renderedMarkdown }}
            />
        </div>
    );

    const renderRaw = () => (
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden animate-fadeIn">
            <div className="bg-neutral-800/50 px-4 py-2 border-b border-neutral-700 flex items-center justify-between">
                <span className="text-xs font-mono text-neutral-400">
                    {damFile.title
                        .replace(/[^a-zA-Z0-9_-]/g, '_')
                        .toLowerCase() || 'file'}
                    .dam
                </span>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-neutral-600">{DAM_MIME}</span>
                    <button
                        onClick={() => {
                            void navigator.clipboard.writeText(rawPreview);
                        }}
                        className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                        Copy
                    </button>
                </div>
            </div>
            <pre className="p-6 text-sm font-mono overflow-auto max-h-[600px] text-neutral-300 whitespace-pre-wrap leading-relaxed">
                {rawPreview}
            </pre>
        </div>
    );

    const renderHistory = () => (
        <div className="animate-fadeIn bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" /> Version History
            </h2>
            {damFile.history.length === 0 ? (
                <p className="text-neutral-500 text-sm">No history yet.</p>
            ) : (
                <div className="space-y-3">
                    {[...damFile.history].reverse().map((entry, i) => (
                        <div key={i} className="flex gap-3 items-start">
                            <div className="mt-1 w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                            <div className="flex-1">
                                <p className="text-sm text-neutral-200">
                                    {entry.summary}
                                </p>
                                <p className="text-xs text-neutral-500">
                                    {new Date(entry.timestamp).toLocaleString()}{' '}
                                    &middot;{' '}
                                    <span className="text-indigo-400/60">
                                        {entry.action}
                                    </span>
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderSpec = () => (
        <div className="space-y-6 animate-fadeIn">
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-8 space-y-6">
                <h2 className="text-2xl font-bold">
                    DAM Format v{DAM_VERSION}
                </h2>
                <p className="text-neutral-400 leading-relaxed">
                    A human-readable, encrypted, compressed, versioned file
                    format. MIME type:{' '}
                    <code className="text-indigo-400">{DAM_MIME}</code>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                        {
                            icon: FileText,
                            title: 'Human-Readable',
                            desc: 'Open in any text editor and read your content',
                        },
                        {
                            icon: Shield,
                            title: 'AES-256 Encryption',
                            desc: 'Password-protect with PBKDF2 + AES-GCM',
                        },
                        {
                            icon: Hash,
                            title: 'SHA-256 Checksums',
                            desc: 'Integrity verification for body and attachments',
                        },
                        {
                            icon: Zap,
                            title: 'Gzip Compression',
                            desc: 'Attachments automatically compressed',
                        },
                        {
                            icon: Clock,
                            title: 'Version History',
                            desc: 'Every edit tracked with timestamps',
                        },
                        {
                            icon: Tag,
                            title: 'Tags & Metadata',
                            desc: 'Title, author, description, tags',
                        },
                    ].map(({ icon: Ic, title, desc }) => (
                        <div
                            key={title}
                            className="p-3 bg-neutral-950 rounded-xl border border-neutral-800"
                        >
                            <Ic className="w-4 h-4 text-indigo-400 mb-1.5" />
                            <h3 className="font-semibold text-sm text-indigo-400">
                                {title}
                            </h3>
                            <p className="text-xs text-neutral-500 mt-0.5">
                                {desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-8">
                <h3 className="font-semibold mb-4 text-indigo-400">
                    v2.0 File Structure
                </h3>
                <pre className="p-4 bg-black rounded-xl text-xs text-indigo-300 overflow-auto leading-relaxed">
                    {[
                        '===DAM v2.0===',
                        'title: My Document',
                        'author: Jane Doe',
                        'created: 2024-06-15T12:00:00.000Z',
                        'modified: 2024-06-16T09:00:00.000Z',
                        'tags: notes, project, draft',
                        'description: My project notes',
                        'checksum: a1b2c3d4e5f6...',
                        'encrypted: no',
                        '==============',
                        '',
                        'Your content with **Markdown** support.',
                        '',
                        '===HISTORY===',
                        '[2024-06-15T12:00:00.000Z|created] File created',
                        '[2024-06-16T09:00:00.000Z|edited] Body updated',
                        '===ATTACHMENTS===',
                        '[photo.jpg|image/jpeg|45230|compressed|sha256:abc123...]',
                        'eJzLSM3J...  (gzipped base64)',
                        '===END===',
                    ].join('\n')}
                </pre>
            </div>
        </div>
    );

    // ═══════════════ MAIN RETURN ═══════════════

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-indigo-500/30">
            {/* Preview modal */}
            {previewAtt && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setPreviewAtt(null)}
                >
                    <div
                        className="relative max-w-3xl w-full max-h-[80vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setPreviewAtt(null)}
                            className="absolute -top-3 -right-3 bg-neutral-800 rounded-full p-1.5 hover:bg-neutral-700 transition-colors z-10"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        {previewAtt.type.startsWith('image/') ? (
                            <img
                                src={`data:${previewAtt.type};base64,${previewAtt.data}`}
                                alt={previewAtt.name}
                                className="max-w-full max-h-[75vh] rounded-xl border border-neutral-700 object-contain mx-auto"
                            />
                        ) : isTextMime(previewAtt.type) ? (
                            <pre className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 text-sm text-neutral-300 font-mono overflow-auto max-h-[75vh] whitespace-pre-wrap">
                                {atob(previewAtt.data)}
                            </pre>
                        ) : (
                            <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-12 text-center">
                                <File className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                                <p className="text-neutral-400">
                                    Preview not available.
                                </p>
                            </div>
                        )}
                        <p className="text-center text-sm text-neutral-400 mt-3">
                            {previewAtt.name} &middot;{' '}
                            {formatBytes(previewAtt.size)}
                            {previewAtt.checksum && (
                                <span className="text-neutral-600 ml-2 text-xs">
                                    SHA-256: {previewAtt.checksum.slice(0, 16)}
                                    ...
                                </span>
                            )}
                        </p>
                    </div>
                </div>
            )}

            {/* Encryption password dialog */}
            {showEncDialog && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setShowEncDialog(false)}
                >
                    <div
                        className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-sm"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                            <Lock className="w-5 h-5 text-indigo-400" /> Set
                            Password
                        </h3>
                        <p className="text-xs text-neutral-500 mb-4">
                            AES-256-GCM encryption with PBKDF2 key derivation.
                        </p>
                        <input
                            type="password"
                            value={encPassword}
                            onChange={(e) => setEncPassword(e.target.value)}
                            placeholder="Enter password..."
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 mb-4 outline-none focus:ring-2 focus:ring-indigo-500/50"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowEncDialog(false)}
                                className="flex-1 py-2 bg-neutral-800 rounded-lg text-sm hover:bg-neutral-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (encPassword.length < 4) {
                                        alert(
                                            'Password must be at least 4 characters.',
                                        );
                                        return;
                                    }
                                    setDamFile((p) => ({
                                        ...p,
                                        encrypted: true,
                                    }));
                                    addHistory(
                                        'encryption_enabled',
                                        'AES-256 encryption enabled',
                                    );
                                    setShowEncDialog(false);
                                }}
                                className="flex-1 py-2 bg-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-500 transition-colors"
                            >
                                Encrypt
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Decryption dialog */}
            {showDecDialog && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-sm">
                        <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                            <Unlock className="w-5 h-5 text-indigo-400" />{' '}
                            Decrypt File
                        </h3>
                        <p className="text-xs text-neutral-500 mb-4">
                            This file is encrypted. Enter the password to open
                            it.
                        </p>
                        <input
                            type="password"
                            value={decPassword}
                            onChange={(e) => setDecPassword(e.target.value)}
                            placeholder="Password..."
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') void handleDecrypt();
                            }}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 mb-4 outline-none focus:ring-2 focus:ring-indigo-500/50"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setShowDecDialog(false);
                                    setDecPassword('');
                                }}
                                className="flex-1 py-2 bg-neutral-800 rounded-lg text-sm hover:bg-neutral-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => void handleDecrypt()}
                                className="flex-1 py-2 bg-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-500 transition-colors"
                            >
                                Decrypt
                            </button>
                        </div>
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
                                v{DAM_VERSION} &middot; {DAM_MIME}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 transition-colors text-sm border border-neutral-700"
                        >
                            <Upload className="w-4 h-4" /> Open
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".dam"
                            onChange={handleUpload}
                        />
                        <button
                            onClick={() => void handleDownload()}
                            disabled={!canSave || isSaving}
                            className={cn(
                                'flex items-center gap-2 px-4 py-1.5 rounded-md transition-colors text-sm font-medium shadow-lg',
                                canSave
                                    ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/20'
                                    : 'bg-neutral-700 text-neutral-400 cursor-not-allowed shadow-none',
                            )}
                            title={
                                canSave ? 'Save as .dam' : 'Fix issues to save'
                            }
                        >
                            <Download className="w-4 h-4" />{' '}
                            {isSaving ? 'Saving...' : 'Save .dam'}
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex gap-1 p-1 bg-neutral-900 rounded-xl w-fit mb-8 border border-neutral-800 flex-wrap">
                    {(
                        [
                            'write',
                            'markdown',
                            'preview',
                            'history',
                            'info',
                        ] as const
                    ).map((tab) => {
                        const labels = {
                            write: 'Write',
                            markdown: 'Preview',
                            preview: 'Raw',
                            history: 'History',
                            info: 'Spec',
                        } as const;
                        const icons = {
                            write: FileText,
                            markdown: BookOpen,
                            preview: FileCode,
                            history: Clock,
                            info: Info,
                        } as const;
                        const Ic = icons[tab];
                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                                    activeTab === tab
                                        ? 'bg-neutral-800 text-white shadow-sm'
                                        : 'text-neutral-400 hover:text-neutral-200',
                                )}
                            >
                                <Ic className="w-4 h-4" />
                                {labels[tab]}
                            </button>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        {activeTab === 'write' && renderWriter()}
                        {activeTab === 'markdown' && renderMarkdown()}
                        {activeTab === 'preview' && renderRaw()}
                        {activeTab === 'history' && renderHistory()}
                        {activeTab === 'info' && renderSpec()}
                    </div>

                    <aside className="space-y-6">
                        <div
                            className={cn(
                                'rounded-2xl p-6 text-white overflow-hidden relative group',
                                canSave
                                    ? 'bg-indigo-600'
                                    : 'bg-neutral-800 border border-red-500/30',
                            )}
                        >
                            <div className="relative z-10">
                                <h3 className="font-bold text-xl mb-1">
                                    {canSave ? 'Save as .dam' : '⚠ Cannot Save'}
                                </h3>
                                <p
                                    className={cn(
                                        'text-sm mb-4',
                                        canSave
                                            ? 'text-indigo-100'
                                            : 'text-red-300',
                                    )}
                                >
                                    {canSave
                                        ? 'Encrypted, compressed, checksummed, versioned.'
                                        : 'Remove inappropriate language first.'}
                                </p>
                                <button
                                    onClick={() => void handleDownload()}
                                    disabled={!canSave || isSaving}
                                    className={cn(
                                        'w-full py-2.5 rounded-xl font-bold text-sm shadow-xl transition-transform',
                                        canSave
                                            ? 'bg-white text-indigo-600 active:scale-95'
                                            : 'bg-neutral-700 text-neutral-400 cursor-not-allowed',
                                    )}
                                >
                                    {isSaving
                                        ? 'Saving...'
                                        : canSave
                                          ? 'Download .dam'
                                          : 'Fix issues'}
                                </button>
                            </div>
                            {canSave && (
                                <Zap className="absolute -bottom-4 -right-4 w-32 h-32 text-indigo-500 opacity-20 group-hover:scale-110 transition-transform" />
                            )}
                        </div>

                        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                            <h3 className="font-semibold mb-4 text-xs uppercase tracking-wider text-neutral-500">
                                File Stats
                            </h3>
                            <div className="space-y-2.5">
                                {[
                                    ['Title', damFile.title || '—'],
                                    ['Version', `v${DAM_VERSION}`],
                                    ['Body', `${damFile.body.length} chars`],
                                    ['Tags', `${damFile.tags.length}`],
                                    [
                                        'Attachments',
                                        `${damFile.attachments.length}`,
                                    ],
                                    [
                                        'History',
                                        `${damFile.history.length} entries`,
                                    ],
                                    [
                                        'Encrypted',
                                        damFile.encrypted ? '🔒 Yes' : 'No',
                                    ],
                                    ['Size', formatBytes(rawPreview.length)],
                                ].map(([label, val]) => (
                                    <div
                                        key={label}
                                        className="flex justify-between items-center text-sm"
                                    >
                                        <span className="text-neutral-400">
                                            {label}
                                        </span>
                                        <span className="font-mono text-indigo-400 truncate max-w-[140px] text-right">
                                            {val}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                            <h3 className="font-semibold mb-3 text-sm">
                                Features in this file
                            </h3>
                            <ul className="text-xs text-neutral-500 space-y-1.5">
                                {[
                                    ['SHA-256 integrity check', true],
                                    [
                                        'Gzip compressed attachments',
                                        damFile.attachments.length > 0,
                                    ],
                                    ['AES-256 encryption', damFile.encrypted],
                                    [
                                        'Version history',
                                        damFile.history.length > 0,
                                    ],
                                    [
                                        'Markdown body',
                                        damFile.body.includes('**') ||
                                            damFile.body.includes('#'),
                                    ],
                                    ['Tagged', damFile.tags.length > 0],
                                ].map(([label, active]) => (
                                    <li
                                        key={label as string}
                                        className="flex items-center gap-2"
                                    >
                                        <span
                                            className={
                                                active
                                                    ? 'text-green-400'
                                                    : 'text-neutral-600'
                                            }
                                        >
                                            {active ? '✓' : '○'}
                                        </span>
                                        <span
                                            className={
                                                active ? 'text-neutral-300' : ''
                                            }
                                        >
                                            {label as string}
                                        </span>
                                    </li>
                                ))}
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
                            &copy; 2024 DAM Format &middot; v{DAM_VERSION}
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <FileJson className="w-5 h-5" />
                        <span className="text-xs font-mono">{DAM_MIME}</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
