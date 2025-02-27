import React from 'react'
import { MultiValue } from 'react-select'
import { ResponseType } from '@devtron-labs/devtron-fe-common-lib'
import { LabelTag, OptionType } from '../app/types'
import { CLUSTER_PAGE_TAB } from './constants'
import { EditModeType } from '../v2/appDetails/k8Resource/nodeDetail/NodeDetailTabs/terminal/constants'
import { ApiResourceGroupType, ClusterOptionType, K8SObjectMapType } from '../ResourceBrowser/Types'

export enum ERROR_TYPE {
    VERSION_ERROR = 'K8s Version diff',
    OTHER = 'OTHER',
}

export enum EFFECT_TYPE {
    NoSchedule = 'NoSchedule',
    PreferNoSchedule = 'PreferNoSchedule',
    NoExecute = 'NoExecute',
}
export interface NodeListSearchFliterType {
    defaultVersion: OptionType
    nodeK8sVersions: string[]
    selectedVersion: OptionType
    setSelectedVersion: React.Dispatch<React.SetStateAction<OptionType>>
    appliedColumns: MultiValue<ColumnMetadataType>
    setAppliedColumns: React.Dispatch<React.SetStateAction<MultiValue<ColumnMetadataType>>>
    selectedSearchTextType: string
    setSelectedSearchTextType: React.Dispatch<React.SetStateAction<string>>
    searchText: string
    setSearchText: React.Dispatch<React.SetStateAction<string>>
    searchedTextMap: Map<string, string>
    setSearchedTextMap: React.Dispatch<React.SetStateAction<Map<string, string>>>
}
export interface ResourceDetail {
    name: string
    capacity: string
    allocatable: string
    usage: string
    request: string
    limit: string
    usagePercentage: string
    requestPercentage: string
    limitPercentage: string
}
export interface ClusterCapacityType {
    nodeK8sVersions: string[]
    nodeErrors: Record<string, string>[]
    cpu: ResourceDetail
    memory: ResourceDetail
}

export interface NodeDetailsType {
    nodeName: string
    nodeGroup: string
    taints?: NodeTaintType[]
}
export interface ClusterDetail {
    id: number
    name: string
    nodeCount: number
    nodeErrors: Record<string, string>[]
    errorInNodeListing: string
    nodeK8sVersions: string[]
    cpu: ResourceDetail
    memory: ResourceDetail
    serverVersion: string
    nodeNames?: string[]
    nodeDetails?: NodeDetailsType[]
    isVirtualCluster?: boolean
}
export interface ClusterDescriptionType {
    clusterId: number
    clusterName: string
    serverUrl:string,
    description:string,
    clusterCreatedBy: string
    clusterCreatedOn: string
    clusterNote?: ClusterNoteType
}
export interface ClusterNoteType {
    id: number
    description: string
    updatedBy: string
    updatedOn: string
}

export interface NodeRowDetail {
    name: string
    status: string
    roles: string[]
    errors: Record<string, string>[]
    k8sVersion: string
    podCount: number
    taintCount: number
    cpu: ResourceDetail
    memory: ResourceDetail
    age: string
}

export interface ClusterListResponse extends ResponseType {
    result?: ClusterDetail[]
}

export interface ClusterDescriptionResponse extends ResponseType {
    result?: ClusterDescriptionType
}

export interface ClusterNoteResponse extends ResponseType {
    result?: ClusterNoteType
}

export interface ClusterCapacityResponse extends ResponseType {
    result?: ClusterCapacityType
}

export interface NodeListResponse extends ResponseType {
    result?: NodeRowDetail[]
}

export interface PodType {
    name: string
    namespace: string
    cpu: ResourceDetail
    memory: ResourceDetail
    age: string
}

export interface TaintType extends LabelTag {
    effect: EFFECT_TYPE
}
export interface NodeDetail {
    name: string
    clusterName: string
    status: string
    version: string
    kind: string
    roles: string[]
    k8sVersion: string
    errors: Record<string, string>
    internalIp: string
    externalIp: string
    unschedulable: boolean
    createdAt: string
    labels: LabelTag[]
    annotations: LabelTag[]
    taints: TaintType[]
    resources: ResourceDetail[]
    pods: PodType[]
    manifest: object
    conditions: { haveIssue: boolean; message: string; reason: string; type: string }[]
    taintCount: number
}
export interface NodeDetailResponse extends ResponseType {
    result?: NodeDetail
}

export interface UpdateNodeRequestBody {
    clusterId: number
    name: string
    manifestPatch: string
    version: string
    kind: string
}

export interface ColumnMetadataType {
    sortType: string
    columnIndex: number
    label: string
    value: string
    isDefault?: boolean
    isSortingAllowed?: boolean
    sortingFieldName?: string
    isDisabled?: boolean
}

export interface ClusterListType {
    isSuperAdmin: boolean
    markTabActiveByIdentifier?: (idPrefix: string, name: string, kind?: string, url?: string) => boolean
    addTab?: (
        idPrefix: string,
        kind: string,
        name: string,
        url: string,
        positionFixed?: boolean,
        iconPath?: string,
    ) => boolean
    updateNodeSelectionData: (_selected: Record<string, any>, _group?: string) => void
    k8SObjectMapRaw: Map<string, K8SObjectMapType>
    lastDataSync: boolean
}

export interface ClusterDetailsPropType extends ClusterListType {
    clusterId: string
    namespaceList: string[]
    imageList: ClusterImageList[]
}

export interface ClusterAboutPropType {
    clusterId: string
    isSuperAdmin: boolean
}

export interface NodeTaintType {
    effect: string
    key: string
    value: string
}

export interface SelectGroupType {
    label: string
    options: OptionType[]
    taints?: NodeTaintType[]
}

export interface ClusterTerminalType {
    clusterId: number
    clusterName?: string
    nodeList?: string[]
    closeTerminal?: (skipRedirection?: boolean) => void
    clusterImageList: ImageList[]
    isClusterDetailsPage?: boolean
    isNodeDetailsPage?: boolean
    namespaceList: string[]
    node?: string
    setSelectedNode?: React.Dispatch<React.SetStateAction<string>>
    nodeGroups?: SelectGroupType[]
    taints: Map<string, NodeTaintType[]>
    showTerminal: boolean
}

export const TEXT_COLOR_CLASS = {
    Ready: 'cg-5',
    'Not ready': 'cr-5',
}

interface ErrorObj {
    isValid: boolean
    message: string | null
}

export interface TaintErrorObj {
    isValid: boolean
    taintErrorList: {
        key: ErrorObj
        value: ErrorObj
    }[]
}
interface NodeDataPropType {
    nodeData: NodeDetail
    getNodeListData: () => void
}

export interface NodeActionsMenuProps extends NodeDataPropType {
    openTerminal: (clusterData: NodeDetail) => void
    isSuperAdmin: boolean
    addTab: (
        idPrefix: string,
        kind: string,
        name: string,
        url: string,
        positionFixed?: boolean,
        iconPath?: string,
        dynamicTitle?: string,
        showNameOnSelect?: boolean,
    ) => boolean
}

export interface NodeActionRequest {
    clusterId?: number
    name: string
    version: string
    kind: string
}
export interface NodeActionModalPropType extends NodeActionRequest {
    closePopup: (refreshData?: boolean) => void
}

export interface CordonNodeModalType extends NodeActionModalPropType {
    unschedulable: boolean
}

export interface EditTaintsModalType extends NodeActionModalPropType {
    taints: TaintType[]
}

interface NodeCordonOptions {
    unschedulableDesired: boolean
}

export interface NodeCordonRequest extends NodeActionRequest {
    nodeCordonOptions: NodeCordonOptions
}

export interface ClusteNotePatchRequest {
    id: number //this is mandatory to send in the request
    identifier: number //equals clusterId for cluster description and appId for app/job description
    description: string
}

export interface ClusterShortDescriptionPatchRequest {
    id: number
    description: string
}

interface NodeDrainOptions {
    gracePeriodSeconds: number
    deleteEmptyDirData: boolean
    disableEviction: boolean
    force: boolean
    ignoreAllDaemonSets: boolean
}

export interface NodeDrainRequest extends NodeActionRequest {
    nodeDrainOptions: NodeDrainOptions
}

export interface EditTaintsRequest extends NodeActionRequest {
    taints: TaintType[]
}
export interface ImageList {
    name: string
    image: string
    description: string
}

export interface ClusterImageList {
    groupId: string
    groupRegex: string
    imageList: ImageList[]
}

export interface ClusterEventsType {
    terminalAccessId: number
    reconnectStart?: () => void
}

export interface TerminalDataType {
    id?: number
    clusterId: number
    baseImage: string
    shellName: string
    nodeName: string
    namespace: string
    terminalAccessId?: number
}

export interface ClusterManifestType {
    terminalAccessId: number
    manifestMode: EditModeType
    setManifestMode: (mode: EditModeType) => void
    setManifestData: (manifest: string) => void
    errorMessage?: string[]
    setManifestAvailable: (isManifestAvailable: boolean) => void
    selectTerminalTab: () => void
}

export interface ClusterEditManifestType {
    id?: number
    clusterId: number
    baseImage: string
    shellName: string
    nodeName: string
    namespace: string
    terminalAccessId?: number
    podName: string
    manifest: string
    forceDelete?: boolean
}

export interface ManifestPopuptype {
    closePopup: (isClose: boolean) => void
    podName: string
    namespace: string
    forceDeletePod: (deletePod: boolean) => void
}
export type MDEditorSelectedTabType = 'write' | 'preview'

export type CLUSTER_PAGE_TAB_TYPE = CLUSTER_PAGE_TAB.ABOUT | CLUSTER_PAGE_TAB.DETAILS

export interface DescriptionDataType {
    descriptionId: number
    descriptionText: string
    descriptionUpdatedBy: string
    descriptionUpdatedOn: string
}

export interface ClusterDetailsType {
    clusterName: string
    shortDescription: string
    serverURL: string
    addedOn: string
    addedBy: string
}

export interface ClusterErrorType {
    errorText: string
    errorType: ERROR_TYPE
    filterText: string[]
}
export interface ClusterOverviewProps {
    isSuperAdmin: boolean
    clusterCapacityData: ClusterCapacityType
    setClusterErrorTitle: React.Dispatch<React.SetStateAction<string>>
    setSelectedResource: React.Dispatch<React.SetStateAction<ApiResourceGroupType>>
    setClusterCapacityData: React.Dispatch<React.SetStateAction<ClusterCapacityType>>
    selectedCluster: ClusterOptionType
    setSelectedCluster: React.Dispatch<React.SetStateAction<ClusterOptionType>>
    sideDataAbortController: {
        prev: AbortController
        new: AbortController
    }
}
