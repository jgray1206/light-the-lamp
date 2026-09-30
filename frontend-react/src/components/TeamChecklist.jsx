import Form from "react-bootstrap/Form";

// selected: array of team ids as strings
export default function TeamChecklist({ teams, selected, onChange }) {
    const toggle = (id, checked) =>
        onChange(checked ? [...selected, id] : selected.filter((t) => t !== id));

    return (
        <div className="team-checklist">
            {teams.map((t) => (
                <Form.Check
                    key={t.id}
                    type="checkbox"
                    id={`team-${t.id}`}
                    label={t.teamName}
                    checked={selected.includes(String(t.id))}
                    onChange={(e) => toggle(String(t.id), e.target.checked)}
                />
            ))}
        </div>
    );
}
