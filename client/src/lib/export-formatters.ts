/**
 * Utility functions for formatting document content for professional export.
 * Transforms structured JSON results into human-readable sections.
 */

export interface ExportSection {
    heading?: string;
    content: string;
    items?: string[];
}

export interface ExportContent {
    title: string;
    sections: ExportSection[];
    subject?: string;
    keywords?: string[];
}

/**
 * Format Medical Chronology for export
 */
export function formatMedicalChronology(result: any): ExportContent {
    const sections: ExportSection[] = [];

    if (result.entries && Array.isArray(result.entries)) {
        sections.push({
            heading: "Medical Treatment Timeline",
            content: result.entries.map((entry: any, idx: number) =>
                `${idx + 1}. ${entry.date || 'N/A'} - ${entry.provider || 'Unknown Provider'}\n` +
                `   Diagnosis: ${entry.diagnosis || 'N/A'}\n` +
                `   Treatment: ${entry.treatment || 'N/A'}\n` +
                `   ICD Code: ${entry.icdCode || 'N/A'} | CPT Code: ${entry.cptCode || 'N/A'}`
            ).join('\n\n'),
        });
    }

    if (result.summary) {
        sections.push({
            heading: "Summary",
            content: result.summary,
        });
    }

    return {
        title: "Medical Chronology Report",
        sections: sections.length > 0 ? sections : [{ content: "No chronology data available." }],
        subject: "Medical Chronology",
        keywords: ["medical", "chronology", "timeline"],
    };
}

/**
 * Format Medical Bill Analysis for export
 */
export function formatMedicalBills(result: any): ExportContent {
    const sections: ExportSection[] = [];

    if (result.bills && Array.isArray(result.bills)) {
        sections.push({
            heading: "Bill Analysis",
            content: result.bills.map((bill: any, idx: number) =>
                `${idx + 1}. ${bill.provider || 'Unknown Provider'}\n` +
                `   Date: ${bill.date || 'N/A'}\n` +
                `   Service: ${bill.service || 'N/A'}\n` +
                `   Billed Amount: $${bill.billedAmount?.toFixed(2) || '0.00'}\n` +
                `   Reasonable Amount: $${bill.reasonableAmount?.toFixed(2) || '0.00'}\n` +
                `   Variance: ${bill.variance || 'N/A'}`
            ).join('\n\n'),
        });
    }

    if (result.totalBilled !== undefined || result.totalReasonable !== undefined) {
        sections.push({
            heading: "Totals",
            content:
                `Total Billed: $${result.totalBilled?.toFixed(2) || '0.00'}\n` +
                `Total Reasonable: $${result.totalReasonable?.toFixed(2) || '0.00'}\n` +
                `Potential Reduction: $${result.potentialReduction?.toFixed(2) || '0.00'}`,
        });
    }

    return {
        title: "Medical Bill Analysis Report",
        sections: sections.length > 0 ? sections : [{ content: "No bill data available." }],
        subject: "Medical Bill Analysis",
        keywords: ["medical", "bills", "analysis"],
    };
}

/**
 * Format Medical Summary for export
 */
export function formatMedicalSummary(result: any): ExportContent {
    const sections: ExportSection[] = [];

    if (result.chiefComplaint) {
        sections.push({
            heading: "Chief Complaint",
            content: result.chiefComplaint,
        });
    }

    if (result.historyOfPresentIllness) {
        sections.push({
            heading: "History of Present Illness",
            content: result.historyOfPresentIllness,
        });
    }

    if (result.injuries && Array.isArray(result.injuries)) {
        sections.push({
            heading: "Injuries Sustained",
            content: result.injuries.join('\n• '),
        });
    }

    if (result.treatmentSummary) {
        sections.push({
            heading: "Treatment Summary",
            content: result.treatmentSummary,
        });
    }

    if (result.prognosis) {
        sections.push({
            heading: "Prognosis",
            content: result.prognosis,
        });
    }

    if (result.currentStatus) {
        sections.push({
            heading: "Current Status",
            content: result.currentStatus,
        });
    }

    if (result.totalMedicalExpenses !== undefined) {
        sections.push({
            heading: "Total Medical Expenses",
            content: `$${result.totalMedicalExpenses?.toFixed(2) || '0.00'}`,
        });
    }

    return {
        title: "Medical Summary Report",
        sections: sections.length > 0 ? sections : [{ content: "No summary data available." }],
        subject: "Medical Summary",
        keywords: ["medical", "summary", "report"],
    };
}

/**
 * Format Discovery Responses for export
 */
export function formatDiscoveryResponses(result: any, type: string): ExportContent {
    const sections: ExportSection[] = [];
    const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);

    if (result.responses && Array.isArray(result.responses)) {
        sections.push({
            heading: `${typeLabel} Responses`,
            content: result.responses.map((resp: any) => {
                let text = `Response #${resp.number || resp.id || 'N/A'}\n`;
                text += `Question/Request: ${resp.question || resp.request || 'N/A'}\n`;

                if (resp.objections && resp.objections.length > 0) {
                    text += `Objections: ${resp.objections.join('; ')}\n`;
                }

                text += `Response: ${resp.response || 'N/A'}`;

                if (resp.explanation) {
                    text += `\nExplanation: ${resp.explanation}`;
                }

                return text;
            }).join('\n\n---\n\n'),
        });
    }

    if (result.privilegeLog && Array.isArray(result.privilegeLog)) {
        sections.push({
            heading: "Privilege Log",
            content: result.privilegeLog.map((item: any) =>
                `Document: ${item.document || 'N/A'}\n` +
                `Privilege: ${item.privilege || 'N/A'}\n` +
                `Description: ${item.description || 'N/A'}`
            ).join('\n\n'),
        });
    }

    return {
        title: `Discovery Responses - ${typeLabel}`,
        sections: sections.length > 0 ? sections : [{ content: "No discovery responses available." }],
        subject: `Discovery - ${typeLabel}`,
        keywords: ["discovery", type, "responses"],
    };
}

/**
 * Format Saved Document for export based on document type
 */
export function formatSavedDocument(doc: any): ExportContent {
    const documentType = doc.documentType || 'other';
    const content = doc.content || {};

    // Route to appropriate formatter based on document type
    if (documentType.startsWith('medical-chronology')) {
        return formatMedicalChronology(content);
    } else if (documentType.startsWith('medical-bill')) {
        return formatMedicalBills(content);
    } else if (documentType.startsWith('medical-summary')) {
        return formatMedicalSummary(content);
    } else if (documentType.startsWith('discovery') || documentType === 'interrogatories' || documentType === 'request-for-production') {
        return formatDiscoveryResponses(content, documentType);
    } else if (documentType === 'demand-letter') {
        return {
            title: doc.title || "Demand Letter",
            sections: [{
                heading: "Demand Letter",
                content: content.letterContent || JSON.stringify(content, null, 2),
            }],
            subject: "Demand Letter",
            keywords: ["demand", "letter"],
        };
    }

    // Fallback for unknown types - still try to format nicely
    const sections: ExportSection[] = [];

    if (typeof content === 'string') {
        sections.push({ content });
    } else if (typeof content === 'object') {
        for (const [key, value] of Object.entries(content)) {
            const heading = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            sections.push({
                heading,
                content: typeof value === 'string' ? value : JSON.stringify(value, null, 2),
            });
        }
    }

    return {
        title: doc.title || "Document",
        sections: sections.length > 0 ? sections : [{ content: "No content available." }],
        subject: doc.title,
        keywords: [documentType],
    };
}
