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
