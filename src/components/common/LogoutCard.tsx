import React from 'react'
import { useHistory } from 'react-router-dom'
import { getRandomColor } from '@devtron-labs/devtron-fe-common-lib'

interface LogoutCardType {
    className: string
    userFirstLetter: string
    setShowLogOutCard: React.Dispatch<React.SetStateAction<boolean>>
    showLogOutCard: boolean
}

function LogoutCard({ className, userFirstLetter, setShowLogOutCard, showLogOutCard }: LogoutCardType) {
    const history = useHistory()

    const onLogout = () => {
        document.cookie = `argocd.token=; expires=Thu, 01-Jan-1970 00:00:01 GMT;path=/`
        history.push('/login')
    }

    return (
        <div className="dc__transparent-div" onClick={() => setShowLogOutCard(!showLogOutCard)}>
            <div className={`logout-card ${className}`}>
                <div className="flexbox flex-justify p-16">
                    <div className="logout-card-user ">
                        <p className="logout-card__name dc__ellipsis-right">{userFirstLetter}</p>
                        <p className="logout-card__email dc__ellipsis-right">{userFirstLetter}</p>
                    </div>
                    <p
                        className="logout-card__initial fs-16 icon-dim-32 mb-0"
                        style={{ backgroundColor: getRandomColor(userFirstLetter) }}
                    >
                        {userFirstLetter[0]}
                    </p>
                </div>
                <div className="logout-card__logout cursor" data-testid="logout-button" onClick={onLogout}>
                    Logout
                </div>
            </div>
        </div>
    )
}

export default LogoutCard
