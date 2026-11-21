import { createClient } from "@supabase/supabase-js";
import { jsPDF } from "jspdf";
import * as xlsx from "xlsx";
import "jspdf-autotable";

export class SupabaseReportingEngine {
  private supabase: any;

  constructor() {
    const url = process.env.VITE_SUPABASE_URL || '';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
    let parsedUrl = url;
    if (parsedUrl.endsWith('/')) parsedUrl = parsedUrl.slice(0, -1);
    if (parsedUrl.includes('/rest/v1')) parsedUrl = parsedUrl.split('/rest/v1')[0];
    
    this.supabase = createClient(parsedUrl, key);
  }

  async generateUserReport(userId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 1).toISOString();

    // Query carbon_footprint_logs
    const { data: logs, error } = await this.supabase
      .from('carbon_footprint_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate)
      .lt('created_at', endDate);

    if (error) console.error("Error fetching user data:", error);

    const logData = logs || [];
    const totalEmissions = logData.reduce((sum: number, log: any) => sum + (log.amount || 0), 0);
    
    const bySector = logData.reduce((acc: any, log: any) => {
       const s = log.category || 'General';
       acc[s] = (acc[s] || 0) + (log.amount || 0);
       return acc;
    }, {});

    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(`Monthly Carbon Report - ${month}/${year}`, 20, 20);
    doc.setFontSize(14);
    doc.text(`Total Emissions: ${totalEmissions.toFixed(2)} kg CO2`, 20, 40);
    
    // @ts-ignore
    doc.autoTable({
      startY: 50,
      head: [['Sector', 'Emissions (kg CO2)']],
      body: Object.entries(bySector).map(([k, v]) => [k, typeof v === 'number' ? v.toFixed(2) : '0.00'])
    });
    
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    const pdfUrl = await this.uploadToStorage(`user_${userId}_${month}_${year}.pdf`, pdfBuffer, 'application/pdf');

    // Excel
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(logData.map((l: any) => ({
      Date: l.created_at,
      Category: l.category,
      Amount: l.amount
    })));
    xlsx.utils.book_append_sheet(wb, ws, "Raw Data");
    const wsSummary = xlsx.utils.json_to_sheet(Object.entries(bySector).map(([k, v]) => ({ Category: k, Total: v })));
    xlsx.utils.book_append_sheet(wb, wsSummary, "Summary");
    const excelBuffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const excelUrl = await this.uploadToStorage(`user_${userId}_${month}_${year}.xlsx`, excelBuffer, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    // Insert to DB
    const { error: insertError } = await this.supabase.from('reports').insert({
        type: 'user', reference_id: userId,
        month, year, file_url_pdf: pdfUrl, file_url_excel: excelUrl
    });
    if (insertError) console.error("DB Insert Error:", insertError);

    // Notify User
    await this.supabase.from('notifications').insert({
      user_id: userId,
      title: 'Monthly Report Generated',
      message: `Your carbon report for ${month}/${year} is ready.`,
      type: 'report',
      is_read: false
    });

    return { pdfUrl, excelUrl, summary: { totalEmissions } };
  }

  async generateCountryReport(month: number, year: number) {
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 1).toISOString();

    const { data: logs } = await this.supabase
      .from('carbon_footprint_logs')
      .select('amount, category')
      .gte('created_at', startDate)
      .lt('created_at', endDate);

    const logData = logs || [];
    const totalEmissions = logData.reduce((sum: number, log: any) => sum + (log.amount || 0), 0);
    const bySector = logData.reduce((acc: any, log: any) => {
        const s = log.category || 'General';
        acc[s] = (acc[s] || 0) + (log.amount || 0);
        return acc;
     }, {});
     
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(`National Monthly Ecometrics Report - ${month}/${year}`, 20, 20);
    doc.setFontSize(14);
    doc.text(`Total National Emissions: ${totalEmissions.toFixed(2)} kg CO2`, 20, 40);
    // @ts-ignore
    doc.autoTable({ startY: 50, head: [['Sector', 'Emissions']], body: Object.entries(bySector).map(([k,v])=>[k, typeof v === 'number' ? v.toFixed(2): '0']) });
    
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    const pdfUrl = await this.uploadToStorage(`country_${month}_${year}.pdf`, pdfBuffer, 'application/pdf');

    const wb = xlsx.utils.book_new();
    const wsSummary = xlsx.utils.json_to_sheet([{ TotalEmissions: totalEmissions }]);
    xlsx.utils.book_append_sheet(wb, wsSummary, "Summary");
    const excelBuffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const excelUrl = await this.uploadToStorage(`country_${month}_${year}.xlsx`, excelBuffer, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    const { error: insertError } = await this.supabase.from('reports').insert({
        type: 'country', reference_id: 'ALL',
        month, year, file_url_pdf: pdfUrl, file_url_excel: excelUrl
    });
    if (insertError) console.error("DB Insert Error:", insertError);
    
    return { pdfUrl, excelUrl };
  }

  async generateSectorReport(sector: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 1).toISOString();

    const { data: logs } = await this.supabase
      .from('carbon_footprint_logs')
      .select('amount, user_id, profiles(full_name)')
      .eq('category', sector)
      .gte('created_at', startDate)
      .lt('created_at', endDate);

    const logData = logs || [];
    const totalEmissions = logData.reduce((sum: number, log: any) => sum + (log.amount || 0), 0);
    
    const userEmissions = logData.reduce((acc: any, log: any) => {
        const u = log.user_id || 'Unknown';
        if (!acc[u]) acc[u] = { name: log.profiles?.full_name || 'Anonymous', amount: 0 };
        acc[u].amount += (log.amount || 0);
        return acc;
    }, {});
    const topUsers = Object.values(userEmissions).sort((a: any, b: any) => b.amount - a.amount).slice(0, 10);

    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(`Sector Report: ${sector} - ${month}/${year}`, 20, 20);
    doc.setFontSize(14);
    doc.text(`Total Emissions: ${totalEmissions.toFixed(2)} kg CO2`, 20, 40);
    doc.text(`Top 10 Emitters:`, 20, 60);
    // @ts-ignore
    doc.autoTable({ startY: 70, head: [['User', 'Emissions']], body: topUsers.map((u:any) => [u.name, u.amount.toFixed(2)]) });
    
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    const pdfUrl = await this.uploadToStorage(`sector_${sector}_${month}_${year}.pdf`, pdfBuffer, 'application/pdf');

    const wb = xlsx.utils.book_new();
    const wsSummary = xlsx.utils.json_to_sheet([{ Sector: sector, TotalEmissions: totalEmissions }]);
    xlsx.utils.book_append_sheet(wb, wsSummary, "Summary");
    const wsTop = xlsx.utils.json_to_sheet(topUsers);
    xlsx.utils.book_append_sheet(wb, wsTop, "Top Users");
    const excelBuffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const excelUrl = await this.uploadToStorage(`sector_${sector}_${month}_${year}.xlsx`, excelBuffer, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    const { error: insertError } = await this.supabase.from('reports').insert({
        type: 'sector', reference_id: sector,
        month, year, file_url_pdf: pdfUrl, file_url_excel: excelUrl
    });
    if (insertError) console.error("DB Insert Error:", insertError);
    return { pdfUrl, excelUrl };
  }

  async generateGovernorateReport(month: number, year: number) {
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 1).toISOString();

    const { data: logs } = await this.supabase
      .from('carbon_footprint_logs')
      .select('amount, profiles(governorate)')
      .gte('created_at', startDate)
      .lt('created_at', endDate);

    const logData = logs || [];
    const govEmissions = logData.reduce((acc: any, log: any) => {
        const gov = log.profiles?.governorate || 'Unknown';
        acc[gov] = (acc[gov] || 0) + (log.amount || 0);
        return acc;
    }, {});
    
    const rankedGovs = Object.entries(govEmissions).map(([gov, amt]) => ({ Governorate: gov, Emissions: amt })).sort((a: any, b: any) => b.Emissions - a.Emissions);

    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(`Governorate Report - ${month}/${year}`, 20, 20);
    // @ts-ignore
    doc.autoTable({ startY: 40, head: [['Governorate', 'Emissions']], body: rankedGovs.map(g => [g.Governorate, (g.Emissions as number).toFixed(2)]) });
    
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    const pdfUrl = await this.uploadToStorage(`governorates_${month}_${year}.pdf`, pdfBuffer, 'application/pdf');

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(rankedGovs);
    xlsx.utils.book_append_sheet(wb, ws, "Rankings");
    const excelBuffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const excelUrl = await this.uploadToStorage(`governorates_${month}_${year}.xlsx`, excelBuffer, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    const { error: insertError } = await this.supabase.from('reports').insert({
        type: 'governorate', reference_id: 'ALL',
        month, year, file_url_pdf: pdfUrl, file_url_excel: excelUrl
    });
    if (insertError) console.error("DB Insert Error:", insertError);
    return { pdfUrl, excelUrl };
  }

  async uploadToStorage(filename: string, buffer: Buffer, contentType: string) {
    try {
        const { data, error } = await this.supabase.storage.from('reports').upload(filename, buffer, {
            contentType, upsert: true
        });
        if (error) {
           console.error("Storage upload error:", error);
           return '';
        }
        const parsedUrl = this.supabase.storage.from('reports').getPublicUrl(filename).data.publicUrl;
        return parsedUrl;
    } catch(e) {
        console.error("Failed to upload", e);
        return '';
    }
  }
}
