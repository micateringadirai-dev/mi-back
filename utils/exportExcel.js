const ExcelJS = require('exceljs');

/**
 * Streams an Excel workbook of the given rows straight to the HTTP response.
 * @param {import('express').Response} res
 * @param {string} filename e.g. "catering-orders-2026-09-06.xlsx"
 * @param {{header: string, key: string, width?: number}[]} columns
 * @param {object[]} rows
 */
async function exportToExcel(res, filename, columns, rows) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Orders');

  sheet.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width || 20 }));
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFEFD9B4' },
  };

  rows.forEach((row) => sheet.addRow(row));

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  await workbook.xlsx.write(res);
  res.end();
}

module.exports = exportToExcel;
