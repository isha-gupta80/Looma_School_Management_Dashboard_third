"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileSpreadsheet, Check, AlertCircle, Download } from "lucide-react"
import type { School } from "@/lib/types"

interface SpreadsheetImportProps {
  onImport: (schools: Partial<School>[]) => Promise<void>
  isOpen: boolean
  onClose: () => void
}

interface ParsedRow {
  name: string
  district: string
  province: string
  palika: string
  latitude: string
  longitude: string
  headmaster: string
  email: string
  phone: string
  loomaId: string
  loomaCount: string
  status: string
}

export function SpreadsheetImport({ onImport, isOpen, onClose }: SpreadsheetImportProps) {
  const [parsedData, setParsedData] = useState<ParsedRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importSuccess, setImportSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const parseCSV = (text: string): ParsedRow[] => {
    const lines = text.trim().split('\n')
    if (lines.length < 2) throw new Error('CSV must have header row and at least one data row')
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''))
    const rows: ParsedRow[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/['"]/g, ''))
      const row: Record<string, string> = {}
      
      headers.forEach((header, idx) => {
        row[header] = values[idx] || ''
      })

      rows.push({
        name: row['name'] || row['school name'] || row['school_name'] || '',
        district: row['district'] || '',
        province: row['province'] || '',
        palika: row['palika'] || row['municipality'] || '',
        latitude: row['latitude'] || row['lat'] || '',
        longitude: row['longitude'] || row['lng'] || row['long'] || '',
        headmaster: row['headmaster'] || row['principal'] || row['contact_name'] || '',
        email: row['email'] || row['contact_email'] || '',
        phone: row['phone'] || row['contact_phone'] || '',
        loomaId: row['looma_id'] || row['loomaid'] || row['looma_unique_id'] || row['device_id'] || '',
        loomaCount: row['looma_count'] || row['loomas'] || row['devices'] || '1',
        status: row['status'] || 'offline',
      })
    }

    return rows.filter(r => r.name)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setParsedData([])
    setImportSuccess(false)

    try {
      const text = await file.text()
      const parsed = parseCSV(text)
      if (parsed.length === 0) {
        throw new Error('No valid school data found in file')
      }
      setParsedData(parsed)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file')
    }
  }

  const handleImport = async () => {
    setIsImporting(true)
    setError(null)

    try {
      const schools: Partial<School>[] = parsedData.map((row, idx) => ({
        id: `import-${Date.now()}-${idx}`,
        name: row.name,
        district: row.district,
        province: row.province,
        palika: row.palika,
        latitude: parseFloat(row.latitude) || 27.7 + Math.random(),
        longitude: parseFloat(row.longitude) || 85.3 + Math.random(),
        contact: {
          headmaster: row.headmaster,
          email: row.email,
          phone: row.phone,
        },
        loomaId: row.loomaId || undefined,
        loomaCount: parseInt(row.loomaCount) || 1,
        status: (row.status === 'online' || row.status === 'offline' || row.status === 'maintenance') 
          ? row.status 
          : 'offline',
        lastSeen: new Date().toISOString(),
      }))

      await onImport(schools)
      setImportSuccess(true)
      setTimeout(() => {
        onClose()
        setParsedData([])
        setImportSuccess(false)
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setIsImporting(false)
    }
  }

  const downloadTemplate = () => {
    const template = `name,district,province,palika,latitude,longitude,headmaster,email,phone,looma_id,looma_count,status
Shree Saraswati Secondary School,Kathmandu,Bagmati,Kathmandu Metropolitan,27.7172,85.3240,Ram Bahadur Thapa,saraswati.school@edu.np,+977-1-4567890,LMA-001,5,online
Himalaya Higher Secondary School,Kaski,Gandaki,Pokhara Metropolitan,28.2096,83.9856,Krishna Prasad Sharma,himalaya.hss@edu.np,+977-61-234567,LMA-002,8,online
Buddha Secondary School,Rupandehi,Lumbini,Siddharthanagar Municipality,27.5000,83.4500,Gita Devi Paudel,buddha.school@edu.np,+977-71-345678,LMA-003,3,offline`

    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'school_import_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Schools from Spreadsheet
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file with school data. Download the template for the correct format.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {importSuccess && (
            <Alert className="bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Successfully imported {parsedData.length} schools!
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Upload CSV File</CardTitle>
              <CardDescription className="text-xs">
                Required columns: name, district, province. Optional: palika, latitude, longitude, headmaster, email, phone, looma_id, looma_count, status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Select CSV File
                </Button>
                <Button variant="secondary" onClick={downloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </div>
            </CardContent>
          </Card>

          {parsedData.length > 0 && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Preview ({parsedData.length} schools)</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-64 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Name</TableHead>
                        <TableHead className="text-xs">District</TableHead>
                        <TableHead className="text-xs">Province</TableHead>
                        <TableHead className="text-xs">Headmaster</TableHead>
                        <TableHead className="text-xs">Looma ID</TableHead>
                        <TableHead className="text-xs">Loomas</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.slice(0, 10).map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-xs font-medium">{row.name}</TableCell>
                          <TableCell className="text-xs">{row.district}</TableCell>
                          <TableCell className="text-xs">{row.province}</TableCell>
                          <TableCell className="text-xs">{row.headmaster}</TableCell>
                          <TableCell className="text-xs font-mono">{row.loomaId || '(auto)'}</TableCell>
                          <TableCell className="text-xs">{row.loomaCount}</TableCell>
                          <TableCell className="text-xs capitalize">{row.status}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {parsedData.length > 10 && (
                    <p className="text-xs text-gray-500 p-2 text-center">
                      ... and {parsedData.length - 10} more schools
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={parsedData.length === 0 || isImporting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isImporting ? 'Importing...' : `Import ${parsedData.length} Schools`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
