import { useState, useMemo } from 'react'
import type { ExerciseRecord } from '@/types/exercise'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, Filter } from 'lucide-react'

interface ExerciseTableProps {
  data: ExerciseRecord[]
}

type SortField = 'Date Lifted' | 'Exercise' | 'Weight (lb)' | 'Reps' | 'Percentile (%)'

export function ExerciseTable({ data }: ExerciseTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedExercise, setSelectedExercise] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [sortField, setSortField] = useState<SortField>('Date Lifted')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Unique exercises list for quick filter dropdown/tabs
  const uniqueExercises = useMemo(() => {
    const set = new Set<string>()
    data.forEach((row) => {
      if (row.Exercise) set.add(row.Exercise)
    })
    return Array.from(set).sort()
  }, [data])

  // Filtered & Sorted list
  const filteredData = useMemo(() => {
    return data
      .filter((row) => {
        const matchesExerciseFilter =
          selectedExercise === 'all' || row.Exercise === selectedExercise
        const matchesSearch =
          searchTerm === '' ||
          row.Exercise?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          row['Date Lifted']?.toLowerCase().includes(searchTerm.toLowerCase())
        return matchesExerciseFilter && matchesSearch
      })
      .sort((a, b) => {
        const valA = a[sortField] ?? ''
        const valB = b[sortField] ?? ''

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortOrder === 'asc' ? valA - valB : valB - valA
        }

        const strA = String(valA)
        const strB = String(valB)
        return sortOrder === 'asc'
          ? strA.localeCompare(strB)
          : strB.localeCompare(strA)
      })
  }, [data, searchTerm, selectedExercise, sortField, sortOrder])

  // Pagination calculation
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredData.slice(start, start + pageSize)
  }, [filteredData, currentPage, pageSize])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
    setCurrentPage(1)
  }

  const handleSearchChange = (val: string) => {
    setSearchTerm(val)
    setCurrentPage(1)
  }

  const handleExerciseChange = (val: string) => {
    setSelectedExercise(val)
    setCurrentPage(1)
  }

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search exercise or date..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <Filter className="h-3.5 w-3.5" />
            <span>Filter:</span>
          </div>
          <select
            aria-label="Filter by exercise"
            value={selectedExercise}
            onChange={(e) => handleExerciseChange(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">All Exercises ({uniqueExercises.length})</option>
            {uniqueExercises.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <select
            aria-label="Rows per page"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              setCurrentPage(1)
            }}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value={10}>10 rows</option>
            <option value={15}>15 rows</option>
            <option value={25}>25 rows</option>
            <option value={50}>50 rows</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer hover:text-foreground transition select-none"
                onClick={() => handleSort('Date Lifted')}
              >
                <div className="flex items-center gap-1.5">
                  Date
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:text-foreground transition select-none"
                onClick={() => handleSort('Exercise')}
              >
                <div className="flex items-center gap-1.5">
                  Exercise
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:text-foreground transition select-none text-right"
                onClick={() => handleSort('Weight (lb)')}
              >
                <div className="flex items-center justify-end gap-1.5">
                  Weight (lb)
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </TableHead>
              <TableHead className="text-right">Weight (kg)</TableHead>
              <TableHead
                className="cursor-pointer hover:text-foreground transition select-none text-right"
                onClick={() => handleSort('Reps')}
              >
                <div className="flex items-center justify-end gap-1.5">
                  Reps
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </TableHead>
              <TableHead className="text-right">Bodyweight (lb)</TableHead>
              <TableHead
                className="cursor-pointer hover:text-foreground transition select-none text-center"
                onClick={() => handleSort('Percentile (%)')}
              >
                <div className="flex items-center justify-center gap-1.5">
                  Percentile
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </TableHead>
              <TableHead className="text-center">Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-28 text-center text-muted-foreground">
                  No records match your criteria.
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, index) => {
                const isWarmup = Number(row.Warmup) === 1
                const percentile = Number(row['Percentile (%)'])

                return (
                  <TableRow key={index} className="hover:bg-muted/40 transition">
                    <TableCell className="font-mono text-xs whitespace-nowrap text-muted-foreground">
                      {row['Date Lifted']}
                    </TableCell>
                    <TableCell className="font-medium whitespace-nowrap">
                      {row.Exercise}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {row['Weight (lb)'] || '-'}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {row['Weight (kg)'] || '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {row.Reps ?? '-'}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {row['Bodyweight (lb)'] || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {!isNaN(percentile) && percentile > 0 ? (
                        <Badge
                          variant={percentile >= 75 ? 'default' : 'secondary'}
                          className="font-mono text-xs"
                        >
                          {percentile}%
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {isWarmup ? (
                        <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800 text-[11px] px-2">
                          Warmup
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground text-[11px] px-2">
                          Working
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground px-1">
        <div>
          Showing{' '}
          <span className="font-semibold text-foreground">
            {filteredData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
          </span>{' '}
          to{' '}
          <span className="font-semibold text-foreground">
            {Math.min(currentPage * pageSize, filteredData.length)}
          </span>{' '}
          of <span className="font-semibold text-foreground">{filteredData.length}</span> records
          {filteredData.length !== data.length && ` (filtered from ${data.length} total)`}
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            aria-label="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-3 text-xs font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            aria-label="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
