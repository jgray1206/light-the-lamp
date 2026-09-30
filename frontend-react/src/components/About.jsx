export default function About() {
    return (
        <div className="panel about">
            <h1 className="h3">How to play</h1>
            <p>
                Light the Lamp is a simple hockey drafting game. When you sign up, you pick your favorite teams.
                Before each of their games, you pick one player (or the goalies, or the whole team) and earn
                points based on how your pick does. Add your friends and family to see who reigns supreme on the
                leaderboard!
            </p>

            <h2 className="h5">Making picks</h2>
            <ul>
                <li>Picks open the night before a game (around 8pm ET) and lock when the game starts.</li>
                <li>On the <strong>Picks</strong> tab, games you can still pick are marked green.</li>
                <li>Every pick has a <strong>two-game cooldown</strong>, so look ahead at upcoming games and use your picks wisely!</li>
                <li>
                    The NHL API doesn't share injury info, so be careful not to pick someone who's hurt. Players with no
                    time on ice in the previous game are highlighted in yellow.
                </li>
            </ul>

            <h2 className="h5">Scoring</h2>
            <dl className="scoring">
                <dt>Forwards</dt>
                <dd>2 points per regulation goal, +5 for an OT goal (7 total!), 1 point per assist. Points double if shorthanded.</dd>
                <dt>Defensemen</dt>
                <dd>3 points per regulation goal, +5 for an OT goal (8 total!), 1 point per assist. Points double if shorthanded.</dd>
                <dt>Goalies</dt>
                <dd>
                    5 points for a shutout, 3 for allowing 1 or 2 goals, 0 for 3 or more. 5 points per assist.
                    Empty-netters and shootouts don't count against the goalies.
                </dd>
                <dt>The Team</dt>
                <dd>1 point per goal once they score 4 or more: 4 points for 4 goals, 5 for 5, and so on.</dd>
            </dl>

            <p className="mb-0 mt-4 small text-body-secondary">
                Enjoying the game?{" "}
                <a href="https://ko-fi.com/I2I8OUVUZ" target="_blank" rel="noopener">Increase your team's karma on Ko-fi</a>.
                Found a bug? <a href="mailto:grayio.lightthelamp@gmail.com">Let me know</a>.
            </p>
        </div>
    );
}
