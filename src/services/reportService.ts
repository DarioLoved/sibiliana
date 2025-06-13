import { BillCalculation, Owner } from '../types';

export class ReportService {
  static async generateReport(calculation: BillCalculation, owners: Owner[]): Promise<void> {
    // Create a report element
    const reportElement = this.createReportElement(calculation, owners);
    
    // Add to DOM temporarily
    document.body.appendChild(reportElement);
    
    try {
      // Try to use html2canvas if available
      if (typeof window !== 'undefined' && (window as any).html2canvas) {
        const canvas = await (window as any).html2canvas(reportElement, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true,
        });
        
        // Convert to blob and download
        canvas.toBlob((blob: Blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `spese-energia-${new Date(calculation.periodEnd).toLocaleDateString('it-IT').replace(/\//g, '-')}.png`;
          a.click();
          URL.revokeObjectURL(url);
        });
      } else {
        // Fallback: generate text report
        this.downloadTextReport(calculation);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      this.downloadTextReport(calculation);
    } finally {
      // Remove from DOM
      document.body.removeChild(reportElement);
    }
  }

  private static createReportElement(calculation: BillCalculation, owners: Owner[]): HTMLElement {
    const div = document.createElement('div');
    div.style.cssText = `
      width: 800px;
      padding: 40px;
      background: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1f2937;
      position: absolute;
      left: -9999px;
      top: -9999px;
    `;

    const getOwnerColor = (ownerId: string) => {
      const owner = owners.find(o => o.id === ownerId);
      return owner?.color || '#6B7280';
    };

    div.innerHTML = `
      <div style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px;">
        <h1 style="color: #2563eb; font-size: 28px; margin-bottom: 8px; font-weight: bold;">Casa Mare - Gestione Spese Energia</h1>
        <h2 style="color: #4b5563; font-size: 20px; margin: 0;">Riepilogo Spese</h2>
        <p style="color: #6b7280; margin-top: 8px; font-size: 14px;">
          Periodo: ${new Date(calculation.periodStart).toLocaleDateString('it-IT')} - ${new Date(calculation.periodEnd).toLocaleDateString('it-IT')}
        </p>
      </div>

      <div style="margin-bottom: 30px; background: #f9fafb; padding: 20px; border-radius: 8px;">
        <h3 style="color: #374151; font-size: 18px; margin-bottom: 12px;">Dettagli Bolletta</h3>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #6b7280;">Importo Totale Bolletta:</span>
          <span style="font-weight: bold; color: #1f2937; font-size: 18px;">€${calculation.totalAmount.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #6b7280;">Costo per kWh:</span>
          <span style="font-weight: bold; color: #2563eb; font-size: 16px;">€${calculation.costPerKwh.toFixed(4)}/kWh</span>
        </div>
      </div>

      <div style="margin-bottom: 30px;">
        <h3 style="color: #374151; font-size: 18px; margin-bottom: 16px;">Ripartizione Spese per Proprietario</h3>
        ${calculation.expenses.map(expense => `
          <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 16px; background: white;">
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <div style="width: 16px; height: 16px; border-radius: 50%; background: ${getOwnerColor(expense.ownerId)}; margin-right: 12px;"></div>
              <h4 style="font-size: 16px; font-weight: bold; color: #1f2937; margin: 0;">${expense.ownerName}</h4>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px;">
              <div>
                <span style="color: #6b7280;">Consumo:</span>
                <span style="font-weight: 500; margin-left: 8px;">${expense.consumption.toFixed(1)} kWh</span>
              </div>
              <div>
                <span style="color: #6b7280;">Percentuale:</span>
                <span style="font-weight: 500; margin-left: 8px;">${expense.percentage.toFixed(1)}%</span>
              </div>
              <div>
                <span style="color: #6b7280;">Costo consumo:</span>
                <span style="font-weight: 500; margin-left: 8px;">€${expense.consumptionCost.toFixed(2)}</span>
              </div>
              <div>
                <span style="color: #6b7280;">Costi fissi:</span>
                <span style="font-weight: 500; margin-left: 8px;">€${expense.fixedCost.toFixed(2)}</span>
              </div>
            </div>
            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
              <div style="display: flex; justify-content: between; align-items: center;">
                <span style="font-weight: bold; color: #1f2937;">Totale da pagare:</span>
                <span style="font-weight: bold; color: #2563eb; font-size: 18px; margin-left: auto;">€${expense.totalCost.toFixed(2)}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
        <p>Report generato automaticamente il ${new Date().toLocaleString('it-IT')}</p>
        <p>App Casa Mare - Gestione Spese Energia</p>
      </div>
    `;

    return div;
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