export interface DamAttachment {
    name: string;
    type: string;
    data: string; // base64
    size: number;
}

export interface DamFile {
    title: string;
    author: string;
    created: string;
    version: string;
    body: string;
    attachments: DamAttachment[];
}

export const DEFAULT_DAM_FILE: DamFile = {
    title: 'Untitled',
    author: 'Anonymous',
    created: new Date().toISOString(),
    version: '1.0.0',
    body: '',
    attachments: [],
};

/**
 * Serialize a DamFile into the .dam text format.
 *
 * When opened in any text editor, it looks like:
 *
 * ===DAM v1.0===
 * title: My Document
 * author: Jane
 * created: 2024-06-15T12:00:00.000Z
 * ==============
 *
 * This is my actual content.
 * It appears exactly as I typed it.
 *
 * ===ATTACHMENTS===
 * [photo.jpg|image/jpeg|4523]
 * /9j/4AAQSkZJRgABAQ...
 * [notes.pdf|application/pdf|89201]
 * JVBERi0xLjQK...
 * ===END===
 */
export function serializeDam(file: DamFile): string {
    const lines: string[] = [];

    lines.push('===DAM v1.0===');
    lines.push(`title: ${file.title}`);
    lines.push(`author: ${file.author}`);
    lines.push(`created: ${file.created}`);
    lines.push('==============');
    lines.push('');
    lines.push(file.body);

    if (file.attachments.length > 0) {
        lines.push('');
        lines.push('===ATTACHMENTS===');
        for (const att of file.attachments) {
            lines.push(`[${att.name}|${att.type}|${att.size}]`);
            lines.push(att.data);
        }
        lines.push('===END===');
    }

    return lines.join('\n');
}

/**
 * Parse a .dam text file back into a DamFile object.
 */
export function parseDam(raw: string): DamFile | null {
    const lines = raw.split('\n');

    if (!lines[0]?.startsWith('===DAM')) return null;

    const file: DamFile = {
        title: 'Untitled',
        author: 'Anonymous',
        created: new Date().toISOString(),
        version: '1.0.0',
        body: '',
        attachments: [],
    };

    let section: 'header' | 'body' | 'attachments' = 'header';
    const bodyLines: string[] = [];
    let currentAttachment: Partial<DamAttachment> | null = null;

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
                if (key === 'author') file.author = val;
                if (key === 'created') file.created = val;
            }
            continue;
        }

        if (line === '===ATTACHMENTS===') {
            section = 'attachments';
            continue;
        }

        if (line === '===END===') {
            if (currentAttachment?.name && currentAttachment.data) {
                file.attachments.push(currentAttachment as DamAttachment);
            }
            break;
        }

        if (section === 'body') {
            bodyLines.push(line);
            continue;
        }

        if (section === 'attachments') {
            const match = line.match(/^\[(.+?)\|(.+?)\|(\d+)]$/);
            if (match) {
                if (currentAttachment?.name && currentAttachment.data) {
                    file.attachments.push(currentAttachment as DamAttachment);
                }
                currentAttachment = {
                    name: match[1],
                    type: match[2],
                    size: parseInt(match[3], 10),
                    data: '',
                };
            } else if (currentAttachment) {
                currentAttachment.data = (currentAttachment.data || '') + line;
            }
        }
    }

    // Trim trailing blank lines that were before ===ATTACHMENTS===
    while (bodyLines.length > 0 && bodyLines[bodyLines.length - 1] === '') {
        bodyLines.pop();
    }
    // Also trim the leading blank line after header
    while (bodyLines.length > 0 && bodyLines[0] === '') {
        bodyLines.shift();
    }

    file.body = bodyLines.join('\n');
    return file;
}
