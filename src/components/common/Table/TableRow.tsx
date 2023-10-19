import React, { PropsWithChildren } from 'react'
import { TableRowProps } from './types'

export const TableRow = (props: PropsWithChildren<TableRowProps>) => {
    const { children, onMouseEnter, onMouseLeave, onClick } = props
    return (
        <div className="dc-table__row" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onClick={onClick}>
            {children}
        </div>
    )
}
