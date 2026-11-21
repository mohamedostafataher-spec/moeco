
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const methodologyService = {
  generateMethodologyPDF: () => {
    const doc = new jsPDF();
    const title = "MoEco: Environmental Data Methodology & Scientific Framework";
    
    // Header
    doc.setFontSize(20);
    doc.text(title, 14, 22);
    doc.setFontSize(10);
    doc.text("Official Document for Government & Research Use", 14, 30);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 35);
    doc.line(14, 40, 196, 40);

    // 1. Definitions
    doc.setFontSize(14);
    doc.text("1. Key Indicators & Definitions", 14, 50);
    autoTable(doc, {
      startY: 55,
      head: [['Indicator', 'Definition', 'Unit']],
      body: [
        ['Total CO2', 'Total greenhouse gas emissions from all sectors.', 'Metric Tons CO2e'],
        ['Per Capita CO2', 'Average emissions per person in a specific region.', 'Tons/Person'],
        ['Energy Poverty Index', 'Ratio of energy expenditure to household income.', 'Index (0-1)'],
        ['Carbon Intensity', 'Emissions per unit of GDP or economic activity.', 'kg CO2/EGP'],
        ['Sustainability Score', 'Composite score of efficiency and renewable share.', 'Score (0-100)'],
        ['Infrastructure Stress', 'Load on national grid and water networks.', 'Percentage (%)']
      ],
    });

    // 2. Mathematical Formulas
    const finalY1 = (doc as any).lastAutoTable.finalY;
    doc.text("2. Mathematical Formulas", 14, finalY1 + 15);
    doc.setFontSize(10);
    doc.text([
      "• Emissions (E) = Activity Data (A) × Emission Factor (EF)",
      "• Per Capita = Total Emissions / Population",
      "• Energy Poverty = (Monthly Bill / Avg. Income) × 100",
      "• Carbon Intensity = Total CO2 / Regional GDP equivalent",
      "• Growth Rate = ((Current - Previous) / Previous) × 100"
    ], 14, finalY1 + 25);

    // 3. Official Data Sources
    doc.setFontSize(14);
    doc.text("3. Official Data Sources", 14, finalY1 + 60);
    autoTable(doc, {
      startY: finalY1 + 65,
      head: [['Agency', 'Data Provided', 'Reliability']],
      body: [
        ['CAPMAS', 'Population, Waste, Industry Stats', 'Primary'],
        ['EEHC', 'Electricity Consumption & Grid Factors', 'Primary'],
        ['Min. of Petroleum', 'Fuel Sales & Natural Gas Distribution', 'Primary'],
        ['IPCC', 'Global Emission Factors (Tier 1/2)', 'Scientific'],
        ['FAO', 'Livestock & Agricultural Methane Factors', 'Scientific'],
        ['UNFCCC', 'National Communication Reports (Egypt)', 'Verified']
      ],
    });

    // 4. Methodology
    const finalY2 = (doc as any).lastAutoTable.finalY;
    doc.addPage();
    doc.setFontSize(14);
    doc.text("4. Data Collection & Processing Methodology", 14, 22);
    doc.setFontSize(10);
    doc.text([
      "The MoEco platform utilizes a hybrid data collection model:",
      "1. Bottom-Up: User-reported consumption from utility bills (Validated).",
      "2. Top-Down: National statistics from CAPMAS and Ministry reports.",
      "3. Temporal: Historical data from 1990 is used to train forecasting models.",
      "4. Validation: Outliers are flagged using a 2-sigma deviation threshold.",
      "5. Anonymization: User IDs are hashed using SHA-256 equivalent for privacy."
    ], 14, 32);

    // Footer on all pages
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text("MoEco 2026 - Sovereign Environmental Intelligence System", 14, 285);
      doc.text(`Page ${i} of ${pageCount}`, 180, 285);
    }

    doc.save('MoEco_Data_Methodology.pdf');
  }
};
