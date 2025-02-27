import React, { useEffect, useRef, useState } from 'react'
import {
    CDMaterialResponseType,
    DeploymentNodeType,
    Drawer,
    multiSelectStyles,
    Progressing,
    ReleaseTag,
    ImageComment,
    showError,
    stopPropagation,
    genericCDMaterialsService,
    CDMaterialServiceEnum,
    CDMaterialType,
    FilterStates,
    useSuperAdmin,
} from '@devtron-labs/devtron-fe-common-lib'
import { ReactComponent as Close } from '../../../../assets/icons/ic-cross.svg'
import { ReactComponent as DeployIcon } from '../../../../assets/icons/ic-nav-rocket.svg'
import { ReactComponent as PlayIcon } from '../../../../assets/icons/ic-play-medium.svg'
import { ReactComponent as Error } from '../../../../assets/icons/ic-warning.svg'
import { ReactComponent as UnAuthorized } from '../../../../assets/icons/ic-locked.svg'
import { ReactComponent as Tag } from '../../../../assets/icons/ic-tag.svg'
import emptyPreDeploy from '../../../../assets/img/empty-pre-deploy.png'
import notAuthorized from '../../../../assets/img/ic-not-authorized.svg'
import CDMaterial from '../../../app/details/triggerView/cdMaterial'
import { BulkSelectionEvents, MATERIAL_TYPE } from '../../../app/details/triggerView/types'
import { BulkCDDetailType, BulkCDTriggerType } from '../../AppGroup.types'
import { BULK_CD_MESSAGING, BUTTON_TITLE } from '../../Constants'
import TriggerResponseModal from './TriggerResponseModal'
import { EmptyView } from '../../../app/details/cicdHistory/History.components'
import ReactSelect, { components } from 'react-select'
import { Option as releaseTagOption } from '../../../v2/common/ReactSelect.utils'
import { useHistory, useLocation, useRouteMatch } from 'react-router-dom'

// TODO: Fix release tags selection
export default function BulkCDTrigger({
    stage,
    appList,
    closePopup,
    // NOTE: Using this to update the appList in the parent component, should remove this later
    updateBulkInputMaterial,
    // NOTE: Should trigger the bulk cd here only but since its also calling another parent function not refactoring right now
    onClickTriggerBulkCD,
    responseList,
    isLoading,
    setLoading,
    isVirtualEnv,
    uniqueReleaseTags,
}: BulkCDTriggerType) {
    const ciTriggerDetailRef = useRef<HTMLDivElement>(null)
    const [selectedApp, setSelectedApp] = useState<BulkCDDetailType>(
        appList.find((app) => !app.warningMessage) || appList[0],
    )
    const [isDownloadPopupOpen, setDownloadPopupOpen] = useState(false)
    const [tagNotFoundWarningsMap, setTagNotFoundWarningsMap] = useState<Map<number, string>>(new Map())
    const [unauthorizedAppList, setUnauthorizedAppList] = useState<Record<number, boolean>>({})
    const abortControllerRef = useRef<AbortController>(new AbortController())
    const [appSearchTextMap, setAppSearchTextMap] = useState<Record<number, string>>({})
    const [selectedImages, setSelectedImages] = useState<Record<number, string>>({})
    // This signifies any action that needs to be propagated to the child
    const [selectedImageFromBulk, setSelectedImageFromBulk] = useState<string>(null)

    const location = useLocation()
    const history = useHistory()
    const match = useRouteMatch()
    const { isSuperAdmin } = useSuperAdmin()

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search)
        const search = searchParams.get('search')
        const _appSearchTextMap = { ...appSearchTextMap }

        if (search) {
            _appSearchTextMap[selectedApp.appId] = search
        } else {
            delete _appSearchTextMap[selectedApp.appId]
        }

        setAppSearchTextMap(_appSearchTextMap)
    }, [location])

    const closeBulkCDModal = (e: React.MouseEvent): void => {
        e.stopPropagation()
        abortControllerRef.current.abort()
        closePopup(e)
    }

    const [selectedTagName, setSelectedTagName] = useState<{ label: string; value: string }>({
        label: 'latest',
        value: 'latest',
    })

    const escKeyPressHandler = (evt): void => {
        if (evt && evt.key === 'Escape' && typeof closePopup === 'function') {
            evt.preventDefault()
            closeBulkCDModal(evt)
        }
    }
    const outsideClickHandler = (evt): void => {
        if (
            !isDownloadPopupOpen &&
            ciTriggerDetailRef.current &&
            !ciTriggerDetailRef.current.contains(evt.target) &&
            typeof closePopup === 'function'
        ) {
            closeBulkCDModal(evt)
        }
    }

    useEffect(() => {
        document.addEventListener('keydown', escKeyPressHandler)
        return (): void => {
            document.removeEventListener('keydown', escKeyPressHandler)
        }
    }, [escKeyPressHandler])

    useEffect(() => {
        document.addEventListener('click', outsideClickHandler)
        return (): void => {
            document.removeEventListener('click', outsideClickHandler)
        }
    }, [outsideClickHandler])

    /**
     * Gets triggered during the mount state of the component through useEffect
     * Fetches the material data pushes them into promise list
     * Promise list is resolved using Promise.allSettled
     * If the promise is fulfilled, the data is pushed into cdMaterialResponse
     */
    const getMaterialData = (): void => {
        const _unauthorizedAppList: Record<number, boolean> = {}
        const _CDMaterialPromiseList = []
        abortControllerRef.current = new AbortController()

        for (const appDetails of appList) {
            if (!appDetails.warningMessage) {
                _unauthorizedAppList[appDetails.appId] = false
                _CDMaterialPromiseList.push(
                    // Not sending any query params since its not necessary on mount and filters and handled by other service
                    genericCDMaterialsService(
                        CDMaterialServiceEnum.CD_MATERIALS,
                        Number(appDetails.cdPipelineId),
                        appDetails.stageType,
                        abortControllerRef.current.signal,
                        {
                            offset: 0,
                            size: 20,
                        },
                    )
                        .then((data) => ({ appId: appDetails.appId, ...data }))
                        .catch((e) => {
                            if (!abortControllerRef.current.signal.aborted) {
                                throw { response: e?.response, appId: appDetails.appId }
                            }
                        }),
                )
            }
        }

        const _cdMaterialResponse: Record<string, CDMaterialResponseType> = {}
        Promise.allSettled(_CDMaterialPromiseList)
            .then((responses) => {
                responses.forEach((response) => {
                    if (response.status === 'fulfilled') {
                        _cdMaterialResponse[response.value['appId']] = response.value
                        // if first image does not have filerState.ALLOWED then unselect all images and set SELECT_NONE for selectedImage and for first app send the trigger of SELECT_NONE from selectedImageFromBulk
                        if (
                            response.value.materials?.length > 0 &&
                            (response.value.materials[0].filterState !== FilterStates.ALLOWED ||
                                response.value.materials[0].vulnerable)
                        ) {
                            const updatedMaterials = response.value.materials.map((mat) => ({
                                ...mat,
                                isSelected: false,
                            }))
                            _cdMaterialResponse[response.value['appId']] = {
                                ...response.value,
                                materials: updatedMaterials,
                            }
                            setSelectedImages((prevSelectedImages) => ({
                                ...prevSelectedImages,
                                [response.value['appId']]: BulkSelectionEvents.SELECT_NONE,
                            }))

                            const _warningMessage = response.value.materials[0].vulnerable
                                ? 'has security vulnerabilities'
                                : 'is not eligible'

                            setTagNotFoundWarningsMap((prevTagNotFoundWarningsMap) => {
                                const _tagNotFoundWarningsMap = new Map(prevTagNotFoundWarningsMap)
                                _tagNotFoundWarningsMap.set(
                                    response.value['appId'],
                                    "Tag '" +
                                        (selectedTagName.value?.length > 15
                                            ? selectedTagName.value.substring(0, 10) + '...'
                                            : selectedTagName.value) +
                                        `' ${_warningMessage}`,
                                )
                                return _tagNotFoundWarningsMap
                            })
                            if (response.value['appId'] === selectedApp.appId) {
                                setSelectedImageFromBulk(BulkSelectionEvents.SELECT_NONE)
                            }
                        } else if (response.value.materials?.length === 0) {
                            setTagNotFoundWarningsMap((prevTagNotFoundWarningsMap) => {
                                const _tagNotFoundWarningsMap = new Map(prevTagNotFoundWarningsMap)
                                _tagNotFoundWarningsMap.set(
                                    response.value['appId'],
                                    "Tag '" +
                                        (selectedTagName.value?.length > 15
                                            ? selectedTagName.value.substring(0, 10) + '...'
                                            : selectedTagName.value) +
                                        `' not found`,
                                )
                                return _tagNotFoundWarningsMap
                            })
                        }

                        delete _unauthorizedAppList[response.value['appId']]
                    } else {
                        const errorReason = response.reason
                        if (errorReason.code === 403) {
                            _unauthorizedAppList[errorReason['appId']] = true
                        }
                    }
                })
                updateBulkInputMaterial(_cdMaterialResponse)
                setUnauthorizedAppList(_unauthorizedAppList)
                setLoading(false)
            })
            .catch((error) => {
                showError(error)
            })
    }

    useEffect(() => {
        getMaterialData()
    }, [])

    const renderHeaderSection = (): JSX.Element => {
        return (
            <div className="flex flex-align-center flex-justify dc__border-bottom bcn-0 pt-16 pr-20 pb-16 pl-20">
                <h2 className="fs-16 fw-6 lh-1-43 m-0">Deploy to {appList[0].envName}</h2>
                <button
                    type="button"
                    className="dc__transparent flex icon-dim-24"
                    disabled={isLoading}
                    onClick={closeBulkCDModal}
                >
                    <Close className="icon-dim-24" />
                </button>
            </div>
        )
    }

    const changeApp = (e): void => {
        const _selectedApp = appList[e.currentTarget.dataset.index]
        setSelectedApp(_selectedApp)
        setSelectedImageFromBulk(selectedImages[_selectedApp.appId])

        if (appSearchTextMap[_selectedApp.appId]) {
            const newSearchParams = new URLSearchParams(location.search)
            newSearchParams.set('search', appSearchTextMap[_selectedApp.appId])

            history.push({
                search: newSearchParams.toString(),
            })
        } else {
            history.push({
                search: '',
            })
        }
    }

    const renderEmptyView = (): JSX.Element => {
        if (unauthorizedAppList[selectedApp.appId]) {
            return (
                <EmptyView
                    imgSrc={notAuthorized}
                    title={BULK_CD_MESSAGING.unauthorized.title}
                    subTitle={BULK_CD_MESSAGING.unauthorized.subTitle}
                />
            )
        }
        return (
            <EmptyView
                imgSrc={emptyPreDeploy}
                title={`${selectedApp.name}  ${BULK_CD_MESSAGING[stage].title}`}
                subTitle={BULK_CD_MESSAGING[stage].subTitle}
            />
        )
    }

    const renderBodySection = (): JSX.Element => {
        if (isLoading) {
            return <Progressing pageLoader />
        }

        const updateCurrentAppMaterial = (matId: number, releaseTags?: ReleaseTag[], imageComment?: ImageComment) => {
            const updatedCurrentApp = selectedApp
            updatedCurrentApp?.material.forEach((mat) => {
                if (mat.id === matId) {
                    if (releaseTags) {
                        mat.imageReleaseTags = releaseTags
                    }
                    if (imageComment) {
                        mat.imageComment = imageComment
                    }
                }
            })
            updatedCurrentApp && setSelectedApp(updatedCurrentApp)
        }

        const _currentApp = appList.find((app) => app.appId === selectedApp.appId) ?? ({} as BulkCDDetailType)
        uniqueReleaseTags.sort((a, b) => a.localeCompare(b))

        const tagsList = ['latest', 'active']

        tagsList.push(...uniqueReleaseTags)
        const options = tagsList.map((tag) => {
            return { label: tag, value: tag }
        })

        const appWiseTagsToArtifactIdMapMappings = {}
        appList.forEach((app) => {
            if (!app.material?.length) {
                appWiseTagsToArtifactIdMapMappings[app.appId] = {}
            } else {
                const tagsToArtifactIdMap = { latest: 0 }
                for (let i = 0; i < app.material?.length; i++) {
                    const mat = app.material?.[i]
                    mat.imageReleaseTags?.forEach((imageTag) => {
                        tagsToArtifactIdMap[imageTag.tagName] = i
                    })

                    if (mat.deployed && mat.latest) {
                        tagsToArtifactIdMap['active'] = i
                    }
                }
                appWiseTagsToArtifactIdMapMappings[app.appId] = tagsToArtifactIdMap
            }
        })

        // Don't use it as single, use it through update function
        const selectImageLocal = (index: number, appId: number, selectedImageTag: string) => {
            setSelectedImages({ ...selectedImages, [appId]: selectedImageTag })

            if (appWiseTagsToArtifactIdMapMappings[appId][selectedTagName.value] !== index) {
                const _tagNotFoundWarningsMap = tagNotFoundWarningsMap
                _tagNotFoundWarningsMap.delete(appId)
                setTagNotFoundWarningsMap(_tagNotFoundWarningsMap)
                setSelectedTagName({ value: 'Multiple tags', label: 'Multiple tags' })
            } else {
                // remove warning if any
                const _tagNotFoundWarningsMap = new Map(tagNotFoundWarningsMap)
                _tagNotFoundWarningsMap.delete(appId)
                setTagNotFoundWarningsMap(_tagNotFoundWarningsMap)
            }
        }

        const parseApplistIntoCDMaterialResponse = (
            appListData: BulkCDDetailType,
            updatedMaterials?: CDMaterialType,
        ) => ({
            materials: updatedMaterials ?? appListData.material,
            approvalUsers: appListData.approvalUsers,
            requestedUserId: appListData.requestedUserId,
            userApprovalConfig: appListData.userApprovalConfig,
            appReleaseTagNames: appListData.appReleaseTags,
            tagsEditable: appListData.tagsEditable,
        })

        const handleTagChange = (selectedTag) => {
            setSelectedTagName(selectedTag)
            const _tagNotFoundWarningsMap = new Map()
            const _cdMaterialResponse: Record<string, any> = {}

            for (let i = 0; i < appList?.length ?? 0; i++) {
                const app = appList[i]
                const tagsToArtifactIdMap = appWiseTagsToArtifactIdMapMappings[app.appId]
                let artifactIndex = -1
                if (typeof tagsToArtifactIdMap[selectedTag.value] !== 'undefined') {
                    artifactIndex = tagsToArtifactIdMap[selectedTag.value]
                }

                // Handling the behavior for excluded filter state
                if (artifactIndex !== -1) {
                    const selectedImageFilterState = app.material?.[artifactIndex]?.filterState

                    if (selectedImageFilterState !== FilterStates.ALLOWED) {
                        artifactIndex = -1
                        _tagNotFoundWarningsMap.set(
                            app.appId,
                            "Tag '" +
                                (selectedTag.value?.length > 15
                                    ? selectedTag.value.substring(0, 10) + '...'
                                    : selectedTag.value) +
                                "' is not eligible",
                        )
                    } else if (app.material?.[artifactIndex]?.vulnerable) {
                        artifactIndex = -1
                        _tagNotFoundWarningsMap.set(
                            app.appId,
                            "Tag '" +
                                (selectedTag.value?.length > 15
                                    ? selectedTag.value.substring(0, 10) + '...'
                                    : selectedTag.value) +
                                "' has security vulnerabilities",
                        )
                    }
                } else {
                    _tagNotFoundWarningsMap.set(
                        app.appId,
                        "Tag '" +
                            (selectedTag.value?.length > 15
                                ? selectedTag.value.substring(0, 10) + '...'
                                : selectedTag.value) +
                            "' not found",
                    )
                }

                if (artifactIndex !== -1 && selectedTag.value !== 'latest' && selectedTag.value !== 'active') {
                    const releaseTag = app.material[artifactIndex]?.imageReleaseTags.find(
                        (releaseTag) => releaseTag.tagName === selectedTag.value,
                    )
                    if (releaseTag?.deleted) {
                        artifactIndex = -1
                        _tagNotFoundWarningsMap.set(
                            app.appId,
                            "Tag '" +
                                (selectedTag.value?.length > 15
                                    ? selectedTag.value.substring(0, 10) + '...'
                                    : selectedTag.value) +
                                "' is soft-deleted",
                        )
                    }
                }

                if (artifactIndex !== -1) {
                    const selectedImageName = app.material?.[artifactIndex]?.image
                    const updatedMaterials: any = app.material?.map((mat, index) => {
                        return {
                            ...mat,
                            isSelected: index === artifactIndex,
                        }
                    })

                    _cdMaterialResponse[app.appId] = parseApplistIntoCDMaterialResponse(app, updatedMaterials)

                    setSelectedImages((prevSelectedImages) => ({
                        ...prevSelectedImages,
                        [app.appId]: selectedImageName,
                    }))
                } else {
                    const updatedMaterials: any = app.material?.map((mat) => {
                        return {
                            ...mat,
                            isSelected: false,
                        }
                    })

                    _cdMaterialResponse[app.appId] = parseApplistIntoCDMaterialResponse(app, updatedMaterials)

                    setSelectedImages((prevSelectedImages) => ({
                        ...prevSelectedImages,
                        [app.appId]: BulkSelectionEvents.SELECT_NONE,
                    }))
                }
            }

            updateBulkInputMaterial(_cdMaterialResponse)

            // Handling to behviour of current app to send a trigger to child
            const selectedImageName = _cdMaterialResponse[selectedApp.appId]?.materials?.find(
                (mat: CDMaterialType) => mat.isSelected === true,
            )?.image

            if (selectedImageName) {
                setSelectedImageFromBulk(selectedImageName)
            } else {
                setSelectedImageFromBulk(BulkSelectionEvents.SELECT_NONE)
            }

            setTagNotFoundWarningsMap(_tagNotFoundWarningsMap)
        }

        const imageTaggingControls = {
            IndicatorSeparator: null,
            Option: releaseTagOption,
            Control: (props) => {
                return (
                    <components.Control {...props}>
                        {<Tag className="ml-8 mt-8 mb-8 flex icon-dim-16" />}
                        {props.children}
                    </components.Control>
                )
            },
        }

        const updateBulkCDMaterialsItem = (singleCDMaterialResponse) => {
            const _cdMaterialResponse: Record<string, CDMaterialResponseType> = {}
            _cdMaterialResponse[selectedApp.appId] = singleCDMaterialResponse

            updateBulkInputMaterial(_cdMaterialResponse)

            const selectedArtifact = singleCDMaterialResponse?.materials?.find(
                (mat: CDMaterialType) => mat.isSelected === true,
            )

            if (selectedArtifact) {
                selectImageLocal(selectedArtifact.index, selectedApp.appId, selectedArtifact.image)
            }

            // Setting it to null since since only wants to trigger change inside if user changes app or tag
            setSelectedImageFromBulk(null)
        }

        return (
            <div className="bulk-ci-trigger">
                <div className="sidebar bcn-0 dc__height-inherit dc__overflow-auto">
                    <div className="dc__position-sticky dc__top-0 pt-12 bcn-0">
                        <span className="pl-16 pr-16">Select image by release tag</span>
                        <div style={{ zIndex: 1 }} className="tag-selection-dropdown pr-16 pl-16 pt-6 pb-12">
                            <ReactSelect
                                isSearchable
                                options={options}
                                value={selectedTagName}
                                styles={multiSelectStyles}
                                components={imageTaggingControls}
                                onChange={handleTagChange}
                                isDisabled={false}
                                classNamePrefix="build-config__select-repository-containing-code"
                                autoFocus
                            />
                        </div>
                        <div
                            className="dc__position-sticky dc__top-0 bcn-0 dc__border-bottom fw-6 fs-13 cn-7 pt-8 pr-16 pb-8 pl-16"
                            style={{ zIndex: 0 }}
                        >
                            APPLICATIONS
                        </div>
                    </div>
                    {appList.map((app, index) => (
                        <div
                            key={`app-${app.appId}`}
                            className={`p-16 cn-9 fw-6 fs-13 dc__border-bottom-n1 cursor ${
                                app.appId === selectedApp.appId ? 'dc__window-bg' : ''
                            }`}
                            data-index={index}
                            onClick={changeApp}
                        >
                            {app.name}
                            {(app.warningMessage || tagNotFoundWarningsMap.has(app.appId)) && (
                                <span
                                    className={`flex left top fw-4 m-0 fs-12 ${
                                        tagNotFoundWarningsMap.has(app.appId) ? 'cr-5' : 'cy-7'
                                    }`}
                                >
                                    <Error
                                        className={`icon-dim-12 mr-4 dc__no-shrink mt-5 ${
                                            tagNotFoundWarningsMap.has(app.appId)
                                                ? 'alert-icon-r5-imp'
                                                : 'warning-icon-y7'
                                        }`}
                                    />
                                    <p className="m-0">{app.warningMessage || tagNotFoundWarningsMap.get(app.appId)}</p>
                                </span>
                            )}
                            {unauthorizedAppList[app.appId] && (
                                <span className="flex left cy-7 fw-4 fs-12">
                                    <UnAuthorized className="icon-dim-12 warning-icon-y7 mr-4" />
                                    {BULK_CD_MESSAGING.unauthorized.title}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
                <div className="main-content dc__window-bg dc__height-inherit w-100">
                    {selectedApp.warningMessage || unauthorizedAppList[selectedApp.appId] ? (
                        renderEmptyView()
                    ) : (
                        // TODO: Handle isSuperAdmin prop
                        <CDMaterial
                            // TODO: Handle this
                            triggerDeploy={onClickStartDeploy}
                            key={selectedApp.appId}
                            materialType={MATERIAL_TYPE.inputMaterialList}
                            location={location}
                            match={match}
                            appId={selectedApp.appId}
                            envId={selectedApp.envId}
                            pipelineId={+selectedApp.cdPipelineId}
                            stageType={selectedApp.stageType}
                            isFromBulkCD
                            envName={selectedApp.envName}
                            closeCDModal={closeBulkCDModal}
                            triggerType={selectedApp.triggerType}
                            history={history}
                            isLoading={isLoading}
                            parentPipelineId={selectedApp.parentPipelineId}
                            parentPipelineType={selectedApp.parentPipelineType}
                            parentEnvironmentName={selectedApp.parentEnvironmentName}
                            ciPipelineId={_currentApp.ciPipelineId}
                            updateCurrentAppMaterial={updateCurrentAppMaterial}
                            updateBulkCDMaterialsItem={updateBulkCDMaterialsItem}
                            selectedImageFromBulk={selectedImageFromBulk}
                            isSuperAdmin={isSuperAdmin}
                        />
                    )}
                </div>
            </div>
        )
    }

    const onClickStartDeploy = (e): void => {
        stopPropagation(e)
        onClickTriggerBulkCD()
    }

    const isDeployDisabled = (): boolean => {
        return appList.every(
            (app) => app.warningMessage || tagNotFoundWarningsMap.has(app.appId) || !app.material?.length,
        )
    }

    const renderFooterSection = (): JSX.Element => {
        return (
            <div className="dc__border-top flex right bcn-0 pt-16 pr-20 pb-16 pl-20 dc__position-fixed dc__bottom-0 env-modal-width">
                <button
                    className="cta flex h-36"
                    data-testid="deploy-button"
                    onClick={onClickStartDeploy}
                    disabled={isDeployDisabled()}
                    type="button"
                >
                    {isLoading ? (
                        <Progressing />
                    ) : (
                        <>
                            {stage === DeploymentNodeType.CD ? (
                                <DeployIcon className="icon-dim-16 dc__no-svg-fill mr-8" />
                            ) : (
                                <PlayIcon className="icon-dim-16 dc__no-svg-fill scn-0 mr-8" />
                            )}
                            {BUTTON_TITLE[stage]}
                        </>
                    )}
                </button>
            </div>
        )
    }

    return (
        <Drawer position="right" width="75%" minWidth="1024px" maxWidth="1200px">
            <div className="dc__window-bg h-100 bulk-ci-trigger-container" ref={ciTriggerDetailRef}>
                {renderHeaderSection()}
                {responseList.length ? (
                    <TriggerResponseModal
                        setDownloadPopupOpen={setDownloadPopupOpen}
                        closePopup={closeBulkCDModal}
                        responseList={responseList}
                        isLoading={isLoading}
                        onClickRetryBuild={onClickTriggerBulkCD}
                        isVirtualEnv={isVirtualEnv}
                        envName={selectedApp.envName}
                    />
                ) : (
                    <>
                        {renderBodySection()}
                        {renderFooterSection()}
                    </>
                )}
            </div>
        </Drawer>
    )
}
