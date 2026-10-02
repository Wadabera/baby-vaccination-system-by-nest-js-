import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Child } from '../children/schemas/child.schema';
import PDFDocument from 'pdfkit';

@Injectable()
export class ReportsService {
  constructor(@InjectModel(Child.name) private childModel: Model<Child>) {}

  async generateImmunizationCard(childId: string): Promise<Buffer> {
    const child = await this.childModel
      .findById(childId)
      .populate('motherId')
      .exec();
    if (!child) throw new Error('Child not found');

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: Error) => reject(err));

      // Header
      doc
        .fillColor('#0D92F4')
        .fontSize(24)
        .text('DIGITAL IMMUNIZATION CARD', { align: 'center' });
      doc.moveDown();

      // Child Info using personalInfo
      doc
        .fillColor('#000')
        .fontSize(14)
        .text(
          `Infant Name: ${child.personalInfo.firstName} ${child.personalInfo.lastName}`,
        );
      doc.text(
        `Birth Date: ${new Date(child.personalInfo.birthDate).toLocaleDateString()}`,
      );
      doc.text(`Blood Type: ${child.personalInfo.bloodType || 'Not recorded'}`);
      doc.moveDown();

      // Table Header
      const tableTop = 200;
      doc.fontSize(10).fillColor('#444');
      doc.text('Vaccine', 50, tableTop);
      doc.text('Due Date', 200, tableTop);
      doc.text('Status', 350, tableTop);
      doc.text('Given Date', 450, tableTop);
      doc
        .moveTo(50, tableTop + 15)
        .lineTo(550, tableTop + 15)
        .stroke();

      // Table Rows
      let currentY = tableTop + 25;
      if (child.schedule) {
        child.schedule.forEach((dose) => {
          doc.text(dose.vaccineName, 50, currentY);
          doc.text(new Date(dose.dueDate).toLocaleDateString(), 200, currentY);
          doc.text(dose.status.toUpperCase(), 350, currentY);
          doc.text(
            dose.givenDate
              ? new Date(dose.givenDate).toLocaleDateString()
              : '---',
            450,
            currentY,
          );
          currentY += 20;
        });
      }

      doc.end();
    });
  }
}
