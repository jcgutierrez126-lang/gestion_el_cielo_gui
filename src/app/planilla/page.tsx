"use client"

// Planilla Semanal de Labores — Finca El Cielo
// Formato: A4 landscape · basado en Planilla nueva.xlsx tab "Labores"

import { useEffect, useState } from "react"
import { api, type Lote, type TipoLabor } from "@/lib/api"

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
const NUM_FILAS = 20

const s = {
  cell: {
    border: "1px solid #000",
    verticalAlign: "middle" as const,
    fontSize: "7.5px",
    padding: "0 2px",
    height: "22px",
  } as React.CSSProperties,
  th: {
    border: "1px solid #000",
    padding: "2px 2px",
    textAlign: "center" as const,
    fontSize: "7.5px",
    fontWeight: "bold" as const,
    backgroundColor: "#ddd",
    verticalAlign: "middle" as const,
  } as React.CSSProperties,
}

function line(w = 100) {
  return (
    <span style={{ display: "inline-block", borderBottom: "1px solid #000", width: `${w}px` }}>&nbsp;</span>
  )
}

export default function PlanillaPage() {
  const [lotes, setLotes] = useState<Lote[]>([])
  const [labores, setLabores] = useState<TipoLabor[]>([])

  useEffect(() => {
    api.produccion.lotes.list().then(r => setLotes(r)).catch(() => {})
    api.nomina.tiposLabor.list().then(r => setLabores(r)).catch(() => {})
  }, [])

  return (
    <div style={{ fontFamily: "Arial, sans-serif", color: "#000", background: "#fff" }}>

      {/* Barra de acción — no se imprime */}
      <div className="print:hidden" style={{
        display: "flex", gap: "12px", padding: "10px 16px",
        background: "#f4f4f4", borderBottom: "1px solid #ddd", alignItems: "center",
      }}>
        <button
          onClick={() => window.print()}
          style={{ padding: "7px 20px", background: "#000", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", fontSize: "13px", cursor: "pointer" }}
        >
          Imprimir (Ctrl+P)
        </button>
        <span style={{ fontSize: "12px", color: "#666" }}>
          1 página A4 landscape · formato Planilla nueva.xlsx tab Labores
        </span>
        <a href="/nomina/control-semanal" style={{ marginLeft: "auto", fontSize: "12px", color: "#1a73e8", textDecoration: "none" }}>
          ← Control Semanal
        </a>
      </div>

      {/* ═══════════════════════════════════════
          PLANILLA (página única landscape A4)
      ═══════════════════════════════════════ */}
      <div style={{ padding: "6mm", boxSizing: "border-box" }}>

        {/* Encabezado */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "2px solid #000", paddingBottom: "4px", marginBottom: "5px" }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 900, letterSpacing: "-0.5px" }}>Finca El Cielo</div>
            <div style={{ fontSize: "8px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.7px", color: "#444" }}>
              Planilla Semanal de Labores
            </div>
          </div>
          <div style={{ display: "flex", gap: "18px", fontSize: "8px", alignItems: "flex-end" }}>
            <span>Semana #: {line(40)}</span>
            <span>Del: {line(90)}</span>
            <span>Al: {line(90)}</span>
          </div>
        </div>

        {/* Leyenda lotes */}
        {lotes.filter(l => l.abreviatura).length > 0 && (
          <div style={{
            display: "flex", flexWrap: "wrap", gap: "3px 10px",
            border: "1px solid #ccc", borderRadius: "2px",
            padding: "3px 6px", marginBottom: "3px",
            fontSize: "7px", backgroundColor: "#fafafa",
          }}>
            <span style={{ fontWeight: "bold", marginRight: "2px" }}>Lotes:</span>
            {lotes.filter(l => l.abreviatura).map(l => (
              <span key={l.id}><b>{l.abreviatura}</b>={l.nombre}</span>
            ))}
          </div>
        )}

        {/* Leyenda labores */}
        {labores.filter(l => l.abreviatura).length > 0 && (
          <div style={{
            display: "flex", flexWrap: "wrap", gap: "3px 10px",
            border: "1px solid #ccc", borderRadius: "2px",
            padding: "3px 6px", marginBottom: "5px",
            fontSize: "7px", backgroundColor: "#fafafa",
          }}>
            <span style={{ fontWeight: "bold", marginRight: "2px" }}>Labores:</span>
            {labores.filter(l => l.abreviatura).map(l => (
              <span key={l.id}><b>{l.abreviatura}</b>={l.nombre}</span>
            ))}
            <span style={{ marginLeft: "8px", color: "#555" }}>
              <b>K</b>=Kilos&nbsp;&nbsp;<b>C</b>=Contrato&nbsp;&nbsp;vacío=Jornal
            </span>
            <span style={{ color: "#555" }}>
              <b>C o B:</b> C=Café / B=Banano
            </span>
          </div>
        )}

        {/* Tabla principal */}
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
          <colgroup>
            {/* Nombre */}
            <col style={{ width: "8%" }} />
            {/* 6 días × 4 columnas = 24 cols */}
            {DIAS.flatMap((_, i) => [
              <col key={`l${i}`} style={{ width: "3.6%" }} />,   // Lote
              <col key={`lb${i}`} style={{ width: "3.6%" }} />,  // Labor
              <col key={`c${i}`} style={{ width: "2.4%" }} />,   // C o B
              <col key={`ca${i}`} style={{ width: "3%" }} />,    // Cant.
            ])}
            {/* 1/2 */}
            <col style={{ width: "2%" }} />
            {/* $ Jornal / $ Kilo */}
            <col style={{ width: "5%" }} />
            {/* K o C */}
            <col style={{ width: "2.4%" }} />
            {/* Valor Total */}
            <col style={{ width: "5%" }} />
          </colgroup>

          <thead>
            {/* Fila 1: día nombres */}
            <tr>
              <th style={{ ...s.th }} rowSpan={2}>Nombre</th>
              {DIAS.map(dia => (
                <th key={dia} style={{ ...s.th }} colSpan={4}>{dia}</th>
              ))}
              <th style={{ ...s.th, fontSize: "6.5px" }} rowSpan={2}>1/2</th>
              <th style={{ ...s.th, fontSize: "6.5px" }} rowSpan={2}>$ Jornal<br />$ Kilo</th>
              <th style={{ ...s.th, fontSize: "6.5px" }} rowSpan={2}>K<br />o<br />C</th>
              <th style={{ ...s.th, fontSize: "6.5px" }} rowSpan={2}>Valor<br />Total</th>
            </tr>
            {/* Fila 2: subcolumnas */}
            <tr>
              {DIAS.map(dia => (
                <>
                  <th key={`${dia}-lote`} style={{ ...s.th, fontSize: "6.5px" }}>Lote</th>
                  <th key={`${dia}-labor`} style={{ ...s.th, fontSize: "6.5px" }}>Labor</th>
                  <th key={`${dia}-cob`} style={{ ...s.th, fontSize: "6.5px" }}>C/B</th>
                  <th key={`${dia}-cant`} style={{ ...s.th, fontSize: "6.5px" }}>Cant.</th>
                </>
              ))}
            </tr>
          </thead>

          <tbody>
            {Array.from({ length: NUM_FILAS }).map((_, i) => (
              <tr key={i} style={{ height: "21px" }}>
                {/* Nombre */}
                <td style={{ ...s.cell, color: "#aaa", fontSize: "6.5px", paddingLeft: "3px" }}>{i + 1}</td>
                {/* 24 celdas de días */}
                {Array.from({ length: 24 }).map((__, j) => (
                  <td key={j} style={s.cell} />
                ))}
                {/* 1/2 */}
                <td style={{ ...s.cell, textAlign: "center" }} />
                {/* $ J/K */}
                <td style={s.cell} />
                {/* K o C */}
                <td style={{ ...s.cell, textAlign: "center" }} />
                {/* Valor Total */}
                <td style={s.cell} />
              </tr>
            ))}

            {/* Fila total */}
            <tr style={{ height: "22px", backgroundColor: "#ebebeb" }}>
              <td colSpan={25} style={{ ...s.cell, textAlign: "right", fontWeight: "bold", paddingRight: "6px", fontSize: "7px" }}>
                TOTAL SEMANA →
              </td>
              <td colSpan={3} style={s.cell} />
              <td style={{ ...s.cell, fontWeight: "bold", fontSize: "8.5px" }} />
            </tr>
          </tbody>
        </table>

        {/* Pie */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", fontSize: "8px" }}>
          <span>Mayordomo: {line(130)}</span>
          <span>Firma: {line(100)}</span>
          <span>Fecha entrega: {line(90)}</span>
          <span style={{ color: "#999" }}>Finca El Cielo</span>
        </div>
      </div>

      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          @page { size: A4 landscape; margin: 6mm; }
          body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  )
}
