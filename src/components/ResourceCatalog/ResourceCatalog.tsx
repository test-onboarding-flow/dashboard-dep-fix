import React, { SyntheticEvent } from 'react'
import HeaderWithCreateButton from '../common/header/HeaderWithCreateButton/HeaderWithCreateButton'
import { ResourceCardList } from './ResourceCardList'
import { ReactComponent as AppIcon } from '../../assets/icons/ic-devtron-app.svg'
import { ReactComponent as JobIcon } from '../../assets/icons/ic-job-node.svg'
import { ReactComponent as Search } from '../../assets/icons/ic-search.svg'
import { ResourceCardProps } from './types'

const cardList: ResourceCardProps[] = [
    {
        name: 'Application',
        icon: <AppIcon className="icon-dim-48" />,
        count: 69,
        to: '/application',
        recentResources: [
            { image: 'https://placehold.co/40', name: 'dashboard', to: '/dashboard' },
            { image: 'https://placehold.co/40', name: 'dashboard', to: '/dashboard' },
            { image: 'https://placehold.co/40', name: 'dashboard', to: '/dashboard' },
            { image: 'https://placehold.co/40', name: 'dashboard', to: '/dashboard' },
            { image: 'https://placehold.co/40', name: 'dashboard', to: '/dashboard' },
            { image: 'https://placehold.co/40', name: 'dashboard', to: '/dashboard' },
            { image: 'https://placehold.co/40', name: 'dashboard', to: '/dashboard' },
            { image: 'https://placehold.co/40', name: 'dashboard', to: '/dashboard' },
            { image: 'https://placehold.co/40', name: 'dashboard', to: '/dashboard' },
            { image: 'https://placehold.co/40', name: 'dashboard', to: '/dashboard' },
            { image: 'https://placehold.co/40', name: 'dashboard', to: '/dashboard' },
            { image: 'https://placehold.co/40', name: 'dashboard', to: '/dashboard' },
        ],
        createResourceLink: '',
    },
    {
        name: 'Job',
        icon: <JobIcon className="icon-dim-48 dc__icon-bg-color br-4 p-8" />,
        count: 69,
        to: '/Job',
        recentResources: [],
        createResourceLink: '',
    },
    {
        name: 'Application',
        icon: <AppIcon className="icon-dim-48" />,
        count: 69,
        to: '/application',
        recentResources: [
            { image: 'https://placehold.co/40', name: 'dashboard', to: '/dashboard' },
            { image: 'https://placehold.co/40', name: 'dashboard', to: '/dashboard' },
            { image: 'https://placehold.co/40', name: 'dashboard', to: '/dashboard' },
            { image: 'https://placehold.co/40', name: 'dashboard', to: '/dashboard' },
            { image: 'https://placehold.co/40', name: 'dashboard', to: '/dashboard' },
            { image: 'https://placehold.co/40', name: 'dashboard', to: '/dashboard' },
        ],
        createResourceLink: '',
    },
    {
        name: 'Job',
        icon: <JobIcon className="icon-dim-48 dc__icon-bg-color br-4 p-8" />,
        count: 69,
        to: '/Job',
        recentResources: [
            { image: 'https://placehold.co/40', name: 'dashboard', to: '/dashboard' },
            { image: 'https://placehold.co/60', name: 'dashboard', to: '/dashboard' },
        ],
        createResourceLink: '',
    },
    {
        name: 'Application',
        icon: <AppIcon className="icon-dim-48" />,
        count: 69,
        to: '/application',
        recentResources: [
            { image: 'https://placehold.co/40', name: 'dashboard', to: '/dashboard' },
            { image: 'https://placehold.co/40', name: 'dashboard', to: '/dashboard' },
            { image: 'https://placehold.co/40', name: 'dashboard', to: '/dashboard' },
            { image: 'https://placehold.co/40', name: 'dashboard', to: '/dashboard' },
            { image: 'https://placehold.co/40', name: 'dashboard', to: '/dashboard' },
            { image: 'https://placehold.co/40', name: 'dashboard', to: '/dashboard' },
        ],
        createResourceLink: '',
    },
    {
        name: 'Job',
        icon: <JobIcon className="icon-dim-48 dc__icon-bg-color br-4 p-8" />,
        count: 69,
        to: '/Job',
        recentResources: [
            { image: 'https://placehold.co/40', name: 'dashboard', to: '/dashboard' },
            { image: 'https://placehold.co/60', name: 'dashboard', to: '/dashboard' },
        ],
        createResourceLink: '',
    },
    {
        name: 'Application',
        icon: <AppIcon className="icon-dim-48" />,
        count: 69,
        to: '/application',
        recentResources: [
            { image: 'https://placehold.co/40', name: 'dashboard', to: '/dashboard' },
            { image: 'https://placehold.co/40', name: 'dashboard', to: '/dashboard' },
            { image: 'https://placehold.co/40', name: 'dashboard', to: '/dashboard' },
            { image: 'https://placehold.co/40', name: 'dashboard', to: '/dashboard' },
            { image: 'https://placehold.co/40', name: 'dashboard', to: '/dashboard' },
            { image: 'https://placehold.co/40', name: 'dashboard', to: '/dashboard' },
        ],
        createResourceLink: '',
    },
    {
        name: 'Job',
        icon: <JobIcon className="icon-dim-48 dc__icon-bg-color br-4 p-8" />,
        count: 69,
        to: '/Job',
        recentResources: [
            { image: 'https://placehold.co/40', name: 'dashboard', to: '/dashboard' },
            { image: 'https://placehold.co/60', name: 'dashboard', to: '/dashboard' },
        ],
        createResourceLink: '',
    },
]

const ResourceCatalog = ({ isSuperAdmin }) => {
    return (
        <div className="fs-13 lh-20 bcn-0">
            <HeaderWithCreateButton headerName="Dashboard" isSuperAdmin={isSuperAdmin} />
            <div className="flex">
                <div className="flexbox-col flex-align-center dc__gap-20 pt-32 pb-32 pr-32 pl-32 dc__mxw-1200">
                    <ResourceCardList cardList={cardList} />
                </div>
            </div>
        </div>
    )
}

export default ResourceCatalog
