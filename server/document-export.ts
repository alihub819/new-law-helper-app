import PDFDocument from "pdfkit";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

export interface ExportContent {
  title: string;
  sections: Array<{
    heading?: string;
    content: string;
    items?: string[];
  }>;
  metadata?: {
    author?: string;
    subject?: string;
    keywords?: string[];
  };
}

export async function generatePDF(content: ExportContent): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 50,
      size: "LETTER",
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Add title
    doc.fontSize(20).font("Helvetica-Bold").text(content.title, { align: "center" });
    doc.moveDown();

    // Add metadata if available
    if (content.metadata) {
      doc.fontSize(10).font("Helvetica");
      if (content.metadata.author) {
        doc.text(`Author: ${content.metadata.author}`);
      }
      if (content.metadata.subject) {
        doc.text(`Subject: ${content.metadata.subject}`);
      }
      doc.moveDown();
    }

    // Add sections
    content.sections.forEach((section, index) => {
      if (section.heading) {
        doc.fontSize(14).font("Helvetica-Bold").text(section.heading);
        doc.moveDown(0.5);
      }

      if (section.content) {
        doc.fontSize(11).font("Helvetica").text(section.content, {
          align: "justify",
        });
        doc.moveDown();
      }

      if (section.items && section.items.length > 0) {
        section.items.forEach((item) => {
          doc.fontSize(11).font("Helvetica").text(`• ${item}`, {
            indent: 20,
          });
        });
        doc.moveDown();
      }

      if (index < content.sections.length - 1) {
        doc.moveDown();
      }
    });

    doc.end();
  });
}

export async function generateDOCX(content: ExportContent): Promise<Buffer> {
  const children: Paragraph[] = [];

  // Add title
  children.push(
    new Paragraph({
      text: content.title,
      heading: HeadingLevel.TITLE,
      spacing: { after: 200 },
    })
  );

  // Add metadata
  if (content.metadata) {
    if (content.metadata.author) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `Author: ${content.metadata.author}`, size: 20 })],
        })
      );
    }
    if (content.metadata.subject) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `Subject: ${content.metadata.subject}`, size: 20 })],
        })
      );
    }
    children.push(new Paragraph({ text: "" }));
  }

  // Add sections
  content.sections.forEach((section) => {
    if (section.heading) {
      children.push(
        new Paragraph({
          text: section.heading,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 100 },
        })
      );
    }

    if (section.content) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: section.content, size: 22 })],
          spacing: { after: 100 },
        })
      );
    }

    if (section.items && section.items.length > 0) {
      section.items.forEach((item) => {
        children.push(
          new Paragraph({
            text: `• ${item}`,
            spacing: { after: 50 },
            indent: { left: 360 },
          })
        );
      });
      children.push(new Paragraph({ text: "" }));
    }
  });

  const doc = new Document({
    sections: [
      {
        children,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

export function generateTXT(content: ExportContent): string {
  let text = "";

  // Add title
  text += content.title.toUpperCase() + "\n";
  text += "=".repeat(content.title.length) + "\n\n";

  // Add metadata
  if (content.metadata) {
    if (content.metadata.author) {
      text += `Author: ${content.metadata.author}\n`;
    }
    if (content.metadata.subject) {
      text += `Subject: ${content.metadata.subject}\n`;
    }
    text += "\n";
  }

  // Add sections
  content.sections.forEach((section, index) => {
    if (section.heading) {
      text += section.heading + "\n";
      text += "-".repeat(section.heading.length) + "\n\n";
    }

    if (section.content) {
      text += section.content + "\n\n";
    }

    if (section.items && section.items.length > 0) {
      section.items.forEach((item) => {
        text += `  • ${item}\n`;
      });
      text += "\n";
    }

    if (index < content.sections.length - 1) {
      text += "\n";
    }
  });

  return text;
}
