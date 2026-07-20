import { prisma } from "@/lib/prisma";
import { saveFile } from "@/lib/storage";
import { extractText } from "@/lib/document-extract";
import { organizeDocument } from "@/lib/document-organize";
import type { DocumentType, SignatureStatus } from "@prisma/client";

/**
 * Run OCR/text extraction + AI organization on a file, and roll the results
 * onto its parent Document. Shared by create + add-version so both paths get
 * the same intelligence.
 */
async function processAndApply(params: {
  documentId: string;
  buffer: Buffer;
  mimeType: string;
  originalName: string;
  /** Only overwrite title/type when the caller didn't set them explicitly */
  allowAiTitle: boolean;
}) {
  const extractedText = await extractText(params.buffer, params.mimeType);
  const analysis = await organizeDocument({ originalName: params.originalName, extractedText });

  const data: {
    extractedText: string | null;
    aiSummary?: string;
    aiParties?: string[];
    aiSuggestedTitle?: string;
    tags?: string[];
    documentType?: DocumentType;
    signatureStatus?: SignatureStatus;
    title?: string;
  } = { extractedText: extractedText || null };

  if (analysis) {
    data.aiSummary = analysis.summary;
    data.aiParties = analysis.parties;
    data.aiSuggestedTitle = analysis.suggestedTitle;
    data.tags = analysis.tags;
    data.documentType = analysis.documentType as DocumentType;
    if (analysis.containsSignature) data.signatureStatus = "SIGNED";
    if (params.allowAiTitle && analysis.suggestedTitle) data.title = analysis.suggestedTitle;
  }

  return prisma.document.update({ where: { id: params.documentId }, data });
}

export async function createDocument(input: {
  firmId: string;
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  title?: string;
  caseId?: string | null;
  clientId?: string | null;
  uploadedBy?: string | null;
}) {
  const stored = await saveFile(input.buffer, `${input.firmId}/${Date.now()}-${input.fileName}`);

  // Create the document + its first version in one go.
  const doc = await prisma.document.create({
    data: {
      firmId: input.firmId,
      title: input.title?.trim() || input.fileName,
      originalName: input.fileName,
      caseId: input.caseId || null,
      clientId: input.clientId || null,
      uploadedBy: input.uploadedBy || null,
      versions: {
        create: {
          versionNumber: 1,
          fileName: input.fileName,
          mimeType: input.mimeType,
          size: input.buffer.length,
          data: stored.data,
          storageKey: stored.storageKey,
          uploadedBy: input.uploadedBy || null,
        },
      },
    },
    include: { versions: true },
  });

  await prisma.document.update({
    where: { id: doc.id },
    data: { currentVersionId: doc.versions[0].id },
  });

  // Extract + organize. Let AI improve the title only if the user didn't set one.
  const updated = await processAndApply({
    documentId: doc.id,
    buffer: input.buffer,
    mimeType: input.mimeType,
    originalName: input.fileName,
    allowAiTitle: !input.title?.trim(),
  });

  return updated;
}

export async function addDocumentVersion(input: {
  documentId: string;
  firmId: string;
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  uploadedBy?: string | null;
}) {
  const last = await prisma.documentVersion.findFirst({
    where: { documentId: input.documentId },
    orderBy: { versionNumber: "desc" },
    select: { versionNumber: true },
  });
  const nextNumber = (last?.versionNumber || 0) + 1;

  const stored = await saveFile(input.buffer, `${input.firmId}/${Date.now()}-${input.fileName}`);

  const version = await prisma.documentVersion.create({
    data: {
      documentId: input.documentId,
      versionNumber: nextNumber,
      fileName: input.fileName,
      mimeType: input.mimeType,
      size: input.buffer.length,
      data: stored.data,
      storageKey: stored.storageKey,
      uploadedBy: input.uploadedBy || null,
    },
  });

  await prisma.document.update({
    where: { id: input.documentId },
    data: { currentVersionId: version.id, originalName: input.fileName },
  });

  // Re-extract + re-organize on the new version (never auto-rename on re-upload).
  await processAndApply({
    documentId: input.documentId,
    buffer: input.buffer,
    mimeType: input.mimeType,
    originalName: input.fileName,
    allowAiTitle: false,
  });

  return version;
}
