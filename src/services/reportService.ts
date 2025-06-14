import jsPDF from 'jspdf';
import { BillCalculation, Owner } from '../types';

export class ReportService {
  static async generateReport(calculation: BillCalculation, owners: Owner[]): Promise<void> {
    try {
      const pdf = new jsPDF();
      
      // Set up fonts and colors
      pdf.setFont('helvetica');
      
      // Header
      pdf.setFontSize(20);
      pdf.setTextColor(37, 99, 235); // Primary blue
      pdf.text('Casa Mare - Gestione Spese Energia', 20, 25);
      
      pdf.setFontSize(16);
      pdf.setTextColor(75, 85, 99); // Gray
      pdf.text('Riepilogo Spese', 20, 35);
      
      pdf.setFontSize(12);
      pdf.setTextColor(107, 114, 128); // Light gray
      const periodText = `Periodo: ${new Date(calculation.periodStart).toLocaleDateString('it-IT')} - ${new Date(calculation.periodEnd).toLocaleDateString('it-IT')}`;
      pdf.text(periodText, 20, 45);
      
      // Line separator
      pdf.setDrawColor(229, 231, 235);
      pdf.line(20, 50, 190, 50);
      
      // Bill details section
      pdf.setFontSize(14);
      pdf.setTextColor(55, 65, 81); // Dark gray
      pdf.text('Dettagli Bolletta', 20, 65);
      
      pdf.setFontSize(11);
      pdf.setTextColor(107, 114, 128);
      pdf.text('Importo Totale Bolletta:', 20, 75);
      pdf.setTextColor(31, 41, 55);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`€${calculation.totalAmount.toFixed(2)}`, 150, 75);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(107, 114, 128);
      pdf.text('Costo per kWh:', 20, 85);
      pdf.setTextColor(37, 99, 235);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`€${calculation.costPerKwh.toFixed(4)}/kWh`, 150, 85);
      
      // Expenses section
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(14);
      pdf.setTextColor(55, 65, 81);
      pdf.text('Ripartizione Spese per Proprietario', 20, 105);
      
      let yPosition = 120;
      
      calculation.expenses.forEach((expense, index) => {
        const owner = owners.find(o => o.id === expense.ownerId);
        
        // Owner name with color indicator
        pdf.setFontSize(12);
        pdf.setTextColor(31, 41, 55);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`● ${expense.ownerName}`, 20, yPosition);
        
        // Owner details
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(107, 114, 128);
        
        yPosition += 10;
        pdf.text(`Consumo: ${expense.consumption.toFixed(1)} kWh (${expense.percentage.toFixed(1)}%)`, 25, yPosition);
        
        yPosition += 8;
        pdf.text(`Costo consumo: €${expense.consumptionCost.toFixed(2)}`, 25, yPosition);
        
        yPosition += 8;
        pdf.text(`Costi fissi: €${expense.fixedCost.toFixed(2)}`, 25, yPosition);
        
        yPosition += 8;
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(37, 99, 235);
        pdf.text(`TOTALE DA PAGARE: €${expense.totalCost.toFixed(2)}`, 25, yPosition);
        
        // Add some space between owners
        yPosition += 20;
        
        // Add new page if needed
        if (yPosition > 250 && index < calculation.expenses.length - 1) {
          pdf.addPage();
          yPosition = 30;
        }
      });
      
      // Footer
      const pageHeight = pdf.internal.pageSize.height;
      pdf.setFontSize(8);
      pdf.setTextColor(107, 114, 128);
      pdf.text(`Report generato automaticamente il ${new Date().toLocaleString('it-IT')}`, 20, pageHeight - 20);
      pdf.text('App Casa Mare - Gestione Spese Energia', 20, pageHeight - 15);
      
      // Save the PDF
      const fileName = `spese-energia-${new Date(calculation.periodEnd).toLocaleDateString('it-IT').replace(/\//g, '-')}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Error generating PDF report:', error);
      // Fallback to text report
      this.downloadTextReport(calculation);
    }
  }

  private static downloadTextReport(calculation: BillCalculation): void {
    const reportText = `
CASA MARE - GESTIONE SPESE ENERGIA
Riepilogo Spese
Periodo: ${new Date(calculation.periodStart).toLocaleDateString('it-IT')} - ${new Date(calculation.periodEnd).toLocaleDateString('it-IT')}

DETTAGLI BOLLETTA
Importo Totale: €${calculation.totalAmount.toFixed(2)}
Costo per kWh: €${calculation.costPerKwh.toFixed(4)}/kWh

RIPARTIZIONE SPESE:
${calculation.expenses.map(expense => `
${expense.ownerName}:
- Consumo: ${expense.consumption.toFixed(1)} kWh (${expense.percentage.toFixed(1)}%)
- Costo consumo: €${expense.consumptionCost.toFixed(2)}
- Costi fissi: €${expense.fixedCost.toFixed(2)}
- TOTALE DA PAGARE: €${expense.totalCost.toFixed(2)}
`).join('\n')}

Report generato il ${new Date().toLocaleString('it-IT')}
    `.trim();

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spese-energia-${new Date(calculation.periodEnd).toLocaleDateString('it-IT').replace(/\//g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }
}