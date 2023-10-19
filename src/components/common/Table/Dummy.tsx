import React, { useState } from 'react'

import { GenericEmptyState, Grid } from '@devtron-labs/devtron-fe-common-lib'

import { TableHeaderCell } from './TableHeaderCell'
import { TableRow } from './TableRow'
import { TableCell } from './TableCell'
import { SortOrder, TableBodyConfig, TableProps } from './types'
import './table.scss'

/**
 * Returns the next sort order to be applied to the header cell
 */
const getRequestedSortOrder = ({ clickedHeaderCellId, sortedHeaderCellId, currentSortOrder }): SortOrder => {
    if (clickedHeaderCellId === sortedHeaderCellId) {
        if (!currentSortOrder) {
            return 'ASC'
        }
        return currentSortOrder === 'ASC' ? 'DESC' : null
    } else {
        return 'ASC'
    }
}

/**
 * Generic table component with the support for following:
 * - Config based headers and body
 * - Empty state
 * - Sorting
 * - Action Buttons
 * - Tooltips for header (with icon) and body cells
 * - Custom component rendering support in the configuration
 * - Sticky header
 *
 * @example Default usage
 * ```tsx
 * const tableData = {
 *  headers: [...],
 *  body: [...],
 *  onRowClick: () => {},
 *  sortConfig: {...},
 *  actionButtons: [...],
 *  emptyStateProps: {...},
 * }
 *
 * <Table {...tableData} />
 * ```
 *
 * Notes:
 * - Override the `dc-table__header-cell--{size}` for customizing the column widths, where size can be 'xs', 'sm', 'md', 'lg' or 'xl'.
 * - The component handles the sorting order but the state needs to handled using callback.
 */
export const Table = (props: TableProps) => {
    const { actionButtons, headers, body, onRowClick, sortConfig, emptyStateProps } = props
    const [currentHoveredRow, setCurrentHoveredRow] = useState<TableBodyConfig['id']>()

    const handleHover = (e, { id: rowId, eventType }: { id: TableBodyConfig['id']; eventType: 'enter' | 'leave' }) => {
        setCurrentHoveredRow(eventType === 'enter' ? rowId : null)
    }

    return (
        <div className="dc__overflow-scroll max-w-100 max-h-100">
            {/* Table header */}
            <Grid container spacing={0} containerClass="w-100">
                {headers.map((header, index) => (
                    <Grid
                        item
                        xs={1}
                        key={`header-cell-${header.id}`}
                        // {...header}
                        // onClick={
                        //     header.isSortable
                        //         ? (e) =>
                        //               sortConfig?.sortFunction?.(e, {
                        //                   clickedHeaderCellId: header.id,
                        //                   requestedSortOrder: getRequestedSortOrder({
                        //                       clickedHeaderCellId: header.id,
                        //                       sortedHeaderCellId: sortConfig.sortedHeaderCellId,
                        //                       currentSortOrder: sortConfig.order,
                        //                   }),
                        //               })
                        //         : undefined
                        // }
                        // sortOrder={sortConfig.sortedHeaderCellId === header.id ? sortConfig.order : undefined}
                    >
                        {header.value}
                    </Grid>
                ))}
            </Grid>
            {body.length === 0 ? (
                <div>No Results</div>
            ) : (
                body.map((row) => (
                    <Grid container spacing={0} containerClass="w-100 dc__overflow-hidden dc__hover-n50" key={row.id}>
                        {(Array.isArray(row.data)
                            ? row.data
                            : row.data({ rowId: row.id, isHovered: currentHoveredRow === row.id })
                        ).map((cellData, index) => (
                            <Grid item xs={1} key={`row-${row.id}-cell-${index}`}>
                                Hello {index}
                            </Grid>
                        ))}
                    </Grid>
                ))
            )}
        </div>
    )
}
