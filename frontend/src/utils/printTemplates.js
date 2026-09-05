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
  
