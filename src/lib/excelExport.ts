import type { MatchData } from "@/context/MatchDataProvider"
import type { PlayerProfile } from "@/data/fakeData"
import {
  buildRankingExportRows,
  buildResultsExportRows,
  getExportSafeFilenamePart,
  protectSpreadsheetCell,
  type ExportCell,
  type ExportRows,
} from "@/lib/csvExport"
import type { RankingPlayer } from "@/lib/ranking"
import {
  buildSeasonFinanceWorkbookRows,
  type SeasonFinanceTransparencyData,
} from "@/lib/seasonFinanceTransparency"

type WorkbookSheet = {
  name: string
  rows: ExportRows
}

type ZipEntry = {
  name: string
  data: Uint8Array
  crc: number
  offset: number
}

const encoder = new TextEncoder()

function escapeXml(value: string) {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function getColumnName(index: number) {
  let column = ""
  let current = index + 1

  while (current > 0) {
    const remainder = (current - 1) % 26
    column = String.fromCharCode(65 + remainder) + column
    current = Math.floor((current - 1) / 26)
  }

  return column
}

function getCellValue(value: ExportCell) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return { type: "number" as const, value: String(value) }
  }

  if (typeof value === "boolean") {
    return { type: "boolean" as const, value: value ? "1" : "0" }
  }

  return {
    type: "string" as const,
    value:
      value === null || value === undefined
        ? ""
        : String(protectSpreadsheetCell(value)),
  }
}

function getColumnWidths(rows: ExportRows) {
  const columnCount = rows.reduce(
    (maximum, row) => Math.max(maximum, row.length),
    0,
  )

  return Array.from({ length: columnCount }, (_, columnIndex) => {
    const maxLength = rows.slice(0, 250).reduce((maximum, row) => {
      const value = row[columnIndex]
      const text = value === null || value === undefined ? "" : String(value)
      return Math.max(maximum, text.length)
    }, 0)

    return Math.min(48, Math.max(10, maxLength + 2))
  })
}

function buildWorksheetXml(rows: ExportRows) {
  const safeRows = rows.length > 0 ? rows : [["Sin datos"]]
  const columnCount = safeRows.reduce(
    (maximum, row) => Math.max(maximum, row.length),
    1,
  )
  const lastCell = `${getColumnName(columnCount - 1)}${safeRows.length}`
  const columns = getColumnWidths(safeRows)
    .map(
      (width, index) =>
        `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`,
    )
    .join("")
  const rowXml = safeRows
    .map((row, rowIndex) => {
      const cells = row
        .map((cell, columnIndex) => {
          const reference = `${getColumnName(columnIndex)}${rowIndex + 1}`
          const parsed = getCellValue(cell)
          const style = rowIndex === 0 ? ' s="1"' : ""

          if (parsed.type === "number") {
            return `<c r="${reference}"${style}><v>${parsed.value}</v></c>`
          }

          if (parsed.type === "boolean") {
            return `<c r="${reference}" t="b"${style}><v>${parsed.value}</v></c>`
          }

          return `<c r="${reference}" t="inlineStr"${style}><is><t xml:space="preserve">${escapeXml(parsed.value)}</t></is></c>`
        })
        .join("")

      return `<row r="${rowIndex + 1}">${cells}</row>`
    })
    .join("")

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:${lastCell}"/>
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <sheetFormatPr defaultRowHeight="18"/>
  <cols>${columns}</cols>
  <sheetData>${rowXml}</sheetData>
  <autoFilter ref="A1:${lastCell}"/>
</worksheet>`
}

function buildWorkbookFiles({
  sheets,
  leagueName,
  seasonName,
}: {
  sheets: WorkbookSheet[]
  leagueName: string
  seasonName: string
}) {
  const createdAt = new Date().toISOString()
  const sheetDefinitions = sheets
    .map(
      (sheet, index) =>
        `<sheet name="${escapeXml(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`,
    )
    .join("")
  const sheetRelationships = sheets
    .map(
      (_, index) =>
        `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`,
    )
    .join("")
  const sheetContentTypes = sheets
    .map(
      (_, index) =>
        `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
    )
    .join("")

  const files: Record<string, string> = {
    "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  ${sheetContentTypes}
</Types>`,
    "_rels/.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`,
    "docProps/app.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Smash &amp; Lob</Application>
  <DocSecurity>0</DocSecurity>
  <ScaleCrop>false</ScaleCrop>
  <HeadingPairs><vt:vector size="2" baseType="variant"><vt:variant><vt:lpstr>Hojas</vt:lpstr></vt:variant><vt:variant><vt:i4>${sheets.length}</vt:i4></vt:variant></vt:vector></HeadingPairs>
  <TitlesOfParts><vt:vector size="${sheets.length}" baseType="lpstr">${sheets.map((sheet) => `<vt:lpstr>${escapeXml(sheet.name)}</vt:lpstr>`).join("")}</vt:vector></TitlesOfParts>
</Properties>`,
    "docProps/core.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>${escapeXml(`${leagueName} · ${seasonName}`)}</dc:title>
  <dc:creator>Smash &amp; Lob</dc:creator>
  <cp:lastModifiedBy>Smash &amp; Lob</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${createdAt}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${createdAt}</dcterms:modified>
</cp:coreProperties>`,
    "xl/workbook.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <bookViews><workbookView xWindow="0" yWindow="0" windowWidth="24000" windowHeight="14000"/></bookViews>
  <sheets>${sheetDefinitions}</sheets>
  <calcPr calcId="191029"/>
</workbook>`,
    "xl/_rels/workbook.xml.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${sheetRelationships}
  <Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    "xl/styles.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="11"/><name val="Aptos"/><family val="2"/></font>
    <font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Aptos Display"/><family val="2"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF19211B"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border><left style="thin"><color rgb="FFDDE3DC"/></left><right style="thin"><color rgb="FFDDE3DC"/></right><top style="thin"><color rgb="FFDDE3DC"/></top><bottom style="thin"><color rgb="FFDDE3DC"/></bottom><diagonal/></border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`,
  }

  sheets.forEach((sheet, index) => {
    files[`xl/worksheets/sheet${index + 1}.xml`] = buildWorksheetXml(sheet.rows)
  })

  return files
}

function createCrcTable() {
  return Array.from({ length: 256 }, (_, index) => {
    let value = index

    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) !== 0 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
    }

    return value >>> 0
  })
}

const crcTable = createCrcTable()

function calculateCrc32(data: Uint8Array) {
  let crc = 0xffffffff

  data.forEach((byte) => {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  })

  return (crc ^ 0xffffffff) >>> 0
}

function writeUint16(view: DataView, offset: number, value: number) {
  view.setUint16(offset, value, true)
}

function writeUint32(view: DataView, offset: number, value: number) {
  view.setUint32(offset, value >>> 0, true)
}

function getDosDateTime(date: Date) {
  const year = Math.max(1980, date.getFullYear())
  const time =
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    Math.floor(date.getSeconds() / 2)
  const day =
    ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()

  return { time, day }
}

function concatenate(parts: Uint8Array[]) {
  const totalLength = parts.reduce((total, part) => total + part.length, 0)
  const result = new Uint8Array(totalLength)
  let offset = 0

  parts.forEach((part) => {
    result.set(part, offset)
    offset += part.length
  })

  return result
}

function buildZip(files: Record<string, string>) {
  const now = new Date()
  const { time, day } = getDosDateTime(now)
  const localParts: Uint8Array[] = []
  const entries: ZipEntry[] = []
  let localOffset = 0

  Object.entries(files).forEach(([name, content]) => {
    const nameBytes = encoder.encode(name)
    const data = encoder.encode(content)
    const crc = calculateCrc32(data)
    const header = new Uint8Array(30 + nameBytes.length)
    const view = new DataView(header.buffer)

    writeUint32(view, 0, 0x04034b50)
    writeUint16(view, 4, 20)
    writeUint16(view, 6, 0x0800)
    writeUint16(view, 8, 0)
    writeUint16(view, 10, time)
    writeUint16(view, 12, day)
    writeUint32(view, 14, crc)
    writeUint32(view, 18, data.length)
    writeUint32(view, 22, data.length)
    writeUint16(view, 26, nameBytes.length)
    writeUint16(view, 28, 0)
    header.set(nameBytes, 30)

    localParts.push(header, data)
    entries.push({ name, data, crc, offset: localOffset })
    localOffset += header.length + data.length
  })

  const centralParts = entries.map((entry) => {
    const nameBytes = encoder.encode(entry.name)
    const header = new Uint8Array(46 + nameBytes.length)
    const view = new DataView(header.buffer)

    writeUint32(view, 0, 0x02014b50)
    writeUint16(view, 4, 20)
    writeUint16(view, 6, 20)
    writeUint16(view, 8, 0x0800)
    writeUint16(view, 10, 0)
    writeUint16(view, 12, time)
    writeUint16(view, 14, day)
    writeUint32(view, 16, entry.crc)
    writeUint32(view, 20, entry.data.length)
    writeUint32(view, 24, entry.data.length)
    writeUint16(view, 28, nameBytes.length)
    writeUint16(view, 30, 0)
    writeUint16(view, 32, 0)
    writeUint16(view, 34, 0)
    writeUint16(view, 36, 0)
    writeUint32(view, 38, 0)
    writeUint32(view, 42, entry.offset)
    header.set(nameBytes, 46)

    return header
  })
  const centralDirectory = concatenate(centralParts)
  const localDirectory = concatenate(localParts)
  const end = new Uint8Array(22)
  const endView = new DataView(end.buffer)

  writeUint32(endView, 0, 0x06054b50)
  writeUint16(endView, 4, 0)
  writeUint16(endView, 6, 0)
  writeUint16(endView, 8, entries.length)
  writeUint16(endView, 10, entries.length)
  writeUint32(endView, 12, centralDirectory.length)
  writeUint32(endView, 16, localDirectory.length)
  writeUint16(endView, 20, 0)

  return concatenate([localDirectory, centralDirectory, end])
}

function downloadWorkbook(filename: string, content: Uint8Array) {
  const workbookBuffer = new ArrayBuffer(content.byteLength)
  new Uint8Array(workbookBuffer).set(content)

  const blob = new Blob([workbookBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function exportSeasonExcelWorkbook({
  leagueName,
  seasonName,
  ranking,
  matches,
  players,
}: {
  leagueName: string
  seasonName: string
  ranking: RankingPlayer[]
  matches: MatchData[]
  players: PlayerProfile[]
}) {
  const files = buildWorkbookFiles({
    leagueName,
    seasonName,
    sheets: [
      { name: "Clasificación", rows: buildRankingExportRows(ranking) },
      {
        name: "Resultados",
        rows: buildResultsExportRows({ matches, players }),
      },
    ],
  })

  downloadWorkbook(
    `${getExportSafeFilenamePart(leagueName)}-${getExportSafeFilenamePart(seasonName)}-datos.xlsx`,
    buildZip(files),
  )
}

export function exportSeasonFinanceExcelWorkbook(
  data: SeasonFinanceTransparencyData,
) {
  const rows = buildSeasonFinanceWorkbookRows(data)
  const files = buildWorkbookFiles({
    leagueName: data.leagueName,
    seasonName: data.seasonName,
    sheets: [
      { name: "Resumen", rows: rows.summaryRows },
      { name: "Pagos", rows: rows.paymentsRows },
      { name: "Gastos", rows: rows.expensesRows },
    ],
  })

  downloadWorkbook(
    `${getExportSafeFilenamePart(data.leagueName)}-${getExportSafeFilenamePart(data.seasonName)}-transparencia-gastos.xlsx`,
    buildZip(files),
  )
}
