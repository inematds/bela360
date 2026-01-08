'use client';

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export type ExportFormat = 'csv' | 'xlsx' | 'pdf';

interface ExportOptions {
  filename: string;
  title?: string;
  subtitle?: string;
}

interface TableData {
  headers: string[];
  rows: (string | number)[][];
}

// Format currency for display
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// Format date for display
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

// Export to CSV
export function exportToCSV(data: TableData, options: ExportOptions): void {
  const { headers, rows } = data;
  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      row
        .map(cell => {
          const cellStr = String(cell);
          // Escape quotes and wrap in quotes if contains comma
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, `${options.filename}.csv`);
}

// Export to Excel
export function exportToExcel(data: TableData, options: ExportOptions): void {
  const { headers, rows } = data;
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Set column widths
  const colWidths = headers.map((header, i) => {
    const maxLength = Math.max(
      header.length,
      ...rows.map(row => String(row[i] || '').length)
    );
    return { wch: Math.min(maxLength + 2, 50) };
  });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, options.title || 'Dados');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, `${options.filename}.xlsx`);
}

// Export to PDF
export function exportToPDF(data: TableData, options: ExportOptions): void {
  const { headers, rows } = data;
  const doc = new jsPDF();

  // Add title
  if (options.title) {
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(options.title, 14, 20);
  }

  // Add subtitle
  if (options.subtitle) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(options.subtitle, 14, 28);
  }

  // Add date
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text(`Gerado em: ${formatDate(new Date())}`, 14, options.subtitle ? 36 : 28);

  // Add table
  autoTable(doc, {
    head: [headers],
    body: rows.map(row => row.map(cell => String(cell))),
    startY: options.subtitle ? 42 : 34,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [139, 92, 246], // Purple
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
  });

  doc.save(`${options.filename}.pdf`);
}

// Generic export function
export function exportData(
  data: TableData,
  format: ExportFormat,
  options: ExportOptions
): void {
  switch (format) {
    case 'csv':
      exportToCSV(data, options);
      break;
    case 'xlsx':
      exportToExcel(data, options);
      break;
    case 'pdf':
      exportToPDF(data, options);
      break;
  }
}

// Helper to prepare dashboard stats for export
export function prepareDashboardExport(stats: {
  today: { appointments: number; confirmed: number; cancelled: number; completed: number; revenue: number };
  week: { appointments: number; newClients: number; revenue: number };
  month: { appointments: number; newClients: number; revenue: number };
  confirmationRate: number;
  averageTicket: number;
}): TableData {
  return {
    headers: ['Período', 'Métrica', 'Valor'],
    rows: [
      ['Hoje', 'Agendamentos', stats.today.appointments],
      ['Hoje', 'Confirmados', stats.today.confirmed],
      ['Hoje', 'Cancelados', stats.today.cancelled],
      ['Hoje', 'Concluídos', stats.today.completed],
      ['Hoje', 'Receita', formatCurrency(stats.today.revenue)],
      ['Semana', 'Agendamentos', stats.week.appointments],
      ['Semana', 'Novos Clientes', stats.week.newClients],
      ['Semana', 'Receita', formatCurrency(stats.week.revenue)],
      ['Mês', 'Agendamentos', stats.month.appointments],
      ['Mês', 'Novos Clientes', stats.month.newClients],
      ['Mês', 'Receita', formatCurrency(stats.month.revenue)],
      ['Geral', 'Taxa de Confirmação', `${stats.confirmationRate}%`],
      ['Geral', 'Ticket Médio', formatCurrency(stats.averageTicket)],
    ],
  };
}

// Helper to prepare revenue report for export
export function prepareRevenueExport(
  data: Array<{ date: string; revenue: number; count: number }>
): TableData {
  return {
    headers: ['Data', 'Receita', 'Agendamentos'],
    rows: data.map(d => [
      formatDate(new Date(d.date)),
      formatCurrency(d.revenue),
      d.count,
    ]),
  };
}

// Helper to prepare service report for export
export function prepareServiceExport(
  data: Array<{ name: string; count: number; revenue: number }>
): TableData {
  return {
    headers: ['Serviço', 'Agendamentos', 'Receita'],
    rows: data.map(s => [s.name, s.count, formatCurrency(s.revenue)]),
  };
}

// Helper to prepare professional report for export
export function prepareProfessionalExport(
  data: Array<{ name: string; appointments: number; revenue: number }>
): TableData {
  return {
    headers: ['Profissional', 'Agendamentos', 'Receita'],
    rows: data.map(p => [p.name, p.appointments, formatCurrency(p.revenue)]),
  };
}

// Helper to prepare client list for export
export function prepareClientExport(
  data: Array<{
    name: string;
    phone: string;
    email?: string;
    lastVisitAt?: string;
    totalAppointments: number;
    totalSpent: number;
  }>
): TableData {
  return {
    headers: ['Nome', 'Telefone', 'Email', 'Última Visita', 'Total Visitas', 'Total Gasto'],
    rows: data.map(c => [
      c.name,
      c.phone,
      c.email || '-',
      c.lastVisitAt ? formatDate(new Date(c.lastVisitAt)) : '-',
      c.totalAppointments,
      formatCurrency(c.totalSpent),
    ]),
  };
}

// Helper to prepare appointments for export
export function prepareAppointmentExport(
  data: Array<{
    client: { name: string };
    service: { name: string };
    professional: { name: string };
    startTime: string;
    status: string;
  }>
): TableData {
  const statusMap: Record<string, string> = {
    SCHEDULED: 'Agendado',
    CONFIRMED: 'Confirmado',
    PENDING: 'Pendente',
    COMPLETED: 'Concluído',
    CANCELLED: 'Cancelado',
    NO_SHOW: 'Não compareceu',
  };

  return {
    headers: ['Cliente', 'Serviço', 'Profissional', 'Horário', 'Status'],
    rows: data.map(a => [
      a.client?.name || '-',
      a.service?.name || '-',
      a.professional?.name || '-',
      new Date(a.startTime).toLocaleString('pt-BR'),
      statusMap[a.status] || a.status,
    ]),
  };
}
