import { jsPDF } from 'jspdf';
import { Jugador } from '../types';

export const exportPlayerToPdf = (player: Jugador) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Margins
  const startX = 15;
  const startY = 15;
  const contentWidth = 180;

  // Header Banner (Dark Slate background)
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(startX, startY, contentWidth, 32, 4, 4, 'F');

  // Header branding text
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(96, 165, 250); // blue-400
  doc.text('CUADERNO DE ENTRENADOR - FICHA TÉCNICA OFICIAL', startX + 8, startY + 11);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text(`${player.nombre.toUpperCase()} ${player.apellidos.toUpperCase()}`, startX + 8, startY + 22);

  // Dorsal Badge in Header
  doc.setFillColor(37, 99, 235); // blue-600
  doc.roundedRect(startX + contentWidth - 25, startY + 6, 18, 18, 4, 4, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(`${player.dorsal}`, startX + contentWidth - 16, startY + 18, { align: 'center' });

  // Main Background block for data
  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(startX, startY + 38, contentWidth, 120, 4, 4, 'F');

  // Profile section / Left Side: Basic Information
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('DATOS DE LA FICHA DEPORTIVA', startX + 8, startY + 48);

  // Draw divider line under title
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.line(startX + 8, startY + 51, startX + 80, startY + 51);

  const getAge = (dob: string) => {
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Player Data fields helper
  const drawField = (label: string, value: string, yPos: number) => {
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(label, startX + 8, yPos);
    
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(value, startX + 42, yPos);
  };

  drawField('Nombre completo:', `${player.nombre} ${player.apellidos}`, startY + 60);
  drawField('Dorsal oficial:', `${player.dorsal}`, startY + 68);
  drawField('Fecha Nacimiento:', `${player.fecha_nacimiento} (${getAge(player.fecha_nacimiento)} años)`, startY + 76);
  drawField('Demarcación:', player.demarcacion, startY + 84);
  drawField('Píe dominante:', player.lateralidad, startY + 92);
  drawField('Equipo/Filiación:', player.equipo, startY + 100);

  // Right Side: Attributes Performance
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('RENDIMIENTO TÁCTICO & FÍSICO', startX + 94, startY + 48);
  doc.line(startX + 94, startY + 51, startX + contentWidth - 8, startY + 51);

  // Draw attribute horizontal bar helper
  const drawAttributeBar = (label: string, val: number, yPos: number) => {
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(label, startX + 94, yPos);

    // Score digit
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(37, 99, 235); // blue-600
    doc.text(`${val}/5`, startX + 134, yPos);

    // Draw 5 notch boxes
    const boxWidth = 6;
    const boxHeight = 2.5;
    for (let i = 1; i <= 5; i++) {
      if (i <= val) {
        doc.setFillColor(37, 99, 235); // Filled blue-600
      } else {
        doc.setFillColor(203, 213, 225); // Unfilled slate-300
      }
      doc.roundedRect(startX + 142 + (i - 1) * 7, yPos - 2.5, boxWidth, boxHeight, 0.5, 0.5, 'F');
    }
  };

  const vel = player.velocidad ?? 3;
  const rem = player.remate ?? 3;
  const pas = player.pase ?? 3;
  const tec = player.tecnica ?? 3;
  const def = player.defensa ?? 3;
  const act = player.actitud ?? 3;

  drawAttributeBar('Velocidad / Ritmo', vel, startY + 60);
  drawAttributeBar('Remate / Gol', rem, startY + 68);
  drawAttributeBar('Pase / Asociación', pas, startY + 76);
  drawAttributeBar('Técnica / Control', tec, startY + 84);
  drawAttributeBar('Defensa / Entrada', def, startY + 92);
  drawAttributeBar('Actitud / Trabajo', act, startY + 100);

  // Section observations / Technical analysis reports at bottom
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200 border
  doc.roundedRect(startX, startY + 114, contentWidth, 38, 4, 4, 'FD');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('ANÁLISIS TÁCTICO & OBSERVACIONES', startX + 8, startY + 122);
  doc.line(startX + 8, startY + 124, startX + 80, startY + 124);

  doc.setFont('Helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85); // slate-700
  
  // Clean multiline wrap for Observations
  const textLines = doc.splitTextToSize(
    player.observaciones || 'No hay notas tácticas registradas en la ficha de este jugador.', 
    contentWidth - 16
  );
  doc.text(textLines, startX + 8, startY + 130);

  // Footer / Authority sign
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('DOCUMENTO EXCLUSIVO GENERADO DESDE CUADERNO DE ENTRENADOR DEPORTIVO', startX, startY + 235);
  
  const todayDate = new Date().toLocaleDateString('es-ES');
  doc.text(`Generado el: ${todayDate}`, startX + contentWidth, startY + 235, { align: 'right' });

  // Save the PDF
  const filename = `${player.nombre.toLowerCase()}_${player.apellidos.toLowerCase()}_ficha.pdf`;
  doc.save(filename);
};

export const exportTacticalBoardToPdf = (
  usFormation: string,
  ourAssignedIds: Record<number, string>,
  ourCoords: any[],
  players: Jugador[],
  showRivals: boolean,
  rivalFormation: string,
  rivalCoords: any[]
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const startX = 10;
  const startY = 10;
  const contentWidth = 190;

  // 1. HEADER BANNER
  doc.setFillColor(15, 23, 42); // slate-900 (Unified Premium theme)
  doc.roundedRect(startX, startY, contentWidth, 24, 3, 3, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(96, 165, 250); // blue-400
  doc.text('INFORME TÁCTICO OFICIAL • ALINEACIÓN Y CAMPOGRAMA', startX + 6, startY + 8);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text(`PIZARRA TÁCTICA: SISTEMA LOCAL ${usFormation}`, startX + 6, startY + 17);

  // Time & Date under Banner
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // slate-400
  const dateStr = new Date().toLocaleDateString('es-ES', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  doc.text(`Planificado el: ${dateStr.toUpperCase()}`, startX + contentWidth - 6, startY + 14, { align: 'right' });

  // 2. LAYOUT DIVISIONS (Side-by-Side: Left Column [Table + Notes] & Right Column [Visual Campograma])
  const colLeftX = 10;
  const colLeftW = 92;
  const colRightX = 108;
  const colRightW = 92;

  // --- LEFT COLUMN ---
  // Stats summary box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.3);
  doc.roundedRect(colLeftX, 38, colLeftW, 20, 2, 2, 'FD');

  const configuredCount = Object.keys(ourAssignedIds).length;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('SISTEMAS ENSAYADOS', colLeftX + 5, 44);
  doc.text('TITULARES ALINEADOS', colLeftX + 53, 44);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(`L: ${usFormation} vs R: ${showRivals ? rivalFormation : 'N/A'}`, colLeftX + 5, 51);
  doc.setTextColor(37, 99, 235); // blue-600
  doc.text(`${configuredCount} / 11 EXPEDIENTADOS`, colLeftX + 53, 51);

  // Lineup Table container
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(colLeftX, 62, colLeftW, 106, 2.5, 2.5, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(147, 197, 253); // blue-300
  doc.text('ONCE TITULAR SELECCIONADO', colLeftX + 6, 69);
  doc.setDrawColor(30, 41, 59); // slate-800
  doc.setLineWidth(0.4);
  doc.line(colLeftX + 6, 71, colLeftX + colLeftW - 6, 71);

  // Table header labels
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('POS', colLeftX + 6, 76);
  doc.text('DORSAL', colLeftX + 18, 76);
  doc.text('JUGADOR CONVOCADO', colLeftX + 34, 76);

  doc.line(colLeftX + 6, 78, colLeftX + colLeftW - 6, 78);

  // Render 11 players table rows
  ourCoords.forEach((coord, idx) => {
    const rowY = 83 + (idx * 7.5);
    const assignedPlayer = players.find(p => p.id === ourAssignedIds[idx]);

    // Zebra highlight
    if (idx % 2 === 0) {
      doc.setFillColor(30, 41, 59); // slate-800
      doc.roundedRect(colLeftX + 3, rowY - 4.5, colLeftW - 6, 6.2, 0.8, 0.8, 'F');
    }

    // Draw circular position label badge
    doc.setFillColor(idx === 0 ? 120 : 15, idx === 0 ? 90 : 23, idx === 0 ? 15 : 42); // Amber for GK, Navy for Others
    doc.roundedRect(colLeftX + 5, rowY - 3.8, 9, 4.4, 0.6, 0.6, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(idx === 0 ? 251 : 255, idx === 0 ? 191 : 255, idx === 0 ? 36 : 255);
    doc.text(coord.label || `J${idx+1}`, colLeftX + 9.5, rowY - 0.7, { align: 'center' });

    if (assignedPlayer) {
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(96, 165, 250); // blue-400
      doc.text(`#${assignedPlayer.dorsal}`, colLeftX + 19, rowY - 0.5);

      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      const fullName = `${assignedPlayer.nombre} ${assignedPlayer.apellidos}`;
      doc.text(fullName.length > 20 ? `${fullName.substring(0, 18)}...` : fullName, colLeftX + 34, rowY - 0.5);
    } else {
      doc.setFont('Helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text('-', colLeftX + 19, rowY - 0.5);
      doc.text('[ Vacante - Sin Asignar ]', colLeftX + 34, rowY - 0.5);
    }
  });

  // Substitutes / Bench players block at bottom left
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(colLeftX, 172, colLeftW, 83, 2.5, 2.5, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(147, 197, 253); // blue-300
  doc.text('CONVOCATORIA: BANQUILLO (SUPLENTES)', colLeftX + 6, 179);
  doc.line(colLeftX + 6, 181, colLeftX + colLeftW - 6, 181);

  // Filter unassigned players
  const alignedIdsSet = new Set(Object.values(ourAssignedIds));
  const benchPlayers = players.filter(p => !alignedIdsSet.has(p.id));

  if (benchPlayers.length === 0) {
    doc.setFont('Helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('No hay futbolistas suplentes inscritos.', colLeftX + 8, 190);
  } else {
    // Render up to 7 bench players
    const maxBenchRows = Math.min(benchPlayers.length, 7);
    for (let bIdx = 0; bIdx < maxBenchRows; bIdx++) {
      const bPlayer = benchPlayers[bIdx];
      const bRowY = 188 + (bIdx * 7.4);

      if (bIdx % 2 === 0) {
        doc.setFillColor(23, 33, 50); // dark slate zebra
        doc.roundedRect(colLeftX + 4, bRowY - 4.5, colLeftW - 8, 6.2, 0.8, 0.8, 'F');
      }

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(`${bPlayer.demarcacion.toUpperCase()}`, colLeftX + 6, bRowY - 0.5);

      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(`#${bPlayer.dorsal}`, colLeftX + 26, bRowY - 0.5);

      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(219, 234, 254);
      doc.text(`${bPlayer.nombre} ${bPlayer.apellidos}`, colLeftX + 36, bRowY - 0.5);
    }

    if (benchPlayers.length > 7) {
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(96, 165, 250);
      doc.text(`+ ${benchPlayers.length - 7} JUGADORES MÁS EN EL BANQUILLO DE SUPLENTES`, colLeftX + 6, 248);
    }
  }


  // --- RIGHT COLUMN: VISUAL PIZARRA TÁCTICA (CAMPOGRAMA) ---
  const frameX = colRightX;
  const frameY = 38;
  const frameW = colRightW;
  const frameH = 217;

  // Frame Border
  doc.setFillColor(15, 23, 42); // slate-900 Stadium outline
  doc.roundedRect(frameX, frameY, frameW, frameH, 4, 4, 'F');

  // Ground container
  const pitchX = frameX + 4;
  const pitchY = frameY + 4;
  const pitchW = frameW - 8;
  const pitchH = frameH - 8;

  // Turf main background (deep emerald grass)
  doc.setFillColor(21, 115, 71); // beautiful pitch grass
  doc.rect(pitchX, pitchY, pitchW, pitchH, 'F');

  // Turf zebra horizontal stripes (highly aesthetic look!)
  doc.setFillColor(16, 105, 63); // slightly darker stripe
  const stripeHeight = pitchH / 10;
  for (let sIdx = 0; sIdx < 10; sIdx++) {
    if (sIdx % 2 === 0) {
      doc.rect(pitchX, pitchY + (sIdx * stripeHeight), pitchW, stripeHeight, 'F');
    }
  }

  // Draw Field Marking Lines
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.38);

  // Outer boundary outline
  doc.rect(pitchX, pitchY, pitchW, pitchH, 'D');

  // Half-way division line
  doc.line(pitchX, pitchY + pitchH / 2, pitchX + pitchW, pitchY + pitchH / 2);

  // Center Circle (Y-Centered)
  const centerCircleRad = pitchW * 0.125;
  doc.ellipse(pitchX + pitchW / 2, pitchY + pitchH / 2, centerCircleRad, centerCircleRad, 'D');
  // Center Spot
  doc.setFillColor(255, 255, 255);
  doc.circle(pitchX + pitchW / 2, pitchY + pitchH / 2, 0.7, 'F');

  // -- Penalty Area Top (Rival end) --
  const penAreaW = pitchW * 0.56;
  const penAreaH = pitchH * 0.165;
  doc.rect(pitchX + (pitchW - penAreaW) / 2, pitchY, penAreaW, penAreaH, 'D');
  // Goal Area Top
  const goalAreaW = pitchW * 0.26;
  const goalAreaH = pitchH * 0.055;
  doc.rect(pitchX + (pitchW - goalAreaW) / 2, pitchY, goalAreaW, goalAreaH, 'D');
  // Penalty Spot Top
  doc.circle(pitchX + pitchW / 2, pitchY + penAreaH * 0.65, 0.45, 'F');
  // Penalty Arc Top (represented by ellipse slice or small arc ellipse)
  doc.ellipse(pitchX + pitchW / 2, pitchY + penAreaH * 0.65, 8, 4.2, 'D');

  // -- Penalty Area Bottom (Our end) --
  doc.rect(pitchX + (pitchW - penAreaW) / 2, pitchY + pitchH - penAreaH, penAreaW, penAreaH, 'D');
  // Goal Area Bottom
  doc.rect(pitchX + (pitchW - goalAreaW) / 2, pitchY + pitchH - goalAreaH, goalAreaW, goalAreaH, 'D');
  // Penalty Spot Bottom
  doc.circle(pitchX + pitchW / 2, pitchY + pitchH - penAreaH * 0.65, 0.45, 'F');
  // Penalty Arc Bottom
  doc.ellipse(pitchX + pitchW / 2, pitchY + pitchH - penAreaH * 0.65, 8, 4.2, 'D');

  // Corner arcs
  const cornerR = 2.2;
  doc.ellipse(pitchX, pitchY, cornerR, cornerR, 'D');
  doc.ellipse(pitchX + pitchW, pitchY, cornerR, cornerR, 'D');
  doc.ellipse(pitchX, pitchY + pitchH, cornerR, cornerR, 'D');
  doc.ellipse(pitchX + pitchW, pitchY + pitchH, cornerR, cornerR, 'D');


  // --- DRAW REPRESENTATION NODES ---

  // RIVAL NODES (Red Team, Attacking downwards from top)
  if (showRivals) {
    // Fill color: Red-600, border: light rose
    doc.setFillColor(220, 38, 38); 
    doc.setDrawColor(254, 202, 202);
    doc.setLineWidth(0.3);

    rivalCoords.forEach((coord, rIdx) => {
      const nodeX = pitchX + (coord.x / 100) * pitchW;
      const nodeY = pitchY + (coord.y / 100) * pitchH;

      // Draw red circle
      doc.circle(nodeX, nodeY, 2.8, 'FD');

      // Jersey number inside ("R" + index)
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(5);
      doc.setTextColor(255, 255, 255);
      doc.text(`R${rIdx + 1}`, nodeX, nodeY + 0.8, { align: 'center' });

      // Tiny Name label card under rival
      doc.setFillColor(15, 23, 42); // slate-900 border
      doc.roundedRect(nodeX - 5.5, nodeY + 3.4, 11, 2.8, 0.4, 0.4, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(3.6);
      doc.setTextColor(254, 205, 205); // light-red
      const rLabel = coord.label || `R${rIdx+1}`;
      doc.text(rLabel.substring(0, 6).toUpperCase(), nodeX, nodeY + 5.3, { align: 'center' });
    });
  }

  // OUR CONTROLLERS NODES (Blue Team, local build)
  ourCoords.forEach((coord, idx) => {
    const nodeX = pitchX + (coord.x / 100) * pitchW;
    const nodeY = pitchY + (coord.y / 100) * pitchH;

    const assignedPlayer = players.find(p => p.id === ourAssignedIds[idx]);
    const isGK = idx === 0;

    if (assignedPlayer) {
      // 1. Solid colored circle (Amber/Orange for Portero, Electric Blue for outfield players)
      if (isGK) {
        doc.setFillColor(245, 158, 11); // amber-500
        doc.setDrawColor(254, 243, 199); // amber-100
      } else {
        doc.setFillColor(37, 99, 235); // blue-600 Outfield
        doc.setDrawColor(219, 234, 254); // blue-100
      }
      doc.setLineWidth(0.4);
      doc.circle(nodeX, nodeY, 3.2, 'FD');

      // 2. Playable Dorsal number inside
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(isGK ? 15 : 255, isGK ? 23 : 255, isGK ? 42 : 255); // Slate-950 for GK for optimal contrast
      doc.text(`${assignedPlayer.dorsal}`, nodeX, nodeY + 0.9, { align: 'center' });

      // 3. Round-corner name tag underneath
      doc.setFillColor(15, 23, 42); // slate-900 backplate
      doc.roundedRect(nodeX - 7.5, nodeY + 3.8, 15, 3.4, 0.5, 0.5, 'F');
      doc.setDrawColor(51, 65, 85); // slate-700
      doc.setLineWidth(0.12);
      doc.roundedRect(nodeX - 7.5, nodeY + 3.8, 15, 3.4, 0.5, 0.5, 'D');

      // Truncated last name or first name
      const shortName = assignedPlayer.nombre.substring(0, 9);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(4);
      doc.setTextColor(255, 255, 255);
      doc.text(shortName.toUpperCase(), nodeX, nodeY + 6.2, { align: 'center' });
    } else {
      // Empty position circle
      doc.setFillColor(15, 23, 42, 0.5); // Navy transparent placeholder
      doc.setDrawColor(148, 163, 184); // slate-400
      doc.setLineWidth(0.24);
      doc.circle(nodeX, nodeY, 2.8, 'FD');

      // Circular position label helper (POR, Central, EI...)
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(4.5);
      doc.setTextColor(226, 232, 240);
      doc.text(coord.label || `J${idx+1}`, nodeX, nodeY + 0.8, { align: 'center' });
    }
  });


  // 3. FOOTER SIGN / AUTHORITY BRANDING MARK
  const footerY = 262;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('DOCUMENTO EXCLUSIVO GENERADO DESDE CUADERNO DE ENTRENADOR DEPORTIVO • APPV4-CAMPOGRAMA', startX, footerY);

  const todayStr = new Date().toLocaleDateString('es-ES');
  doc.text(`Expedido el: ${todayStr}`, startX + contentWidth, footerY, { align: 'right' });

  // Save PDF Document
  const filename = `campograma_${usFormation.replace(/-/g, '_')}_pizarra.pdf`;
  doc.save(filename);
};

