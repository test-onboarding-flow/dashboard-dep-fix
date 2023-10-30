import { ReactNode } from "react"

type RecentResources = {
    name: string
    to: string
} & ({ image: string } | { icon: ReactNode })

export interface ResourceCardProps {
    name: string
    icon: ReactNode
    count?: number
    to: string
    recentResources: RecentResources[]
    createResourceLink: string
}
