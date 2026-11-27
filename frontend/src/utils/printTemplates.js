export const printReturnReceipt = (returnData, currentUser) => {
    if (!returnData) return;
  
    // Formatear Fecha
    const returnDate = returnData.date || returnData.movement_at || new Date().toISOString();
    const dateObj = new Date(returnDate);
    const formattedDate = dateObj.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  
    // Extraer datos
    const patient = returnData.patient || {};
    const cylinderMovements = returnData.cylinder_movements || [];
    // En devolucion, el balon es el que entra (Entry)
    const cylinder = returnData.cylinder || cylinderMovements.find(m => m.action === 'Entry')?.cylinder || {};
    const reason = returnData.reason || returnData.notes || '';
  
    // Evaluar motivo para casillas
    const isDefinitive = ["Fallecimiento", "Alta médica", "Baja voluntaria"].includes(reason);
    const isTemporal = ["Viaje", "Otro"].includes(reason);
  
    // Variables para las X
    const xDefFallecimiento = reason === 'Fallecimiento' ? 'X' : '&nbsp;&nbsp;';
    const xDefAlta = reason === 'Alta médica' ? 'X' : '&nbsp;&nbsp;';
    const xDefOtros = (isDefinitive && !['Fallecimiento', 'Alta médica'].includes(reason)) ? 'X' : '&nbsp;&nbsp;';
    
    const xTempAlta = (reason === 'Alta médica' && isTemporal) ? 'X' : '&nbsp;&nbsp;';
    const xTempViajes = reason === 'Viaje' ? 'X' : '&nbsp;&nbsp;';
    const xTempOtros = (isTemporal && reason !== 'Viaje') ? 'X' : '&nbsp;&nbsp;';
  
    const printWindow = window.open('', '', 'width=800,height=900');
    printWindow.document.write(`
      <html>
        <head>
          <title>Constancia de Devolución</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body { 
              font-family: Arial, sans-serif; 
              color: #000; 
              line-height: 1.4;
              font-size: 14px;
              width: 100%;
              max-width: 180mm;
              margin: 0 auto;
            }
            .header { display: flex; justify-content: flex-end; align-items: center; margin-bottom: 30px; }
            .patient-code { display: flex; align-items: center; gap: 10px; font-weight: bold;}
            .code-box { border: 2px solid #000; padding: 5px 20px; font-size: 18px; letter-spacing: 2px; min-width: 100px; text-align: center;}
            .title { text-align: center; text-decoration: underline; font-weight: bold; font-size: 18px; margin-bottom: 25px; }
            .paragraph { text-align: justify; margin-bottom: 25px; line-height: 1.6; }
            .flex-row { display: flex; align-items: flex-end; margin-bottom: 15px; }
            .label { font-weight: bold; white-space: nowrap; margin-right: 10px; }
            .line-fill { flex: 1; border-bottom: 1px dashed #000; padding-left: 10px; font-weight: bold; }
            .subtitle { font-weight: bold; margin-bottom: 15px; margin-top: 25px; }
            
            .motivos { margin-left: 20px; margin-bottom: 30px; }
            .motivo-row { display: flex; align-items: center; margin-bottom: 10px; }
            .motivo-title { width: 220px; }
            .casillas { display: flex; gap: 30px; }
            .casilla-item { display: flex; align-items: center; gap: 5px; }
            .box { font-family: monospace; font-size: 16px; font-weight: bold; }
            
            .table-container { width: 80%; margin: 0 auto 30px; border: 2px solid #000; }
            .t-row { display: flex; border-bottom: 1px solid #000; }
            .t-row:last-child { border-bottom: none; }
            .t-col-1 { width: 35%; padding: 8px; border-right: 1px solid #000; font-weight: bold; text-align: center; display: flex; align-items: center; justify-content: center;}
            .t-col-2 { width: 65%; padding: 8px; text-align: center; font-weight: bold; font-size: 16px; }
            
            .estado-row { display: flex; justify-content: space-between; padding: 0 40px; margin-bottom: 30px; }
            
            .obs-lines { border-bottom: 1px dashed #000; height: 30px; margin-bottom: 15px; }
            
            .signatures { display: flex; justify-content: space-between; margin-top: 60px; }
            .sig-block { width: 45%; }
            .sig-title { text-align: center; font-weight: bold; margin-bottom: 30px; }
            .sig-line { display: flex; align-items: flex-end; margin-bottom: 15px; }
            .sig-line .line-fill { margin-left: 5px; }
            .sig-firma { border-top: 1px dashed #000; text-align: center; font-weight: bold; width: 80%; margin: 50px auto 0; padding-top: 5px; }
            
            .footer { margin-top: 40px; text-align: right; font-size: 11px; color: #666; font-family: monospace; }
          </style>
        </head>
        <body onload="window.print(); window.onafterprint = function(){ window.close(); }">
          
          <div class="header">
            <div class="patient-code">
              <span>Código de Paciente:</span>
              <div class="code-box">${patient.exchange_code || patient.dni || ''}</div>
            </div>
          </div>
  
          <div class="title">CONSTANCIA DE DEVOLUCIÓN DE CILINDRO DE OXÍGENO</div>
  
          <div class="paragraph">
            Por la presente se realiza la recepción de balón de oxígeno medicinal que fue asignado para el
            uso en domicilio por sistema de PACIENTES AMBULATORIOS (PADOMI), correspondiendo la
            devolución temporal o definitiva.
          </div>
  
          <div class="flex-row" style="margin-bottom: 5px;">
            <div class="label" style="width: 80px;">PACIENTE:</div>
            <div class="line-fill text-center">${patient.full_name || ''}</div>
          </div>
          <div style="display: flex; font-size: 11px; text-align: center; margin-bottom: 15px; padding-left: 90px; color: #555;">
            <div style="flex: 1;">(Nombres</div>
            <div style="width: 20px;">Y</div>
            <div style="flex: 1;">Apellidos)</div>
          </div>
  
          <div class="flex-row">
            <div class="label">Dirección de Domicilio:</div>
            <div class="line-fill">${patient.address || ''}</div>
          </div>
  
          <div class="flex-row">
            <div class="label">Teléfono/Celular:</div>
            <div class="line-fill">${patient.phone || ''}</div>
          </div>
  
          <div class="subtitle">DEVOLUCIÓN POR MOTIVO DE:</div>
          <div class="motivos">
            <div class="motivo-row">
              <div class="motivo-title">- DEVOLUCIÓN DEFINITIVA:</div>
              <div class="casillas">
                <div class="casilla-item">Defunción <span class="box">(${xDefFallecimiento})</span></div>
                <div class="casilla-item">Alta <span class="box">(${xDefAlta})</span></div>
                <div class="casilla-item">Otros <span class="box">(${xDefOtros})</span></div>
              </div>
            </div>
            <div class="motivo-row">
              <div class="motivo-title">- DEVOLUCIÓN TEMPORAL:</div>
              <div class="casillas">
                <div class="casilla-item">Alta <span class="box">(${xTempAlta})</span></div>
                <div class="casilla-item">Viajes <span class="box">(${xTempViajes})</span></div>
                <div class="casilla-item">Otros <span class="box">(${xTempOtros})</span></div>
              </div>
            </div>
          </div>
  
          <div class="subtitle">DATOS DEL BALÓN:</div>
          <div class="table-container">
            <div class="t-row">
              <div class="t-col-1">CANTIDAD</div>
              <div class="t-col-2" style="font-weight: normal;">1</div>
            </div>
            <div class="t-row">
              <div class="t-col-1">CODIGO DE BALÓN</div>
              <div class="t-col-2">${cylinder.serial_number || ''}</div>
            </div>
            <div class="t-row">
              <div class="t-col-1">CAPACIDAD (m3)</div>
              <div class="t-col-2" style="font-weight: normal;">${cylinder.capacity || ''} m³</div>
            </div>
          </div>
  
          <div class="subtitle">ESTADO DEL BALÓN:</div>
          <div class="estado-row">
            <div>BUENO <span class="box">( &nbsp; )</span></div>
            <div>MALO <span class="box">( &nbsp; )</span></div>
            <div>REGULAR <span class="box">( &nbsp; )</span></div>
            <div>OTROS <span class="box">( &nbsp; )</span></div>
          </div>
  
          <div class="subtitle">OBSERVACIONES:</div>
          <div class="obs-lines"></div>
          <div class="obs-lines" style="margin-bottom: 30px;"></div>
  
          <div class="signatures">
            <div class="sig-block">
              <div class="sig-title">AUTORIZADO</div>
              <div class="sig-line">
                <div class="label" style="font-weight: normal;">Nombres y Apellidos:</div>
                <div class="line-fill text-center" style="font-size: 13px;">${currentUser?.name || ''}</div>
              </div>
              <div class="sig-line">
                <div class="label" style="font-weight: normal;">DNI:</div>
                <div class="line-fill"></div>
              </div>
              <div class="sig-firma">FIRMA</div>
            </div>
            
            <div class="sig-block">
              <div class="sig-title">PERSONA RESPONSABLE / GARANTE</div>
              <div class="sig-line">
                <div class="label" style="font-weight: normal;">Nombres y Apellidos:</div>
                <div class="line-fill"></div>
              </div>
              <div class="sig-line">
                <div class="label" style="font-weight: normal;">DNI:</div>
                <div class="line-fill"></div>
              </div>
              <div class="sig-firma">FIRMA</div>
            </div>
          </div>
  
          <div class="footer">
            Fecha de Impresión: ${formattedDate} - Sist. Inventario EsSalud
          </div>
  
        </body>
      </html>
    `);
    printWindow.document.close();
  };

export const printControlFormat = (patient) => {
  const printWindow = window.open('', '', 'width=800,height=900');
  
  const cells = Array(25).fill(0).map(() => `
    <td class="grid-cell">
      <div class="cell-top">
        <div class="chk-row">
          <span class="lbl-normal">Intercambio</span>
          <div class="chk-box"></div>
        </div>
        <div class="chk-row">
          <span class="lbl-normal">Trasiego</span>
          <div class="flex-align">
            <div class="chk-box"></div>
            <span>____ m³</span>
          </div>
        </div>
      </div>
      <div class="cell-bottom">
        <span class="lbl-normal" style="font-style: italic;">Fecha:</span> <span style="letter-spacing: -1px;">___/___/___</span>
      </div>
    </td>
  `).join('');

  // Group cells into 5 rows of 5 columns
  let gridHtml = '';
  for (let i = 0; i < 5; i++) {
    gridHtml += '<tr>';
    for (let j = 0; j < 5; j++) {
      gridHtml += cells.match(/<td class="grid-cell">[\s\S]*?<\/td>/g)[i * 5 + j];
    }
    gridHtml += '</tr>';
  }

  printWindow.document.write(`
    <html>
      <head>
        <title>Control de Atención Paciente</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { 
            font-family: Arial, sans-serif; 
            color: #000; 
            font-size: 10px;
            width: 100%;
            max-width: 180mm;
            margin: 0 auto;
          }
          .title { text-align: center; font-weight: bold; font-size: 16px; margin-bottom: 10px; margin-top: 10px; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; border: 1px solid #000; table-layout: fixed; }
          th, td { border: 1px solid #000; padding: 4px 6px; }
          .header-table { margin-bottom: 0; }
          .header-label { font-weight: bold; width: 130px; font-size: 11px; }
          .header-val { text-transform: uppercase; text-align: center; font-size: 11px; }
          
          .grid-table { margin-top: -1px; }
          .grid-cell { height: 185px; vertical-align: top; position: relative; padding: 6px; }
          
          .chk-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
          .chk-box { width: 12px; height: 12px; border: 1px solid #000; }
          .lbl-normal { font-style: normal; }
          .flex-align { display: flex; align-items: center; gap: 2px; }
          
          .cell-bottom { position: absolute; bottom: 8px; left: 8px; width: calc(100% - 16px); display: flex; justify-content: space-between; align-items: flex-end; }
          
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 100px;
            color: rgba(0,0,0,0.06);
            z-index: -1;
            font-weight: bold;
          }
        </style>
      </head>
      <body onload="window.print(); window.onafterprint = function(){ window.close(); }">
        <div class="watermark">Página 1</div>
        <div class="title">CONTROL DE ATENCIÓN PACIENTE</div>
        
        <table class="header-table">
          <tr>
            <td class="header-label">Nombres y Apellidos:</td>
            <td class="header-val" style="width: 40%;">${patient.full_name || ''}</td>
            <td class="header-label">Código del paciente:</td>
            <td class="header-val">${patient.exchange_code || patient.dni || ''}</td>
          </tr>
          <tr>
            <td class="header-label">Dirección:</td>
            <td class="header-val">${patient.address || ''}</td>
            <td class="header-label">Número de celular:</td>
            <td class="header-val">${patient.phone || ''}</td>
          </tr>
        </table>
        
        <table class="grid-table">
          ${gridHtml}
        </table>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
};

export const printSupplierGuide = (mov, currentUser) => {
  if (!mov) return;

  const movementDate = mov.movement_at || mov.created_at || new Date().toISOString();
  const dateObj = new Date(movementDate);
  const formattedDate = dateObj.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const formattedTime = dateObj.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

  const operatorName = mov.user?.name || currentUser?.name || 'Operario de Almacén';
  const supplierName = mov.supplier?.name || mov.supplier_name || 'PROVEEDOR GENERAL';
  const refDoc = mov.reference_document || `MOV-${mov.id}`;

  const cylinderMovements = mov.cylinder_movements || [];
  
  // Salidas (Vacíos a proveedor)
  const salidas = cylinderMovements
    .filter(cm => cm.action === 'Exit' || cm.action === 'OUT')
    .map(cm => ({
      code: cm.cylinder?.serial_number || 'N/A',
      brand: cm.cylinder?.supplier?.name || cm.cylinder?.ownership_type?.name || 'PRAXAIR',
      capacity: 0
    }));

  // Ingresos (Llenos de proveedor)
  const ingresos = cylinderMovements
    .filter(cm => cm.action === 'Entry' || cm.action === 'IN')
    .map(cm => ({
      code: cm.cylinder?.serial_number || 'N/A',
      brand: cm.cylinder?.supplier?.name || cm.cylinder?.ownership_type?.name || 'PRAXAIR',
      capacity: parseFloat(cm.cylinder?.capacity) || 0
    }));

  const maxRows = Math.max(salidas.length, ingresos.length, 6);
  const totalIngresosM3 = ingresos.reduce((sum, item) => sum + item.capacity, 0);

  const printWindow = window.open('', '', 'width=950,height=900');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Guía de Proveedores A4</title>
        <style>
          @page { size: A4 portrait; margin: 12mm 15mm; }
          * { box-sizing: border-box; }
          body { 
            font-family: Arial, Helvetica, sans-serif; 
            color: #000; 
            font-size: 11px; 
            margin: 0; 
            padding: 0;
            width: 100%;
            max-width: 185mm;
            margin: 0 auto;
          }
          .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #15803d; padding-bottom: 8px; }
          .title-main { font-size: 20px; font-weight: bold; color: #15803d; margin: 0; text-transform: uppercase; }
          .title-sub { font-size: 13px; font-weight: bold; color: #16a34a; margin: 3px 0 0 0; text-transform: uppercase; }
          
          .info-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
          .info-table td { padding: 4px 6px; font-size: 11px; }
          .lbl { font-weight: bold; width: 140px; }
          .val { font-weight: bold; text-transform: uppercase; border-bottom: 1px dashed #666; }

          table.data-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; table-layout: fixed; }
          table.data-table th, table.data-table td { border: 1px solid #000; padding: 4px 6px; font-size: 10px; word-wrap: break-word; }
          table.data-table th { background-color: #f1f5f9; font-weight: bold; text-align: center; font-size: 10.5px; }

          .section-head { background-color: #e2e8f0 !important; font-size: 11px !important; text-transform: uppercase; font-weight: bold; }
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }

          .signatures { display: flex; justify-content: space-between; margin-top: 45px; padding: 0 20px; }
          .sig-block { width: 42%; text-align: center; }
          .sig-line { border-top: 1px solid #000; padding-top: 5px; font-weight: bold; margin-top: 40px; font-size: 10.5px; }
          .footer { margin-top: 25px; text-align: right; font-size: 9px; color: #666; font-family: monospace; }
        </style>
      </head>
      <body onload="window.print(); window.onafterprint = function(){ window.close(); }">
        
        <div class="header">
          <div class="title-main">GLAES SAC / ESSALUD</div>
          <div class="title-sub">INGRESO Y SALIDA DE CILINDROS - PROVEEDORES</div>
        </div>

        <table class="info-table">
          <tr>
            <td class="lbl">PROVEEDOR:</td>
            <td class="val">${supplierName}</td>
            <td class="lbl" style="width: 110px;">GUÍA / DOC:</td>
            <td class="val">${refDoc}</td>
          </tr>
          <tr>
            <td class="lbl">OPERARIO ATENCIÓN:</td>
            <td class="val">${operatorName}</td>
            <td class="lbl">FECHA Y HORA:</td>
            <td class="val">${formattedDate} ${formattedTime}</td>
          </tr>
        </table>

        <table class="data-table">
          <thead>
            <tr>
              <th colSpan="4" class="section-head" style="width: 50%;">SALIDA DE CILINDROS (VACÍOS)</th>
              <th colSpan="4" class="section-head" style="width: 50%;">INGRESO DE CILINDROS (LLENOS)</th>
            </tr>
            <tr>
              <th style="width: 20%;">MARCA/PROP.</th>
              <th style="width: 18%;">CÓDIGO</th>
              <th style="width: 6%;">UND</th>
              <th style="width: 6%;">M3</th>
              
              <th style="width: 20%;">MARCA/PROP.</th>
              <th style="width: 18%;">CÓDIGO</th>
              <th style="width: 6%;">UND</th>
              <th style="width: 6%;">M3</th>
            </tr>
          </thead>
          <tbody>
            ${Array.from({ length: maxRows }).map((_, i) => `
              <tr>
                <td>${salidas[i]?.brand || ''}</td>
                <td class="text-center font-bold">${salidas[i]?.code || ''}</td>
                <td class="text-center">${salidas[i] ? '1' : ''}</td>
                <td class="text-center">0</td>
                
                <td>${ingresos[i]?.brand || ''}</td>
                <td class="text-center font-bold">${ingresos[i]?.code || ''}</td>
                <td class="text-center">${ingresos[i] ? '1' : ''}</td>
                <td class="text-center font-bold">${ingresos[i]?.capacity || ''}</td>
              </tr>
            `).join('')}
            
            <tr class="font-bold" style="background-color: #f8fafc;">
              <td colSpan="2">TOTAL SALIDAS VACÍOS</td>
              <td class="text-center">${salidas.length}</td>
              <td class="text-center">0</td>
              
              <td colSpan="2">TOTAL INGRESOS LLENOS</td>
              <td class="text-center">${ingresos.length}</td>
              <td class="text-center">${totalIngresosM3}</td>
            </tr>
          </tbody>
        </table>

        <div class="signatures">
          <div class="sig-block">
            <div class="sig-line">FIRMA Y SELLO OPERARIO ALMACÉN</div>
            <div style="font-size: 9px; color: #555; margin-top: 2px;">${operatorName}</div>
          </div>
          <div class="sig-block">
            <div class="sig-line">FIRMA Y SELLO REPARTIDOR / PROVEEDOR</div>
            <div style="font-size: 9px; color: #555; margin-top: 2px;">${supplierName}</div>
          </div>
        </div>

        <div class="footer">
          Impreso el ${new Date().toLocaleDateString('es-PE')} ${new Date().toLocaleTimeString('es-PE')} - Formato A4 Estándar EsSalud
        </div>

      </body>
    </html>
  `);
  printWindow.document.close();
};

export const printPeripheryGuide = (mov, currentUser) => {
  if (!mov) return;

  const movementDate = mov.movement_at || mov.created_at || new Date().toISOString();
  const dateObj = new Date(movementDate);
  const formattedDate = dateObj.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const formattedTime = dateObj.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

  const operatorName = mov.user?.name || currentUser?.name || 'Operario de Almacén';
  const serviceName = mov.service?.name || mov.service_name || 'CENTRO PERIFÉRICO UPS';
  const refDoc = mov.reference_document || `PER-${mov.id}`;

  const cylinderMovements = mov.cylinder_movements || [];

  // Salidas (Llenos a periferia)
  const fullCylindersOut = cylinderMovements
    .filter(cm => cm.action === 'Exit' || cm.action === 'OUT')
    .map(cm => ({
      code: cm.cylinder?.serial_number || 'N/A',
      brand: cm.cylinder?.ownership_type?.name || 'ESSALUD',
      capacity: parseFloat(cm.cylinder?.capacity) || 0
    }));

  // Ingresos (Vacíos de periferia)
  const emptyCylindersIn = cylinderMovements
    .filter(cm => cm.action === 'Entry' || cm.action === 'IN')
    .map(cm => ({
      code: cm.cylinder?.serial_number || 'N/A',
      brand: cm.cylinder?.ownership_type?.name || 'ESSALUD',
      capacity: 0
    }));

  const maxRows = Math.max(fullCylindersOut.length, emptyCylindersIn.length, 6);
  const totalFullM3 = fullCylindersOut.reduce((sum, item) => sum + item.capacity, 0);

  const printWindow = window.open('', '', 'width=950,height=900');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Guía Canje Periferia A4</title>
        <style>
          @page { size: A4 portrait; margin: 12mm 15mm; }
          * { box-sizing: border-box; }
          body { 
            font-family: Arial, sans-serif; 
            color: #000; 
            font-size: 11px; 
            margin: 0; 
            padding: 0;
            width: 100%;
            max-width: 185mm;
            margin: 0 auto;
          }
          .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #1e40af; padding-bottom: 8px; }
          .title-main { font-size: 20px; font-weight: bold; color: #1e40af; margin: 0; text-transform: uppercase; }
          .title-sub { font-size: 13px; font-weight: bold; color: #2563eb; margin: 3px 0 0 0; text-transform: uppercase; }
          
          .info-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
          .info-table td { padding: 4px 6px; font-size: 11px; }
          .lbl { font-weight: bold; width: 140px; }
          .val { font-weight: bold; text-transform: uppercase; border-bottom: 1px dashed #666; }

          table.data-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; table-layout: fixed; }
          table.data-table th, table.data-table td { border: 1px solid #000; padding: 4px 6px; font-size: 10px; word-wrap: break-word; }
          table.data-table th { background-color: #f1f5f9; font-weight: bold; text-align: center; font-size: 10.5px; }

          .section-head { background-color: #dbeafe !important; color: #1e3a8a; font-size: 11px !important; text-transform: uppercase; font-weight: bold; }
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }

          .signatures { display: flex; justify-content: space-between; margin-top: 45px; padding: 0 20px; }
          .sig-block { width: 42%; text-align: center; }
          .sig-line { border-top: 1px solid #000; padding-top: 5px; font-weight: bold; margin-top: 40px; font-size: 10.5px; }
          .footer { margin-top: 25px; text-align: right; font-size: 9px; color: #666; font-family: monospace; }
        </style>
      </head>
      <body onload="window.print(); window.onafterprint = function(){ window.close(); }">
        
        <div class="header">
          <div class="title-main">ATENCIÓN DE ÓXIGENO MEDICINAL - ESSALUD</div>
          <div class="title-sub">GUÍA DE CANJE DE RED (PERIFERIA - U.P.S.)</div>
        </div>

        <table class="info-table">
          <tr>
            <td class="lbl">CENTRO MÉDICO (U.P.S.):</td>
            <td class="val">${serviceName}</td>
            <td class="lbl" style="width: 110px;">GUÍA / DOC:</td>
            <td class="val">${refDoc}</td>
          </tr>
          <tr>
            <td class="lbl">OPERARIO ATENCIÓN:</td>
            <td class="val">${operatorName}</td>
            <td class="lbl">FECHA Y HORA:</td>
            <td class="val">${formattedDate} ${formattedTime}</td>
          </tr>
        </table>

        <table class="data-table">
          <thead>
            <tr>
              <th colSpan="4" class="section-head" style="width: 50%;">SALIDA DE CILINDROS (LLENOS)</th>
              <th colSpan="4" class="section-head" style="width: 50%;">INGRESO DE CILINDROS (VACÍOS)</th>
            </tr>
            <tr>
              <th style="width: 20%;">PROPIEDAD</th>
              <th style="width: 18%;">CÓDIGO</th>
              <th style="width: 6%;">UND</th>
              <th style="width: 6%;">M3</th>
              
              <th style="width: 20%;">PROPIEDAD</th>
              <th style="width: 18%;">CÓDIGO</th>
              <th style="width: 6%;">UND</th>
              <th style="width: 6%;">M3</th>
            </tr>
          </thead>
          <tbody>
            ${Array.from({ length: maxRows }).map((_, i) => `
              <tr>
                <td>${fullCylindersOut[i]?.brand || ''}</td>
                <td class="text-center font-bold">${fullCylindersOut[i]?.code || ''}</td>
                <td class="text-center">${fullCylindersOut[i] ? '1' : ''}</td>
                <td class="text-center font-bold">${fullCylindersOut[i]?.capacity || ''}</td>
                
                <td>${emptyCylindersIn[i]?.brand || ''}</td>
                <td class="text-center font-bold">${emptyCylindersIn[i]?.code || ''}</td>
                <td class="text-center">${emptyCylindersIn[i] ? '1' : ''}</td>
                <td class="text-center">0</td>
              </tr>
            `).join('')}
            
            <tr class="font-bold" style="background-color: #f8fafc;">
              <td colSpan="2">TOTAL SALIDAS LLENOS</td>
              <td class="text-center">${fullCylindersOut.length}</td>
              <td class="text-center">${totalFullM3}</td>
              
              <td colSpan="2">TOTAL INGRESOS VACÍOS</td>
              <td class="text-center">${emptyCylindersIn.length}</td>
              <td class="text-center">0</td>
            </tr>
          </tbody>
        </table>

        <div class="signatures">
          <div class="sig-block">
            <div class="sig-line">FIRMA Y SELLO OPERARIO ALMACÉN</div>
            <div style="font-size: 9px; color: #555; margin-top: 2px;">${operatorName}</div>
          </div>
          <div class="sig-block">
            <div class="sig-line">FIRMA Y SELLO RESPONSABLE U.P.S.</div>
            <div style="font-size: 9px; color: #555; margin-top: 2px;">${serviceName}</div>
          </div>
        </div>

        <div class="footer">
          Impreso el ${new Date().toLocaleDateString('es-PE')} ${new Date().toLocaleTimeString('es-PE')} - Formato A4 Estándar EsSalud
        </div>

      </body>
    </html>
  `);
  printWindow.document.close();
};

/**
 * IMPRESIÓN DE ETIQUETA TÉRMICA ADHESIVA (76mm × 76mm) PARA DEVOLUCIÓN DE PACIENTE
 */
export const printThermalReturnLabel = (returnData, currentUser) => {
  if (!returnData) return;

  const patient = returnData.patient || {};
  const operator = returnData.user || currentUser || {};

  const rawDate = returnData.movement_at || returnData.date ? new Date(returnData.movement_at || returnData.date) : new Date();
  const formattedDate = `${rawDate.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${rawDate.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`;

  const attentionNum = returnData.attention_number || returnData.id || '-';

  const cylinderMovements = returnData.cylinder_movements || [];
  const cylinder = returnData.cylinder || cylinderMovements.find(m => m.action === 'Entry')?.cylinder || cylinderMovements[0]?.cylinder || {};
  const cylinderStatus = cylinderMovements.find(m => m.action === 'Entry')?.cylinder_status || cylinder.status || 'empty';
  const statusEs = cylinderStatus === 'empty' ? 'VACÍO' : 'LLENO';
  const propName = cylinder.ownership_type?.name || cylinder.ownership_type_name || 'ESSALUD';
  const reason = returnData.reason || '';

  const printWindow = window.open('', '', 'width=400,height=600');
  if (!printWindow) return;

  printWindow.document.write(`
    <html>
      <head>
        <title>Devolución N° ${attentionNum}</title>
        <style>
          @page {
            size: 76mm 76mm;
            margin: 0 !important;
          }
          body { 
            font-family: Arial, Helvetica, sans-serif; 
            margin: 0; 
            padding: 3.5mm 3.5mm;
            color: #000;
            width: 74mm;
            height: 74mm;
            box-sizing: border-box;
            font-size: 10px;
            line-height: 1.25;
            overflow: hidden;
          }
          .ticket-container {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            box-sizing: border-box;
          }
          .ticket-header { 
            text-align: center; 
            border-bottom: 1.5px solid #000; 
            padding-bottom: 2px;
            margin-bottom: 2px;
          }
          .ticket-header h3 {
            margin: 0;
            font-size: 12.5px;
            font-weight: 900;
            letter-spacing: 0.3px;
          }
          .badge-row {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 4px;
            margin-top: 1px;
          }
          .ticket-badge {
            display: inline-block;
            font-size: 9.5px;
            font-weight: 900;
            border: 1px solid #000;
            padding: 0 4px;
            border-radius: 2px;
          }
          .ticket-body {
            flex-grow: 1;
          }
          .line { 
            margin-bottom: 1.5px; 
            font-size: 10px; 
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .bold { 
            font-weight: bold; 
          }
          .section-title {
            font-weight: bold;
            font-size: 9.5px;
            border-bottom: 1px dashed #000;
            margin-top: 3px;
            margin-bottom: 2px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .cyl-card {
            border: 1px solid #000;
            border-radius: 3px;
            padding: 2.5px 4px;
            margin: 2px 0;
            background: #fafafa;
          }
          .cylinder-number {
            font-weight: 900;
            font-size: 12px;
          }
          .cyl-detail {
            font-size: 9.5px;
            display: flex;
            justify-content: space-between;
            margin-top: 1px;
            border-top: 0.5px dashed #aaa;
            padding-top: 1px;
          }
          .ticket-footer {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 2px;
            border-top: 1px dashed #000;
            padding-top: 2px;
          }
          .footer-info {
            font-size: 8.5px;
            line-height: 1.2;
          }
          .signatures { 
            width: 32mm; 
            font-size: 8px;
            text-align: center;
          }
          .sign-line { 
            border-top: 1px solid #000; 
            padding-top: 1px;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="ticket-container">
          <div class="ticket-header">
            <h3>DEVOLUCIÓN DE PACIENTE</h3>
            <div class="badge-row">
              <span class="ticket-badge">CONTROL N° ${attentionNum}</span>
              ${reason ? `<span class="ticket-badge" style="background:#000; color:#fff;">${reason.toUpperCase()}</span>` : ''}
            </div>
          </div>
          
          <div class="ticket-body">
            <div class="line"><span class="bold">Paciente:</span> ${patient.full_name || '-'}</div>
            <div class="line"><span class="bold">Cód / DNI:</span> ${patient.exchange_code || patient.dni || '-'}</div>
            <div class="line"><span class="bold">Dirección:</span> ${patient.address || '-'}</div>

            <div class="section-title">Balón Devuelto (Recepción)</div>
            <div class="cyl-card">
              <div class="line" style="margin-bottom: 0;">
                <span class="bold">SERIE:</span> <span class="cylinder-number">${cylinder.serial_number || 'S/N'}</span>
              </div>
              <div class="cyl-detail">
                <span>Cap: <b>${cylinder.capacity ? `${cylinder.capacity} m³` : '-'}</b></span>
                <span>Prop: <b>${propName}</b></span>
                <span>Est: <b>${statusEs}</b></span>
              </div>
            </div>
          </div>

          <div class="ticket-footer">
            <div class="footer-info">
              <div class="line"><span class="bold">Op:</span> ${operator.name || '-'}</div>
              <div class="line"><span class="bold">Fecha:</span> ${formattedDate}</div>
            </div>
            <div class="signatures">
              <div class="sign-line">
                <div><b>Firma / DNI</b></div>
                <div>Entregó el balón</div>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
};


  
