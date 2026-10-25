import type { Request, Response } from "express";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import * as service from "./reports.service.js";
import { auditQuerySchema, periodQuerySchema } from "./reports.schemas.js";

export const dashboard = async (_req: Request, res: Response) =>
  res.json({ ok: true, dashboard: await service.dashboard() });

export const sales = async (req: Request, res: Response) =>
  res.json({ ok: true, report: await service.salesReport(periodQuerySchema.parse(req.query)) });

export const inventory = async (_req: Request, res: Response) =>
  res.json({ ok: true, report: await service.inventoryReport() });

export const purchases = async (req: Request, res: Response) =>
  res.json({ ok: true, report: await service.purchasesReport(periodQuerySchema.parse(req.query)) });

export const cash = async (req: Request, res: Response) =>
  res.json({ ok: true, report: await service.cashReport(periodQuerySchema.parse(req.query)) });

export const controlled = async (req: Request, res: Response) =>
  res.json({ ok: true, report: await service.controlledReport(periodQuerySchema.parse(req.query)) });

export const audit = async (req: Request, res: Response) =>
  res.json({ ok: true, ...(await service.auditLogs(auditQuerySchema.parse(req.query))) });

export const salesExcel = async (req: Request, res: Response) => {
  const report = await service.salesReport(periodQuerySchema.parse(req.query));
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Ventas");

  sheet.columns = [
    { header: "Código", key: "code", width: 18 },
    { header: "Fecha", key: "date", width: 22 },
    { header: "Vendedor", key: "seller", width: 25 },
    { header: "Paciente/RUT", key: "patient", width: 25 },
    { header: "Descuento", key: "discount", width: 15 },
    { header: "Cobertura", key: "coverage", width: 15 },
    { header: "Total", key: "total", width: 15 },
  ];

  for (const sale of report.sales) {
    sheet.addRow({
      code: sale.code,
      date: sale.saleDate.toISOString(),
      seller: sale.seller.username,
      patient: sale.patient?.rut ?? sale.customerRut ?? "",
      discount: Number(sale.discountAmount),
      coverage: Number(sale.coverageAmount),
      total: Number(sale.totalAmount),
    });
  }

  sheet.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader("Content-Disposition", 'attachment; filename="reporte-ventas.xlsx"');
  res.end(Buffer.from(buffer));
};

export const inventoryExcel = async (_req: Request, res: Response) => {
  const report = await service.inventoryReport();
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Inventario");

  sheet.columns = [
    { header: "SKU", key: "sku", width: 18 },
    { header: "Producto", key: "name", width: 35 },
    { header: "Categoría", key: "category", width: 22 },
    { header: "Laboratorio", key: "laboratory", width: 22 },
    { header: "Stock", key: "stock", width: 12 },
    { header: "Mínimo", key: "minimum", width: 12 },
    { header: "Estado", key: "status", width: 15 },
  ];

  report.forEach((item) =>
    sheet.addRow({
      sku: item.sku,
      name: item.name,
      category: item.category,
      laboratory: item.laboratory ?? "",
      stock: item.stock,
      minimum: item.minimumStock,
      status: item.lowStock ? "STOCK BAJO" : "OK",
    }),
  );

  sheet.getRow(1).font = { bold: true };
  const buffer = await workbook.xlsx.writeBuffer();

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader("Content-Disposition", 'attachment; filename="reporte-inventario.xlsx"');
  res.end(Buffer.from(buffer));
};

export const salesPdf = async (req: Request, res: Response) => {
  const report = await service.salesReport(periodQuerySchema.parse(req.query));

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="reporte-ventas.pdf"');

  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(res);

  doc.fontSize(18).text("Reporte de Ventas - Farmacia");
  doc.moveDown();
  doc.fontSize(11).text(`Cantidad de ventas: ${report.summary.count}`);
  doc.text(`Total: $${Math.round(report.summary.total).toLocaleString("es-CL")}`);
  doc.text(`Descuentos: $${Math.round(report.summary.discounts).toLocaleString("es-CL")}`);
  doc.text(`Coberturas: $${Math.round(report.summary.coverages).toLocaleString("es-CL")}`);
  doc.moveDown();

  for (const sale of report.sales.slice(0, 200)) {
    doc
      .fontSize(9)
      .text(
        `${sale.code} | ${sale.saleDate.toISOString().slice(0, 10)} | ${sale.seller.username} | $${Math.round(Number(sale.totalAmount)).toLocaleString("es-CL")}`,
      );
  }

  doc.end();
};
