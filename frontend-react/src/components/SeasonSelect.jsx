import Form from "react-bootstrap/Form";
import { useConfig } from "../lib/config";

export default function SeasonSelect({ value, onChange }) {
    const { seasons } = useConfig();
    return (
        <Form.Select size="sm" className="w-auto" value={value ?? ""} onChange={(e) => onChange(e.target.value)}
                     aria-label="Season">
            {seasons.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </Form.Select>
    );
}
