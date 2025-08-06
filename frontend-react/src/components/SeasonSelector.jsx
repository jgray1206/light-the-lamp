import Form from 'react-bootstrap/Form';

export default function SeasonSelector(props) {
    return <>
        <Form.Select className="seasonSelector me-1" onChange={(e) => props.setSeason(e.target.value)} defaultValue={props.getSeason} title="Season">
            <option value="202501">2025-2026 Pre</option>
            <option value="202403">2024-2025 Post</option>
            <option value="202402">2024-2025</option>
            <option value="202401">2024-2025 Pre</option>
            <option value="202303">2023-2024 Post</option>
            <option value="202302">2023-2024</option>
            <option value="202301">2023-2024 Pre</option>
            <option value="202203">2022-2023 Post</option>
            <option value="202202">2022-2023</option>
        </Form.Select>
    </>
}