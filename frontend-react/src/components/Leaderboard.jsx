import Form from 'react-bootstrap/Form';
import { useState } from "react";
import { useLoaderData, useRevalidator } from "react-router-dom";
import { useAuth } from "../provider/authProvider";
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { Button } from 'react-bootstrap';
import SeasonSelector from "./SeasonSelector";

const groupByTeamName = function (xs) {
    return xs.reduce(function (rv, x) {
        (rv[x.team.teamName] = rv[x.team.teamName] || []).push(x);
        return rv;
    }, {});
};
const groupByUserIdAndName = function (xs) {
    return xs.reduce(function (rv, x) {
        (rv[x.user?.id || x.announcer.displayName] = rv[x.user?.id || x.announcer.displayName] || []).push(x);
        return rv;
    }, {});
};

function groupPicksIntoLeaderboardUsers(groupedByTeamPicks, announcerPicksOnly, myPicksOnly, userId) {
    for (let [team] of Object.entries(groupedByTeamPicks)) {
        groupedByTeamPicks[team] = groupByUserIdAndName(groupedByTeamPicks[team]);
        const userObjects = [];
        const filterGames = new Set();
        for (const [user] of Object.entries(groupedByTeamPicks[team])) {
            let announcer = groupedByTeamPicks[team][user][0].announcer != undefined;
            for (const [pickIndex] of Object.entries(groupedByTeamPicks[team][user])) {
                const pick = groupedByTeamPicks[team][user][pickIndex];
                if (announcerPicksOnly && announcer) {
                    filterGames.add(pick.game.id);
                }
                if (myPicksOnly && user == userId) {
                    filterGames.add(pick.game.id);
                }
            }
        }
        for (const [userIndex] of Object.entries(groupedByTeamPicks[team])) {
            const userPicks = groupedByTeamPicks[team][userIndex];
            let points = 0;
            let games = 0;
            let announcer = userPicks[0].announcer != undefined;
            let displayName = userPicks[0].user?.displayName || userPicks[0].announcer?.displayName;
            for (let [pickIndex] of Object.entries(userPicks)) {
                const pick = groupedByTeamPicks[team][userIndex][pickIndex];
                if ((!myPicksOnly && !announcerPicksOnly) || filterGames.has(pick.game.id)) {
                    if (pick.doublePoints == true) {
                        points += (pick.points || 0) * 2;
                    } else {
                        points += pick.points || 0;
                    }
                    games++;
                }
            }
            if (games > 0) {
                userObjects.push({
                    'points': points,
                    'games': games,
                    'displayName': displayName,
                    'redditUsername': announcer ? null : userPicks[0].user?.redditUsername,
                    'isAnnouncer': announcer,
                    'isMe': !announcer && userPicks[0].user.id == userId
                });
            }
        }
        userObjects.sort((aUser, bUser) => bUser.points - aUser.points || aUser.games - bUser.games);
        var rank = 0;
        var lastPoints = -1;
        var lastNumPicks = -1;
        userObjects.forEach((userObject) => {
            if (userObject.points != lastPoints || userObject.games != lastNumPicks) {
                rank += 1;
                lastPoints = userObject.points;
                lastNumPicks = userObject.games;
            }
            userObject.rank = rank;
        });
        groupedByTeamPicks[team] = userObjects;
    }
}

export default function Leaderboard(props) {
    const revalidator = useRevalidator();
    const { getIdFromJwt } = useAuth();
    const [myPicksOnly, setMyPicksOnly] = useState(false);
    const [announcerPicksOnly, setAnnouncerPicksOnly] = useState(false);
    const userId = getIdFromJwt();
    const response = useLoaderData();
    const picks = response.data;
    let groupedByTeamPicks = groupByTeamName(picks);
    groupPicksIntoLeaderboardUsers(groupedByTeamPicks, announcerPicksOnly, myPicksOnly, userId);
    let teams = Object.keys(groupedByTeamPicks)
        .filter((team) => groupedByTeamPicks[team].length > 0)
        .sort((a, b) => a.localeCompare(b));
    return <>
        <SeasonSelector setSeason={props.setSeason} getSeason={props.getSeason} />
        <Button variant="secondary" size="sm" className="mt-1 float-end" onClick={() => revalidator.revalidate()}>
            {revalidator.state === "idle" ? "Refresh Points" : "Refreshing......"}
        </Button>
        <Form.Select className="leaderboardSelector mt-1 me-1" onChange={(e) => props.setLeaderboardTab(e.target.value)} defaultValue={props.leaderboardTab}>
            <option value="friends">Friends</option>
            <option value="global">Global</option>
            <option value="reddit">Reddit</option>
        </Form.Select>
        <Form.Check
            type="checkbox"
            id="mypicksonly"
            label="Only games I've picked"
            defaultChecked={myPicksOnly}
            disabled={announcerPicksOnly}
            onChange={() => { setMyPicksOnly(!myPicksOnly) }}
        />
        {props.leaderboardTab == "global" &&
            <Form.Check
                type="checkbox"
                id="announcerpicksonly"
                label="Only games announcers picked"
                defaultChecked={announcerPicksOnly}
                disabled={myPicksOnly}
                onChange={() => { setAnnouncerPicksOnly(!announcerPicksOnly) }}
            />
        }
        {picks.length == 0 ?
            <h2>No picks yet!</h2> :
            <Tabs
                id="controlled-tab-example"
                className="mb-3 flex-nowrap text-nowrap" style={{ overflowX: 'auto', overflowY: 'hidden' }}
            >
                {teams.map(function (team) {
                    const users = groupedByTeamPicks[team];
                    const userKeys = Object.keys(users);
                    return <Tab eventKey={team} title={team} key={team}>
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <td></td><td>User</td><td>Num Picks</td><td>Points</td>
                                </tr>
                            </thead>
                            <tbody>
                                {userKeys.map(function (userKey) {
                                    const user = users[userKey];
                                    let rowClassName = ""
                                    if (user.isMe) {
                                        rowClassName = "table-active";
                                    }
                                    if (user.isAnnouncer) {
                                        rowClassName = "table-danger";
                                    }
                                    let displayName = user.displayName;
                                    if (props.leaderboardTab == "reddit") {
                                        displayName = user.redditUsername;
                                    }
                                    return <tr key={userKey} className={rowClassName}><td>{user.rank}</td><td>{displayName}</td><td>{user.games}</td><td><b>{user.points}</b></td></tr>
                                })}
                            </tbody>
                        </table>
                    </Tab>;
                })}
            </Tabs>
        }
    </>

}