import React, { useState, useRef, useEffect } from 'react'
import Tippy from '@tippyjs/react'
import { LoadScopedVariables } from './UploadScopedVariables'
import ScopedVariablesEditor from './ScopedVariablesEditor'
import VariablesList from './VariablesList'
import { useFileReader, useClickOutside } from './utils/hooks'
import CodeEditor from '../CodeEditor/CodeEditor'
import Descriptor from './Descriptor'
import { downloadData, parseIntoYAMLString } from './utils/helpers'
import { FileView, SavedVariablesViewI, VariableListItemI } from './types'
import {
    DOWNLOAD_FILE_NAME,
    DOWNLOAD_TEMPLATE_NAME,
    DROPDOWN_ITEMS,
    SCOPED_VARIABLES_TEMPLATE_DATA
} from './constants'
import { ReactComponent as ICPencil } from '../../assets/icons/ic-pencil.svg'
import { ReactComponent as ICFileDownload } from '../../assets/icons/ic-file-download.svg'

const SavedVariablesView = ({
    scopedVariablesData,
    jsonSchema,
    reloadScopedVariables,
    setScopedVariables,
}: SavedVariablesViewI) => {
    const [showDropdown, setShowDropdown] = useState<boolean>(false)
    const [currentView, setCurrentView] = useState<FileView>(FileView.YAML)
    const [variablesList, setVariablesList] = useState<VariableListItemI[]>([])
    const [showEditView, setShowEditView] = useState<boolean>(false)
    const dropdownRef = useRef(null)
    // No need to make it a state since editor here is read only and we don't need to update it
    let scopedVariablesYAML = parseIntoYAMLString(scopedVariablesData)

    const { status, progress, fileData, abortRead, readFile } = useFileReader()

    useEffect(() => {
        if (status?.status == null) {
            const variables = scopedVariablesData?.spec?.map((variable) => {
                return {
                    name: variable.name,
                    description: variable.description,
                }
            })
            if (variables) setVariablesList([...variables])
        }
    }, [scopedVariablesData])

    const handleDropdownClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.stopPropagation()
        setShowDropdown(!showDropdown)
    }

    useClickOutside(dropdownRef, () => {
        setShowDropdown(false)
    })

    const handleDownload = (item: string) => {
        if (!scopedVariablesYAML) return
        switch (item) {
            case DROPDOWN_ITEMS[0]:
                downloadData(scopedVariablesYAML, DOWNLOAD_FILE_NAME, 'application/x-yaml')
                setShowDropdown(false)
                break
            case DROPDOWN_ITEMS[1]:
                downloadData(SCOPED_VARIABLES_TEMPLATE_DATA, DOWNLOAD_TEMPLATE_NAME, 'application/x-yaml')
                setShowDropdown(false)
                break
        }
    }

    if (showEditView) {
        return (
            <ScopedVariablesEditor
                variablesData={scopedVariablesYAML}
                name={fileData?.name}
                abortRead={null}
                reloadScopedVariables={reloadScopedVariables}
                jsonSchema={jsonSchema}
                setShowEditView={setShowEditView}
                setScopedVariables={setScopedVariables}
            />
        )
    }

    if (status?.status === true) {
        return (
            <ScopedVariablesEditor
                variablesData={status?.message?.data}
                name={fileData?.name}
                abortRead={abortRead}
                reloadScopedVariables={reloadScopedVariables}
                jsonSchema={jsonSchema}
                setScopedVariables={setScopedVariables}
            />
        )
    }

    return status?.status == null ? (
        <div
            className="flex column h-100 dc__content-space bcn-0"
            style={{
                overflowY: 'hidden',
            }}
        >
            <Descriptor showUploadButton readFile={readFile}>
                <div className="scoped-variables-tab-container bcn-0 pt-0 pb-0 pl-20 pr-20 flex center dc__align-self-stretch dc__content-start">
                    <button
                        className={`scoped-variables-tab pt-8 pr-16 pb-0 pl-0 flex column dc__content-center dc__align-start ${
                            currentView === FileView.YAML ? 'scoped-variables-active-tab' : ''
                        }`}
                        onClick={() => setCurrentView(FileView.YAML)}
                    >
                        <div>YAML</div>
                    </button>
                    <button
                        className={`scoped-variables-tab pt-8 pr-16 pb-0 pl-0 flex column dc__content-center dc__align-start ${
                            currentView === FileView.SAVED ? 'scoped-variables-active-tab' : ''
                        }`}
                        onClick={() => setCurrentView(FileView.SAVED)}
                    >
                        <div>Variable List</div>
                    </button>
                </div>
            </Descriptor>

            {currentView === FileView.YAML ? (
                <div className="saved-variables-editor-background p-8 flex column dc__align-start dc__content-start dc__gap-16 dc__align-self-stretch">
                    <div className="saved-variables-editor-container flex column dc__content-space dc__align-self-stretch dc__align-start">
                        <div className="scoped-variables-editor-infobar flex pt-8 pb-8 pl-12 pr-12 bcn-0 dc__gap-16 dc__content-space dc__align-items-center dc__align-self-stretch">
                            <p className="scoped-variables-editor-infobar__typography">Last saved file</p>

                            <Tippy
                                className="default-tt"
                                arrow
                                placement="top"
                                content={
                                    <div>
                                        <div className="flex column left">Edit</div>
                                    </div>
                                }
                            >
                                <button
                                    className="scoped-variables-editor-infobar__btn"
                                    onClick={() => setShowEditView(true)}
                                >
                                    <ICPencil width={20} height={20} />
                                </button>
                            </Tippy>

                            <Tippy
                                className="default-tt"
                                arrow
                                placement="top"
                                content={
                                    <div>
                                        <div className="flex column left">Download file/template</div>
                                    </div>
                                }
                            >
                                <button className="scoped-variables-editor-infobar__btn" onClick={handleDropdownClick}>
                                    <ICFileDownload width={20} height={20} />
                                </button>
                            </Tippy>
                            {showDropdown && (
                                <div
                                    className="scoped-variables-editor-infobar__dropdown pt-4 pb-4 pl-0 pr-0 bcn-0 flex column dc__content-start dc__align-start"
                                    ref={dropdownRef}
                                >
                                    {DROPDOWN_ITEMS.map((item) => (
                                        <div
                                            key={item}
                                            className="scoped-variables-editor-infobar__dropdown-item bcn-0 p-8 flex center dc__align-self-stretch dc__gap-12 dc__content-start"
                                            onClick={() => handleDownload(item)}
                                        >
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <CodeEditor value={scopedVariablesYAML} mode="yaml" height="100%" readOnly />
                    </div>
                </div>
            ) : (
                <VariablesList variablesList={variablesList} />
            )}
        </div>
    ) : (
        <div className="flex column h-100 dc__content-space">
            <Descriptor />
            <div className="flex center flex-grow-1">
                <div className="flex column center dc__gap-20 w-320 dc__no-shrink">
                    <div className="upload-scoped-variables-card flex column center dc__gap-8">
                        <LoadScopedVariables
                            status={status}
                            progress={progress}
                            fileData={fileData}
                            abortRead={abortRead}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SavedVariablesView
