import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { formatOperationalDate, operationalWeekLabel, getOperationalDate } from './dateUtils';

// Ordena por fecha operativa (Kardex) descendente y luego por hora real descendente
const compareByOperationalDateDesc = (a, b) => {
    const opA = getOperationalDate(a) || '';
    const opB = getOperationalDate(b) || '';
    if (opA !== opB) return opB.localeCompare(opA);
    return new Date(b?.date || 0) - new Date(a?.date || 0);
};

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
            fecha: formatOperationalDate(item),
            semana: operationalWeekLabel(item),
            accion: item.action,
            codigo: item.cylinder?.serial_number,
            modelo: item.cylinder?.ownership_type || 'PRAXAIR',
            capacidad: item.cylinder?.capacity,
            propiedad: item.cylinder?.supplier || item.location?.name,
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

    const filteredData = data.filter(item => {
        const isService = item.location && (item.location.type === 'Servicio (Hospital)' || item.location.type?.includes('Servicio'));
        const isNotPeriphery = item.type !== 'Canje de Red (Periferia)' && item.location?.type !== 'Centro Asistencial (Periferia)' && item.location?.detail !== 'PERIFERIE / CENTRO MÉDICO';
        const isNotTrasiego = item.type !== 'Trasiego (Decantación)' && !item.location?.type?.includes('Trasiego') && item.location?.detail !== 'Trasiego Recarga';
        const isNotSupplier = item.type !== 'Ingreso Proveedor' && item.type !== 'Salida Proveedor' && item.location?.type !== 'Proveedor';
        const isNotPatient = item.location?.type !== 'Paciente' && item.type !== 'Intercambio PADOMI' && item.type !== 'Devolución Paciente';
        return isService && isNotPeriphery && isNotTrasiego && isNotSupplier && isNotPatient;
    });

    const groupedData = [];
    const movementMap = new Map();

    filteredData.forEach(item => {
        if (item.movement_id) {
            if (!movementMap.has(item.movement_id)) {
                movementMap.set(item.movement_id, {
                    baseItem: item,
                    salida: item.action === 'Salida' ? item : null,
                    ingreso: item.action === 'Ingreso' ? item : null,
                });
            } else {
                const group = movementMap.get(item.movement_id);
                if (item.action === 'Salida') group.salida = item;
                if (item.action === 'Ingreso') group.ingreso = item;
            }
        } else {
            groupedData.push({
                baseItem: item,
                salida: item.action === 'Salida' ? item : null,
                ingreso: item.action === 'Ingreso' ? item : null,
            });
        }
    });

    movementMap.forEach(group => {
        groupedData.push(group);
    });

    groupedData.sort((a, b) => compareByOperationalDateDesc(a.baseItem, b.baseItem));

    groupedData.forEach(group => {
        const base = group.baseItem;
        const salida = group.salida;
        const ingreso = group.ingreso;
        
        const mainCylinder = (salida && salida.cylinder) ? salida.cylinder : (ingreso ? ingreso.cylinder : base.cylinder);

        const lleno = salida ? salida.cylinder?.serial_number : (base.cylinder_status === 'full' ? base.cylinder?.serial_number : '');
        const modelo1 = salida ? salida.cylinder?.ownership_type : (base.cylinder_status === 'full' ? base.cylinder?.ownership_type : '');
        
        const vacio = ingreso ? ingreso.cylinder?.serial_number : (base.cylinder_status === 'empty' ? base.cylinder?.serial_number : '');
        const modelo2 = ingreso ? ingreso.cylinder?.ownership_type : (base.cylinder_status === 'empty' ? base.cylinder?.ownership_type : '');

        worksheet.addRow({
            fecha: formatOperationalDate(base),
            semana: operationalWeekLabel(base),
            servicio: base.location?.name,
            ubicacion: base.location?.detail || base.location?.name,
            lleno_codigo: lleno,
            modelo1: modelo1 || mainCylinder?.ownership_type,
            propiedad: mainCylinder?.supplier,
            capacidad: mainCylinder?.capacity,
            vacio_codigo: vacio,
            modelo2: modelo2 || (vacio ? mainCylinder?.ownership_type : ''),
        });
    });

    applyDataStyles(worksheet, 6, data.length, 10);
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Reporte_Ubicacion_${dateRangeText.replace(/\//g, '-')}.xlsx`);
};

export const exportPadomiExchangeReport = async (data, dateRangeText) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Intercambios PADOMI');

    applyBaseStyles(worksheet, 'REPORTE DE INTERCAMBIOS DE OXÍGENO - PACIENTES PADOMI', '', dateRangeText);

    worksheet.columns = [
        // BALON LLENO
        { header: 'FECHA MOV.', key: 'fecha', width: 15 },
        { header: 'CÓDIGO LLENO (LLEVÓ)', key: 'lleno_codigo', width: 22 },
        { header: 'CAPACIDAD', key: 'capacidad', width: 12 },
        { header: 'PROPIEDAD', key: 'propiedad', width: 15 },
        { header: 'MODELO', key: 'modelo', width: 15 },
        // PACIENTE Y RECETA
        { header: 'DNI', key: 'dni', width: 15 },
        { header: 'PACIENTE', key: 'paciente', width: 35 },
        { header: 'DIRECCIÓN', key: 'direccion', width: 40 },
        { header: 'TELÉFONO', key: 'telefono', width: 15 },
        { header: 'DIAGNÓSTICO', key: 'diagnostico', width: 25 },
        { header: 'MÉDICO TRATANTE', key: 'medico', width: 25 },
        { header: 'FLUJO (L/min)', key: 'flujo', width: 15 },
        { header: 'HORAS/DÍA', key: 'horas', width: 15 },
        { header: 'VENCIMIENTO RECETA', key: 'vencimiento', width: 20 },
        // BALON VACIO
        { header: 'CÓDIGO VACÍO (DEVOLVIÓ)', key: 'vacio_codigo', width: 25 },
    ];

    worksheet.getRow(5).values = worksheet.columns.map(c => c.header);
    applyHeaderStyles(worksheet, 5, 15);

    // Pintar los headers para separar secciones
    const headerRow = worksheet.getRow(5);
    // Balon lleno (1 al 5)
    for(let i=1; i<=5; i++) {
        headerRow.getCell(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAD3' } }; // verde claro
    }
    // Paciente y receta (6 al 14)
    for(let i=6; i<=14; i++) {
        headerRow.getCell(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC9DAF8' } }; // azul claro
    }
    // Balon vacio (15)
    headerRow.getCell(15).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4CCCC' } }; // rojo claro

    data.forEach(mov => {
        let lleno = null;
        let vacio = null;

        if (mov.cylinder_movements) {
            mov.cylinder_movements.forEach(cm => {
                if (cm.action === 'Exit') lleno = cm.cylinder;
                if (cm.action === 'Entry') vacio = cm.cylinder;
            });
        }

        const p = mov.patient || {};
        const rx = mov.prescription || {};

        worksheet.addRow({
            fecha: formatOperationalDate(mov, 'movement_at'),
            
            lleno_codigo: lleno?.serial_number || '-',
            capacidad: lleno?.capacity || '-',
            propiedad: lleno?.supplier?.name || '-',
            modelo: lleno?.ownership_type?.name || '-',

            dni: p.dni || '-',
            paciente: p.full_name || '-',
            direccion: p.address || '-',
            telefono: p.phone_number || '-',

            diagnostico: rx.diagnosis || '-',
            medico: rx.prescribing_doctor || '-',
            flujo: rx.flow_rate || '-',
            horas: rx.hours_per_day || '-',
            vencimiento: rx.expires_at ? format(new Date(rx.expires_at), 'dd/MM/yyyy') : '-',

            vacio_codigo: vacio?.serial_number || '-'
        });
    });

    applyDataStyles(worksheet, 6, data.length, 15);
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Intercambios_PADOMI_${dateRangeText.replace(/\//g, '-')}.xlsx`);
};

export const exportPadomiPatientReport = async (data, dateRangeText, filterMode = 'ALL') => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Pacientes');

    let reportTitle = 'REPORTE DIARIO MENSUAL DE PACIENTES PADOMI - INTERCAMBIO Y TRASIEGO';
    let filePrefix = 'Reporte_Pacientes_Integral';
    if (filterMode === 'EXCHANGE') {
        reportTitle = 'REPORTE DIARIO MENSUAL DE ASIGNACIONES PACIENTES PADOMI (CÓDIGO INTERCAMBIO)';
        filePrefix = 'Reporte_Pacientes_Intercambio';
    } else if (filterMode === 'TRASIEGO') {
        reportTitle = 'REPORTE DIARIO MENSUAL DE TRASIEGOS PACIENTES PADOMI (CÓDIGO TRASIEGO)';
        filePrefix = 'Reporte_Pacientes_Trasiego';
    }

    applyBaseStyles(worksheet, reportTitle, '', dateRangeText);

    let columns = [];
    if (filterMode === 'EXCHANGE') {
        columns = [
            { header: 'FECHA', key: 'fecha', width: 12 },
            { header: 'SEMANA', key: 'semana', width: 12 },
            { header: 'CODIGO INTERCAMBIO', key: 'cod_intercambio', width: 18 },
            { header: 'DNI', key: 'dni', width: 12 },
            { header: 'PACIENTE / USUARIO', key: 'usuario', width: 32 },
            { header: 'DIRECCION', key: 'direccion', width: 35 },
            { header: 'CODIGO LLENO', key: 'lleno', width: 16 },
            { header: 'MODELO', key: 'modelo', width: 15 },
            { header: 'CAP.', key: 'capacidad', width: 10 },
            { header: 'PROPIEDAD', key: 'propiedad', width: 16 },
            { header: 'CODIGO VACIO', key: 'vacio', width: 16 },
        ];
    } else if (filterMode === 'TRASIEGO') {
        columns = [
            { header: 'FECHA', key: 'fecha', width: 12 },
            { header: 'SEMANA', key: 'semana', width: 12 },
            { header: 'CODIGO TRASIEGO', key: 'cod_trasiego', width: 18 },
            { header: 'DNI', key: 'dni', width: 12 },
            { header: 'PACIENTE / USUARIO', key: 'usuario', width: 32 },
            { header: 'DIRECCION', key: 'direccion', width: 35 },
            { header: 'CODIGO CILINDRO', key: 'lleno', width: 18 },
            { header: 'MODELO', key: 'modelo', width: 15 },
            { header: 'CAP.', key: 'capacidad', width: 10 },
            { header: 'PROPIEDAD', key: 'propiedad', width: 16 },
            { header: 'CANTIDAD RECARGADA', key: 'cantidad', width: 18 },
            { header: 'DETALLE / NOTAS', key: 'detalle', width: 25 },
        ];
    } else {
        // AMBOS
        columns = [
            { header: 'FECHA', key: 'fecha', width: 12 },
            { header: 'SEMANA', key: 'semana', width: 12 },
            { header: 'MODALIDAD', key: 'modalidad', width: 15 },
            { header: 'COD. INTERCAMBIO', key: 'cod_intercambio', width: 16 },
            { header: 'COD. TRASIEGO', key: 'cod_trasiego', width: 16 },
            { header: 'DNI', key: 'dni', width: 12 },
            { header: 'PACIENTE / USUARIO', key: 'usuario', width: 32 },
            { header: 'DIRECCION', key: 'direccion', width: 35 },
            { header: 'CODIGO LLENO / CILINDRO', key: 'lleno', width: 20 },
            { header: 'MODELO', key: 'modelo', width: 15 },
            { header: 'CAP.', key: 'capacidad', width: 10 },
            { header: 'PROPIEDAD', key: 'propiedad', width: 16 },
            { header: 'CODIGO VACIO', key: 'vacio', width: 16 },
            { header: 'DETALLE / OBSERVACIÓN', key: 'detalle', width: 25 },
        ];
    }

    worksheet.columns = columns;
    worksheet.getRow(5).values = worksheet.columns.map(c => c.header);
    applyHeaderStyles(worksheet, 5, columns.length);

    // Agrupar movimientos por movement_id para unificar Intercambios (Salida y Entrada)
    const groupedData = [];
    const movementMap = new Map();

    data.forEach(item => {
        if (item.movement_id) {
            if (!movementMap.has(item.movement_id)) {
                movementMap.set(item.movement_id, {
                    baseItem: item,
                    salida: item.action === 'Salida' ? item : null,
                    ingreso: item.action === 'Ingreso' ? item : null,
                });
            } else {
                const group = movementMap.get(item.movement_id);
                if (item.action === 'Salida') group.salida = item;
                if (item.action === 'Ingreso') group.ingreso = item;
            }
        } else {
            // Para trasiegos o elementos sin movement_id
            groupedData.push({
                baseItem: item,
                salida: item.action === 'Salida' ? item : null,
                ingreso: item.action === 'Ingreso' ? item : null,
            });
        }
    });

    movementMap.forEach(group => {
        groupedData.push(group);
    });

    // Ordenar cronológicamente descendente
    groupedData.sort((a, b) => compareByOperationalDateDesc(a.baseItem, b.baseItem));

    groupedData.forEach(group => {
        const base = group.baseItem;
        const salida = group.salida;
        const ingreso = group.ingreso;
        
        const isTrasiego = base.type === 'Trasiego (Decantación)' || base.location?.type?.includes('Trasiego');
        const mainCylinder = (salida && salida.cylinder) ? salida.cylinder : (ingreso ? ingreso.cylinder : base.cylinder);

        const codIntercambio = base.location?.exchange_code || (isTrasiego ? '-' : (base.location?.patient_code || '-'));
        const codTrasiego = base.location?.trasiego_code || (isTrasiego ? (base.location?.patient_code || '-') : '-');
        const dniClean = base.location?.detail?.replace('DNI: ', '') || '-';
        const usuarioNombre = base.location?.name || '-';
        const direccion = base.location?.patient_address || '';

        if (filterMode === 'EXCHANGE') {
            worksheet.addRow({
                fecha: formatOperationalDate(base),
                semana: operationalWeekLabel(base),
                cod_intercambio: codIntercambio !== '-' ? codIntercambio : (base.location?.patient_code || '-'),
                dni: dniClean,
                usuario: usuarioNombre,
                direccion: direccion,
                lleno: salida ? salida.cylinder?.serial_number : (base.cylinder?.serial_number || ''),
                modelo: mainCylinder?.ownership_type || '-',
                capacidad: mainCylinder?.capacity || '-',
                propiedad: mainCylinder?.supplier || '-',
                vacio: ingreso ? ingreso.cylinder?.serial_number : '',
            });
        } else if (filterMode === 'TRASIEGO') {
            worksheet.addRow({
                fecha: formatOperationalDate(base),
                semana: operationalWeekLabel(base),
                cod_trasiego: codTrasiego !== '-' ? codTrasiego : (base.location?.patient_code || '-'),
                dni: dniClean,
                usuario: usuarioNombre,
                direccion: direccion,
                lleno: base.cylinder?.serial_number || (salida ? salida.cylinder?.serial_number : '-'),
                modelo: mainCylinder?.ownership_type || '-',
                capacidad: mainCylinder?.capacity || '-',
                propiedad: mainCylinder?.supplier || '-',
                cantidad: base.notes || base.location?.detail || 'Recarga',
                detalle: base.user ? `Operador: ${base.user}` : 'Estación de Trasiego',
            });
        } else {
            // AMBOS
            worksheet.addRow({
                fecha: formatOperationalDate(base),
                semana: operationalWeekLabel(base),
                modalidad: isTrasiego ? 'TRASIEGO' : 'INTERCAMBIO',
                cod_intercambio: codIntercambio,
                cod_trasiego: codTrasiego,
                dni: dniClean,
                usuario: usuarioNombre,
                direccion: direccion,
                lleno: salida ? salida.cylinder?.serial_number : (base.cylinder?.serial_number || ''),
                modelo: mainCylinder?.ownership_type || '-',
                capacidad: mainCylinder?.capacity || '-',
                propiedad: mainCylinder?.supplier || '-',
                vacio: ingreso ? ingreso.cylinder?.serial_number : '',
                detalle: isTrasiego ? (base.notes || 'Recarga Trasiego') : (base.type || 'Intercambio PADOMI'),
            });
        }
    });

    applyDataStyles(worksheet, 6, groupedData.length, columns.length);
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `${filePrefix}_${dateRangeText.replace(/\//g, '-')}.xlsx`);
};

export const exportPatientsCatalogReport = async (patientsData, filterCodeType = 'ALL') => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Directorio Pacientes');

    let titleSuffix = 'GENERAL';
    if (filterCodeType === 'EXCHANGE') titleSuffix = 'CON CÓDIGO DE INTERCAMBIO (CANJE)';
    else if (filterCodeType === 'TRASIEGO') titleSuffix = 'CON CÓDIGO DE TRASIEGO';

    applyBaseStyles(worksheet, `PADRÓN DE PACIENTES PADOMI - ${titleSuffix}`, '', format(new Date(), 'dd/MM/yyyy'));

    worksheet.columns = [
        { header: 'Nº', key: 'nro', width: 6 },
        { header: 'DNI', key: 'dni', width: 12 },
        { header: 'PACIENTE (APELLIDOS Y NOMBRES)', key: 'nombre', width: 36 },
        { header: 'CÓD. INTERCAMBIO', key: 'cod_intercambio', width: 18 },
        { header: 'CÓD. TRASIEGO', key: 'cod_trasiego', width: 18 },
        { header: 'TELÉFONO 1', key: 'tel1', width: 14 },
        { header: 'TELÉFONO 2', key: 'tel2', width: 14 },
        { header: 'DIRECCIÓN', key: 'direccion', width: 36 },
        { header: 'RECETA (DOSIS / TIEMPO)', key: 'receta_dosis', width: 22 },
        { header: 'VENCIMIENTO RECETA', key: 'vencimiento', width: 16 },
        { header: 'DÍAS RESTANTES', key: 'dias_restantes', width: 15 },
        { header: 'ESTADO RECETA', key: 'estado_receta', width: 14 },
    ];

    worksheet.getRow(5).values = worksheet.columns.map(c => c.header);
    applyHeaderStyles(worksheet, 5, 12);

    patientsData.forEach((p, idx) => {
        const activeRx = p.prescriptions?.find(rx => rx.status === 'active');
        let dosisText = '-';
        if (activeRx) {
            if (activeRx.dosage && activeRx.usage_time) dosisText = `${activeRx.dosage} L/min · ${activeRx.usage_time} hrs`;
            else if (activeRx.dosage) dosisText = `${activeRx.dosage} L/min`;
            else if (activeRx.usage_time) dosisText = `${activeRx.usage_time} hrs`;
            else dosisText = 'Receta Activa';
        }

        let diasText = '-';
        if (activeRx && activeRx.days_remaining !== undefined && activeRx.days_remaining !== null) {
            diasText = activeRx.days_remaining < 0 
                ? `Vencida (${Math.abs(activeRx.days_remaining)}d)` 
                : `${activeRx.days_remaining} días`;
        }

        worksheet.addRow({
            nro: idx + 1,
            dni: p.dni || '-',
            nombre: p.full_name,
            cod_intercambio: p.exchange_code || '-',
            cod_trasiego: p.trasiego_code || '-',
            tel1: p.phone1 || '-',
            tel2: p.phone2 || '-',
            direccion: p.address || '-',
            receta_dosis: dosisText,
            vencimiento: activeRx?.expires_at ? format(new Date(activeRx.expires_at), 'dd/MM/yyyy') : (activeRx ? 'Sin fecha' : '-'),
            dias_restantes: diasText,
            estado_receta: activeRx ? (activeRx.status === 'active' ? 'ACTIVA' : 'INACTIVA') : 'SIN RECETA',
        });
    });

    applyDataStyles(worksheet, 6, patientsData.length, 12);
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Padron_Pacientes_${filterCodeType}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
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
        { header: 'ACCIÓN', key: 'accion', width: 12 },
        { header: 'CÓDIGO DE BALÓN', key: 'codigo', width: 18 },
        { header: 'MODELO', key: 'modelo', width: 15 },
        { header: 'CAP.', key: 'cap', width: 10 },
        { header: 'PROPIEDAD', key: 'propiedad', width: 18 },
        { header: 'MODALIDAD', key: 'modalidad', width: 15 },
    ];

    worksheet.getRow(5).values = worksheet.columns.map(c => c.header);
    applyHeaderStyles(worksheet, 5, 10);

    data.forEach((item, index) => {
        worksheet.addRow({
            nro: index + 1,
            fecha: formatOperationalDate(item),
            ipress: item.location?.name,
            ubicacion: item.action === 'Ingreso' ? 'CENTRAL' : item.location?.name,
            accion: item.action,
            codigo: item.cylinder?.serial_number,
            modelo: item.cylinder?.ownership_type,
            cap: item.cylinder?.capacity,
            propiedad: item.cylinder?.supplier,
            modalidad: item.type || 'INTERCAMBIO',
        });
    });

    applyDataStyles(worksheet, 6, data.length, 10);
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
            fecha: formatOperationalDate(item),
            semana: operationalWeekLabel(item),
            cod_paciente: item.location?.service_abbreviation || item.location?.patient_code || item.location?.detail?.replace('DNI: ', ''),
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

export const exportExecutiveConsumptionReport = async (reportData, dateText) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Consumo Ejecutivo');

    // 1. Header
    worksheet.mergeCells('A1:I2');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'REPORTE DE CONSUMO DE OXIGENO';
    titleCell.font = { name: 'Arial', size: 16, bold: true };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.mergeCells('A3:C3');
    worksheet.getCell('A3').value = 'Gestión Logística';
    worksheet.getCell('A3').font = { size: 9, bold: true };
    
    worksheet.mergeCells('G3:I3');
    worksheet.getCell('G3').value = `FECHA: ${dateText}`;
    worksheet.getCell('G3').font = { size: 10, bold: true };
    worksheet.getCell('G3').alignment = { horizontal: 'right' };

    worksheet.getRow(4).height = 10;

    // Col width setup
    worksheet.getColumn('A').width = 25;
    worksheet.getColumn('B').width = 12;
    worksheet.getColumn('C').width = 12;
    worksheet.getColumn('D').width = 12;
    worksheet.getColumn('E').width = 3; // Separator
    worksheet.getColumn('F').width = 25;
    worksheet.getColumn('G').width = 15;
    worksheet.getColumn('H').width = 15;
    worksheet.getColumn('I').width = 18;

    const mainHeaderColor = 'FFB33979'; // Magenta
    const yellowHighlight = 'FFFEF08A';
    
    const createMainTitle = (range, text) => {
        worksheet.mergeCells(range);
        const cell = worksheet.getCell(range.split(':')[0]);
        cell.value = text;
        cell.font = { name: 'Arial', size: 12, bold: true };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = { top: {style:'thick'}, left: {style:'thick'}, bottom: {style:'thick'}, right: {style:'thick'} };
    };

    const createSectionHeader = (range, text, bgCol = mainHeaderColor, txtCol = 'FFFFFFFF') => {
        worksheet.mergeCells(range);
        const cell = worksheet.getCell(range.split(':')[0]);
        cell.value = text;
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: txtCol } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgCol } };
    };

    const applyGrid = (startCol, startRow, endCol, endRow, withBoldHeader = true) => {
        for (let r = startRow; r <= endRow; r++) {
            const row = worksheet.getRow(r);
            for (let c = startCol; c <= endCol; c++) {
                const cell = row.getCell(c);
                cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                if (withBoldHeader && r === startRow) {
                    cell.font = { bold: true };
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } }; // Light gray header
                }
            }
        }
    };

    // Main Titles
    createMainTitle('A5:D5', 'OXIGENO GASEOSO');
    createMainTitle('F5:I5', 'OXIGENO LIQUIDO');
    worksheet.getRow(6).height = 5;

    // --- GASEOSO -> SALDO INICIAL ---
    createSectionHeader('A7:D7', 'SALDO INICIAL');
    worksheet.getRow(8).values = ['CAPACIDAD', '10 M3', '8 M3', '6 M3'];
    worksheet.getRow(9).values = ['TOTAL UND', reportData.gaseoso.saldo_inicial['10'], reportData.gaseoso.saldo_inicial['8'], reportData.gaseoso.saldo_inicial['6']];
    worksheet.getRow(10).getCell('A').value = 'TOTAL M3';
    worksheet.mergeCells('B10:D10');
    worksheet.getCell('B10').value = reportData.gaseoso.saldo_inicial.total_m3;
    
    // --- LIQUIDO -> SALDO INICIAL ---
    createSectionHeader('F7:I7', 'SALDO INICIAL');
    worksheet.getRow(8).getCell('F').value = 'LECTURA ANTERIOR';
    worksheet.getRow(8).getCell('G').value = 'LECTURA ACTUAL';
    worksheet.mergeCells('H8:I8');
    worksheet.getCell('H8').value = 'SALDO INICIAL M3';
    worksheet.getRow(9).getCell('F').value = reportData.liquido.saldo_inicial.lectura_anterior;
    worksheet.getRow(9).getCell('G').value = reportData.liquido.saldo_inicial.lectura_actual;
    worksheet.getRow(9).getCell('G').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: yellowHighlight } };
    worksheet.mergeCells('H9:I9');
    worksheet.getCell('H9').value = reportData.liquido.saldo_inicial.saldo_inicial_m3;

    applyGrid(1, 8, 4, 10);
    applyGrid(6, 8, 9, 9);
    
    // --- GASEOSO -> CONSUMO ---
    let rowG = 12;
    createSectionHeader(`A${rowG}:D${rowG}`, 'CONSUMO DE OXIGENO GASEOSO');
    rowG++;
    worksheet.getRow(rowG).values = ['CAPACIDAD', '10 M3', '8 M3', '6 M3'];
    rowG++;
    worksheet.getRow(rowG).values = ['PADOMI', reportData.gaseoso.consumo.padomi['10'], reportData.gaseoso.consumo.padomi['8'], reportData.gaseoso.consumo.padomi['6']];
    rowG++;
    worksheet.getRow(rowG).values = ['HNAGV', reportData.gaseoso.consumo.hnagv['10'], reportData.gaseoso.consumo.hnagv['8'], reportData.gaseoso.consumo.hnagv['6']];
    rowG++;
    worksheet.getRow(rowG).values = ['CCAA PERIFERIC', reportData.gaseoso.consumo.perifericos['10'], reportData.gaseoso.consumo.perifericos['8'], reportData.gaseoso.consumo.perifericos['6']];
    rowG++;
    worksheet.getRow(rowG).values = ['TOTAL UND', reportData.gaseoso.consumo.total_und['10'], reportData.gaseoso.consumo.total_und['8'], reportData.gaseoso.consumo.total_und['6']];
    rowG++;
    worksheet.getRow(rowG).getCell('A').value = 'TOTAL M3';
    worksheet.mergeCells(`B${rowG}:D${rowG}`);
    worksheet.getCell(`B${rowG}`).value = reportData.gaseoso.consumo.total_m3;
    
    applyGrid(1, rowG-5, 4, rowG);

    // --- LIQUIDO -> CONSUMO ---
    let rowL = 12;
    createSectionHeader(`F${rowL}:I${rowL}`, 'CONSUMO DE OXIGENO LIQUIDO');
    rowL++;
    worksheet.getRow(rowL).getCell('F').value = 'LECTURA ANTERIOR';
    worksheet.getRow(rowL).getCell('G').value = 'LECTURA ACTUAL';
    worksheet.getRow(rowL).getCell('H').value = 'CONSUMO LIQ M3';
    worksheet.getRow(rowL).getCell('I').value = 'CONSUMO / HORA';
    rowL++;
    worksheet.getRow(rowL).getCell('F').value = reportData.liquido.consumo.lectura_anterior;
    worksheet.getRow(rowL).getCell('F').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: yellowHighlight } };
    worksheet.getRow(rowL).getCell('G').value = reportData.liquido.consumo.lectura_actual;
    worksheet.getRow(rowL).getCell('G').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: yellowHighlight } };
    worksheet.getRow(rowL).getCell('H').value = reportData.liquido.consumo.consumo_m3;
    worksheet.getRow(rowL).getCell('I').value = reportData.liquido.consumo.consumo_hora;

    applyGrid(6, rowL-1, 9, rowL);
    
    // --- GASEOSO -> INGRESO ---
    rowG += 2;
    createSectionHeader(`A${rowG}:D${rowG}`, 'INGRESO DE CILINDROS DE OXIGENO');
    rowG++;
    worksheet.getRow(rowG).values = ['CAPACIDAD', '10 M3', '8 M3', '6 M3'];
    rowG++;
    worksheet.getRow(rowG).values = ['TOTAL UND', reportData.gaseoso.ingreso['10'], reportData.gaseoso.ingreso['8'], reportData.gaseoso.ingreso['6']];
    rowG++;
    worksheet.getRow(rowG).getCell('A').value = 'TOTAL M3';
    worksheet.mergeCells(`B${rowG}:D${rowG}`);
    worksheet.getCell(`B${rowG}`).value = reportData.gaseoso.ingreso.total_m3;

    applyGrid(1, rowG-2, 4, rowG);

    // --- LIQUIDO -> INGRESO ---
    rowL += 2;
    createSectionHeader(`F${rowL}:I${rowL}`, 'INGRESO DE OXIGENO LIQUIDO');
    rowL++;
    worksheet.getRow(rowL).getCell('F').value = 'INICIAL';
    worksheet.getRow(rowL).getCell('G').value = 'FINAL';
    worksheet.getRow(rowL).getCell('H').value = 'DIFERENCIA';
    worksheet.getRow(rowL).getCell('I').value = 'RECARGADO M3';
    rowL++;
    worksheet.getRow(rowL).getCell('F').value = reportData.liquido.ingreso.inicial || '';
    worksheet.getRow(rowL).getCell('G').value = reportData.liquido.ingreso.final || '';
    worksheet.getRow(rowL).getCell('H').value = reportData.liquido.ingreso.diferencia;
    worksheet.getRow(rowL).getCell('I').value = reportData.liquido.ingreso.recargado_m3;
    
    applyGrid(6, rowL-1, 9, rowL);

    // --- GASEOSO -> RESERVA LLENOS ---
    rowG += 2;
    createSectionHeader(`A${rowG}:D${rowG}`, 'RESERVA DE CILINDROS DE OXIGENO');
    rowG++;
    worksheet.getRow(rowG).values = ['CAPACIDAD', '10 M3', '8 M3', '6 M3'];
    rowG++;
    worksheet.getRow(rowG).values = ['CENTRAL', reportData.gaseoso.reserva_llenos.central['10'], reportData.gaseoso.reserva_llenos.central['8'], reportData.gaseoso.reserva_llenos.central['6']];
    rowG++;
    worksheet.getRow(rowG).values = ['ALMACEN', reportData.gaseoso.reserva_llenos.almacen['10'], reportData.gaseoso.reserva_llenos.almacen['8'], reportData.gaseoso.reserva_llenos.almacen['6']];
    rowG++;
    worksheet.getRow(rowG).values = ['TOTAL UND', reportData.gaseoso.reserva_llenos.total_und['10'], reportData.gaseoso.reserva_llenos.total_und['8'], reportData.gaseoso.reserva_llenos.total_und['6']];
    rowG++;
    worksheet.getRow(rowG).getCell('A').value = 'TOTAL M3';
    worksheet.getCell(`B${rowG}`).value = reportData.gaseoso.reserva_llenos.total_m3;
    
    worksheet.getCell(`C${rowG}`).value = 'PROYEC. DIAS';
    worksheet.getCell(`C${rowG}`).font = { bold: true, size: 8 };
    
    const consumoTotalGas = parseFloat(reportData.gaseoso.consumo.total_m3) || 0;
    const reservaTotalGas = parseFloat(reportData.gaseoso.reserva_llenos.total_m3) || 0;
    const proyGas = consumoTotalGas > 0 ? (reservaTotalGas / consumoTotalGas).toFixed(2) : 0;
    
    worksheet.getCell(`D${rowG}`).value = parseFloat(proyGas);
    worksheet.getCell(`D${rowG}`).font = { bold: true, color: { argb: 'FF0000FF' } };
    
    applyGrid(1, rowG-4, 4, rowG);

    // --- LIQUIDO -> RESERVA ---
    rowL += 2;
    createSectionHeader(`F${rowL}:I${rowL}`, 'RESERVA DE OXIGENO LIQUIDO');
    rowL++;
    worksheet.getRow(rowL).getCell('F').value = 'NIVEL ANTERIOR';
    worksheet.getRow(rowL).getCell('G').value = 'NIVEL ACTUAL';
    worksheet.getRow(rowL).getCell('H').value = 'RESERVA LIQ M3';
    worksheet.getRow(rowL).getCell('I').value = 'PROYEC. DIAS';
    rowL++;
    worksheet.getRow(rowL).getCell('F').value = reportData.liquido.reserva.nivel_anterior;
    worksheet.getRow(rowL).getCell('G').value = reportData.liquido.reserva.nivel_actual;
    worksheet.getRow(rowL).getCell('G').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: yellowHighlight } };
    worksheet.getRow(rowL).getCell('H').value = reportData.liquido.reserva.reserva_m3;
    worksheet.getRow(rowL).getCell('I').value = reportData.liquido.reserva.proyeccion_dias;
    
    applyGrid(6, rowL-1, 9, rowL);

    // --- GASEOSO -> BALANCE GENERAL ---
    rowG += 2;
    createSectionHeader(`A${rowG}:D${rowG}`, 'BALANCE GENERAL', 'FF3730A3', 'FFFFFFFF');
    rowG++;
    worksheet.getRow(rowG).values = ['SALDO INICIAL', 'CONSUMO', 'INGRESO', 'SALDO FINAL'];
    rowG++;
    worksheet.getRow(rowG).values = [
        reportData.gaseoso.saldo_inicial.total_m3,
        reportData.gaseoso.consumo.total_m3,
        reportData.gaseoso.ingreso.total_m3,
        reportData.gaseoso.reserva_llenos.total_m3
    ];
    worksheet.getRow(rowG).getCell('A').font = { bold: true, color: { argb: 'FF3730A3' } };
    worksheet.getRow(rowG).getCell('B').font = { bold: true, color: { argb: 'FFDC2626' } };
    worksheet.getRow(rowG).getCell('C').font = { bold: true, color: { argb: 'FF16A34A' } };
    worksheet.getRow(rowG).getCell('D').font = { bold: true, color: { argb: 'FF1D4ED8' } };

    applyGrid(1, rowG-1, 4, rowG);

    // --- GASEOSO -> RESERVA VACIOS ---
    rowG += 2;
    createSectionHeader(`A${rowG}:D${rowG}`, 'RESERVA DE CILINDROS VACIOS DE OXIGENO');
    rowG++;
    worksheet.getRow(rowG).values = ['CAPACIDAD', '10 M3', '8 M3', '6 M3'];
    rowG++;
    worksheet.getRow(rowG).values = ['LINDE', reportData.gaseoso.reserva_vacios.linde['10'], reportData.gaseoso.reserva_vacios.linde['8'], reportData.gaseoso.reserva_vacios.linde['6']];
    rowG++;
    worksheet.getRow(rowG).values = ['ESSALUD', reportData.gaseoso.reserva_vacios.essalud['10'], reportData.gaseoso.reserva_vacios.essalud['8'], reportData.gaseoso.reserva_vacios.essalud['6']];
    rowG++;
    worksheet.getRow(rowG).values = ['PERIFERIA', reportData.gaseoso.reserva_vacios.periferia['10'], reportData.gaseoso.reserva_vacios.periferia['8'], reportData.gaseoso.reserva_vacios.periferia['6']];
    rowG++;
    worksheet.getRow(rowG).values = ['MANTENIMIENTO', reportData.gaseoso.reserva_vacios.mantenimiento['10'], reportData.gaseoso.reserva_vacios.mantenimiento['8'], reportData.gaseoso.reserva_vacios.mantenimiento['6']];
    rowG++;
    worksheet.getRow(rowG).values = ['DESCONOCIDOS', reportData.gaseoso.reserva_vacios.desconocidos['10'], reportData.gaseoso.reserva_vacios.desconocidos['8'], reportData.gaseoso.reserva_vacios.desconocidos['6']];
    rowG++;
    worksheet.getRow(rowG).values = ['TOTAL UND', reportData.gaseoso.reserva_vacios.total_und['10'], reportData.gaseoso.reserva_vacios.total_und['8'], reportData.gaseoso.reserva_vacios.total_und['6']];
    
    applyGrid(1, rowG-6, 4, rowG);

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Reporte_Ejecutivo_Consumo_${dateText.replace(/\//g, '-')}.xlsx`);
};

export const exportCylindersInventoryReport = async (cylindersData, dateText) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inventario Balones');

    applyBaseStyles(worksheet, 'INVENTARIO GENERAL Y CONTROL DE CILINDROS DE OXÍGENO', '', dateText);

    worksheet.columns = [
        { header: 'Nº', key: 'nro', width: 6 },
        { header: 'CÓDIGO CILINDRO', key: 'codigo', width: 20 },
        { header: 'CÓDIGO REFERENCIA', key: 'codigo_ref', width: 20 },
        { header: 'PROPIEDAD', key: 'propiedad', width: 18 },
        { header: 'MODELO / PROVEEDOR', key: 'modelo', width: 22 },
        { header: 'ESTADO', key: 'estado', width: 16 },
        { header: 'UBICACIÓN', key: 'ubicacion', width: 22 },
        { header: 'DETALLE ASIGNACIÓN (PACIENTE / SERVICIO)', key: 'asignacion', width: 38 },
        { header: 'CAPACIDAD M3', key: 'capacidad', width: 15 },
        { header: 'TIPO DE GAS', key: 'gas', width: 22 },
    ];

    worksheet.getRow(5).values = worksheet.columns.map(c => c.header);
    applyHeaderStyles(worksheet, 5, 10);

    const statusTranslations = {
        'full': 'LLENO',
        'empty': 'VACÍO',
        'in_use': 'EN USO',
        'in_transit': 'EN TRÁNSITO',
        'lost': 'EXTRAVIADO'
    };

    cylindersData.forEach((item, index) => {
        let detalleAsignacion = '-';
        if (item.location === 'PADOMI') {
            const p = item.current_patient || item.patient;
            detalleAsignacion = p ? `${p.full_name || ''} (DNI: ${p.dni || 'S/D'})` : 'Paciente PADOMI';
        } else if (item.location === 'HOSPITALIZACION') {
            const s = item.current_service || item.service;
            const b = item.current_bed;
            detalleAsignacion = s ? `${s.name || ''}${b ? ' - Cama: ' + b.bed_number : ''}` : 'Servicio Hospitalario';
        } else if (item.location === 'PERIFERIE' || item.location === 'PERIFERIE/CENTROS MEDICOS') {
            const s = item.current_service || item.service;
            detalleAsignacion = s ? s.name : 'Centro Asistencial Red';
        } else if (item.location === 'PROVEEDOR') {
            const sup = item.supplier;
            detalleAsignacion = sup ? sup.name : 'Recarga Externa';
        } else if (item.location === 'CENTRAL') {
            detalleAsignacion = 'Almacén Central / Planta';
        } else if (item.location === 'AUTORIDAD / TERCEROS' || item.location === 'AUTORIDADES') {
            detalleAsignacion = 'Entidad Externa / Autoridad';
        }

        worksheet.addRow({
            nro: index + 1,
            codigo: item.serial_number || 'S/D',
            codigo_ref: item.barcode || '-',
            propiedad: item.ownership_type?.name || item.ownership_type_name || 'ESSALUD',
            modelo: item.supplier?.name || item.supplier_name || item.ownership_type?.name || '-',
            estado: statusTranslations[item.status] || (item.status ? item.status.toUpperCase() : 'S/D'),
            ubicacion: item.location || 'CENTRAL',
            asignacion: detalleAsignacion,
            capacidad: `${item.capacity || 0} m³`,
            gas: item.gas_type || 'OXÍGENO MEDICINAL',
        });
        const r = index + 6;
        const doc = worksheet.getRow(r).getCell(9).value;
        if (!doc) worksheet.getRow(r).getCell(9).value = 'S/D';
    });

    applyDataStyles(worksheet, 6, cylindersData.length, 10);
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Inventario_Cilindros_${dateText.replace(/\//g, '-')}.xlsx`);
};

// =========================================================
// REPORTES DE OXÍGENO LÍQUIDO
// =========================================================

export const exportLiquidReadingsReport = async (data, dateRangeText) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Lecturas Oxígeno Líquido');

    applyBaseStyles(worksheet, 'REPORTE DIARIO DE LECTURAS DE OXÍGENO LÍQUIDO', '', dateRangeText);

    worksheet.columns = [
        { header: 'FECHA LECTURA', key: 'fecha_lectura', width: 20 },
        { header: 'TURNO', key: 'turno', width: 15 },
        { header: 'NIVEL TANQUE (mmH2O)', key: 'nivel', width: 25 },
        { header: 'LECTURA FLUJÓMETRO (m3)', key: 'flujometro', width: 25 },
        { header: 'REGISTRADO POR', key: 'operario', width: 25 },
    ];

    applyHeaderStyles(worksheet, 5, 5);

    const SHIFT_LABELS = { MORNING: 'MAÑANA', AFTERNOON: 'TARDE', NIGHT: 'NOCHE' };

    data.forEach(item => {
        const safeDate = item.reading_date ? item.reading_date.substring(0, 10) : '';
        const rawDate = safeDate
            ? format(new Date(safeDate + 'T12:00:00'), 'dd/MM/yyyy')
            : '-';
        const shiftKey = item.shift?.toUpperCase() || '';
        worksheet.addRow({
            fecha_lectura: rawDate,
            turno: SHIFT_LABELS[shiftKey] || shiftKey || '-',
            nivel: item.tank_level || '0',
            flujometro: item.flow_meter_reading || '0',
            operario: item.user?.name || item.user_name || '-',
        });
    });

    applyDataStyles(worksheet, 6, data.length, 5);

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Lecturas_O2_Liquido_${dateRangeText.replace(/ /g, '_')}.xlsx`);
};

export const exportLiquidRefillsReport = async (data, dateRangeText) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Recargas Oxígeno Líquido');

    applyBaseStyles(worksheet, 'REPORTE DE RECARGAS DE OXÍGENO LÍQUIDO (CISTERNA)', '', dateRangeText);

    worksheet.columns = [
        { header: 'FECHA RECARGA', key: 'fecha_recarga', width: 20 },
        { header: 'PROVEEDOR', key: 'proveedor', width: 25 },
        { header: 'Nº GUÍA / TICKET', key: 'guia', width: 20 },
        { header: 'CANT. TICKET (Kg)', key: 'cantidad', width: 20 },
        { header: 'PESO INICIAL', key: 'peso_ini', width: 15 },
        { header: 'PESO FINAL', key: 'peso_fin', width: 15 },
        { header: 'NIVEL ANTES', key: 'nivel_antes', width: 15 },
        { header: 'NIVEL DESPUÉS', key: 'nivel_despues', width: 15 },
        { header: 'OPERARIO', key: 'operario', width: 25 },
    ];

    applyHeaderStyles(worksheet, 5, 9);

    data.forEach(item => {
        worksheet.addRow({
            fecha_recarga: formatOperationalDate(item, 'refilled_at', '-'),
            proveedor: item.supplier_name || item.supplier?.name || 'PRAXAIR / LINDE',
            guia: item.guide_number || item.reference_document || '-',
            cantidad: item.ticket_quantity ?? item.ticket_amount ?? '-',
            peso_ini: item.initial_weight ?? item.weight_before ?? '-',
            peso_fin: item.final_weight ?? item.weight_after ?? '-',
            nivel_antes: item.tank_level_before ?? item.level_before ?? '-',
            nivel_despues: item.tank_level_after ?? item.level_after ?? '-',
            operario: item.operator_name || item.user?.name || '-'
        });
    });

    applyDataStyles(worksheet, 6, data.length, 9);

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Recargas_O2_Liquido_${dateRangeText.replace(/ /g, '_')}.xlsx`);
};
