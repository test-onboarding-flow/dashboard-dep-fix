import React, { useMemo, useRef, useState, useEffect } from 'react'
import { ReactComponent as Add } from '../../../../assets/icons/ic-add.svg'
import Creatable from 'react-select/creatable'
import { ReactComponent as Close } from '../../../../assets/icons/ic-close.svg'
import { ReactComponent as QuestionIcon } from '../../../v2/assets/icons/ic-question.svg'
import { ReactComponent as EditIcon } from '../../../../assets/icons/ic-pencil.svg'
import { ReactComponent as Redo } from '../../../../assets/icons/ic-arrow-counter-clockwise.svg'
import { ReactComponent as Minus } from '../../../../assets/icons/ic-minus.svg'
import { ReactComponent as Rectangle } from '../../../../assets/icons/RectangleLine.svg'
import { ReactComponent as Error } from '../../../../assets/icons/ic-warning.svg'
import { ImageTagType, ReleaseTag } from './types'
import { setImageTags, getImageTags } from '../../service'
import { showError } from '@devtron-labs/devtron-fe-common-lib'

export const ImageTagsContainer = ({ ciPipelineId, artifactId }: ImageTagType) => {
    const [initialTags, setInitialTags] = useState<ReleaseTag[]>([])
    const [initialDescription, setInitialDescription] = useState('')
    const [existingTags, setExistingTags] = useState([])
    const [newDescription, setNewDescription] = useState('')
    const [isEditing, setIsEditing] = useState(false)
    const [displayedTags, setDisplayedTags] = useState<ReleaseTag[]>([])
    const [tagErrorMessage, setTagErrorMessage] = useState('')
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await getImageTags(ciPipelineId, artifactId)
                const tags = response.result?.imageReleaseTags?.map((tag) => ({
                    id: tag.id,
                    tagName: tag.tagName,
                    deleted: tag.deleted,
                    appId: 0,
                    artifactId: 0,
                }))
                const appReleaseTags = response.result?.appReleaseTags
                setExistingTags(appReleaseTags)
                setDisplayedTags(tags)
                setInitialTags(tags)
                setInitialDescription(response.result?.imageComment?.comment)
                setNewDescription(response.result?.imageComment?.comment)
            } catch (error) {
                // Handle the error if necessary
                showError(error)
            }
        }
        fetchData()
    }, [ciPipelineId, artifactId])
    const [createTags, setCreateTags] = useState<ReleaseTag[]>([])
    const [softDeleteTags, setSoftDeleteTags] = useState<ReleaseTag[]>([])
    const [hardDeleteTags, setHardDeleteTags] = useState<ReleaseTag[]>([])

    const CreatableComponents = useMemo(
        () => ({
            DropdownIndicator: () => null,
            IndicatorSeparator: () => null,
            Menu: () => null,
        }),
        [],
    )

    const handleEditClick = () => {
        setIsEditing(!isEditing)
    }

    const handleDescriptionChange = (e) => {
        setNewDescription(e.target.value)
    }

    const handleCancel = () => {
        setDisplayedTags(initialTags)
        setNewDescription(initialDescription)
        setCreateTags([])
        setSoftDeleteTags([])
        setHardDeleteTags([])
        handleEditClick()
    }

    const handleTagCreate = (newValue) => {
        setTagErrorMessage('')
        const isTagExists = existingTags.includes(newValue)
        if (isTagExists) {
            setTagErrorMessage('This tag is already applied on another image in this application')
            return
        }
        const newTag: ReleaseTag = {
            id: 0,
            tagName: newValue,
            appId: 0,
            deleted: false,
            artifactId: 0,
        }
        setCreateTags([...createTags, newTag])
        setDisplayedTags([...displayedTags, newTag])
    }

    const handleTagSoftDelete = (index) => {
        const updatedTags = [...displayedTags]
        updatedTags[index] = {
            ...updatedTags[index],
            deleted: !updatedTags[index].deleted,
        }
        setDisplayedTags(updatedTags)

        const updatedTag = {
            ...displayedTags[index],
            deleted: updatedTags[index].deleted,
        }
        const updatedSoftDeleteTags = [...softDeleteTags, updatedTag]
        setSoftDeleteTags(updatedSoftDeleteTags)
    }

    const handleTagHardDelete = (index) => {
        const deletedTag = displayedTags[index]
        const updatedCreateTags = createTags.filter((tag) => tag.tagName !== deletedTag.tagName)
        setCreateTags(updatedCreateTags)
        const updatedDisplayedTags = [...displayedTags]
        updatedDisplayedTags.splice(index, 1)
        setDisplayedTags(updatedDisplayedTags)
        if (deletedTag.id !== 0) {
            const updatedHardDeleteTags = [...hardDeleteTags, deletedTag]
            setHardDeleteTags(updatedHardDeleteTags)
        }
    }

    const handleSave = async () => {
        const payload = {
            createTags: createTags,
            softDeleteTags: softDeleteTags,
            imageComment: {
                id: 0,
                comment: newDescription,
                artifactId: 0,
            },
            hardDeleteTags: hardDeleteTags,
        }

        try {
            // set loading state true
            let response = await setImageTags(payload, ciPipelineId, artifactId)
            const tags = response.result?.imageReleaseTags?.map((tag) => ({
                id: tag.id,
                tagName: tag.tagName,
                deleted: tag.deleted,
                appId: 0,
                artifactId: 0,
            }))
            const comment = response.result?.imageComment?.comment
            setInitialTags(tags)
            setInitialDescription(comment)
            setDisplayedTags(tags)
            setNewDescription(comment)
            setCreateTags([])
            setSoftDeleteTags([])
            setHardDeleteTags([])
            handleEditClick()
        } catch (err) {
            showError(err)
        }
    }

    const creatableRef = useRef(null)

    if (newDescription === '' && displayedTags.length === 0 && !isEditing) {
        return (
            <div className="bcn-0">
                <AddImageButton handleEditClick={handleEditClick} />
            </div>
        )
    }

    return (
        <div>
            {!isEditing ? (
                <div className="top br-4 bcn-0 image-tags-container" style={{ display: 'flex' }}>
                    <div className="flex left" style={{ width: '734px' }}>
                        <Rectangle className="image-tags-container-rectangle__icon" />
                        <div className="ml-10">
                            <div className="mb-8 mt-8">{initialDescription}</div>
                            <div className="dc__flex-wrap flex left">
                                {initialTags?.map((tag, index) => (
                                    <ImageTagButton
                                        key={tag?.id}
                                        text={tag?.tagName}
                                        isSoftDeleted={tag?.deleted}
                                        isEditing={isEditing}
                                        onSoftDeleteClick={() => handleTagSoftDelete(index)}
                                        onHardDeleteClick={() => handleTagHardDelete(index)}
                                        tagId={tag.id}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <EditIcon
                        className="icon-dim-16 mt-8 ml-10 image-tags-container-edit__icon"
                        onClick={handleEditClick}
                    />
                </div>
            ) : (
                <div className="bcn-0 dc__border-top-n1 ">
                    <div className="cn-7 mt-12 flex left">
                        Release tags (eg. v1.0)
                        <QuestionIcon className="icon-dim-16 fcn-6 ml-4 cursor" />
                    </div>
                    <div className="mt-6">
                        <Creatable
                            placeholder="Type a tag and press enter"
                            onCreateOption={handleTagCreate}
                            ref={creatableRef}
                            components={CreatableComponents}
                        />
                    </div>

                    {tagErrorMessage && (
                        <div className="flex left">
                            <Error className="form__icon form__icon--error" />
                            <div className="form__error">{tagErrorMessage}</div>
                        </div>
                    )}
                    <div className="dc__flex-wrap mt-8 flex left">
                        {displayedTags?.map((tag, index) => (
                            <ImageTagButton
                                key={tag.id}
                                text={tag?.tagName}
                                isSoftDeleted={tag?.deleted}
                                isEditing={isEditing}
                                onSoftDeleteClick={() => handleTagSoftDelete(index)}
                                onHardDeleteClick={() => handleTagHardDelete(index)}
                                tagId={tag.id}
                            />
                        ))}
                    </div>
                    <div className="cn-7">Comment</div>
                    <div className="flex left flex-wrap dc__gap-8 w-100 mt-6 mb-12 ">
                        <textarea
                            value={newDescription}
                            onChange={handleDescriptionChange}
                            className="flex left flex-wrap dc__gap-8 dc__description-textarea h-90"
                        />
                    </div>
                    <div className="w-100 flex right">
                        <button className="cta cancel h-32 lh-32" type="button" onClick={handleCancel}>
                            Cancel
                        </button>
                        <button className="cta h-32 lh-32 ml-12" type="button" onClick={handleSave}>
                            Save
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

const ImageTagButton = ({ text, isSoftDeleted, isEditing, onSoftDeleteClick, onHardDeleteClick, tagId }) => {
    const containerClassName = isSoftDeleted ? 'image-tag-button-soft-deleted mb-8 mr-8' : 'image-tag-button mb-8 mr-8'
    const IconComponent = isSoftDeleted ? Redo : Minus

    const [isHovered, setIsHovered] = useState(false)
    const handleMouseEnter = () => {
        if (isEditing) {
            setIsHovered(true)
        }
    }
    const handleMouseLeave = () => {
        if (isEditing) {
            setIsHovered(false)
        }
    }

    return (
        <div className={containerClassName} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <div className="mr-8 ml-8 mt-2 mb-2 flex">
                {isHovered && isEditing && ((tagId === 0 && isSoftDeleted) || (tagId !== 0 && !isSoftDeleted)) && (
                    <IconComponent className="icon-dim-14 mr-2" onClick={onSoftDeleteClick} />
                )}
                {text}
                {isHovered && isEditing && <Close className="icon-dim-14 mr-2 cn-5" onClick={onHardDeleteClick} />}
            </div>
        </div>
    )
}

const AddImageButton = ({ handleEditClick }) => {
    const handleClick = () => {
        handleEditClick()
    }

    return (
        <div className="add-tag-button flex" onClick={handleClick}>
            <div className="lh-16 flex">
                <Add className="icon-dim-16 cn-6" />
                <span className="cn-7">Add tags/comment</span>
            </div>
        </div>
    )
}
