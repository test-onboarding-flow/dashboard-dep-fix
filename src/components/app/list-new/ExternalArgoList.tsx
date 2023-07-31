import React, { useEffect, useState } from 'react'
import {
    showError,
    Progressing,
    ErrorScreenManager,
    ServerErrors,
    Host,
    GenericEmptyState,
} from '@devtron-labs/devtron-fe-common-lib'
import { useLocation, useHistory } from 'react-router'
import { OrderBy, SortBy } from '../list/types'
import {
    buildClusterVsNamespace,
    AppListResponse,
    HelmApp,
    getArgoInstalledExternalApps,
    ArgoAppListResponse,
    ArgoAppListResult,
} from './AppListService'
import { Pagination, LazyImage } from '../../common'
import { SERVER_MODE, URLS, checkIfDevtronOperatorHelmRelease, ModuleNameMap } from '../../../config'
import { AppListViewType } from '../config'
import { Link } from 'react-router-dom'
import NoClusterSelectImage from '../../../assets/gif/ic-empty-select-cluster.gif'
import defaultChartImage from '../../../assets/icons/ic-default-chart.svg'
import HelmCluster from '../../../assets/img/guided-helm-cluster.png'
import DeployCICD from '../../../assets/img/guide-onboard.png'
import { Empty } from '../list/emptyView/Empty'
import { AllCheckModal } from '../../checkList/AllCheckModal'
import { ReactComponent as InfoFill } from '../../../assets/icons/ic-info-filled.svg'
import { ReactComponent as AlertTriangleIcon } from '../../../assets/icons/ic-alert-triangle.svg'
import { ReactComponent as ArrowRight } from '../../../assets/icons/ic-arrow-right.svg'
import noChartInClusterImage from '../../../assets/img/ic-no-chart-in-clusters@2x.png'
import ContentCard from '../../common/ContentCard/ContentCard'
import { CardContentDirection, CardLinkIconPlacement } from '../../common/ContentCard/ContentCard.types'
import '../list/list.scss'
import {
    APPLIST_EMPTY_STATE_MESSAGING,
    EXTERNAL_HELM_APP_FETCH_CLUSTER_ERROR,
    EXTERNAL_HELM_APP_FETCH_ERROR,
    APP_LIST_HEADERS,
    HELM_PERMISSION_MESSAGE,
    ClearFiltersLabel,
} from './Constants'
import { HELM_GUIDED_CONTENT_CARDS_TEXTS } from '../../onboardingGuide/OnboardingGuide.constants'
import AppStatus from '../AppStatus'
import { clusterId } from '../../ClusterNodes/__mocks__/clusterAbout.mock'
import DevtronAppIcon from '../../../assets/icons/ic-devtron-app.svg'
import { ExternalArgoListType } from '../types'

export default function ExternalArgoList({
    serverMode,
    payloadParsedFromUrl,
    sortApplicationList,
    clearAllFilters,
    fetchingExternalApps,
    setFetchingExternalAppsState,
    updateDataSyncing,
    setShowPulsatingDotState,
    masterFilters,
    syncListData,
    isArgoInstalled,
}: ExternalArgoListType) {
    console.log(
        serverMode,
    payloadParsedFromUrl,
    sortApplicationList,
    clearAllFilters,
    fetchingExternalApps,
    setFetchingExternalAppsState,
    updateDataSyncing,
    setShowPulsatingDotState,
    masterFilters,
    syncListData,
    isArgoInstalled,
    )
    const [dataStateType, setDataStateType] = useState(AppListViewType.LOADING)
    const [errorResponseCode, setErrorResponseCode] = useState(0)
    const [argoAppsList, setArgoAppsList] = useState<ArgoAppListResult[]>([])
    const [filteredArgoAppsList, setFilteredArgoAppsList] = useState<ArgoAppListResult[]>([])
    const [sortBy, setSortBy] = useState(SortBy.APP_NAME)
    const [sortOrder, setSortOrder] = useState(OrderBy.ASC)
    const [clusterIdsCsv, setClusterIdsCsv] = useState('')
    const [appStatus, setAppStatus] = useState('')
    const [showGuidedContentCards, setShowGuidedContentCards] = useState(false)
    const location = useLocation()
    const history = useHistory()
    const params = new URLSearchParams(location.search)

    // component load
    useEffect(() => {
        init()
    }, [])

    // it means filter/sorting has been applied
    useEffect(() => {
        if (dataStateType === AppListViewType.LIST) {
            if (clusterIdsCsv === _getClusterIdsFromRequestUrl() && appStatus === _getAppStatusFromRequestUrl()) {
                handleFilteration()
            } else {
                init()
            }
        }
    }, [payloadParsedFromUrl])

    // on data rendering first time
    useEffect(() => {
        if (dataStateType == AppListViewType.LIST) {
            handleFilteration()
        }
    }, [dataStateType])

    useEffect(() => {
        updateDataSyncing(true)
        setDataStateType(AppListViewType.LOADING)
        if (serverMode == SERVER_MODE.EA_ONLY) {
            setDataStateType(AppListViewType.LIST)
            if (clusterIdsCsv) {
                _getExternalHelmApps()
                updateDataSyncing(false)
            }
        } else {
            getArgoInstalledExternalApps(clusterIdsCsv, appStatus)
                .then((argoAppsListResponse) => {
                    let res = argoAppsListResponse.result
                    setArgoAppsList(res)
                    setDataStateType(AppListViewType.LIST)
                    _getExternalHelmApps()
                })
                .catch((errors: ServerErrors) => {
                    showError(errors)
                    setDataStateType(AppListViewType.ERROR)
                    setErrorResponseCode(errors.code)
                })
                .finally(() => {
                    updateDataSyncing(false)
                })
        }
    }, [clusterIdsCsv, appStatus, syncListData])

    // reset data
    function init() {
        setDataStateType(AppListViewType.LOADING)
        setArgoAppsList([])
        setFilteredArgoAppsList([])
        setClusterIdsCsv(_getClusterIdsFromRequestUrl())
        setAppStatus(_getAppStatusFromRequestUrl())
        setFetchingExternalAppsState(false)
    }

    function _getExternalHelmApps() {
        if (clusterIdsCsv) {
            setFetchingExternalAppsState(true)
        }
    }

    function _getClusterIdsFromRequestUrl() {
        return [...buildClusterVsNamespace(payloadParsedFromUrl.namespaces.join(',')).keys()].join(',')
    }

    function _getAppStatusFromRequestUrl() {
        return payloadParsedFromUrl.appStatuses.join(',')
    }

    function handleFilteration() {
        let _search = payloadParsedFromUrl.appNameSearch
        let _sortBy = payloadParsedFromUrl.sortBy
        let _sortOrder = payloadParsedFromUrl.sortOrder
        let _filteredArgoAppsList = [...(argoAppsList || [])]

        // handle search
        if (_search?.length) {
            _filteredArgoAppsList = _filteredArgoAppsList.filter((app) =>
                app.appName.toLowerCase().includes(_search.toLowerCase()),
            )
        }

        // handle sort
        if (_sortOrder == OrderBy.ASC) {
            _filteredArgoAppsList = _filteredArgoAppsList.sort((a, b) => a.appName.localeCompare(b.appName))
        } else {
            _filteredArgoAppsList = _filteredArgoAppsList.sort((a, b) => b.appName.localeCompare(a.appName))
        }

        setSortBy(_sortBy)
        setSortOrder(_sortOrder)
        setFilteredArgoAppsList(_filteredArgoAppsList)
        setShowPulsatingDotState(_filteredArgoAppsList.length == 0 && !clusterIdsCsv)
    }

    function _isAnyFilterationAppliedExceptClusterAndNs() {
        return (
            payloadParsedFromUrl.teams?.length ||
            payloadParsedFromUrl.appNameSearch?.length ||
            payloadParsedFromUrl.environments?.length
        )
    }

    function _isAnyFilterationApplied() {
        return _isAnyFilterationAppliedExceptClusterAndNs() || payloadParsedFromUrl.namespaces?.length
    }

    function _isOnlyAllClusterFilterationApplied() {
        let _isAllClusterSelected = !masterFilters.clusters.some((_cluster) => !_cluster.isChecked)
        let _isAnyNamespaceSelected = masterFilters.namespaces.some((_namespace) => _namespace.isChecked)
        return !_isAnyFilterationAppliedExceptClusterAndNs() && _isAllClusterSelected && !_isAnyNamespaceSelected
    }

    function handleImageError(e) {
        const target = e.target as HTMLImageElement
        target.onerror = null
        target.src = defaultChartImage
    }

    function _buildAppDetailUrl(app: ArgoAppListResult) {
        return `${URLS.APP}/${URLS.DEVTRON_CHARTS}/deployments/cluster=${clusterId}/app=${app.appName}`
    }

    function sortByAppName(e) {
        e.preventDefault()
        sortApplicationList('appNameSort')
    }

    function renderHeaders() {
        return (
            <div className="app-list__header">
                <div className="app-list__cell--icon"></div>
                <div className="app-list__cell app-list__cell--name">
                <button className="app-list__cell-header flex" onClick={sortByAppName}>
                    {APP_LIST_HEADERS.AppName}
                    {sortBy == SortBy.APP_NAME ? (
                        <span className={`sort ${sortOrder == OrderBy.ASC ? 'sort-up' : ''} ml-4`}></span>
                    ) : (
                        <span className="sort-col dc__opacity-0_5 ml-4"></span>
                    )}
                </button>
                </div>
                {isArgoInstalled && (
                    <div className="app-list__cell app-list__cell--app_status">
                        <span className="app-list__cell-header">{APP_LIST_HEADERS.AppStatus}</span>
                    </div>
                )}

                <div className="app-list__cell app-list__cell--cluster">
                    <span className="app-list__cell-header">{APP_LIST_HEADERS.Cluster}</span>
                </div>
                <div className="app-list__cell app-list__cell--namespace">
                    <span className="app-list__cell-header">{APP_LIST_HEADERS.Namespace}</span>
                </div>
            </div>
        )
    }

    const renderHelmAppLink = (app: ArgoAppListResult): JSX.Element => {
        return (
            <Link key={app.appName} to={_buildAppDetailUrl(app)} className="app-list__row" data-testid="app-list-row">
                <div className="app-list__cell--icon">
                    <LazyImage
                        className="dc__chart-grid-item__icon icon-dim-24"
                        src={DevtronAppIcon}
                        onError={handleImageError}
                    />
                </div>
                <div className="app-list__cell app-list__cell--name flex column left">
                    <div className="dc__truncate-text  m-0 value">{app.appName}</div>
                </div>
                {isArgoInstalled && (
                    <div className="app-list__cell app-list__cell--namespace">
                        <AppStatus appStatus={app.appStatus} />
                    </div>
                )}
                <div className="app-list__cell app-list__cell--cluster">
                    <p className="dc__truncate-text  m-0" data-testid={`${app.clusterName}`}>
                        {app.clusterName}
                    </p>
                </div>
                <div className="app-list__cell app-list__cell--namespace">
                    <p className="dc__truncate-text  m-0" data-testid={`${app.namespace}`}>
                        {app.namespace}
                    </p>
                </div>
            </Link>
        )
    }

    function renderApplicationList() {
        return (
            <div data-testid="helm-app-list-container">
                {filteredArgoAppsList.length > 0 && renderHeaders()}

                {filteredArgoAppsList
                    .slice(payloadParsedFromUrl.hOffset, payloadParsedFromUrl.hOffset + payloadParsedFromUrl.size)
                    .map((app) => renderHelmAppLink(app))}

                {showGuidedContentCards && (
                    <div className="helm-app-guided-cards-wrapper">
                        <ContentCard
                            redirectTo={URLS.GLOBAL_CONFIG_CLUSTER}
                            direction={CardContentDirection.Horizontal}
                            imgSrc={HelmCluster}
                            title={HELM_GUIDED_CONTENT_CARDS_TEXTS.GlobalConfigCluster.title}
                            linkText={HELM_GUIDED_CONTENT_CARDS_TEXTS.GlobalConfigCluster.linkText}
                            LinkIcon={ArrowRight}
                            linkIconClass="scb-5"
                            linkIconPlacement={CardLinkIconPlacement.AfterLinkApart}
                        />
                        <ContentCard
                            redirectTo={`${URLS.STACK_MANAGER_DISCOVER_MODULES_DETAILS}?id=${ModuleNameMap.CICD}`}
                            direction={CardContentDirection.Horizontal}
                            imgSrc={DeployCICD}
                            title={HELM_GUIDED_CONTENT_CARDS_TEXTS.StackManager.title}
                            linkText={HELM_GUIDED_CONTENT_CARDS_TEXTS.StackManager.installLinkText}
                            LinkIcon={ArrowRight}
                            linkIconClass="scb-5"
                            linkIconPlacement={CardLinkIconPlacement.AfterLinkApart}
                        />
                    </div>
                )}
            </div>
        )
    }

    function renderAllCheckModal() {
        return (
            <div
                style={{ width: '600px', margin: 'auto', marginTop: '20px' }}
                className="bcn-0 pt-20 pb-20 pl-20 pr-20 br-8 en-1 bw-1 mt-20"
            >
                <AllCheckModal />
            </div>
        )
    }

    function askToSelectClusterId() {
        return (
            <div className="dc__position-rel" style={{ height: 'calc(100vh - 150px)' }}>
                <GenericEmptyState
                    image={NoClusterSelectImage}
                    title={APPLIST_EMPTY_STATE_MESSAGING.heading}
                    subTitle={APPLIST_EMPTY_STATE_MESSAGING.infoText}
                />
            </div>
        )
    }

    function askToClearFilters(showTipToSelectCluster?: boolean) {
        return (
            <Empty
                view={AppListViewType.NO_RESULT}
                title={APPLIST_EMPTY_STATE_MESSAGING.noAppsFound}
                message={APPLIST_EMPTY_STATE_MESSAGING.noAppsFoundInfoText}
                buttonLabel={ClearFiltersLabel}
                clickHandler={clearAllFilters}
            >
                {showTipToSelectCluster && (
                    <div className="mt-18">
                        <p
                            className="bcb-1 cn-9 fs-13 pt-10 pb-10 pl-16 pr-16 eb-2 bw-1 br-4 cluster-tip flex left top"
                            style={{ width: '300px' }}
                        >
                            <span>
                                <InfoFill className="icon-dim-20" />
                            </span>
                            <div className="ml-12 cn-9" style={{ textAlign: 'start' }}>
                                <span className="fw-6">Tip </span>
                                <span>{APPLIST_EMPTY_STATE_MESSAGING.selectCluster}</span>
                            </div>
                        </p>
                    </div>
                )}
            </Empty>
        )
    }

    function askToClearFiltersWithSelectClusterTip() {
        return <div className="flex column">{askToClearFilters(true)}</div>
    }

    function askToConnectAClusterForNoResult() {
        const handleButton = () => {
            return (
                <Link to={URLS.GLOBAL_CONFIG_CLUSTER}>
                    <button type="button" className="cta flex">
                        {APPLIST_EMPTY_STATE_MESSAGING.connectClusterLabel}
                    </button>
                </Link>
            )
        }
        return (
            <div className="dc__position-rel" style={{ height: 'calc(100vh - 150px)' }}>
                <GenericEmptyState
                    image={noChartInClusterImage}
                    title={APPLIST_EMPTY_STATE_MESSAGING.noHelmChartsFound}
                    subTitle={APPLIST_EMPTY_STATE_MESSAGING.connectClusterInfoText}
                    isButtonAvailable={true}
                    renderButton={handleButton}
                />
            </div>
        )
    }

    function renderHelmPermissionMessageStrip() {
        return (
            <>
                <div className="h-8"></div>
                <div className="helm-permission-message-strip above-header-message flex left">
                    <span className="mr-8 flex">
                        <AlertTriangleIcon className="icon-dim-20 icon" />
                    </span>
                    <span>{HELM_PERMISSION_MESSAGE}</span>
                </div>
            </>
        )
    }

    function renderNoApplicationState() {
        if (_isAnyFilterationAppliedExceptClusterAndNs() && !clusterIdsCsv) {
            return askToClearFiltersWithSelectClusterTip()
        } else if (_isOnlyAllClusterFilterationApplied()) {
            return askToConnectAClusterForNoResult()
        } else if (_isAnyFilterationApplied()) {
            return askToClearFilters()
        } else if (!clusterIdsCsv) {
            return askToSelectClusterId()
        } else {
            return renderAllCheckModal()
        }
    }

    function renderFullModeApplicationListContainer() {
        if (filteredArgoAppsList.length == 0) {
            return (
                <>
                    {serverMode == SERVER_MODE.FULL && renderHelmPermissionMessageStrip()}
                    {renderNoApplicationState()}
                </>
            )
        } else {
            return renderApplicationList()
        }
    }

    function changePageSize(size: number): void {
        params.set('pageSize', size.toString())
        params.set('offset', '0')
        params.set('hOffset', '0')

        history.push(`${URLS.APP}/${URLS.APP_LIST}/${URLS.APP_LIST_HELM}?${params.toString()}`)
    }

    function changePage(pageNo: number): void {
        const newOffset = payloadParsedFromUrl.size * (pageNo - 1)

        params.set('hOffset', newOffset.toString())

        history.push(`${URLS.APP}/${URLS.APP_LIST}/${URLS.APP_LIST_HELM}?${params.toString()}`)
    }

    function renderPagination(): JSX.Element {
        return (
            filteredArgoAppsList.length > 20 &&
            !fetchingExternalApps && (
                <Pagination
                    size={filteredArgoAppsList.length}
                    pageSize={payloadParsedFromUrl.size}
                    offset={payloadParsedFromUrl.hOffset}
                    changePage={changePage}
                    changePageSize={changePageSize}
                />
            )
        )
    }

    return (
        <>
            {dataStateType == AppListViewType.LOADING && (
                <div className="dc__loading-wrapper">
                    <Progressing pageLoader />
                </div>
            )}
            {dataStateType == AppListViewType.ERROR && (
                <div className="dc__loading-wrapper">
                    <ErrorScreenManager code={errorResponseCode} />
                </div>
            )}
            {dataStateType == AppListViewType.LIST && (
                <div>
                    {renderFullModeApplicationListContainer()}
                    {renderPagination()}
                </div>
            )}
        </>
    )
}
