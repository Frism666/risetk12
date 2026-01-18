
import React, { useState } from 'react';
import { FacultyMember } from '../types';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { GeminiResearchService } from '../services/geminiService';

interface Props {
  data: FacultyMember[];
  onExport: () => void;
  onExportText: () => void;
  onExportJson: () => void;
}

export const ResultsTable: React.FC<Props> = ({ data, onExport, onExportText, onExportJson }) => {
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  if (data.length === 0) return null;

  const calculateFinancials = (salaryStr: string) => {
    const rawSalaryStr = salaryStr.replace(/[^0-9]/g, '');
    const annualSalary = parseInt(rawSalaryStr) || 55000;
    const monthlyGross = annualSalary / 12;
    
    const fedTax = monthlyGross * 0.141;
    const stateTax = monthlyGross * 0.02;
    const socSec = monthlyGross * 0.062;
    const medicare = monthlyGross * 0.0145;
    const healthIns = 215.80;
    const dentalIns = 58.55;
    const totalDeductions = fedTax + stateTax + socSec + medicare + healthIns + dentalIns;
    const netPay = monthlyGross - totalDeductions;

    return { annualSalary, monthlyGross, fedTax, stateTax, socSec, medicare, healthIns, dentalIns, totalDeductions, netPay };
  };

  const generateOfficialLetter = (item: FacultyMember) => {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    doc.setFont('times', 'bold');
    doc.setFontSize(18);
    doc.text(item.schoolName.toUpperCase(), 105, 30, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('times', 'normal');
    doc.text(item.schoolAddress, 105, 37, { align: 'center' });
    doc.setLineWidth(0.5);
    doc.line(20, 42, 190, 42);

    doc.setFontSize(12);
    doc.text(`Date: ${today}`, 20, 60);
    doc.setFont('times', 'bold');
    doc.text('SUBJECT: EMPLOYMENT VERIFICATION AND OFFICIAL RECORD', 20, 75);
    
    doc.setFont('times', 'normal');
    const bodyText = `To Whom It May Concern,\n\nThis letter serves as formal verification of employment for ${item.name}. Our records confirm that ${item.name} is currently a member of the faculty at ${item.schoolName}, holding the official position of ${item.position}.\n\nAs a professional educator within the ${item.schoolName} system, the individual has been granted all access and responsibilities associated with their current faculty standing. This document validates their status for research, financial, or administrative purposes as of the date issued.\n\nShould you require further information regarding this faculty member's standing or additional institutional data, please contact the administrative office at the address listed above.`;
    
    const splitText = doc.splitTextToSize(bodyText, 170);
    doc.text(splitText, 20, 90);

    doc.setFont('times', 'bold');
    doc.text('Authorized by:', 20, 180);
    doc.line(20, 205, 80, 205);
    doc.setFontSize(10);
    doc.text('Office of Human Resources', 20, 212);
    doc.text(item.schoolName, 20, 218);

    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('This is an electronically generated official document from EduScout US Researcher System.', 105, 285, { align: 'center' });

    doc.save(`Official_Letter_${item.name.replace(/\s+/g, '_')}.pdf`);
  };

  const generateIDCard = async (item: FacultyMember) => {
    setGeneratingId(item.id);
    const container = document.getElementById('paystub-export-container');
    if (!container) return;

    const service = new GeminiResearchService();
    const portraitUrl = await service.generateTeacherPortrait(item.name, item.position, item.schoolName);

    const initials = item.schoolName.split(' ').map(n => n[0]).join('').substring(0, 3).toUpperCase();
    const facultyId = `FAC-${Math.floor(100000 + Math.random() * 900000)}`;

    const portraitHtml = portraitUrl 
      ? `<img src="${portraitUrl}" style="width: 100%; height: 100%; object-fit: cover;" />`
      : `<div style="width: 100%; height: 100%; background: #e2e8f0; display: flex; align-items: center; justify-content: center;">
          <svg style="width: 60px; height: 60px; color: #94a3b8;" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path></svg>
         </div>`;

    container.innerHTML = `
      <div id="id-card-capture" style="width: 380px; height: 600px; background: white; border-radius: 24px; overflow: hidden; font-family: 'Inter', sans-serif; position: relative; border: 1px solid #d1d5db; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);">
        
        <!-- Plastic Sheen / Reflection Layer -->
        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0.1) 60%, rgba(255,255,255,0) 100%); pointer-events: none; z-index: 10;"></div>
        
        <!-- Plastic Card Edge Detail (Inner Glow) -->
        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; border: 2px solid rgba(255,255,255,0.8); border-radius: 24px; pointer-events: none; z-index: 11; box-sizing: border-box;"></div>

        <!-- Card Header -->
        <div style="height: 140px; background: linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%); display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; position: relative;">
          <div style="font-weight: 900; font-size: 32px; letter-spacing: -1.5px; opacity: 0.9;">${initials}</div>
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; margin-top: 6px; letter-spacing: 1px; color: #c7d2fe; text-align: center; padding: 0 30px;">${item.schoolName}</div>
          
          <!-- Hologram Seal -->
          <div style="position: absolute; top: 20px; right: 20px; width: 35px; height: 35px; border-radius: 50%; background: linear-gradient(45deg, #fcd34d, #ec4899, #6366f1); opacity: 0.4; display: flex; align-items: center; justify-content: center;">
            <svg style="width: 20px; height: 20px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
          </div>
        </div>
        
        <div style="display: flex; flex-direction: column; align-items: center; margin-top: -60px; padding: 0 24px; position: relative; z-index: 5;">
          <!-- Portrait Container -->
          <div style="width: 140px; height: 160px; border-radius: 16px; background: white; border: 6px solid white; display: flex; align-items: center; justify-content: center; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.05);">
            ${portraitHtml}
          </div>
          
          <div style="margin-top: 24px; text-align: center;">
            <div style="font-size: 24px; font-weight: 800; color: #111827; letter-spacing: -0.5px;">${item.name}</div>
            <div style="font-size: 13px; font-weight: 700; color: #4f46e5; text-transform: uppercase; margin-top: 6px; letter-spacing: 2px;">${item.position}</div>
          </div>
          
          <!-- Data Table -->
          <div style="width: 100%; margin-top: 45px; background: #f8fafc; border-radius: 12px; padding: 16px; border: 1px solid #f1f5f9;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
              <span style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Employee ID</span>
              <span style="font-size: 11px; font-weight: 800; color: #1e293b; font-family: monospace;">${facultyId}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
              <span style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Valid From</span>
              <span style="font-size: 11px; font-weight: 800; color: #1e293b;">AUG ${new Date().getFullYear()}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Access Level</span>
              <span style="font-size: 11px; font-weight: 800; color: #dc2626;">FACULTY / STAFF</span>
            </div>
          </div>
          
          <!-- Barcode Area -->
          <div style="margin-top: 40px; width: 100%; display: flex; flex-direction: column; align-items: center;">
             <div style="width: 100%; height: 45px; background: white; border: 1px solid #e2e8f0; border-radius: 6px; display: flex; align-items: center; justify-content: center; padding: 0 10px;">
                <div style="width: 100%; height: 25px; background: repeating-linear-gradient(90deg, #000 0px, #000 2px, transparent 2px, transparent 4px, #000 4px, #000 5px, transparent 5px, transparent 8px); opacity: 0.8;"></div>
             </div>
             <div style="margin-top: 8px; font-size: 9px; color: #94a3b8; font-weight: 600; letter-spacing: 2px;">PROPERTY OF ${initials} DISTRICT</div>
          </div>
        </div>
        
        <!-- Safety Footer -->
        <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 12px; background: repeating-linear-gradient(45deg, #4f46e5, #4f46e5 10px, #4338ca 10px, #4338ca 20px);"></div>
      </div>
    `;

    const element = document.getElementById('id-card-capture');
    if (!element) return;

    try {
      await new Promise(r => setTimeout(r, 800)); // Increased delay for sheen rendering
      const canvas = await html2canvas(element, { 
        scale: 4, // Higher scale for extreme crispness
        backgroundColor: null,
        useCORS: true,
        allowTaint: true
      });
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `Premium_ID_${item.name.replace(/\s+/g, '_')}.png`;
      link.click();
    } catch (err) {
      console.error("Error generating ID Card", err);
    } finally {
      container.innerHTML = '';
      setGeneratingId(null);
    }
  };

  const generatePDF = (item: FacultyMember) => {
    const doc = new jsPDF();
    const { annualSalary, monthlyGross, fedTax, stateTax, socSec, medicare, healthIns, dentalIns, totalDeductions, netPay } = calculateFinancials(item.salaryEstimate);
    
    doc.setFont('courier', 'bold');
    doc.setLineWidth(0.8);
    doc.rect(5, 5, 200, 280); 
    doc.setFontSize(10);
    doc.text('DEPARTMENT OF EDUCATION', 15, 15);
    doc.setFontSize(16);
    doc.text(item.schoolName.toUpperCase(), 15, 25);
    doc.setFontSize(10);
    doc.setFont('courier', 'normal');
    doc.text(item.schoolAddress.toUpperCase(), 15, 32);
    doc.setLineWidth(0.5);
    doc.rect(145, 10, 50, 20);
    doc.setFont('courier', 'bold');
    doc.text('FORM W-2', 170, 18, { align: 'center' });
    doc.setFontSize(8);
    doc.text('WAGE STATEMENT', 170, 24, { align: 'center' });
    doc.line(5, 40, 205, 40);
    doc.rect(10, 45, 90, 45);
    doc.setFontSize(9);
    doc.text('EMPLOYEE INFORMATION', 15, 52);
    doc.setFont('courier', 'normal');
    doc.text(`NAME:     ${item.name.toUpperCase()}`, 15, 62);
    doc.text(`SSN:      ***-**-${Math.floor(1000 + Math.random() * 9000)}`, 15, 70);
    doc.text(`ID:       F-2026-${Math.floor(10000 + Math.random() * 90000)}`, 15, 78);
    doc.text(`POSITION: ${item.position.toUpperCase()}`, 15, 86);
    doc.rect(105, 45, 95, 45);
    doc.setFont('courier', 'bold');
    doc.text('PAY PERIOD INFORMATION', 110, 52);
    doc.setFont('courier', 'normal');
    const today = new Date();
    const lastWeek = new Date(today); lastWeek.setDate(today.getDate() - 7);
    doc.text(`CHECK NO:     P${Math.floor(1000000 + Math.random() * 9000000)}`, 110, 62);
    doc.text(`PAY DATE:     ${today.toLocaleDateString()}`, 110, 70);
    doc.text(`PERIOD:       ${lastWeek.toLocaleDateString()}`, 110, 78);
    doc.text(`TO:           ${today.toLocaleDateString()}`, 110, 86);
    doc.setFillColor(0, 0, 0);
    doc.rect(10, 100, 190, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('courier', 'bold');
    doc.text('SECTION A: EARNINGS', 15, 106);
    doc.setTextColor(0, 0, 0);
    doc.setFillColor(230, 235, 245);
    doc.rect(10, 108, 190, 10, 'F');
    doc.rect(10, 108, 190, 10);
    doc.setFontSize(8);
    doc.text('CODE', 12, 114);
    doc.text('DESCRIPTION', 32, 114);
    doc.text('RATE', 85, 114);
    doc.text('HOURS', 110, 114);
    doc.text('CURRENT', 140, 114);
    doc.text('YTD', 175, 114);
    doc.text('001', 12, 124);
    doc.text('REGULAR SALARY', 32, 124);
    doc.text('---', 85, 124);
    doc.text('80.00', 110, 124);
    doc.text(monthlyGross.toFixed(2), 140, 124);
    doc.text((annualSalary).toFixed(2), 175, 124);
    doc.line(10, 128, 200, 128);
    doc.text('TOTAL GROSS PAY', 12, 134);
    doc.text(monthlyGross.toFixed(2), 140, 134);
    doc.text((annualSalary).toFixed(2), 175, 134);
    doc.rect(10, 108, 190, 30);
    doc.setFillColor(0, 0, 0);
    doc.rect(10, 150, 190, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text('SECTION B: DEDUCTIONS & TAXES', 15, 156);
    doc.setTextColor(0, 0, 0);
    doc.setFillColor(230, 235, 245);
    doc.rect(10, 158, 190, 10, 'F');
    doc.rect(10, 158, 190, 10);
    doc.text('CODE', 12, 164);
    doc.text('DESCRIPTION', 32, 164);
    doc.text('CURRENT', 140, 164);
    doc.text('YTD', 175, 164);
    const deductions = [
      { c: '100', d: 'FEDERAL INCOME TAX', v: fedTax },
      { c: '101', d: 'STATE INCOME TAX', v: stateTax },
      { c: '102', d: 'SOCIAL SECURITY (OASDI)', v: socSec },
      { c: '103', d: 'MEDICARE', v: medicare },
      { c: '104', d: 'HEALTH INSURANCE', v: healthIns },
      { c: '105', d: 'DENTAL INSURANCE', v: dentalIns }
    ];
    deductions.forEach((d, idx) => {
      const y = 174 + (idx * 8);
      doc.setFont('courier', 'normal');
      doc.text(d.c, 12, y);
      doc.text(d.d, 32, y);
      doc.text(`$${d.v.toFixed(2)}`, 140, y);
      doc.text(`$${(d.v * 12).toFixed(2)}`, 175, y);
    });
    doc.line(10, 222, 200, 222);
    doc.setFont('courier', 'bold');
    doc.text('TOTAL DEDUCTIONS', 12, 228);
    doc.text(totalDeductions.toFixed(2), 140, 228);
    doc.text((totalDeductions * 12).toFixed(2), 175, 228);
    doc.rect(10, 158, 190, 75);
    doc.setFillColor(0, 0, 0);
    doc.rect(10, 245, 190, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('NET PAY', 15, 255);
    doc.setFontSize(24);
    doc.text(`$${netPay.toFixed(2)}`, 15, 270);
    doc.setFontSize(9);
    doc.text('PAYMENT METHOD', 140, 255);
    doc.text(`Direct Deposit - Account ****${Math.floor(1000 + Math.random() * 8999)}`, 115, 263);
    doc.text(`YTD NET: $${(netPay * 12).toFixed(2)}`, 150, 270);
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(8);
    doc.text('OFFICIAL GOVERNMENT DOCUMENT - RETAIN FOR TAX PURPOSES', 105, 288, { align: 'center' });
    doc.text(`EMPLOYER ID: 12-3456789 | ISSUED: ${today.toLocaleDateString()}`, 105, 292, { align: 'center' });
    doc.save(`Paystub_W2_${item.name.replace(/\s+/g, '_')}.pdf`);
  };

  const generateJPG = async (item: FacultyMember) => {
    const container = document.getElementById('paystub-export-container');
    if (!container) return;

    const { annualSalary, monthlyGross, fedTax, stateTax, socSec, medicare, healthIns, dentalIns, totalDeductions, netPay } = calculateFinancials(item.salaryEstimate);
    const today = new Date();
    const lastWeek = new Date(today); lastWeek.setDate(today.getDate() - 7);

    container.innerHTML = `
      <div id="w2-capture" style="width: 800px; padding: 20px; background: white; border: 4px solid black; font-family: 'Courier New', Courier, monospace; color: black;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
          <div>
            <div style="font-size: 14px; font-weight: bold;">DEPARTMENT OF EDUCATION</div>
            <div style="font-size: 24px; font-weight: bold; margin-top: 5px;">${item.schoolName.toUpperCase()}</div>
            <div style="font-size: 14px; margin-top: 5px;">${item.schoolAddress.toUpperCase()}</div>
          </div>
          <div style="border: 2px solid black; padding: 10px; text-align: center; width: 180px;">
            <div style="font-size: 16px; font-weight: bold;">FORM W-2</div>
            <div style="font-size: 12px; margin-top: 5px;">WAGE STATEMENT</div>
          </div>
        </div>

        <hr style="border: 0; border-top: 2px solid black; margin-bottom: 20px;">

        <div style="display: flex; gap: 20px; margin-bottom: 20px;">
          <div style="flex: 1; border: 2px solid black; padding: 10px;">
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 10px; border-bottom: 1 solid black;">EMPLOYEE INFORMATION</div>
            <div style="font-size: 12px; margin-top: 5px;">NAME: ${item.name.toUpperCase()}</div>
            <div style="font-size: 12px; margin-top: 5px;">SSN: ***-**-${Math.floor(1000 + Math.random() * 9000)}</div>
            <div style="font-size: 12px; margin-top: 5px;">ID: F-2026-${Math.floor(10000 + Math.random() * 90000)}</div>
            <div style="font-size: 12px; margin-top: 5px;">POSITION: ${item.position.toUpperCase()}</div>
          </div>
          <div style="flex: 1; border: 2px solid black; padding: 10px;">
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 10px; border-bottom: 1px solid black;">PAY PERIOD INFORMATION</div>
            <div style="font-size: 12px; margin-top: 5px;">CHECK NO: P${Math.floor(1000000 + Math.random() * 9000000)}</div>
            <div style="font-size: 12px; margin-top: 5px;">PAY DATE: ${today.toLocaleDateString()}</div>
            <div style="font-size: 12px; margin-top: 5px;">PERIOD: ${lastWeek.toLocaleDateString()}</div>
            <div style="font-size: 12px; margin-top: 5px;">TO: ${today.toLocaleDateString()}</div>
          </div>
        </div>

        <div style="background: black; color: white; padding: 5px 10px; font-weight: bold; font-size: 14px;">SECTION A: EARNINGS</div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 2px solid black;">
          <tr style="background: #e6ebf5; font-size: 12px; text-align: left;">
            <th style="padding: 5px; border: 1px solid black;">CODE</th>
            <th style="padding: 5px; border: 1px solid black;">DESCRIPTION</th>
            <th style="padding: 5px; border: 1px solid black;">RATE</th>
            <th style="padding: 5px; border: 1px solid black;">HOURS</th>
            <th style="padding: 5px; border: 1px solid black;">CURRENT</th>
            <th style="padding: 5px; border: 1px solid black;">YTD</th>
          </tr>
          <tr style="font-size: 12px;">
            <td style="padding: 5px; border: 1px solid black;">001</td>
            <td style="padding: 5px; border: 1px solid black;">REGULAR SALARY</td>
            <td style="padding: 5px; border: 1px solid black;">---</td>
            <td style="padding: 5px; border: 1px solid black;">80.00</td>
            <td style="padding: 5px; border: 1px solid black;">${monthlyGross.toFixed(2)}</td>
            <td style="padding: 5px; border: 1px solid black;">${annualSalary.toFixed(2)}</td>
          </tr>
          <tr style="font-weight: bold; font-size: 12px;">
            <td colspan="4" style="padding: 5px; border: 1px solid black;">TOTAL GROSS PAY</td>
            <td style="padding: 5px; border: 1px solid black;">${monthlyGross.toFixed(2)}</td>
            <td style="padding: 5px; border: 1px solid black;">${annualSalary.toFixed(2)}</td>
          </tr>
        </table>

        <div style="background: black; color: white; padding: 5px 10px; font-weight: bold; font-size: 14px;">SECTION B: DEDUCTIONS & TAXES</div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 2px solid black;">
          <tr style="background: #e6ebf5; font-size: 12px; text-align: left;">
            <th style="padding: 5px; border: 1px solid black;">CODE</th>
            <th style="padding: 5px; border: 1px solid black;">DESCRIPTION</th>
            <th style="padding: 5px; border: 1px solid black;">CURRENT</th>
            <th style="padding: 5px; border: 1px solid black;">YTD</th>
          </tr>
          <tr style="font-size: 12px;"><td>100</td><td>FEDERAL INCOME TAX</td><td>$${fedTax.toFixed(2)}</td><td>$${(fedTax * 12).toFixed(2)}</td></tr>
          <tr style="font-size: 12px;"><td>101</td><td>STATE INCOME TAX</td><td>$${stateTax.toFixed(2)}</td><td>$${(stateTax * 12).toFixed(2)}</td></tr>
          <tr style="font-size: 12px;"><td>102</td><td>SOCIAL SECURITY (OASDI)</td><td>$${socSec.toFixed(2)}</td><td>$${(socSec * 12).toFixed(2)}</td></tr>
          <tr style="font-size: 12px;"><td>103</td><td>MEDICARE</td><td>$${medicare.toFixed(2)}</td><td>$${(medicare * 12).toFixed(2)}</td></tr>
          <tr style="font-size: 12px;"><td>104</td><td>HEALTH INSURANCE</td><td>$${healthIns.toFixed(2)}</td><td>$${(healthIns * 12).toFixed(2)}</td></tr>
          <tr style="font-size: 12px;"><td>105</td><td>DENTAL INSURANCE</td><td>$${dentalIns.toFixed(2)}</td><td>$${(dentalIns * 12).toFixed(2)}</td></tr>
          <tr style="font-weight: bold; font-size: 12px;">
            <td colspan="2" style="padding: 5px; border: 1px solid black;">TOTAL DEDUCTIONS</td>
            <td style="padding: 5px; border: 1px solid black;">${totalDeductions.toFixed(2)}</td>
            <td style="padding: 5px; border: 1px solid black;">${(totalDeductions * 12).toFixed(2)}</td>
          </tr>
        </table>

        <div style="background: black; color: white; padding: 20px; display: flex; justify-content: space-between; align-items: flex-end;">
          <div>
            <div style="font-size: 14px;">NET PAY</div>
            <div style="font-size: 42px; font-weight: bold; margin-top: 10px;">$${netPay.toFixed(2)}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 12px;">PAYMENT METHOD</div>
            <div style="font-size: 12px; margin-top: 5px;">Direct Deposit - Account ****${Math.floor(1000 + Math.random() * 8999)}</div>
            <div style="font-size: 14px; margin-top: 10px;">YTD NET: $${(netPay * 12).toFixed(2)}</div>
          </div>
        </div>

        <div style="text-align: center; font-size: 10px; color: #555; margin-top: 30px;">
          OFFICIAL GOVERNMENT DOCUMENT - RETAIN FOR TAX PURPOSES<br>
          EMPLOYER ID: 12-3456789 | ISSUED: ${today.toLocaleDateString()}
        </div>
      </div>
    `;

    const element = document.getElementById('w2-capture');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/jpeg', 0.85);
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `Paystub_W2_${item.name.replace(/\s+/g, '_')}.jpg`;
      link.click();
    } catch (err) {
      console.error("Error generating JPG", err);
    } finally {
      container.innerHTML = '';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Hasil Riset ({data.length})</h3>
          <p className="text-xs text-slate-500">Menganalisis profil guru & struktur gaji sekolah US</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onExportJson}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            Export JSON
          </button>
          <button
            onClick={onExportText}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            Export TXT
          </button>
          <button
            onClick={onExport}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            Export CSV
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Guru & Sumber</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Posisi</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Institusi</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Kontak & Dokumen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-900">{item.name}</div>
                  <div className="text-[10px] text-slate-400 mt-1 max-w-[150px] truncate underline cursor-help" title={item.sourceUrl}>
                    {item.sourceUrl}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 uppercase">
                    {item.position}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-bold text-slate-800">{item.schoolName}</div>
                  <div className="text-[11px] text-slate-500 mb-2">{item.schoolAddress}</div>
                  <div className="flex gap-1">
                    {item.isK12Unified ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-purple-600 text-white uppercase tracking-tighter">
                        K-12 Unified
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-200 text-slate-700 uppercase tracking-tighter">
                        {item.level.split('(')[0]}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 space-y-3">
                  <a 
                    href={`mailto:${item.email}`}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                      <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a.5.5 0 00.118.05L10 11.486l.441-.254a.5.5 0 00.118-.05L19 7.161V6a2 2 0 00-2-2H3z" />
                      <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
                    </svg>
                    {item.email}
                  </a>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => generatePDF(item)}
                      title="W-2 Paystub (PDF)"
                      className="flex items-center justify-center gap-1.5 px-2 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[9px] font-bold transition-all shadow-sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                        <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                      </svg>
                      PAYSTUB
                    </button>
                    <button 
                      onClick={() => generateJPG(item)}
                      title="W-2 Paystub (JPG)"
                      className="flex items-center justify-center gap-1.5 px-2 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[9px] font-bold transition-all shadow-sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                      W2 JPG
                    </button>
                    <button 
                      onClick={() => generateOfficialLetter(item)}
                      title="Employment Verification Letter (PDF)"
                      className="flex items-center justify-center gap-1.5 px-2 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-[9px] font-bold transition-all shadow-sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                        <path d="M3 4a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-1a2 2 0 00-2-2H5V5a2 2 0 012-2h9V2a2 2 0 00-2-2H5a4 4 0 00-4 4v1h2V4z" />
                        <path d="M12.903 11.312a1 1 0 001.188 0L19 7.433V14a2 2 0 01-2 2H9a2 2 0 01-2-2V7.433l4.903 3.879z" />
                      </svg>
                      LETTER
                    </button>
                    <button 
                      onClick={() => generateIDCard(item)}
                      disabled={generatingId === item.id}
                      title="Faculty ID Card (PNG)"
                      className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[9px] font-bold transition-all shadow-sm ${
                        generatingId === item.id 
                          ? 'bg-indigo-300 cursor-not-allowed text-white' 
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      {generatingId === item.id ? (
                        <svg className="animate-spin h-3 w-3 text-white" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                          <path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 4h3a3 3 0 006 0h3a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm2.5 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm2.45 4a2.5 2.5 0 10-4.9 0h4.9zM12 9a1 1 0 100 2h3a1 1 0 100-2h-3zm-1 4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                      ID CARD
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
