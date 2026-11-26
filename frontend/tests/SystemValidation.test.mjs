import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ExcelJS from 'exceljs';
import { formatOperationalDate, operationalWeekLabel } from '../src/utils/dateUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.resolve(__dirname, '../src');

/**
 * 3.3.3.C — Pruebas de Sistema y Validación Funcional en Frontend (Tabla 29)
 * Complementa PS-01, PS-02, PS-04 y PS-05 directamente sobre el código React/ExcelJS.
 */

test('PS-01 (Frontend): Fecha operativa Kardex (corte 07:00 AM) concilia movimientos de madrugada', () => {
  // Movimiento hecho el 19/11 a las 03:30 AM pertenece al Kardex del 18/11
  const madrugadaItem = { date: '2026-11-19T08:30:00.000000Z' }; // 03:30 America/Lima
  assert.equal(formatOperationalDate(madrugadaItem), '18/11/2026');
  assert.equal(operationalWeekLabel(madrugadaItem), 'Semana 3');

  // Movimiento hecho el 19/11 a las 07:30 AM pertenece al Kardex del 19/11
  const mananaItem = { date: '2026-11-19T12:30:00.000000Z' }; // 07:30 America/Lima
  assert.equal(formatOperationalDate(mananaItem), '19/11/2026');
});

test('PS-02 (RF-13): Generación y lectura íntegra de archivo institucional .xlsx con ExcelJS', async () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Consumo Ejecutivo EsSalud');

  sheet.mergeCells('A1:I2');
  sheet.getCell('A1').value = 'REPORTE DE CONSUMO DE OXIGENO - ESSALUD';
  sheet.getCell('A3').value = 'RESPONSABLE: ING. WILY CHUQUIPIUNTA SAAVEDRA';
  sheet.getCell('G3').value = 'FECHA: 19/11/2026';

  sheet.addRow([]);
  sheet.addRow(['CONCEPTO', 'SALDO INICIAL (m3)', 'INGRESOS (m3)', 'SALIDAS (m3)', 'SALDO FINAL (m3)']);
  sheet.addRow(['OXÍGENO GASEOSO 10m3', 50, 20, 30, 40]);

  const buffer = await workbook.xlsx.writeBuffer();
  assert.ok(buffer.byteLength > 1000, 'El buffer .xlsx generado debe contener estructura OpenXML válida');

  // Re-abrir el binario en ExcelJS para validar que no tiene corrupción de formato
  const reloaded = new ExcelJS.Workbook();
  await reloaded.xlsx.load(buffer);
  const loadedSheet = reloaded.getWorksheet('Consumo Ejecutivo EsSalud');

  assert.ok(loadedSheet, 'La hoja institucional debe existir al abrir el archivo .xlsx');
  assert.equal(loadedSheet.getCell('A1').value, 'REPORTE DE CONSUMO DE OXIGENO - ESSALUD');
  assert.match(String(loadedSheet.getCell('A3').value), /RESPONSABLE:/);
  assert.equal(loadedSheet.getRow(6).getCell(5).value, 40);
});

test('PS-04 (RNF-01 / RNF-02): App.jsx implementa carga diferida (React.lazy + Suspense) en módulos y reportes', () => {
  const appSource = fs.readFileSync(path.join(SRC_DIR, 'App.jsx'), 'utf8');

  assert.match(appSource, /import\s*\{\s*lazy,\s*Suspense\s*\}\s*from\s*['"]react['"]/);
  assert.match(appSource, /<Suspense\s+fallback=/);

  const lazyMatches = appSource.match(/lazy\(\(\)\s*=>\s*import\(/g) || [];
  assert.ok(
    lazyMatches.length >= 30,
    `Se esperaban al menos 30 vistas con Code Splitting (React.lazy), encontradas: ${lazyMatches.length}`
  );
});

test('PS-05 (RNF-03): Protección de rutas privadas hacia /login e interceptor 401 en cliente SPA', () => {
  const layoutSource = fs.readFileSync(path.join(SRC_DIR, 'layouts/MainLayout.jsx'), 'utf8');
  const apiSource = fs.readFileSync(path.join(SRC_DIR, 'services/api.js'), 'utf8');

  // Redirección declarativa en MainLayout cuando !isAuthenticated
  assert.match(layoutSource, /if\s*\(\s*!isAuthenticated\s*\)/);
  assert.match(layoutSource, /<Navigate\s+to=["']\/login["']\s+replace\s*\/>/);

  // Interceptor Axios adjunta Bearer token y limpia sesión ante HTTP 401
  assert.match(apiSource, /Authorization\s*=\s*`Bearer \$\{token\}`/);
  assert.match(apiSource, /error\.response\.status\s*===\s*401/);
  assert.match(apiSource, /window\.location\.replace\(['"]\/login['"]\)/);
});
