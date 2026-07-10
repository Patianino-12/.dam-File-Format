import { deflate, inflate } from 'pako';
import { sha256 } from '../utils/crypto.ts';

// ── Types ──

export interface DamAttachment {
    name: string;
    type: string;
    data: string; // base64 (may be gzipped)
    size: number;
    checksum: string; // sha256 of original data
    compressed: boolean;
}

export interface DamHistoryEntry {
    timestamp: string;
    action: string; // "created" | "edited" | "attachment_added" | etc.
    summary: string;
}

export interface DamFile {
    title: string;
    author: string;
    created: string;
    modified: string;
    version: string;
    tags: string[];
    description: string;
    body: string;
    checksum: string; // computed on save
    encrypted: boolean;
    attachments: DamAttachment[];
    history: DamHistoryEntry[];
}

export const DAM_VERSION = '2.0.0';
export const DAM_MIME = 'application/x-dam';

export function createDefaultDamFile(): DamFile {
    const now = new Date().toISOString();
    return {
        title: 'Untitled',
        author: 'Anonymous',
        created: now,
        modified: now,
        version: DAM_VERSION,
        tags: [],
        description: '',
        body: '',
        checksum: '',
        encrypted: false,
        attachments: [],
        history: [
            { timestamp: now, action: 'created', summary: 'File created' },
        ],
    };
}

// ── Compression helpers ──

function strToBytes(str: string): Uint8Array {
    const arr = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) arr[i] = str.charCodeAt(i);
    return arr;
}

function bytesToBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i++)
        binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
}

function compressBase64(raw: string): string {
    const bytes = strToBytes(atob(raw));
    const compressed = deflate(bytes);
    return bytesToBase64(compressed);
}

function decompressBase64(compressed: string): string {
    const bytes = strToBytes(atob(compressed));
    const decompressed = inflate(bytes);
    return bytesToBase64(decompressed);
}

// ── Attachment checksum ──

export async function computeAttachmentChecksum(data: string): Promise<string> {
    return sha256(data);
}

// ── Serialize ──

/**
 * .dam v2 format:
 *
 * ===DAM v2.0===
 * title: My Document
 * author: Jane
 * created: 2024-06-15T12:00:00.000Z
 * modified: 2024-06-16T09:00:00.000Z
 * tags: notes, project, draft
 * description: My project notes
 * checksum: a1b2c3d4...
 * encrypted: no
 * ==============
 *
 * Your actual written content appears here.
 *
 * ===HISTORY===
 * [2024-06-15T12:00:00.000Z|created] File created
 * [2024-06-16T09:00:00.000Z|edited] Body updated
 * ===ATTACHMENTS===
 * [photo.jpg|image/jpeg|45230|compressed|sha256:abc123...]
 * eJzLSM3J...  (gzipped base64)
 * ===END===
 */
export async function serializeDam(file: DamFile): Promise<string> {
    const lines: string[] = [];

    // Compute body checksum
    const bodyChecksum = await sha256(file.body);

    lines.push('===DAM v2.0===');
    lines.push(`title: ${file.title}`);
    lines.push(`author: ${file.author}`);
    lines.push(`created: ${file.created}`);
    lines.push(`modified: ${new Date().toISOString()}`);
    if (file.tags.length > 0) {
        lines.push(`tags: ${file.tags.join(', ')}`);
    }
    if (file.description) {
        lines.push(`description: ${file.description}`);
    }
    lines.push(`checksum: ${bodyChecksum}`);
    lines.push(`encrypted: ${file.encrypted ? 'yes' : 'no'}`);
    lines.push('==============');
    lines.push('');
    lines.push(file.body);

    // History
    if (file.history.length > 0) {
        lines.push('');
        lines.push('===HISTORY===');
        for (const entry of file.history) {
            lines.push(`[${entry.timestamp}|${entry.action}] ${entry.summary}`);
        }
    }

    // Attachments
    if (file.attachments.length > 0) {
        lines.push('===ATTACHMENTS===');
        for (const att of file.attachments) {
            let data = att.data;
            let isCompressed = att.compressed;

            // Compress if not already and data is large enough
            if (!isCompressed && att.data.length > 1024) {
                try {
                    const compressed = compressBase64(att.data);
                    if (compressed.length < att.data.length * 0.9) {
                        data = compressed;
                        isCompressed = true;
                    }
                } catch {
                    // compression failed, use raw
                }
            }

            const compFlag = isCompressed ? 'compressed' : 'raw';
            lines.push(
                `[${att.name}|${att.type}|${att.size}|${compFlag}|sha256:${att.checksum}]`,
            );
            lines.push(data);
        }
        lines.push('===END===');
    }

    return lines.join('\n');
}

// ── Parse ──

export function parseDam(raw: string): DamFile | null {
    const lines = raw.split('\n');

    if (!lines[0]?.startsWith('===DAM')) return null;

    const file = createDefaultDamFile();
    file.history = [];

    let section: 'header' | 'body' | 'history' | 'attachments' = 'header';
    const bodyLines: string[] = [];
    let currentAttachment: {
        name: string;
        type: string;
        size: number;
        compressed: boolean;
        checksum: string;
        dataLines: string[];
    } | null = null;

    function flushAttachment() {
        if (!currentAttachment) return;
        let data = currentAttachment.dataLines.join('');

        if (currentAttachment.compressed) {
            try {
                data = decompressBase64(data);
            } catch {
                // decompression failed, keep raw
            }
        }

        file.attachments.push({
            name: currentAttachment.name,
            type: currentAttachment.type,
            size: currentAttachment.size,
            checksum: currentAttachment.checksum,
            compressed: false, // stored decompressed in memory
            data,
        });
        currentAttachment = null;
    }

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];

        if (section === 'header') {
            if (line.startsWith('==============')) {
                section = 'body';
                continue;
            }
            const colonIdx = line.indexOf(': ');
            if (colonIdx !== -1) {
                const key = line.substring(0, colonIdx).trim();
                const val = line.substring(colonIdx + 2).trim();
                if (key === 'title') file.title = val;
                else if (key === 'author') file.author = val;
                else if (key === 'created') file.created = val;
                else if (key === 'modified') file.modified = val;
                else if (key === 'tags')
                    file.tags = val
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean);
                else if (key === 'description') file.description = val;
                else if (key === 'checksum') file.checksum = val;
                else if (key === 'encrypted') file.encrypted = val === 'yes';
            }
            continue;
        }

        if (line === '===HISTORY===') {
            section = 'history';
            continue;
        }

        if (line === '===ATTACHMENTS===') {
            section = 'attachments';
            continue;
        }

        if (line === '===END===') {
            flushAttachment();
            break;
        }

        if (section === 'body') {
            bodyLines.push(line);
            continue;
        }

        if (section === 'history') {
            const match = line.match(/^\[(.+?)\|(.+?)] (.+)$/);
            if (match) {
                file.history.push({
                    timestamp: match[1],
                    action: match[2],
                    summary: match[3],
                });
            }
            continue;
        }

        if (section === 'attachments') {
            // v2: [name|type|size|compressed/raw|sha256:hash]
            const matchV2 = line.match(
                /^\[(.+?)\|(.+?)\|(\d+)\|(compressed|raw)\|sha256:([a-f0-9]+)]$/,
            );
            // v1 compat: [name|type|size]
            const matchV1 = line.match(/^\[(.+?)\|(.+?)\|(\d+)]$/);

            const m = matchV2 || matchV1;
            if (m) {
                flushAttachment();
                currentAttachment = {
                    name: m[1],
                    type: m[2],
                    size: parseInt(m[3], 10),
                    compressed: matchV2 ? m[4] === 'compressed' : false,
                    checksum: matchV2 ? m[5] : '',
                    dataLines: [],
                };
            } else if (currentAttachment) {
                currentAttachment.dataLines.push(line);
            }
        }
    }

    // Trim body
    while (bodyLines.length > 0 && bodyLines[bodyLines.length - 1] === '') {
        bodyLines.pop();
    }
    while (bodyLines.length > 0 && bodyLines[0] === '') {
        bodyLines.shift();
    }

    file.body = bodyLines.join('\n');
    return file;
}
