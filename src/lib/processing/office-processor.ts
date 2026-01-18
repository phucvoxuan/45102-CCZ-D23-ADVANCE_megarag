/**
 * Office Document Processor
 * Extracts text from DOCX, XLSX, and PPTX files
 * Uses mammoth for DOCX and xlsx for Excel files
 *
 * Note: Gemini API does not support Office formats directly,
 * so we extract text first, then chunk like regular text files.
 */

import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { v4 as uuidv4 } from 'uuid';
import { chunkText } from './text-processor';
import type { ChunkInsert } from '@/types';

/**
 * Extract text from a DOCX file using mammoth
 */
export async function extractTextFromDocx(buffer: ArrayBuffer): Promise<string> {
  // mammoth requires a Node.js Buffer, not ArrayBuffer
  const nodeBuffer = Buffer.from(buffer);
  const result = await mammoth.extractRawText({ buffer: nodeBuffer });

  if (result.messages.length > 0) {
    console.log('[DOCX] Extraction messages:', result.messages);
  }

  return result.value;
}

/**
 * Extract text from an Excel file (XLSX/XLS)
 * Converts each sheet to a text representation
 */
export function extractTextFromExcel(buffer: ArrayBuffer): string {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const textParts: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];

    // Add sheet header
    textParts.push(`\n=== Sheet: ${sheetName} ===\n`);

    // Convert sheet to CSV-like text (easier to read than JSON)
    const csvText = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });

    if (csvText.trim()) {
      textParts.push(csvText);
    } else {
      textParts.push('(Empty sheet)');
    }
  }

  return textParts.join('\n');
}

/**
 * Extract text from a PowerPoint file (PPTX)
 * PPTX is a ZIP file containing XML slides.
 * We parse the XML directly to extract text content.
 */
export async function extractTextFromPptx(buffer: ArrayBuffer): Promise<string> {
  try {
    const zip = await JSZip.loadAsync(buffer);
    const textParts: string[] = [];

    // Get all slide files and sort them numerically
    const slideFiles = Object.keys(zip.files)
      .filter(name => name.match(/ppt\/slides\/slide\d+\.xml$/))
      .sort((a, b) => {
        const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0');
        const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0');
        return numA - numB;
      });

    console.log(`[PPTX] Found ${slideFiles.length} slides`);

    for (const slideName of slideFiles) {
      const slideXml = await zip.files[slideName].async('text');

      // Extract text from <a:t> tags (PowerPoint text elements)
      const textMatches = slideXml.match(/<a:t>([^<]*)<\/a:t>/g) || [];
      const slideTexts = textMatches
        .map(match => match.replace(/<\/?a:t>/g, ''))
        .filter(text => text.trim())
        .join(' ');

      if (slideTexts.trim()) {
        const slideNum = slideName.match(/slide(\d+)/)?.[1];
        textParts.push(`[Slide ${slideNum}]\n${slideTexts}`);
      }
    }

    // Also try to extract from notes if available
    const notesFiles = Object.keys(zip.files)
      .filter(name => name.match(/ppt\/notesSlides\/notesSlide\d+\.xml$/));

    for (const noteName of notesFiles) {
      const noteXml = await zip.files[noteName].async('text');
      const textMatches = noteXml.match(/<a:t>([^<]*)<\/a:t>/g) || [];
      const noteTexts = textMatches
        .map(match => match.replace(/<\/?a:t>/g, ''))
        .filter(text => text.trim())
        .join(' ');

      if (noteTexts.trim()) {
        const noteNum = noteName.match(/notesSlide(\d+)/)?.[1];
        textParts.push(`[Speaker Notes - Slide ${noteNum}]\n${noteTexts}`);
      }
    }

    if (textParts.length === 0) {
      console.warn('[PPTX] No text content found in slides');
      return '';
    }

    const result = textParts.join('\n\n');
    console.log(`[PPTX] Extracted ${result.length} characters from ${slideFiles.length} slides`);
    return result;
  } catch (error) {
    console.error('[PPTX] Extraction error:', error);
    throw new Error(`Failed to extract text from PPTX: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Process a DOCX file into chunks
 */
export async function processDocxFile(
  buffer: ArrayBuffer,
  documentId: string,
  workspace: string = 'default'
): Promise<ChunkInsert[]> {
  console.log(`[processDocxFile] Starting extraction for document ${documentId}`);

  const text = await extractTextFromDocx(buffer);
  console.log(`[processDocxFile] Extracted ${text.length} characters`);

  if (!text.trim()) {
    console.warn('[processDocxFile] No text content extracted from DOCX');
    return [];
  }

  const textChunks = chunkText(text);
  console.log(`[processDocxFile] Created ${textChunks.length} chunks`);

  const chunks: ChunkInsert[] = textChunks.map((chunk, index) => ({
    id: uuidv4(),
    workspace,
    document_id: documentId,
    chunk_order_index: index,
    content: chunk.content,
    tokens: chunk.tokenCount,
    chunk_type: 'text',
    metadata: {
      source: 'docx',
      startIndex: chunk.startIndex,
      endIndex: chunk.endIndex,
    },
  }));

  return chunks;
}

/**
 * Process an Excel file (XLSX) into chunks
 */
export async function processExcelFile(
  buffer: ArrayBuffer,
  documentId: string,
  workspace: string = 'default'
): Promise<ChunkInsert[]> {
  console.log(`[processExcelFile] Starting extraction for document ${documentId}`);

  const text = extractTextFromExcel(buffer);
  console.log(`[processExcelFile] Extracted ${text.length} characters`);

  if (!text.trim()) {
    console.warn('[processExcelFile] No text content extracted from Excel');
    return [];
  }

  const textChunks = chunkText(text);
  console.log(`[processExcelFile] Created ${textChunks.length} chunks`);

  const chunks: ChunkInsert[] = textChunks.map((chunk, index) => ({
    id: uuidv4(),
    workspace,
    document_id: documentId,
    chunk_order_index: index,
    content: chunk.content,
    tokens: chunk.tokenCount,
    chunk_type: 'text',
    metadata: {
      source: 'xlsx',
      startIndex: chunk.startIndex,
      endIndex: chunk.endIndex,
    },
  }));

  return chunks;
}

/**
 * Process a PowerPoint file (PPTX) into chunks
 */
export async function processPptxFile(
  buffer: ArrayBuffer,
  documentId: string,
  workspace: string = 'default'
): Promise<ChunkInsert[]> {
  console.log(`[processPptxFile] Starting extraction for document ${documentId}`);

  const text = await extractTextFromPptx(buffer);
  console.log(`[processPptxFile] Extracted ${text.length} characters`);

  if (!text.trim()) {
    console.warn('[processPptxFile] No text content extracted from PPTX');
    return [];
  }

  const textChunks = chunkText(text);
  console.log(`[processPptxFile] Created ${textChunks.length} chunks`);

  const chunks: ChunkInsert[] = textChunks.map((chunk, index) => ({
    id: uuidv4(),
    workspace,
    document_id: documentId,
    chunk_order_index: index,
    content: chunk.content,
    tokens: chunk.tokenCount,
    chunk_type: 'text',
    metadata: {
      source: 'pptx',
      startIndex: chunk.startIndex,
      endIndex: chunk.endIndex,
    },
  }));

  return chunks;
}

/**
 * Check if a file type is an Office format that needs text extraction
 */
export function isOfficeType(fileType: string): boolean {
  return ['docx', 'xlsx', 'pptx', 'xls', 'doc'].includes(fileType.toLowerCase());
}

/**
 * Process an Office file based on its type
 */
export async function processOfficeFile(
  buffer: ArrayBuffer,
  fileType: string,
  documentId: string,
  workspace: string = 'default'
): Promise<ChunkInsert[]> {
  const type = fileType.toLowerCase();

  switch (type) {
    case 'docx':
    case 'doc':
      return processDocxFile(buffer, documentId, workspace);

    case 'xlsx':
    case 'xls':
      return processExcelFile(buffer, documentId, workspace);

    case 'pptx':
    case 'ppt':
      return processPptxFile(buffer, documentId, workspace);

    default:
      throw new Error(`Unsupported Office format: ${fileType}`);
  }
}
