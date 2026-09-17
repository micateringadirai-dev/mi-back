const ExcelJS = require('exceljs');

async function exportCateringPrepExcel(res, filename, dateStr, orders, format = 'xlsx') {
  if (format === 'csv') {
    return await exportCateringPrepCsv(res, filename, dateStr, orders);
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'MI Catering Services';
  workbook.created = new Date();

  // --- SHEET 1: Kitchen Prep & Detailed Orders Review ---
  const summarySheet = workbook.addWorksheet('Prep Review & Orders');

  // Define comprehensive column widths across all sections (A to R)
  summarySheet.columns = [
    { key: 'colA', width: 15 }, // Order Ref / Main Dish
    { key: 'colB', width: 16 }, // Order Type / Portion Unit
    { key: 'colC', width: 26 }, // Item Name / Quantity
    { key: 'colD', width: 16 }, // Portion Unit / Orders Count
    { key: 'colE', width: 16 }, // Packets / Revenue Est.
    { key: 'colF', width: 28 }, // Extra Side Dishes
    { key: 'colG', width: 15 }, // Subtotal
    { key: 'colH', width: 16 }, // Discount
    { key: 'colI', width: 16 }, // Final Payable
    { key: 'colJ', width: 20 }, // Fulfillment Mode
    { key: 'colK', width: 22 }, // Customer Name
    { key: 'colL', width: 16 }, // Mobile Number
    { key: 'colM', width: 18 }, // Scheduled Date
    { key: 'colN', width: 38 }, // Address / Notes
    { key: 'colO', width: 24 }, // Food Requirements
    { key: 'colP', width: 24 }, // Special Instructions
    { key: 'colQ', width: 14 }, // Status
    { key: 'colR', width: 22 }, // Submitted At
  ];

  // Title Block
  summarySheet.mergeCells('A1:R1');
  const titleCell = summarySheet.getCell('A1');
  titleCell.value = 'MI CATERING SERVICES — KITCHEN PREPARATION & BOOKED ORDERS REVIEW';
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8A2810' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  summarySheet.getRow(1).height = 32;

  summarySheet.mergeCells('A2:R2');
  const subCell = summarySheet.getCell('A2');
  const totalPacketsAll = orders.reduce((sum, o) => sum + (Number(o.numberOfPackets) || 0), 0);
  subCell.value = `Event / Preparation Date: ${dateStr ? new Date(dateStr).toDateString() : 'All Scheduled Dates'} | Total Bookings: ${orders.length} | Total Packets: ${totalPacketsAll}`;
  subCell.font = { name: 'Arial', size: 10, italic: true, bold: true };
  subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5E6D3' } };
  subCell.alignment = { horizontal: 'center', vertical: 'middle' };
  summarySheet.getRow(2).height = 24;

  summarySheet.addRow([]);

  // ================= SECTION 1: Main Dishes Aggregation =================
  const s1TitleRow = summarySheet.addRow(['1. MAIN DISHES TO PREPARE (KITCHEN QUANTITIES)']);
  summarySheet.mergeCells(`A${s1TitleRow.number}:E${s1TitleRow.number}`);
  s1TitleRow.getCell(1).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  s1TitleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB85D19' } };
  s1TitleRow.height = 22;

  const headerMain = summarySheet.addRow(['MAIN DISH / MENU ITEM', 'PORTION UNIT', 'TOTAL QUANTITY (PKTS)', 'ORDERS COUNT', 'REVENUE EST.']);
  headerMain.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerMain.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    if (colNumber <= 5) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD97706' } };
      cell.alignment = { vertical: 'middle' };
    }
  });

  const dishMap = {};
  orders.forEach((o) => {
    const key = `${o.itemName}___${o.portionUnit || 'Packet'}`;
    if (!dishMap[key]) {
      dishMap[key] = {
        name: o.itemName,
        portionUnit: o.portionUnit || 'Packet',
        quantity: 0,
        ordersCount: 0,
        subtotal: 0,
      };
    }
    dishMap[key].quantity += Number(o.numberOfPackets) || 0;
    dishMap[key].ordersCount += 1;
    dishMap[key].subtotal += Number(o.subtotalAmount || o.estimatedAmount) || 0;
  });

  let totalMainPackets = 0;
  Object.values(dishMap).forEach((d) => {
    totalMainPackets += d.quantity;
    const r = summarySheet.addRow([d.name, d.portionUnit, d.quantity, d.ordersCount, `₹${d.subtotal.toLocaleString('en-IN')}`]);
    r.getCell(3).alignment = { horizontal: 'right' };
    r.getCell(4).alignment = { horizontal: 'right' };
    r.getCell(5).alignment = { horizontal: 'right' };
  });
  const mainTotalRow = summarySheet.addRow(['TOTAL MAIN DISHES', '—', totalMainPackets, orders.length, '—']);
  mainTotalRow.font = { bold: true };
  mainTotalRow.getCell(3).alignment = { horizontal: 'right' };
  mainTotalRow.getCell(4).alignment = { horizontal: 'right' };

  summarySheet.addRow([]);

  // ================= SECTION 2: Add-ons & Extra Side Dishes =================
  const s2TitleRow = summarySheet.addRow(['2. EXTRA SIDE DISHES & ADD-ONS TO PREPARE']);
  summarySheet.mergeCells(`A${s2TitleRow.number}:E${s2TitleRow.number}`);
  s2TitleRow.getCell(1).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  s2TitleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D6A4F' } };
  s2TitleRow.height = 22;

  const headerExtras = summarySheet.addRow(['EXTRA SIDE DISH / ADD-ON', 'PORTION / GRAMMAGE', 'TOTAL PORTIONS', 'ORDERS COUNT', 'EXTRA REVENUE']);
  headerExtras.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerExtras.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    if (colNumber <= 5) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF40916C' } };
      cell.alignment = { vertical: 'middle' };
    }
  });

  const extrasMap = {};
  orders.forEach((o) => {
    if (Array.isArray(o.selectedExtras)) {
      o.selectedExtras.forEach((ex) => {
        if (!ex.name) return;
        const key = `${ex.name}___${ex.portion || ''}`;
        if (!extrasMap[key]) {
          extrasMap[key] = {
            name: ex.name,
            portion: ex.portion || '—',
            quantity: 0,
            ordersCount: 0,
            revenue: 0,
          };
        }
        extrasMap[key].quantity += Number(ex.quantity) || 1;
        extrasMap[key].ordersCount += 1;
        extrasMap[key].revenue += (Number(ex.price) || 0) * (Number(ex.quantity) || 1);
      });
    }
  });

  let totalExtraPortions = 0;
  let totalExtraRevenue = 0;
  const extrasList = Object.values(extrasMap);
  if (extrasList.length > 0) {
    extrasList.forEach((e) => {
      totalExtraPortions += e.quantity;
      totalExtraRevenue += e.revenue;
      const r = summarySheet.addRow([e.name, e.portion, e.quantity, e.ordersCount, `₹${e.revenue.toLocaleString('en-IN')}`]);
      r.getCell(3).alignment = { horizontal: 'right' };
      r.getCell(4).alignment = { horizontal: 'right' };
      r.getCell(5).alignment = { horizontal: 'right' };
    });
    const extraTotalRow = summarySheet.addRow(['TOTAL ADD-ONS', '—', totalExtraPortions, '—', `₹${totalExtraRevenue.toLocaleString('en-IN')}`]);
    extraTotalRow.font = { bold: true };
    extraTotalRow.getCell(3).alignment = { horizontal: 'right' };
  } else {
    summarySheet.addRow(['No extra add-ons requested for this date', '—', 0, 0, '₹0']);
  }

  summarySheet.addRow([]);

  // ================= SECTION 3: Fulfillment & Logistics Summary =================
  const s3TitleRow = summarySheet.addRow(['3. FULFILLMENT & LOGISTICS DISPATCH SUMMARY']);
  summarySheet.mergeCells(`A${s3TitleRow.number}:E${s3TitleRow.number}`);
  s3TitleRow.getCell(1).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  s3TitleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
  s3TitleRow.height = 22;

  const headerFulfillment = summarySheet.addRow(['FULFILLMENT MODE', 'TOTAL ORDERS', 'TOTAL PACKETS', 'ACTION FOR KITCHEN / DISPATCH', 'LOGISTICS STATUS']);
  headerFulfillment.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerFulfillment.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    if (colNumber <= 5) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF64748B' } };
      cell.alignment = { vertical: 'middle' };
    }
  });

  const deliveryOrders = orders.filter((o) => (o.deliveryType || 'Delivery') === 'Delivery');
  const pickupOrders = orders.filter((o) => o.deliveryType === 'Self Service');
  const deliveryPkts = deliveryOrders.reduce((sum, o) => sum + (Number(o.numberOfPackets) || 0), 0);
  const pickupPkts = pickupOrders.reduce((sum, o) => sum + (Number(o.numberOfPackets) || 0), 0);

  summarySheet.addRow(['🚚 Doorstep Delivery', deliveryOrders.length, deliveryPkts, 'Pack in hot thermal boxes & dispatch via delivery vehicle', 'Requires Driver']);
  summarySheet.addRow(['🛍️ Self Service (Kitchen Pickup)', pickupOrders.length, pickupPkts, 'Keep packed, tagged with customer name & phone on pickup shelf', 'Counter Collection']);

  summarySheet.addRow([]);
  summarySheet.addRow([]);

  // ================= SECTION 4: DETAILED BOOKED ORDERS TABLE (TABLE DETAILS) =================
  const s4TitleRow = summarySheet.addRow(['4. DETAILED BOOKED ORDERS & DISPATCH MANIFEST (TABLE DETAILS)']);
  summarySheet.mergeCells(`A${s4TitleRow.number}:R${s4TitleRow.number}`);
  s4TitleRow.getCell(1).font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  s4TitleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8A2810' } };
  s4TitleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  s4TitleRow.height = 26;

  const orderTableHeaders = [
    'Order Ref',
    'Order Type',
    'Item / Event Name',
    'Portion Unit',
    'Packets',
    'Extra Side Dishes',
    'Subtotal',
    'Discount',
    'Final Total',
    'Fulfillment Mode',
    'Customer Name',
    'Mobile Number',
    'Scheduled Date',
    'Delivery Address / Pickup Location',
    'Food Requirements',
    'Special Instructions',
    'Status',
    'Submitted At',
  ];

  const orderHeaderRow = summarySheet.addRow(orderTableHeaders);
  orderHeaderRow.height = 26;
  orderHeaderRow.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  orderHeaderRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF701A0E' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      bottom: { style: 'medium', color: { argb: 'FF8A2810' } },
      right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
    };
  });

  let sumSubtotal = 0;
  let sumDiscount = 0;
  let sumFinal = 0;
  let sumPackets = 0;

  orders.forEach((o, index) => {
    const extrasStr =
      Array.isArray(o.selectedExtras) && o.selectedExtras.length > 0
        ? o.selectedExtras.map((e) => `${e.name}${e.portion ? ` (${e.portion})` : ''} × ${e.quantity || 1}`).join(', ')
        : '—';

    const packets = Number(o.numberOfPackets) || 0;
    const subtotal = Number(o.subtotalAmount) || Number(o.estimatedAmount) || 0;
    const discount = Number(o.discountAmount) || 0;
    const finalAmt = Number(o.finalAmount) || Number(o.estimatedAmount) || 0;

    sumPackets += packets;
    sumSubtotal += subtotal;
    sumDiscount += discount;
    sumFinal += finalAmt;

    let discountInfo = '—';
    if (discount > 0) {
      discountInfo = `-₹${discount.toLocaleString('en-IN')}${o.discountType === 'percentage' ? ` (${o.discountValue}%)` : ''}`;
    }

    const orderRef = `#${(o._id || '').toString().slice(-6).toUpperCase()}`;
    const orderType = o.orderType === 'quotation' ? '📋 Quotation' : '🔥 Pre-Order';
    const fulfillment = o.deliveryType === 'Self Service' ? '🛍️ Kitchen Pickup' : '🚚 Delivery';

    const rowData = [
      orderRef,
      orderType,
      o.itemName || '—',
      o.portionUnit || 'Packet',
      packets,
      extrasStr,
      subtotal > 0 ? `₹${subtotal.toLocaleString('en-IN')}` : '—',
      discountInfo,
      `₹${finalAmt.toLocaleString('en-IN')}`,
      fulfillment,
      o.customerName || '—',
      o.mobileNumber || '—',
      o.orderDate ? new Date(o.orderDate).toDateString() : '—',
      o.address || '—',
      o.foodRequirements || '—',
      o.additionalNotes || '—',
      o.status || 'Pending',
      o.createdAt ? new Date(o.createdAt).toLocaleString('en-IN') : '—',
    ];

    const dataRow = summarySheet.addRow(rowData);
    dataRow.height = 22;

    const isEven = index % 2 === 0;
    dataRow.eachCell((cell, colNum) => {
      cell.font = { name: 'Arial', size: 9.5 };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      };
      if (isEven) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
      }
      if ([1, 2, 4, 10, 13, 17].includes(colNum)) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if ([5, 7, 8, 9].includes(colNum)) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      }

      // Highlight Final Payable
      if (colNum === 9) {
        cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF166534' } };
      }
      // Highlight Customer
      if (colNum === 11) {
        cell.font = { name: 'Arial', size: 9.5, bold: true };
      }
    });
  });

  // Aggregate Total Row for Orders Table
  const totalRow = summarySheet.addRow([
    'TOTALS',
    `Count: ${orders.length}`,
    '—',
    '—',
    sumPackets,
    '—',
    `₹${sumSubtotal.toLocaleString('en-IN')}`,
    sumDiscount > 0 ? `-₹${sumDiscount.toLocaleString('en-IN')}` : '—',
    `₹${sumFinal.toLocaleString('en-IN')}`,
    '—',
    '—',
    '—',
    '—',
    '—',
    '—',
    '—',
    '—',
    '—',
  ]);
  totalRow.height = 25;
  totalRow.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF1E293B' } };
  totalRow.eachCell((cell, colNum) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFD9B4' } };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF8A2810' } },
      bottom: { style: 'double', color: { argb: 'FF8A2810' } },
      left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    };
    if ([5, 7, 8, 9].includes(colNum)) {
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
    } else {
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    }
  });


  // --- SHEET 2: Dedicated Customer Dispatch List ---
  const orderSheet = workbook.addWorksheet('Customer Dispatch List');

  orderSheet.columns = [
    { header: 'Order Ref', key: 'orderRef', width: 15 },
    { header: 'Order Type', key: 'orderType', width: 16 },
    { header: 'Item / Event', key: 'itemName', width: 24 },
    { header: 'Portion Unit', key: 'portionUnit', width: 16 },
    { header: 'Packets', key: 'numberOfPackets', width: 12 },
    { header: 'Extra Add-ons', key: 'extraSideDishes', width: 30 },
    { header: 'Subtotal', key: 'subtotalAmount', width: 15 },
    { header: 'Discount', key: 'discountInfo', width: 16 },
    { header: 'Final Payable', key: 'finalAmount', width: 16 },
    { header: 'Fulfillment', key: 'deliveryType', width: 18 },
    { header: 'Customer Name', key: 'customerName', width: 22 },
    { header: 'Mobile Number', key: 'mobileNumber', width: 16 },
    { header: 'Scheduled Date', key: 'orderDate', width: 18 },
    { header: 'Address / Pickup Notes', key: 'address', width: 40 },
    { header: 'Food Requirements', key: 'foodRequirements', width: 25 },
    { header: 'Additional Notes', key: 'additionalNotes', width: 25 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Submitted At', key: 'createdAt', width: 22 },
  ];

  const sheet2Header = orderSheet.getRow(1);
  sheet2Header.height = 26;
  sheet2Header.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  sheet2Header.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF8A2810' },
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  orders.forEach((o, idx) => {
    const extrasStr = Array.isArray(o.selectedExtras) && o.selectedExtras.length > 0
      ? o.selectedExtras.map((e) => `${e.name}${e.portion ? ` (${e.portion})` : ''} × ${e.quantity || 1}`).join(', ')
      : '—';

    let discountInfo = '—';
    if (o.discountAmount > 0) {
      discountInfo = `-₹${Number(o.discountAmount).toLocaleString('en-IN')}${o.discountType === 'percentage' ? ` (${o.discountValue}%)` : ''}`;
    }

    const subtotal = Number(o.subtotalAmount) || Number(o.estimatedAmount) || 0;
    const finalAmt = Number(o.finalAmount) || Number(o.estimatedAmount) || 0;

    const row = orderSheet.addRow({
      orderRef: `#${(o._id || '').toString().slice(-6).toUpperCase()}`,
      orderType: o.orderType === 'quotation' ? 'Quotation' : 'Pre-Order',
      itemName: o.itemName,
      portionUnit: o.portionUnit || 'Packet',
      numberOfPackets: Number(o.numberOfPackets) || 0,
      extraSideDishes: extrasStr,
      subtotalAmount: subtotal > 0 ? `₹${subtotal.toLocaleString('en-IN')}` : '—',
      discountInfo,
      finalAmount: `₹${finalAmt.toLocaleString('en-IN')}`,
      deliveryType: o.deliveryType || 'Delivery',
      customerName: o.customerName,
      mobileNumber: o.mobileNumber,
      orderDate: o.orderDate ? new Date(o.orderDate).toDateString() : '—',
      address: o.address || '—',
      foodRequirements: o.foodRequirements || '—',
      additionalNotes: o.additionalNotes || '—',
      status: o.status || 'Pending',
      createdAt: o.createdAt ? new Date(o.createdAt).toLocaleString('en-IN') : '—',
    });

    row.height = 20;
    const isEven = idx % 2 === 0;
    row.eachCell((cell, colNum) => {
      cell.font = { name: 'Arial', size: 9.5 };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      };
      if (isEven) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
      }
      if ([5, 7, 8, 9].includes(colNum)) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      } else if ([1, 2, 4, 10, 13, 17].includes(colNum)) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }
    });
  });

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  await workbook.xlsx.write(res);
  res.end();
}

function escapeCsv(val) {
  if (val === null || val === undefined) return '';
  const s = String(val).replace(/"/g, '""');
  if (s.search(/("|,|\n|\r)/g) >= 0) {
    return `"${s}"`;
  }
  return s;
}

async function exportToCsv(res, filename, columns, rows) {
  const csvFilename = filename.replace(/\.xlsx$/i, '.csv');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${csvFilename}"`);
  res.write('\uFEFF');

  const headerLine = columns.map((c) => escapeCsv(c.header)).join(',');
  const rowLines = rows.map((r) => columns.map((c) => escapeCsv(r[c.key])).join(','));
  const csvContent = [headerLine, ...rowLines].join('\r\n');
  res.write(csvContent);
  res.end();
}

async function exportCateringPrepCsv(res, filename, dateStr, orders) {
  const csvFilename = filename.replace(/\.xlsx$/i, '.csv');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${csvFilename}"`);
  res.write('\uFEFF');

  const lines = [];
  lines.push(['MI CATERING SERVICES - KITCHEN PREPARATION & BOOKED ORDERS REVIEW']);
  const totalPackets = orders.reduce((sum, o) => sum + (Number(o.numberOfPackets) || 0), 0);
  lines.push([`Scheduled Date: ${dateStr ? new Date(dateStr).toDateString() : 'All Dates'} | Total Bookings: ${orders.length} | Total Packets: ${totalPackets}`]);
  lines.push([]);

  // Section 1: Main Dishes
  lines.push(['1. MAIN DISHES TO PREPARE (KITCHEN QUANTITIES)']);
  lines.push(['Main Dish / Menu Item', 'Portion Unit', 'Total Quantity (Packets)', 'Orders Count', 'Revenue Est.']);
  
  const dishMap = {};
  orders.forEach((o) => {
    const key = `${o.itemName}___${o.portionUnit || 'Packet'}`;
    if (!dishMap[key]) {
      dishMap[key] = {
        name: o.itemName,
        portionUnit: o.portionUnit || 'Packet',
        quantity: 0,
        ordersCount: 0,
        subtotal: 0,
      };
    }
    dishMap[key].quantity += Number(o.numberOfPackets) || 0;
    dishMap[key].ordersCount += 1;
    dishMap[key].subtotal += Number(o.subtotalAmount || o.estimatedAmount) || 0;
  });

  Object.values(dishMap).forEach((d) => {
    lines.push([d.name, d.portionUnit, d.quantity, d.ordersCount, `₹${d.subtotal.toLocaleString('en-IN')}`]);
  });
  lines.push([]);

  // Section 2: Extra Side Dishes
  lines.push(['2. EXTRA SIDE DISHES & ADD-ONS TO PREPARE']);
  lines.push(['Extra Side Dish / Add-On', 'Portion', 'Total Portions', 'Orders Count', 'Extra Revenue']);
  const extrasMap = {};
  orders.forEach((o) => {
    if (Array.isArray(o.selectedExtras)) {
      o.selectedExtras.forEach((ex) => {
        if (!ex.name) return;
        const key = `${ex.name}___${ex.portion || ''}`;
        if (!extrasMap[key]) {
          extrasMap[key] = {
            name: ex.name,
            portion: ex.portion || '—',
            quantity: 0,
            ordersCount: 0,
            revenue: 0,
          };
        }
        extrasMap[key].quantity += Number(ex.quantity) || 1;
        extrasMap[key].ordersCount += 1;
        extrasMap[key].revenue += (Number(ex.price) || 0) * (Number(ex.quantity) || 1);
      });
    }
  });

  Object.values(extrasMap).forEach((e) => {
    lines.push([e.name, e.portion, e.quantity, e.ordersCount, `₹${e.revenue.toLocaleString('en-IN')}`]);
  });
  lines.push([]);

  // Section 3: All Booked Orders Manifest
  lines.push(['3. ALL BOOKED ORDERS (DISPATCH & CUSTOMER MANIFEST)']);
  lines.push(['Order Ref', 'Type', 'Item Name', 'Portion Unit', 'Packets', 'Delivery Mode', 'Customer Name', 'Mobile', 'Order Date', 'Address / Location', 'Side Dishes', 'Total Payable', 'Status']);
  orders.forEach((o) => {
    const extrasStr = Array.isArray(o.selectedExtras) && o.selectedExtras.length > 0
      ? o.selectedExtras.map((e) => `${e.name} (${e.quantity || 1})`).join('; ')
      : '-';
    lines.push([
      `#${(o._id || '').toString().slice(-6).toUpperCase()}`,
      o.orderType === 'quotation' ? 'Quotation' : 'Pre-Order',
      o.itemName,
      o.portionUnit || 'Packet',
      o.numberOfPackets,
      o.deliveryType || 'Delivery',
      o.customerName,
      o.mobileNumber,
      new Date(o.orderDate).toDateString(),
      o.address || '-',
      extrasStr,
      o.finalAmount ? `₹${o.finalAmount}` : (o.estimatedAmount ? `₹${o.estimatedAmount}` : '-'),
      o.status,
    ]);
  });

  const csvContent = lines.map((row) => row.map(escapeCsv).join(',')).join('\r\n');
  res.write(csvContent);
  res.end();
}

async function exportToExcel(res, filename, columns, rows, format = 'xlsx') {
  if (format === 'csv') {
    return await exportToCsv(res, filename, columns, rows);
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Orders');

  sheet.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width || 20 }));
  sheet.getRow(1).height = 26;
  sheet.getRow(1).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF8A2810' },
  };
  sheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };

  rows.forEach((row, idx) => {
    const r = sheet.addRow(row);
    r.height = 20;
    const isEven = idx % 2 === 0;
    r.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 9.5 };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      };
      if (isEven) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
      }
    });
  });

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  await workbook.xlsx.write(res);
  res.end();
}

exportToExcel.exportToExcel = exportToExcel;
exportToExcel.exportCateringPrepExcel = exportCateringPrepExcel;
exportToExcel.exportToCsv = exportToCsv;
exportToExcel.exportCateringPrepCsv = exportCateringPrepCsv;

module.exports = exportToExcel;
