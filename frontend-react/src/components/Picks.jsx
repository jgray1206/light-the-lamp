import AxiosInstance from '../provider/axiosProvider';
import {useLoaderData, useRevalidator} from "react-router-dom";
import {useState, useEffect} from "react";
import Form from 'react-bootstrap/Form';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import Table from 'react-bootstrap/Table';
import {Button} from 'react-bootstrap';
import Swal from 'sweetalert2';
import SeasonSelector from "./SeasonSelector";

const getPic = async (id) => {
    return await AxiosInstance.get("/api/user/" + id + "/pic")
        .then(response => "data:image/png;base64," + response.data)
        .catch(err => "./shrug.png");
}

export default function Picks(props) {
    const [hideFriendsPick, setHideFriendsPick] = useState(true);
    const response = useLoaderData();
    const games = response.games.data.sort((a, b) => b.id - a.id).sort(function (a, b) {
        return (
            new Date(
                b.date[0],
                b.date[1] - 1,
                b.date[2],
                b.date[3],
                b.date[4]
            ) -
            new Date(a.date[0], a.date[1] - 1, a.date[2], a.date[3], a.date[4])
        );
    });
    const myPicksMap = new Map(response.myPicks.data.map((pick) => [pick.game.id + "-" + pick.team.id, pick]));
    const user = response.user.data;
    const teams = user.teams?.sort(function (a, b) {
        return a.teamName.localeCompare(b.teamName)
    });
    const gamesByTeamMap = games?.reduce(
        (acc, obj) => (
            (acc[obj.awayTeam.id] =
                acc[obj.awayTeam.id] || []).push(obj) && (acc[obj.homeTeam.id] =
                acc[obj.homeTeam.id] || []).push(obj),
                acc
        ),
        {}
    );
    const friendsPicks = response.friendsPicks.data;
    const [pics, setPics] = useState(new Map());
    const [resetTeamGameEnabled, setResetTeamGameEnabled] = useState(true);
    const [team, setTeam] = useState();
    const [game, setGame] = useState();
    const friendsPicksMap = friendsPicks?.reduce(
        (acc, obj) => (
            (acc[obj.game.id + "-" + obj.team.id] =
                acc[obj.game.id + "-" + obj.team.id] || []).push(obj),
                acc
        ),
        {}
    );

    const revalidator = useRevalidator();

    useEffect(() => {
        if (resetTeamGameEnabled) {
            const activeGame = getActiveGame(games);
            const activeTeam = getActiveTeam(teams, activeGame);
            setTeam(activeTeam);
            setGame(activeGame?.id + "-" + activeTeam);
        }
    }, [teams, games]);

    useEffect(() => {
        setResetTeamGameEnabled(true);
    }, [props.getSeason]);

    useEffect(() => {
        async function fetchPics() {
            const pics = new Map();
            if (user.friends?.length > 0) {
                for (const friend of user.friends) {
                    pics.set(friend.id, await getPic(friend.id));
                }
            }
            setPics(pics);
        }

        fetchPics();
    }, []);

    return <>
        <SeasonSelector setSeason={props.setSeason} getSeason={props.getSeason}/>
        <Button variant="secondary" size="sm" className="mt-1 float-end" onClick={() => {
            setResetTeamGameEnabled(false);
            revalidator.revalidate();
        }}>
            {revalidator.state === "idle" ? "Refresh Points" : "Refreshing..."}
        </Button>
        <Form.Check
            type="switch"
            id="hideFriendsPick"
            label="Hide Friend Picks When Picking"
            defaultChecked={hideFriendsPick}
            onChange={() => {
                setHideFriendsPick(!hideFriendsPick)
            }}/>
        {!teams || teams.length == 0 ? <h2>You have not joined any teams! Please check your profile settings.</h2> :
            games.length == 0 ? <h2>No games yet!</h2> :
                <Tabs
                    id="team-tabs"
                    className="mb-3 flex-nowrap text-nowrap"
                    style={{overflowX: 'auto', overflowY: 'hidden'}}
                    activeKey={team}
                    onSelect={(k) => {
                        setTeam(k);
                        setGame(getActiveGame(gamesByTeamMap[k])?.id + "-" + k);
                    }}
                >
                    {teams.map(function (team) {
                        if (gamesByTeamMap[team.id]?.length > 0) {
                            return <Tab eventKey={team.id} title={team.teamName} key={team.id}>
                                <Tabs
                                    id="game-tabs"
                                    className="mb-3 flex-nowrap text-nowrap"
                                    style={{overflowX: 'auto', overflowY: 'hidden'}}
                                    onSelect={(e) => {
                                        if (e.includes("moregames")) {
                                            props.setMaxGames(props.maxGames + 20);
                                            setGame(game);
                                        } else {
                                            setGame(e);
                                        }
                                    }}
                                    activeKey={game}>
                                    {
                                        gamesByTeamMap[team.id]?.map((game, index) => {
                                            const prevGame = index != (gamesByTeamMap[team.id].size - 1) ? gamesByTeamMap[team.id][index + 1] : undefined;
                                            const prevPrevGame = index != (gamesByTeamMap[team.id].size - 2) ? gamesByTeamMap[team.id][index + 2] : undefined;
                                            const prevPicks = [prevGame, prevPrevGame]
                                                .filter((prevGame) => prevGame != undefined)
                                                .map((prevGame) => {
                                                    return myPicksMap.get(prevGame.id + "-" + team.id);
                                                })
                                                .filter((prevGame) => prevGame != undefined);
                                            return picksTable(game, prevGame, team, myPicksMap, friendsPicksMap, pics, props.getSeason, hideFriendsPick, revalidator, prevPicks, setResetTeamGameEnabled);
                                        })
                                    }
                                    {
                                        gamesByTeamMap[team.id]?.length == props.maxGames &&
                                        <Tab tabClassName="text-secondary" eventKey={team.id + "moregames"}
                                             title={"Load More\nGames"} key={team.id + "moregames"}/>
                                    }
                                </Tabs>
                            </Tab>;
                        }
                    })}
                </Tabs>
        }
    </>;
}

function getActiveTeam(teams, game) {
    const output = teams?.find((team) => {
        return (
            team.id == game?.awayTeam?.id ||
            team.id == game?.homeTeam?.id
        );
    })?.id;
    return output;
}

function getActiveGame(games) {
    const output = games?.findLast((game) => {
        return game.gameState == "Live" || game.gameState == "Preview";
    }) || games?.[0];
    return output;
}

function picksTable(game, prevGame, team, picksMap, friendsPicksMap, pics, season, hideFriendsPick, revalidator, prevPicks, setResetTeamGameEnabled) {
    var pick = picksMap.get(game.id + "-" + team.id);
    var friendsPicksForGame = friendsPicksMap[game.id + "-" + team.id];
    var friendPicksByPlayerMap = friendsPicksForGame?.reduce(
        (acc, obj) => (
            (acc[
            obj.gamePlayer?.id?.playerId ||
            (obj.theTeam && "theTeam") ||
            (obj.goalies && "goalies")
                ] =
                acc[
                obj.gamePlayer?.id?.playerId ||
                (obj.theTeam && "theTeam") ||
                (obj.goalies && "goalies")
                    ] || []).push(obj),
                acc
        ),
        {}
    );
    let prevGamePlayersMap;
    if (prevGame) {
        prevGamePlayersMap = new Map(prevGame.players.map((player) => [player.id.playerId, player]));
    }
    game.awayOrHome = game.awayTeam.id == team.id ? "away" : "home";
    var seasonImgText = season.substring(0, 4) + (parseInt(season.substring(0, 4)) + 1);
    var curDate = new Date();
    var gameDate = new Date(
        Date.UTC(
            game.date[0],
            game.date[1] - 1,
            game.date[2],
            game.date[3],
            game.date[4] + 5
        )
    );
    const pickEnabled = pick == undefined && gameDate > curDate;
    var rows = [];
    var gamePlayers = game.players.filter((player) => player.team.id == team.id);
    pushPlayerRows(gamePlayers, rows, prevGamePlayersMap, pickEnabled, team, seasonImgText, prevPicks, pick, friendPicksByPlayerMap, game);
    pushGoalieRow(gamePlayers, rows, pickEnabled, team, seasonImgText, prevPicks, pick, friendPicksByPlayerMap, game);
    pushTeamRow(rows, pickEnabled, team, prevPicks, pick, friendPicksByPlayerMap, game);
    rows.sort((a, b) =>
        a.picked ? -1
            : 1
    );

    var gameStringShort =
        gameDate.getMonth() +
        1 +
        "/" +
        gameDate.getDate() +
        "/" +
        gameDate.getFullYear();
    if (game.awayOrHome == "away") {
        gameStringShort += "\n@ " + game.homeTeam.shortName;
    } else {
        gameStringShort += "\nv " + game.awayTeam.shortName;
    }
    let classString = "";
    if (pick && game.gameState != "Final") {
        classString = "text-danger";
    } else if (pickEnabled && game.gameState != "Final") {
        classString = "text-success";
    }
    return <Tab tabClassName={classString} eventKey={game.id + "-" + team.id} title={gameStringShort}
                key={game.id + "-" + team.id}>
        <Table responsive hover>
            <thead>
            <tr>
                <th>Player</th>
                {(!pickEnabled || (pickEnabled && !hideFriendsPick)) && <th>Friends</th>}
                <th>Points</th>
                {pickEnabled && <th>Pick</th>}</tr>
            </thead>
            <tbody>
            {
                rows.map(function (row) {
                        return <>
                            <tr key={game.id + "-" + row.name}
                                className={row.picked ? "table-danger" : (pickEnabled && row.noToi) ? "table-warning" : undefined}>
                                <td>
                                    <figure className="mb-1">
                                        {
                                            row.imgSrcs && row.imgSrcs.split(",")?.map(function (imgSrc) {
                                                return <img key={game.id + imgSrc} width="90" height="90"
                                                            className="rounded-circle img-thumbnail" src={imgSrc}
                                                            onError={({currentTarget}) => currentTarget.src = "./shrug.png"}/>
                                            })
                                        }
                                        <figcaption>{row.displayName}</figcaption>
                                    </figure>
                                </td>
                                {(!pickEnabled || (pickEnabled && !hideFriendsPick)) &&
                                    <td>
                                        {
                                            row.friendPicks?.map(function (friend) {
                                                if (friend.id) {
                                                    return <>
                                                        <div key={game.id + "-" + friend.id}>
                                                            <img width="30" height="30" className="rounded-circle"
                                                                 style={{marginBottom: "1px", marginRight: "3px"}}
                                                                 src={pics.get(friend.id)}/><span
                                                            style={{fontSize: "14px"}}>{friend.name}</span><br/>
                                                        </div>
                                                    </>
                                                } else {
                                                    return <>
                                                        <div key={game.id + "-" + friend.name}>
                                                            <span style={{fontSize: "13px"}}>{friend.name}</span><br/>
                                                        </div>
                                                    </>
                                                }
                                            })
                                        }
                                    </td>
                                }
                                <td>{!pickEnabled && <><h1>{row.points}</h1><br/></>}<span
                                    style={{whiteSpace: "pre"}}>{row.pointsCellText}</span><br/></td>
                                {pickEnabled && <td><Button variant={row.disabled ? 'secondary' : 'primary'}
                                                            onClick={() => doPick(game.id, team.id, row, revalidator, setResetTeamGameEnabled)}>Pick</Button>
                                </td>}
                            </tr>
                        </>
                    }
                )
            }
            </tbody>
        </Table>
    </Tab>;
}

function pushTeamRow(rows, pickEnabled, team, prevPicks, pick, friendPicksByPlayerMap, game) {
    let teamPoints = 0
    let teamPointsCellText = ""
    if (pickEnabled) {
        teamPointsCellText = "4/4goals\n5/5goals\n6/6goals\netc..";
    } else {
        var goals =
            (game.awayOrHome == "home" ? game.homeTeamGoals : game.awayTeamGoals) ||
            0;
        var otherTeamGoals =
            (game.awayOrHome == "away" ? game.homeTeamGoals : game.awayTeamGoals) ||
            0;
        var realGoals = goals;
        if (game.isShootout == true && goals > otherTeamGoals) {
            realGoals--;
        }
        if (realGoals >= 4) {
            teamPoints = realGoals;
        } else {
            teamPoints = 0;
        }
        teamPointsCellText += "G: " + realGoals;
        if (goals != realGoals) {
            teamPointsCellText += "\nSO Goals: 1";
        }
    }
    rows.push(
        {
            'name': "team",
            'displayName': "The " + team.teamName + "!",
            'points': teamPoints,
            'noToi': false,
            'pointsCellText': teamPointsCellText,
            'picked': pick && pick.theTeam != undefined,
            'disabled': prevPicks.map((e) => e?.theTeam).includes(true),
            'friendPicks': friendPicksByPlayerMap && friendPicksByPlayerMap["theTeam"]?.map((friend) => {
                if (friend.user) {
                    return {'name': friend.user.displayName, 'id': friend.user.id};
                } else {
                    return {'name': friend.announcer?.nickname};
                }
            }).sort((a, b) => a.name.localeCompare(b.name))
                .sort((a, b) =>
                    a.id == undefined ? -1
                        : 1
                )
        }
    )
}

function pushGoalieRow(gamePlayers, rows, pickEnabled, team, seasonImgText, prevPicks, pick, friendPicksByPlayerMap, game) {
    let goaliesPics
    if (game.league === "PWHL") {
        goaliesPics = gamePlayers.filter((player) => player.position == "Goalie")
            .reduce(
                (accumulator, player) => accumulator + "https://assets.leaguestat.com/pwhl/240x240/" +
                    + player.id.playerId + ".jpg,", "",
            ).replace(/,$/, "");
    } else {
        goaliesPics = gamePlayers.filter((player) => player.position == "Goalie")
            .reduce(
                (accumulator, player) => accumulator + "https://assets.nhle.com/mugs/nhl/" +
                    seasonImgText +
                    "/" +
                    team.abbreviation +
                    "/" +
                    player.id.playerId +
                    ".png,",
                "",
            ).replace(/,$/, "");
    }
    let points = 0
    let pointsCellText = ""
    if (pickEnabled) {
        pointsCellText = "5/shutout\n3/1-or-2 GA\n5/assist";
    } else {
        const goals =
            (game.awayOrHome == "home" ? game.awayTeamGoals : game.homeTeamGoals) ||
            0;
        const assists = (game.awayOrHome == "home" ? game.homeTeamGoalieAssists : game.awayTeamGoalieAssists) || 0;
        if (goals > 2) {
            points = 0;
        } else if (goals > 0) {
            points = 3;
        } else {
            points = 5;
        }
        pointsCellText += "GA: " + goals;
        if (assists > 0) {
            points += assists * 5;
            pointsCellText += "\nA: " + assists;
        }
    }
    rows.push(
        {
            'name': "goalies",
            'displayName': "The Goalies",
            'points': points,
            'pointsCellText': pointsCellText,
            'imgSrcs': goaliesPics,
            'noToi': false,
            'picked': pick && pick.goalies != undefined,
            'disabled': prevPicks.map((e) => e?.goalies).includes(true),
            'friendPicks': friendPicksByPlayerMap && friendPicksByPlayerMap["goalies"]?.map((friend) => {
                if (friend.user) {
                    return {'name': friend.user.displayName, 'id': friend.user.id};
                } else {
                    return {'name': friend.announcer?.nickname};
                }
            }).sort((a, b) => a.name.localeCompare(b.name)).sort((a, b) =>
                a.id == undefined ? -1
                    : 1
            )
        }
    )
}

function pushPlayerRows(gamePlayers, rows, prevGamePlayersMap, pickEnabled, team, seasonImgText, prevPicks, pick, friendPicksByPlayerMap, game) {
    let anyToisLastGame = false;
    if (prevGamePlayersMap) {
        for (const player of prevGamePlayersMap.values()) {
            if (player?.timeOnIce && player.timeOnIce != "0:00") {
                anyToisLastGame = true;
                break;
            }
        }
    }
    gamePlayers.filter((player) => player.position != "Goalie")
        .sort((a, b) =>
            a.name.split(" ").reverse().join(",") >
            b.name.split(" ").reverse().join(",")
                ? 1
                : -1
        )
        .forEach((player) => {
            let lastGameToi = prevGamePlayersMap?.get(player.id.playerId)?.timeOnIce;
            let positionText = "(F)";
            if (player.position == "Defenseman") {
                positionText = "(D)";
            }
            let points = 0
            let pointsCellText = ""
            if (pickEnabled) {
                if (player.position == "Defenseman") {
                    pointsCellText = "3/goal\n5/OT goal\n1/assist\n*2/shorty";
                } else if (player.position == "Forward") {
                    pointsCellText = "2/goal\n5/OT goal\n1/assist\n*2/shorty";
                }
            } else {
                if (player.position == "Defenseman") {
                    points =
                        ((player.goals || 0) * 3 +
                            (player.otGoals || 0) * 5 +
                            (player.otShortGoals || 0) * 10 +
                            (player.assists || 0) +
                            (player.shortGoals || 0) * 6 +
                            (player.shortAssists || 0) * 2);
                } else if (player.position == "Forward") {
                    points = ((player.goals || 0) * 2 +
                        (player.otGoals || 0) * 5 +
                        (player.otShortGoals || 0) * 10 +
                        (player.assists || 0) +
                        (player.shortGoals || 0) * 4 +
                        (player.shortAssists || 0) * 2);
                }
                if (player.goals) {
                    pointsCellText += "G: " + player.goals + "\n";
                }
                if (player.otGoals) {
                    pointsCellText += "OT G: 1\n";
                }
                if (player.otShortGoals) {
                    pointsCellText += "OT SHG: 1\n";
                }
                if (player.assists) {
                    pointsCellText += "A: " + player.assists + "\n";
                }
                if (player.shortGoals) {
                    pointsCellText += "SHG: " + player.shortGoals + "\n";
                }
                if (player.shortAssists) {
                    pointsCellText += "SHA: " + player.shortAssists;
                }
            }
            let imgSrc = "";
            if (game.league === "PWHL") {
                imgSrc = "https://assets.leaguestat.com/pwhl/240x240/" + player.id.playerId + ".jpg"
            } else {
                imgSrc = "https://assets.nhle.com/mugs/nhl/" +
                    seasonImgText +
                    "/" +
                    team.abbreviation +
                    "/" +
                    player.id.playerId +
                    ".png"
            }
            rows.push(
                {
                    'name': player.name,
                    'displayName': player.name + " " + positionText,
                    'id': player.id.playerId,
                    'noToi': anyToisLastGame && (lastGameToi == undefined || lastGameToi == "0:00"),
                    'points': points,
                    'pointsCellText': pointsCellText,
                    'imgSrcs': imgSrc,
                    'disabled': prevPicks.map((e) => e?.gamePlayer?.name).includes(player.name),
                    'picked': pick && pick.gamePlayer && pick.gamePlayer.id.playerId == player.id.playerId,
                    'friendPicks': friendPicksByPlayerMap && friendPicksByPlayerMap[player.id.playerId]?.map((friend) => {
                        if (friend.user) {
                            return {'name': friend.user.displayName, 'id': friend.user.id};
                        } else {
                            return {'name': friend.announcer?.nickname};
                        }
                    }).sort((a, b) => a.name.localeCompare(b.name)).sort((a, b) =>
                        a.id == undefined ? -1
                            : 1
                    )
                }
            )
        });
}

function doPick(gameId, teamId, row, revalidator, setResetTeamGameEnabled) {
    if (row.disabled) {
        Swal.fire({
            text:
                "Cannot pick " +
                row.name +
                " again! On cooldown from being picked in one of the previous two games.",
            icon: "error",
            confirmButtonText: "OK"
        });
        return;
    }
    var message = "";
    if (row.noToi) {
        message =
            row.name +
            " had no time-on-ice the previous game! Are you sure you want to pick them? You can't change a pick once locked in!";
    } else {
        message =
            "Are you sure you want to pick " +
            row.name +
            "? You can't change a pick once locked in!";
    }
    Swal.fire({
        text: message,
        icon: "warning",
        confirmButtonText: "OK",
        showCancelButton: true,
        cancelButtonText: "NOPE!",
    }).then((result) => {
        if (result["isConfirmed"]) {
            AxiosInstance.post("/api/pick/user?gameId=" + gameId + "&pick=" + row.name + "&teamId=" + teamId)
                .then(response => {
                    setResetTeamGameEnabled(false);
                    revalidator.revalidate();
                    window.scrollTo({top: 0, behavior: 'smooth'});
                })
                .catch(err => {
                    console.log(err)
                    Swal.fire({
                        text: err?.response?.data?._embedded?.errors?.[0]?.message || err["message"],
                        icon: "error",
                        confirmButtonText: "OK",
                    });
                });
        }
    });
}
