import AxiosInstance from '../provider/axiosProvider';
import { useLoaderData, useNavigate } from "react-router-dom";
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import Table from 'react-bootstrap/Table';
import Swal from 'sweetalert2';
import { Typeahead } from 'react-bootstrap-typeahead';
import { Button, FormCheck } from 'react-bootstrap';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import SeasonSelector from "./SeasonSelector";
import Form from 'react-bootstrap/Form';

export default function Announcers(props) {
    const response = useLoaderData();
    const navigate = useNavigate();
    const games = response.games.data.sort((a, b) => b.id - a.id);
    const announcers = response.announcers.data;
    const picks = response.picks.data;
    const userCount = response.userCount.data;
    const picksMap = picks?.reduce(
        (acc, obj) => (
            (acc[obj.game.id + "-" + obj.team.id] =
                acc[obj.game.id + "-" + obj.team.id] || []).push(obj),
            acc
        ),
        {}
    );
    var teamGroupedAnnouncers = announcers.reduce(
        (acc, obj) => (
            (acc[obj.team.id] = acc[obj.team.id] || []).push(obj),
            acc
        ),
        {}
    );
    const teams = Object.values(announcers.reduce(
        (acc, obj) => (
            (acc[obj.team.id] = obj.team),
            acc
        ),
        {}
    ));
    const gamesByTeamMap = games?.reduce(
        (acc, obj) => (
            (acc[obj.awayTeam.id] =
                acc[obj.awayTeam.id] || []).push(obj) && (acc[obj.homeTeam.id] =
                    acc[obj.homeTeam.id] || []).push(obj),
            acc
        ),
        {}
    );

    return <>
        <SeasonSelector setSeason={props.setSeason} getSeason={props.getSeason} />
        {games.length == 0 ?
            <h2>No games yet!</h2> :
            <Tabs
                id="team-tabs"
                className="mb-3 mt-1 flex-nowrap text-nowrap" style={{ overflowX: 'auto', overflowY: 'hidden' }}
            >
                {teams.map(function (team) {
                    if (gamesByTeamMap[team.id]?.length > 0) {
                        return <Tab eventKey={team.id} title={team.teamName} key={team.id}>
                            <Tabs
                                id="game-tabs"
                                className="mb-3 flex-nowrap text-nowrap" style={{ overflowX: 'auto', overflowY: 'hidden' }}
                                onSelect={(e) => { if (e.includes("moregames")) { props.setMaxGames(props.maxGames + 20); } }}>

                                {
                                    gamesByTeamMap[team.id]?.map((game) => {
                                        return picksTable(game, team, picksMap, teamGroupedAnnouncers[team.id], navigate);
                                    })
                                }
                                {
                                    gamesByTeamMap[team.id]?.length == props.maxGames && <Tab tabClassName="text-secondary" eventKey={team.id + "moregames"} title={"Load More\nGames"} key={team.id + "moregames"} />
                                }
                            </Tabs>
                        </Tab>;
                    }
                })}
            </Tabs>
        }
        <span>active users: {userCount}</span>
    </>;
}

function picksTable(game, team, picksMap, announcers, navigate) {
    var picks = picksMap[game.id + "-" + team.id];
    game.awayOrHome = game.awayTeam.id == team.id ? "away" : "home";
    var gameDate = new Date(
        Date.UTC(
            game.date[0],
            game.date[1] - 1,
            game.date[2],
            game.date[3],
            game.date[4] + 5
        )
    );
    var opts = game.players.filter((player) => player.team.id == team.id).filter((player) => player.position != "Goalie")
        .map((player) => player.name)
        .sort((a, b) =>
            a > b
                ? 1
                : -1
        );
    opts.push("goalies");
    opts.push("team");
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
    let classString = "text-success";
    if (picks?.length == announcers.length) {
        classString = "text-secondary";
    }
    return <Tab tabClassName={classString} eventKey={game.id + "-" + team.id} title={gameStringShort} key={game.id + "-" + team.id}>
        <Button variant="primary" className="mt-1" onClick={() => { refreshGame(game.id) }}>Refresh Points</Button>
        <Table responsive hover>
            <thead><tr><th>Announcer</th><th>Pick</th><th>x2 Points</th></tr></thead>
            <tbody>
                {
                    announcers.map(function (announcer) {
                        const announcerPick = picks?.find((pick) => pick.announcer.id == announcer.id);
                        const otherAnnouncerDoublePoints = picks?.find((pick) => pick.game.id == game.id && pick.doublePoints == true && pick.announcer.id != announcer.id);
                        let selectedOpt = undefined;
                        if (announcerPick?.theTeam) {
                            selectedOpt = "team";
                        } else if (announcerPick?.goalies) {
                            selectedOpt = "goalies";
                        } else if (announcerPick?.gamePlayer?.name) {
                            selectedOpt = announcerPick.gamePlayer.name;
                        }
                        return <>
                            <tr key={game.id + "-" + announcer.id}>
                                <td>
                                    <span>{announcer.displayName}</span>
                                </td>
                                <td>
                                    <Typeahead
                                        id={game.id + "-" + announcer.id}
                                        onChange={(selected) => {
                                            if (selected.length > 0) {
                                                doPick(game.id, announcer, selected[0], navigate);
                                            } else {
                                                deletePick(game.id, announcer, navigate);
                                            }
                                        }}
                                        options={opts}
                                        defaultSelected={selectedOpt ? [selectedOpt] : undefined}
                                    />
                                </td>
                                <td>
                                    <Form.Check
                                        type="checkbox"
                                        disabled={!announcerPick || otherAnnouncerDoublePoints != undefined}
                                        checked={announcerPick?.doublePoints}
                                        onChange={(event) => {
                                            markDoublePoints(game.id, announcer, event.target.checked, navigate);
                                        }}
                                        id={game.id + "-" + announcer.id + "-checkbox"}
                                    />
                                </td>
                            </tr>
                        </>
                    }
                    )
                }
            </tbody>
        </Table>
    </Tab>;
}

function markDoublePoints(gameId, announcer, doublePoints, navigate) {
    AxiosInstance.post("/api/pick/announcer?gameId=" + gameId + "&doublePoints=" + doublePoints + "&announcerId=" + announcer.id)
        .then(() => navigate("/announcers", { replace: true }))
        .catch(err => {
            console.log(err)
            Swal.fire({
                text: err?.response?.data?._embedded?.errors?.[0]?.message || err["message"],
                icon: "error",
                confirmButtonText: "OK",
            });
        });
}


function doPick(gameId, announcer, pick, navigate) {
    AxiosInstance.post("/api/pick/announcer?gameId=" + gameId + "&pick=" + pick + "&announcerId=" + announcer.id)
        .then(() => navigate("/announcers", { replace: true }))
        .catch(err => {
            console.log(err)
            Swal.fire({
                text: err?.response?.data?._embedded?.errors?.[0]?.message || err["message"],
                icon: "error",
                confirmButtonText: "OK",
            });
        });
}

function deletePick(gameId, announcer, navigate) {
    AxiosInstance.delete("/api/pick/announcer?gameId=" + gameId + "&announcerId=" + announcer.id)
        .then(() => navigate("/announcers", { replace: true }))
        .catch(err => {
            console.log(err)
            Swal.fire({
                text: err?.response?.data?._embedded?.errors?.[0]?.message || err["message"],
                icon: "error",
                confirmButtonText: "OK",
            });
        });
}

function refreshGame(gameId) {
    AxiosInstance.post("/api/game/refresh-points?gameId=" + gameId)
        .catch(err => {
            console.log(err)
            Swal.fire({
                text: err?.response?.data?._embedded?.errors?.[0]?.message || err["message"],
                icon: "error",
                confirmButtonText: "OK",
            });
        });
}