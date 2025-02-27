import React, { useContext, useState } from 'react'
import { ChartListPopUpType } from '../charts.types'
import {
    showError,
    Progressing,
    InfoColourBar,
    GenericEmptyState,
    ImageType,
    stopPropagation,
} from '@devtron-labs/devtron-fe-common-lib'
import { ReactComponent as Close } from '../../../assets/icons/ic-cross.svg'
import { ReactComponent as Search } from '../../../assets/icons/ic-search.svg'
import { ReactComponent as Clear } from '../../../assets/icons/ic-error.svg'
import Tippy from '@tippyjs/react'
import { toast } from 'react-toastify'
import { EMPTY_STATE_STATUS, TOAST_INFO } from '../../../config/constantMessaging'
import { reSyncChartRepo } from '../../chartRepo/chartRepo.service'
import { ReactComponent as Help } from '../../../assets/icons/ic-help.svg'
import { NavLink, useHistory } from 'react-router-dom'
import { SERVER_MODE, URLS } from '../../../config'
import { ReactComponent as Add } from '../../../assets/icons/ic-add.svg'
import EmptyFolder from '../../../assets/img/Empty-folder.png'
import NoResults from '../../../assets/img/empty-noresult@2x.png'
import AddChartSource from './AddChartSource'
import ChartListPopUpRow from './ChartListPopUpRow'
import { ReactComponent as SyncIcon } from '../../../assets/icons/ic-arrows_clockwise.svg'
import { mainContext } from '../../common/navigation/NavigationRoutes'

function ChartListPopUp({
    onClose,
    chartList,
    filteredChartList,
    isLoading,
    setFilteredChartList,
    setShowSourcePopoUp,
}: ChartListPopUpType) {
    const { serverMode } = useContext(mainContext)
    const [searchApplied, setSearchApplied] = useState<boolean>(false)
    const [searchText, setSearchText] = useState<string>('')
    const [fetching, setFetching] = useState<boolean>(false)
    const [showAddPopUp, setShowAddPopUp] = useState<boolean>(false)
    const isEmpty = chartList.length && !filteredChartList.length
    const history = useHistory()
    
    const setStore = (event): void => {
        setSearchText(event.target.value)
    }

    const closeChartPopUpModalOnBlur = (e) => {
        e.stopPropagation()
        if (showAddPopUp) {
            setShowAddPopUp(false)
        } else {
            setShowSourcePopoUp(false)
        }
    }

    const toggleAddPopUp = (event: React.MouseEvent): void => {
        event.stopPropagation()
        setShowAddPopUp(!showAddPopUp)
    }

    const onClickAddSource = (e) => {
        if (serverMode === SERVER_MODE.EA_ONLY) {
            history.push(URLS.GLOBAL_CONFIG_CHART)
        } else {
            toggleAddPopUp(e)
        }
    }

    const renderChartListHeaders = () => {
        return (
            <div className="pt-12 pb-12 pl-16 flex dc__content-space dc__border-bottom fw-6">
                <span>Helm chart sources</span>
                <div className="flex">
                    <div className="flex cb-5 fw-6 cursor mr-12" onClick={onClickAddSource}>
                        <Add className="icon-dim-20 fcb-5 mr-8" />
                        Add
                    </div>
                    {renderGlobalRefetch()}
                    <div className="dc__divider ml-12 mr-4" />
                    <button className="dc__transparent flex mr-8" onClick={onClose}>
                        <Close className="dc__page-header__close-icon icon-dim-20 cursor" />
                    </button>
                </div>
                {showAddPopUp && <AddChartSource />}
            </div>
        )
    }

    async function refetchCharts(e) {
        if (fetching) {
            return
        }
        setFetching(true)
        await reSyncChartRepo()
            .then((response) => {
                setFetching(false)
                toast.success(TOAST_INFO.RE_SYNC)
            })
            .catch((error) => {
                showError(error)
                setFetching(false)
            })
    }

    const renderInfoText = (isEmptyState?: boolean): JSX.Element => {
        const renderNavigationeToOCIRepository = () => {
            return (
                <>
                    <NavLink className="ml-4 mr-4" to={URLS.GLOBAL_CONFIG_CHART}>
                        Chart repositories
                    </NavLink>
                    or
                    <NavLink className="ml-4 mr-4" to={URLS.GLOBAL_CONFIG_DOCKER}>
                        OCI Registries
                    </NavLink>
                </>
            )
        }
        return (
            <div>
                {isEmptyState ? (
                    <>Add a {renderNavigationeToOCIRepository()} to view and deploy helm charts.</>
                ) : (
                    <>
                        Showing Chart repositories and OCI Registries (used as chart repositories). You can add other{' '}
                        {renderNavigationeToOCIRepository()} as chart sources.
                    </>
                )}
            </div>
        )
    }

    const renderGlobalRefetch = () => {
            return (
                <Tippy className="default-tt" arrow={false} placement="top" content="Refetch charts from all resources">
                    <a
                        rel="noreferrer noopener"
                        target="_blank"
                        className={`chartRepo_form__subtitle dc__float-right dc__link flex ${
                            !fetching ? 'cursor' : ''
                        }`}
                        onClick={refetchCharts}
                    >
                        {fetching ? <Progressing size={16} /> : <SyncIcon />}
                    </a>
                </Tippy>
            )
    }

    const renderChartList = () => {
        if (isEmpty) {
            return renderEmptyState(true)
        }
        return (
            <div className="dc__overflow-scroll h-100 mxh-390-imp">
                {filteredChartList.map((list, index) => {
                    return (list.id != 1) && <ChartListPopUpRow index={index} list={list} />
                })}
                <InfoColourBar
                    message={renderInfoText()}
                    classname="question-bar m-16"
                    Icon={Help}
                    iconClass="icon-dim-20 fcv-5"
                />
            </div>
            )
    }

    const handleFilterChanges = (_searchText: string): void => {
        const _filteredData = chartList.filter((cluster) => cluster.name.indexOf(_searchText.toLowerCase()) >= 0)
        setFilteredChartList(_filteredData)
    }

    const clearSearch = (): void => {
        if (searchApplied) {
            handleFilterChanges('')
            setSearchApplied(false)
        }
        setSearchText('')
    }

    const handleFilterKeyPress = (event): void => {
        const theKeyCode = event.key
        if (theKeyCode === 'Enter') {
            handleFilterChanges(event.target.value)
            setSearchApplied(true)
        } else if (theKeyCode === 'Backspace' && searchText.length === 1) {
            clearSearch()
        }
    }

    const renderChartListSearch = () => {
        return (
            <div className="dc__position-rel dc__block en-2 bw-1 br-4 h-32 m-12">
                <Search className="search__icon icon-dim-18" />
                <input
                    type="text"
                    placeholder="Search by repository or registry"
                    value={searchText}
                    className="search__input"
                    onChange={setStore}
                    data-testid="chart-store-list-search-box"
                    onKeyDown={handleFilterKeyPress}
                    autoFocus={true}
                />
                {searchApplied && (
                    <button className="search__clear-button" type="button" onClick={clearSearch}>
                        <Clear className="icon-dim-18 icon-n4 dc__vertical-align-middle" />
                    </button>
                )}
            </div>
        )
    }

    const renderEmptyState = (noChartFound?: boolean) => {
        return (
            <GenericEmptyState
                image={noChartFound ? NoResults : EmptyFolder}
                title={noChartFound ? <>No result for "{searchText}"</> : EMPTY_STATE_STATUS.CHART.NO_SOURCE_TITLE}
                subTitle={noChartFound ? EMPTY_STATE_STATUS.CHART.NO_CHART_FOUND : renderInfoText(true)}
                imageType={ImageType.Medium}
            />
        )
    }

    const renderChartListBody = () => {
        if (isLoading) {
            return (
                <div className="mh-400 flex column">
                    <Progressing size={24} />
                    <span className="dc__loading-dots mt-12">Loading Chart source</span>
                </div>
            )
        } else if (!chartList.length) {
            return renderEmptyState()
        }
        return (
            <div>
                {renderChartListSearch()}
                {renderChartList()}
            </div>
        )
    }

    return (
        <div className="dc__transparent-div" onClick={closeChartPopUpModalOnBlur}>
            <div className="chart-store__list h-100 w-400 br-4 bcn-0 en-2 bw-1 fw-4 fs-13 dc__overflow-hidden"  onClick={stopPropagation}>
                {renderChartListHeaders()}
               {renderChartListBody()}
            </div>
        </div>
    )
}

export default ChartListPopUp
