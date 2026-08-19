import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';

const applyBaseStyles = (worksheet, title, subtitle, dateRangeText) => {
    // 1. Título principal
    worksheet.mergeCells('A1:I2');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = title;
    titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF000000' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

    // 2. Subtítulos (Responsable y Fecha)
    worksheet.mergeCells('A3:C3');
    worksheet.getCell('A3').value = 'RESPONSABLE: WILY CHUQUIPIUNTA SAAVEDRA';
    
    worksheet.mergeCells('G3:I3');
    worksheet.getCell('G3').value = `FECHA: ${dateRangeText}`;

    const subRow = worksheet.getRow(3);
    subRow.font = { name: 'Arial', size: 10 };
    subRow.alignment = { vertical: 'middle', horizontal: 'center' };
    
    // Bordes rosa/púrpura arriba y abajo del subtítulo (simulando imagen)
    subRow.eachCell(cell => {
        cell.border = {
            top: { style: 'thin', color: { argb: 'FFD8B4E2' } },
            bottom: { style: 'thin', color: { argb: 'FFD8B4E2' } }
        };
    });

    worksheet.getRow(1).height = 30;
    worksheet.getRow(3).height = 20;
    worksheet.getRow(4).height = 10; // Espaciador
};

const applyHeaderStyles = (worksheet, startRow, colCount) => {
    const headerRow = worksheet.getRow(startRow);
    headerRow.height = 35;
    
    for(let i=1; i<=colCount; i++) {
        const cell = headerRow.getCell(i);
        cell.font = { name: 'Arial', size: 10, bold: true };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    }
};

const applyDataStyles = (worksheet, startRow, rowCount, colCount) => {
    for (let r = startRow; r < startRow + rowCount; r++) {
        const row = worksheet.getRow(r);
        // Banding manual para celdas grises (filas pares)
        const isEven = (r - startRow) % 2 === 1; 

        for(let c = 1; c <= colCount; c++) {
            const cell = row.getCell(c);
            cell.font = { name: 'Arial', size: 9 };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FFBFBFBF' } },
                left: { style: 'thin', color: { argb: 'FFBFBFBF' } },
                bottom: { style: 'thin', color: { argb: 'FFBFBFBF' } },
                right: { style: 'thin', color: { argb: 'FFBFBFBF' } }
            };
            if (isEven) {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFF2F2F2' }
                };
            }
        }
    }
};

// =========================================================
// REPORTES ESPECÍFICOS
// =========================================================

export const exportSupplierReport = async (data, dateRangeText) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Proveedor Externo');

    applyBaseStyles(worksheet, 'REPORTE DIARIO MENSUALIZADO DE RECEPCION DE CILINDROS DE OXIGENO POR PROVEEDOR EXTERNO', '', dateRangeText);

    worksheet.columns = [
        { header: 'FECHA', key: 'fecha', width: 12 },
        { header: 'SEMANA', key: 'semana', width: 12 },
        { header: 'ACCIÓN', key: 'accion', width: 12 },
        { header: 'CÓDIGO DE BALÓN', key: 'codigo', width: 18 },
        { header: 'MODELO', key: 'modelo', width: 15 },
        { header: 'CAPACIDAD M3', key: 'capacidad', width: 15 },
        { header: 'PROPIEDAD', key: 'propiedad', width: 18 },
        { header: 'PROVEEDOR', key: 'proveedor', width: 22 },
        { header: 'Nº DE GUÍA', key: 'guia', width: 15 },
        { header: 'PRODUCTO', key: 'producto', width: 20 },
    ];

    worksheet.getRow(5).values = worksheet.columns.map(c => c.header);
    applyHeaderStyles(worksheet, 5, 10);

    data.forEach(item => {
        worksheet.addRow({
            fecha: item.date ? format(new Date(item.date), 'dd/MM/yyyy') : '',
            semana: `Semana ${Math.ceil(new Date(item.date || new Date()).getDate() / 7)}`,
            accion: item.action,
            codigo: item.cylinder?.serial_number,
            modelo: item.cylinder?.ownership_type || 'PRAXAIR',
            capacidad: item.cylinder?.capacity,
            propiedad: item.cylinder?.ownership_type,
            proveedor: item.location?.name,
            guia: item.reference_document,
            producto: 'OXIGENO MEDICINAL',
        });
    });

    applyDataStyles(worksheet, 6, data.length, 10);
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Reporte_Proveedor_${dateRangeText.replace(/\//g, '-')}.xlsx`);
};

export const exportLocationReport = async (data, dateRangeText) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Ubicación HNAGV');

    applyBaseStyles(worksheet, 'REPORTE DIARIO DE LA UBICACIÓN DE CILINDROS EN EL HNAGV', '', dateRangeText);

    worksheet.columns = [
        { header: 'FECHA', key: 'fecha', width: 12 },
        { header: 'SEMANA', key: 'semana', width: 12 },
        { header: 'SERVICIO', key: 'servicio', width: 18 },
        { header: 'UBICACIÓN', key: 'ubicacion', width: 18 },
        { header: 'B. LLENO CODIGO', key: 'lleno_codigo', width: 15 },
        { header: 'MODELO', key: 'modelo1', width: 15 },
        { header: 'PROPIEDAD', key: 'propiedad', width: 18 },
        { header: 'CAPACIDAD', key: 'capacidad', width: 12 },
        { header: 'B. VACIO', key: 'vacio_codigo', width: 15 },
        { header: 'MODELO 2', key: 'modelo2', width: 15 },
    ];

    worksheet.getRow(5).values = worksheet.columns.map(c => c.header);
    applyHeaderStyles(worksheet, 5, 10);

    data.forEach(item => {
        const isFull = item.cylinder_status === 'full';
        worksheet.addRow({
            fecha: item.date ? format(new Date(item.date), 'dd/MM/yyyy') : '',
            semana: `Semana ${Math.ceil(new Date(item.date || new Date()).getDate() / 7)}`,
            servicio: item.location?.name,
            ubicacion: item.location?.detail || item.location?.name,
            lleno_codigo: isFull ? item.cylinder?.serial_number : '',
            modelo1: isFull ? item.cylinder?.ownership_type : '',
            propiedad: item.cylinder?.ownership_type,
            capacidad: item.cylinder?.capacity,
            vacio_codigo: !isFull ? item.cylinder?.serial_number : '',
            modelo2: !isFull ? item.cylinder?.ownership_type : '',
        });
    });

    applyDataStyles(worksheet, 6, data.length, 10);
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Reporte_Ubicacion_${dateRangeText.replace(/\//g, '-')}.xlsx`);
};

export const exportPadomiPatientReport = async (data, dateRangeText) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Pacientes');

    applyBaseStyles(worksheet, 'REPORTE DIARIO MENSUAL DE ASIGNACIONES PACIENTES PADOMI', '', dateRangeText);

    worksheet.columns = [
        { header: 'FECHA', key: 'fecha', width: 12 },
        { header: 'SEMANA', key: 'semana', width: 12 },
        { header: 'CODIGO PACIENTE', key: 'cod_paciente', width: 15 },
        { header: 'DNI', key: 'dni', width: 12 },
        { header: 'SERVICIO /USUARIO', key: 'usuario', width: 30 },
        { header: 'DIRECCION', key: 'direccion', width: 35 },
        { header: 'CODIGO LLENO', key: 'lleno', width: 15 },
        { header: 'MODELO', key: 'modelo', width: 15 },
        { header: 'CAP.', key: 'capacidad', width: 10 },
        { header: 'PROPIEDAD', key: 'propiedad', width: 15 },
        { header: 'CODIGO VACIO', key: 'vacio', width: 15 },
    ];

    worksheet.getRow(5).values = worksheet.columns.map(c => c.header);
    applyHeaderStyles(worksheet, 5, 11);

    data.forEach(item => {
        worksheet.addRow({
            fecha: item.date ? format(new Date(item.date), 'dd/MM/yyyy') : '',
            semana: `Semana ${Math.ceil(new Date(item.date || new Date()).getDate() / 7)}`,
            cod_paciente: item.location?.detail?.replace('DNI: ', ''),
            dni: item.location?.detail?.replace('DNI: ', ''),
            usuario: item.location?.name,
            direccion: '', // No disponible en movimientos, requeriría inner join
            lleno: item.action === 'Salida' ? item.cylinder?.serial_number : '',
            modelo: item.cylinder?.ownership_type,
            capacidad: item.cylinder?.capacity,
            propiedad: item.cylinder?.ownership_type,
            vacio: item.action === 'Ingreso' ? item.cylinder?.serial_number : '',
        });
    });

    applyDataStyles(worksheet, 6, data.length, 11);
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Reporte_Pacientes_${dateRangeText.replace(/\//g, '-')}.xlsx`);
};

export const exportIpressReport = async (data, dateRangeText) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Centro Asistencial');

    applyBaseStyles(worksheet, 'REPORTE DIARIO MENSUALIZADO DE LLENADO DE CILINDROS POR CENTRO ASISTENCIAL', '', dateRangeText);

    worksheet.columns = [
        { header: 'Nº', key: 'nro', width: 5 },
        { header: 'FECHA', key: 'fecha', width: 12 },
        { header: 'IPRESS', key: 'ipress', width: 25 },
        { header: 'UBICACIÓN', key: 'ubicacion', width: 25 },
        { header: 'B. LLENO CODIGO', key: 'codigo', width: 18 },
        { header: 'MODELO', key: 'modelo', width: 15 },
        { header: 'CAP.', key: 'cap', width: 10 },
        { header: 'PROPIEDAD', key: 'propiedad', width: 18 },
        { header: 'MODALIDAD', key: 'modalidad', width: 15 },
    ];

    worksheet.getRow(5).values = worksheet.columns.map(c => c.header);
    applyHeaderStyles(worksheet, 5, 9);

    data.forEach((item, index) => {
        worksheet.addRow({
            nro: index + 1,
            fecha: item.date ? format(new Date(item.date), 'dd/MM/yyyy') : '',
            ipress: item.location?.name,
            ubicacion: item.location?.name,
            codigo: item.cylinder?.serial_number,
            modelo: item.cylinder?.ownership_type,
            cap: item.cylinder?.capacity,
            propiedad: item.cylinder?.ownership_type,
            modalidad: item.type || 'INTERCAMBIO',
        });
    });

    applyDataStyles(worksheet, 6, data.length, 9);
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Reporte_IPRESS_${dateRangeText.replace(/\//g, '-')}.xlsx`);
};

export const exportTrasiegosReport = async (data, dateRangeText) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Trasiegos');

    applyBaseStyles(worksheet, 'REPORTE DIARIO MENSUAL DE LLENADO DE CILINDROS POR PACIENTE PADOMI Y SERVICIOS', '', dateRangeText);

    worksheet.columns = [
        { header: 'N', key: 'nro', width: 5 },
        { header: 'DESTINO', key: 'destino', width: 15 },
        { header: 'FECHA1', key: 'fecha', width: 12 },
        { header: 'SEMANA', key: 'semana', width: 12 },
        { header: 'COD. PACIENTE', key: 'cod_paciente', width: 15 },
        { header: 'CODIGO DE CILINDRO', key: 'codigo_cil', width: 20 },
        { header: 'SERVICIO /USUARIO', key: 'usuario', width: 30 },
        { header: 'CAPACIDAD DEL CILINDRO', key: 'capacidad', width: 22 },
        { header: 'CANTIDAD', key: 'cantidad', width: 10 },
        { header: 'TOTAL TRASIEGO', key: 'total', width: 15 },
    ];

    worksheet.getRow(5).values = worksheet.columns.map(c => c.header);
    applyHeaderStyles(worksheet, 5, 10);

    data.forEach((item, index) => {
        // En los trasiegos de ReportController el type es "Trasiego (Decantación)"
        // location.type dice si es Paciente o Servicio
        let destino = item.location?.type?.includes('Paciente') ? 'Paciente' : 'Hospitalizacion';
        
        worksheet.addRow({
            nro: index + 1,
            destino: destino,
            fecha: item.date ? format(new Date(item.date), 'dd/MM/yyyy') : '',
            semana: `Semana ${Math.ceil(new Date(item.date || new Date()).getDate() / 7)}`,
            cod_paciente: item.location?.detail?.replace('DNI: ', ''),
            codigo_cil: item.cylinder?.serial_number,
            usuario: item.location?.name,
            capacidad: item.cylinder?.capacity,
            cantidad: 1,
            total: item.notes?.match(/[\d.]+/) ? item.notes.match(/[\d.]+/)[0] : 0,
        });
    });

    applyDataStyles(worksheet, 6, data.length, 10);
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Reporte_Trasiegos_${dateRangeText.replace(/\//g, '-')}.xlsx`);
};
