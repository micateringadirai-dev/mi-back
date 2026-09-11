const ExcelJS = require('exceljs');

async function exportCateringPrepExcel(res, filename, dateStr, orders) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'MI Catering Services';
  workbook.created = new Date();

  // --- SHEET 1: Kitchen Prep Summary ---
  const summarySheet = workbook.addWorksheet('Kitchen Prep Summary');

  // Title block
  summarySheet.mergeCells('A1:E1');
  const titleCell = summarySheet.getCell('A1');
  titleCell.value = 'MI CATERING SERVICES — KITCHEN PREPARATION REVIEW';
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8A2810' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  summarySheet.getRow(1).height = 30;

  summarySheet.mergeCells('A2:E2');
  const subCell = summarySheet.getCell('A2');
  subCell.value = `Preparation Cutoff Date: ${dateStr ? new Date(dateStr).toDateString() : 'All Dates'} | Total Bookings: ${orders.length}`;
  subCell.font = { name: 'Arial', size: 10, italic: true, bold: true };
  subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5E6D3' } };
  subCell.alignment = { horizontal: 'center', vertical: 'middle' };
  summarySheet.getRow(2).height = 22;

  summarySheet.addRow([]);

  // Section 1: Main Dishes Aggregation
  const headerMain = summarySheet.addRow(['MAIN DISH / MENU ITEM', 'PORTION UNIT', 'TOTAL QUANTITY', 'ORDERS COUNT', 'REVENUE EST.']);
  headerMain.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerMain.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB85D19' } };
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
    summarySheet.addRow([d.name, d.portionUnit, d.quantity, d.ordersCount, `₹${d.subtotal.toLocaleString('en-IN')}`]);
  });
  const mainTotalRow = summarySheet.addRow(['TOTAL MAIN DISHES', '—', totalMainPackets, orders.length, '—']);
  mainTotalRow.font = { bold: true };

  summarySheet.addRow([]);

  // Section 2: Add-ons & Extra Side Dishes Aggregation
  const headerExtras = summarySheet.addRow(['EXTRA SIDE DISH / ADD-ON', 'PORTION / GRAMMAGE', 'TOTAL PORTIONS', 'ORDERS COUNT', 'EXTRA REVENUE']);
  headerExtras.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerExtras.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D6A4F' } };
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
      summarySheet.addRow([e.name, e.portion, e.quantity, e.ordersCount, `₹${e.revenue.toLocaleString('en-IN')}`]);
    });
    const extraTotalRow = summarySheet.addRow(['TOTAL ADD-ONS', '—', totalExtraPortions, '—', `₹${totalExtraRevenue.toLocaleString('en-IN')}`]);
    extraTotalRow.font = { bold: true };
  } else {
    summarySheet.addRow(['No extra add-ons requested for this date', '—', 0, 0, '₹0']);
  }

  summarySheet.addRow([]);

  // Section 3: Fulfillment & Logistics
  const headerFulfillment = summarySheet.addRow(['FULFILLMENT MODE', 'TOTAL ORDERS', 'TOTAL PACKETS', 'ACTION FOR KITCHEN / DISPATCH', 'STATUS']);
  headerFulfillment.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerFulfillment.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4A5568' } };
  });

  const deliveryOrders = orders.filter((o) => (o.deliveryType || 'Delivery') === 'Delivery');
  const pickupOrders = orders.filter((o) => o.deliveryType === 'Self Service');
  const deliveryPkts = deliveryOrders.reduce((sum, o) => sum + (Number(o.numberOfPackets) || 0), 0);
  const pickupPkts = pickupOrders.reduce((sum, o) => sum + (Number(o.numberOfPackets) || 0), 0);

  summarySheet.addRow(['🚚 Doorstep Delivery', deliveryOrders.length, deliveryPkts, 'Pack in hot thermal boxes & dispatch via delivery vehicle', 'Requires Driver']);
  summarySheet.addRow(['🛍️ Self Service (Kitchen Pickup)', pickupOrders.length, pickupPkts, 'Keep packed, tagged with customer name & phone on pickup shelf', 'Counter Collection']);

  summarySheet.columns = [
    { width: 35 },
    { width: 25 },
    { width: 18 },
    { width: 18 },
    { width: 45 },
  ];

  // --- SHEET 2: Itemized Customer Orders ---
  const orderSheet = workbook.addWorksheet('Customer Dispatch List');

  orderSheet.columns = [
    { header: 'Order Type', key: 'orderType', width: 14 },
    { header: 'Item / Event', key: 'itemName', width: 22 },
    { header: 'Portion Unit', key: 'portionUnit', width: 18 },
    { header: 'Packets', key: 'numberOfPackets', width: 10 },
    { header: 'Extra Add-ons', key: 'extraSideDishes', width: 30 },
    { header: 'Subtotal', key: 'subtotalAmount', width: 14 },
    { header: 'Discount', key: 'discountInfo', width: 18 },
    { header: 'Final Payable', key: 'finalAmount', width: 15 },
    { header: 'Fulfillment', key: 'deliveryType', width: 16 },
    { header: 'Customer Name', key: 'customerName', width: 20 },
    { header: 'Mobile Number', key: 'mobileNumber', width: 15 },
    { header: 'Address / Pickup Notes', key: 'address', width: 40 },
    { header: 'Food Requirements', key: 'foodRequirements', width: 25 },
    { header: 'Additional Notes', key: 'additionalNotes', width: 25 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Submitted At', key: 'createdAt', width: 22 },
  ];

  orderSheet.getRow(1).font = { bold: true };
  orderSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFEFD9B4' },
  };

  orders.forEach((o) => {
    const extrasStr = Array.isArray(o.selectedExtras) && o.selectedExtras.length > 0
      ? o.selectedExtras.map((e) => `${e.name}${e.portion ? ` (${e.portion})` : ''} × ${e.quantity || 1}`).join(', ')
      : '-';

    let discountInfo = '-';
    if (o.discountAmount > 0) {
      discountInfo = `-₹${o.discountAmount}${o.discountType === 'percentage' ? ` (${o.discountValue}%)` : ' (Flat)'}`;
    }

    orderSheet.addRow({
      orderType: o.orderType === 'quotation' ? 'Quotation' : 'Pre-Order',
      itemName: o.itemName,
      portionUnit: o.portionUnit || 'Packet',
      numberOfPackets: o.numberOfPackets,
      extraSideDishes: extrasStr,
      subtotalAmount: o.subtotalAmount ? `₹${o.subtotalAmount}` : (o.estimatedAmount ? `₹${o.estimatedAmount}` : '-'),
      discountInfo,
      finalAmount: o.finalAmount ? `₹${o.finalAmount}` : (o.estimatedAmount ? `₹${o.estimatedAmount}` : '-'),
      deliveryType: o.deliveryType || 'Delivery',
      customerName: o.customerName,
      mobileNumber: o.mobileNumber,
      address: o.address,
      foodRequirements: o.foodRequirements || '-',
      additionalNotes: o.additionalNotes || '-',
      status: o.status,
      createdAt: new Date(o.createdAt).toLocaleString(),
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

exportToExcel.exportToExcel = exportToExcel;
exportToExcel.exportCateringPrepExcel = exportCateringPrepExcel;

module.exports = exportToExcel;
