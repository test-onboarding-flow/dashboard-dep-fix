import React from 'react'
import { useHistory } from 'react-router-dom'
import { ResourceCardProps } from './types'
import { ReactComponent as AddIcon } from '../../assets/icons/ic-add.svg'

const ResourceCard = ({
    name,
    icon,
    count = 0,
    recentResources,
    handleClick,
    to,
    createResourceLink: createResource,
}: ResourceCardProps & {
    handleClick: (to: string) => void
}) => (
    <div className="flexbox-col w-100 dc__mxw-350 mxh-228 br-8 bcn-0 en-2 bw-1 dc__overflow-hidden">
        <div
            className="flex flex-justify dc__gap-16 dc__border-bottom cursor pl-16 pr-16 pt-16 pb-16"
            role="button"
            onClick={() => handleClick(to)}
        >
            <div className="flexbox-col dc__gap-4">
                <h3 className="fs-16 fw-7 lh-24 m-0">{name}</h3>
                <p className="cn-7 m-0">{count === 0 ? 'No' : count} Resources</p>
            </div>
            <div>{icon}</div>
        </div>
        <div
            className={`flexbox-col dc__gap-12 bc-n50 pl-16 pr-16 pt-16 pb-16 dc__overflow-auto flex-grow-1 ${
                recentResources.length === 0 ? 'flex' : ''
            }`}
        >
            {recentResources.length === 0 ? (
                <div className="flex column left dc__gap-8 ">
                    <AddIcon
                        className="icon-dim-24 bcn-0 fcn-6 bw-1 br-4 dashed en-3 cursor"
                        onClick={() => handleClick(createResource)}
                    />
                    <span className="cn-7">Create Resource</span>
                </div>
            ) : (
                <>
                    <h4 className="cn-7 fw-6 m-0">Recent</h4>
                    <div
                        className="display-grid dc__gap-8"
                        style={{
                            gridTemplateColumns: 'repeat(2, 1fr)',
                        }}
                    >
                        {recentResources.map((resource) => (
                            <div
                                className="flex flex-justify-start dc__gap-8 dc__ellipsis-right cursor"
                                role="button"
                                onClick={() => handleClick(resource.to)}
                            >
                                {'image' in resource ? (
                                    <img
                                        className="w-24 h-24 br-4"
                                        src={resource.image}
                                        alt={`Resource - ${resource.name}`}
                                    />
                                ) : (
                                    resource.icon
                                )}
                                <span className="dc__ellipsis-right">{resource.name}</span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    </div>
)

export const ResourceCardList = ({ cardList }: { cardList: ResourceCardProps[] }) => {
    const history = useHistory()

    const handleClick = (to) => {
        history.push(to)
    }

    return (
        <div className="cn-9 fs-13 lh-20 fw-4 flexbox dc__gap-16 flex-wrap">
            {cardList.map((card, index) => (
                <ResourceCard key={`resource-card-${index}`} {...card} handleClick={handleClick} />
            ))}
        </div>
    )
}
