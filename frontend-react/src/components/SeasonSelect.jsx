import Form from "react-bootstrap/Form";
import { SEASONS } from "../lib/prefs";

export default function SeasonSelect({ value, onChange }) {
    return (
        <Form.Select size="sm" className="w-auto" value={value} onChange={(e) => onChange(e.target.value)}
                     aria-label="Season">
            {SEASONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </Form.Select>
    );
}
