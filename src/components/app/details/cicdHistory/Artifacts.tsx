import React, { useEffect, useState } from 'react'
import { showError, EmptyState, TippyCustomized, TippyTheme } from '@devtron-labs/devtron-fe-common-lib'
import { copyToClipboard, getAlphabetIcon } from '../../../common'
import { useParams } from 'react-router'
import { ReactComponent as CopyIcon } from '../../../../assets/icons/ic-copy.svg'
import { ReactComponent as Download } from '../../../../assets/icons/ic-download.svg'
import { ReactComponent as MechanicalOperation } from '../../../../assets/img/ic-mechanical-operation.svg'
import { ReactComponent as OpenInNew } from '../../../../assets/icons/ic-open-in-new.svg'
import { ReactComponent as Question } from '../../../../assets/icons/ic-help.svg'
import { ReactComponent as ApprovedIcon } from '../../../../assets/icons/ic-checks.svg'
import docker from '../../../../assets/icons/misc/docker.svg'
import folder from '../../../../assets/icons/ic-folder.svg'
import noartifact from '../../../../assets/img/no-artifact@2x.png'
import Tippy from '@tippyjs/react'
import { EmptyView } from './History.components'
import '../cIDetails/ciDetails.scss'
import { ArtifactType, CIListItemType, CopyTippyWithTextType, HistoryComponentType } from './types'
import { DOCUMENTATION, TERMINAL_STATUS_MAP } from '../../../../config'
import { ARTIFACTS_EMPTY_STATE_TEXTS } from './Constants'
import { extractImage } from '../../service'

export default function Artifacts({
    status,
    artifact,
    blobStorageEnabled,
    isArtifactUploaded,
    getArtifactPromise,
    isJobView,
    type,
}: ArtifactType) {
    const { buildId, triggerId } = useParams<{ buildId: string; triggerId: string }>()
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (!copied) return
        setTimeout(() => setCopied(false), 2000)
    }, [copied])

    async function handleArtifact(e) {
        try {
            const response = await getArtifactPromise()
            const b = await (response as any).blob()
            const a = document.createElement('a')
            a.href = URL.createObjectURL(b)
            a.download = `${buildId || triggerId}.zip`
            a.click()
        } catch (err) {
            showError(err)
        }
    }

    if (status.toLowerCase() === TERMINAL_STATUS_MAP.RUNNING || status.toLowerCase() === TERMINAL_STATUS_MAP.STARTING) {
        return <CIProgressView />
    } else if (isJobView && !blobStorageEnabled) {
        return (
            <div className="flex column p-24 w-100 h-100">
                <EmptyView
                    title={ARTIFACTS_EMPTY_STATE_TEXTS.NoFilesFound}
                    subTitle={ARTIFACTS_EMPTY_STATE_TEXTS.BlobStorageNotConfigured}
                    imgSrc={noartifact}
                />
                <div className="flexbox pt-8 pr-12 pb-8 pl-12 bcv-1 ev-2 bw-1 br-4">
                    <Question className="icon-dim-20 fcv-5" />
                    <span className="fs-13 fw-4 mr-8 ml-8">{ARTIFACTS_EMPTY_STATE_TEXTS.StoreFiles}</span>
                    <a className="fs-13 fw-6 cb-5 dc__no-decor" href={DOCUMENTATION.BLOB_STORAGE} target="_blank">
                        {ARTIFACTS_EMPTY_STATE_TEXTS.ConfigureBlobStorage}
                    </a>
                    <OpenInNew className="icon-dim-20 ml-8" />
                </div>
            </div>
        )
    } else if (isJobView && !isArtifactUploaded) {
        return (
            <EmptyView
                title={ARTIFACTS_EMPTY_STATE_TEXTS.NoFilesFound}
                subTitle={ARTIFACTS_EMPTY_STATE_TEXTS.NoFilesGenerated}
                imgSrc={noartifact}
            />
        )
    } else if (
        status.toLowerCase() === TERMINAL_STATUS_MAP.FAILED ||
        status.toLowerCase() === TERMINAL_STATUS_MAP.CANCELLED
    ) {
        return (
            <EmptyView
                title={ARTIFACTS_EMPTY_STATE_TEXTS.NoArtifactsGenerated}
                subTitle={ARTIFACTS_EMPTY_STATE_TEXTS.NoArtifactsError}
            />
        )
    } else {
        return (
            <div className="flex left column p-16">
                {!isJobView && (
                    <CIListItem type="artifact">
                        <div className="flex column left hover-trigger">
                            <div className="cn-9 fs-14 flex left" data-testid = "artifact-text-visibility">
                                <CopyTippyWithText
                                    copyText={extractImage(artifact)}
                                    copied={copied}
                                    setCopied={setCopied}
                                />
                            </div>
                            <div className="cn-7 fs-12 flex left" data-testid = "artifact-image-text">
                                <CopyTippyWithText copyText={artifact} copied={copied} setCopied={setCopied} />
                            </div>
                        </div>
                    </CIListItem>
                )}
                {blobStorageEnabled && getArtifactPromise && (type === HistoryComponentType.CD || isArtifactUploaded) && (
                    <CIListItem type="report">
                        <div className="flex column left">
                            <div className="cn-9 fs-14">Reports.zip</div>
                            <button
                                type="button"
                                onClick={handleArtifact}
                                className="anchor p-0 cb-5 fs-12 flex left pointer"
                            >
                                Download
                                <Download className="ml-5 icon-dim-16" />
                            </button>
                        </div>
                    </CIListItem>
                )}
            </div>
        )
    }
}

export const CopyTippyWithText = ({ copyText, copied, setCopied }: CopyTippyWithTextType): JSX.Element => {
    const onClickCopyToClipboard = (e): void => {
        copyToClipboard(e.target.dataset.copyText, () => setCopied(true))
    }
    return (
        <>
            {copyText}
            <Tippy
                className="default-tt"
                arrow={false}
                placement="bottom"
                content={copied ? 'Copied!' : 'Copy to clipboard.'}
                trigger="mouseenter click"
                interactive={true}
            >
                <CopyIcon
                    data-copy-text={copyText}
                    className="pointer ml-6 icon-dim-16"
                    onClick={onClickCopyToClipboard}
                />
            </Tippy>
        </>
    )
}

const CIProgressView = (): JSX.Element => {
    return (
        <EmptyState>
            <EmptyState.Image>
                <MechanicalOperation />
            </EmptyState.Image>
            <EmptyState.Title>
                <h4>Building artifacts</h4>
            </EmptyState.Title>
            <EmptyState.Subtitle>
                Generated artifact(s) will be available here after the pipeline is executed.
            </EmptyState.Subtitle>
        </EmptyState>
    )
}

const getApprovedTippyContent = (
    approvalRequested: string,
    approvedBy: string[],
    deployedBy: string
) => {
    return (
        <div className="pl-12 pr-12 h-100 dc__overflow-hidden">
            <div className="pt-12 pb-12 h-100 mxh-210 dc__overflow-scroll">
                <div>
                    <h5 className="fs-13 fw-6 lh-20 mt-0 mb-8">Approval requested by</h5>
                    <span className="flex left mb-8">
                        {getAlphabetIcon(approvalRequested)}
                        {approvalRequested}
                    </span>
                </div>
                <div className="mt-12">
                    <h5 className="fs-13 fw-6 lh-20 mt-0 mb-8">Approved by</h5>
                    <ol className="p-0 dc__list-style-none">
                        {approvedBy.map((_approver) => {
                            return (
                                <li key={_approver} className="flex left mb-8">
                                    {getAlphabetIcon(_approver)}
                                    {_approver}
                                </li>
                            )
                        })}
                    </ol>
                </div>
                <div className="mt-12">
                    <h5 className="fs-13 fw-6 lh-20 mt-0 mb-8">Deployed by</h5>
                    <span className="flex left mt-8">
                        {getAlphabetIcon(deployedBy)}
                        {deployedBy}
                    </span>
                </div>
            </div>
        </div>
    )
}

export const CIListItem = ({ type, userApprovalMetadata, triggeredBy, children }: CIListItemType) => {
    return (
        <div className={`mb-16 ci-artifact ci-artifact--${type}`}>
            {type === 'approved-artifact' ? (
                <>
                    <TippyCustomized
                        theme={TippyTheme.white}
                        className="w-300 h-100"
                        placement="top-start"
                        Icon={ApprovedIcon}
                        heading="Approved"
                        additionalContent={getApprovedTippyContent(
                            userApprovalMetadata.requestedUserData?.userEmail,
                            userApprovalMetadata.approvedUsersData?.map((_approver) => _approver.userEmail),
                            triggeredBy,
                        )}
                        showCloseButton={true}
                        trigger="click"
                        interactive={true}
                    >
                        <div className="flex left dc_width-max-content dc__border-bottom-n1 pt-8 pb-8 pl-16 pr-16 h-36 cursor">
                            <ApprovedIcon className="icon-dim-16 mr-8" />
                            {userApprovalMetadata.approvedUsersData.length} Approved
                        </div>
                    </TippyCustomized>
                    <div className="approved-artifact pt-16 pb-16 pl-16 pr-16 flex-align-center">
                        <div className="bcn-1 flex br-4 icon-dim-40">
                            <img src={docker} className="icon-dim-24" />
                        </div>
                        {children}
                    </div>
                </>
            ) : (
                <>
                    <div className="bcn-1 flex br-4">
                        <img src={type === 'artifact' ? docker : folder} className="icon-dim-24" />
                    </div>
                    {children}
                </>
            )}
        </div>
    )
}
