export default function About() {
  return (
    <>
      <h1>Light the Lamp</h1>
      <br />
      <h3>What is it?</h3>
      <span>
        Light the Lamp is a simple hockey drafting game. When you sign up, you
        can select your favorite NHL teams to select a player (or the goalies,
        or the team) for before each game. You will gain points based on how
        your pick does. Add your friends/family to filter down the leaderboards
        to see who reigns supreme!
      </span>
      <br />
      <br />
      <h3>How to play?</h3>
      <span>
        Picking for a game opens up the night before the game, around 8pm EST,
        and locks when the game starts. Simply head to the "Picks" tab, scroll
        through your active games (which will be green), and select who or what
        you think will get you the most points. Sadly the NHL api doesn’t expose
        injury info, so you will have to be a bit careful not pick someone you
        know is injured. Players that didn’t have any time on ice the previous
        game will be yellowed out in the pick selection. Every pick has a two
        game cooldown, so look ahead at the upcoming games to make sure you use
        your picks wisely!
      </span>
      <br />
      <br />
      <h3>Scoring</h3>
      <ul>
        <li>
          <strong>Goalies</strong>: 5 points for a shutout, 3 points for a 1 or
          2 goal game, 0 points for 3+ goals against.
        </li>
        <li>
          <strong>The Team</strong>: 1 point per goal past 3. So 4 points for 4
          goals, 5 for 5, etc.
        </li>
        <li>
          <strong>Forwards</strong>: 2 points per goal, 4 per shorty, 1 point
          per assist, 2 points per shorty assist.
        </li>
        <li>
          <strong>Defensemen</strong>: 3 points per goal, 6 per shorty, 1 points
          per assist, 2 points per shorty assist.
        </li>
      </ul>
    </>
  );
}
