import Button from "react-bootstrap/Button";
import { MdRefresh } from "react-icons/md";

export default function RefreshButton({ onClick, refreshing }) {
    return (
        <Button variant="outline-secondary" size="sm" className="ms-auto d-inline-flex align-items-center gap-1"
                onClick={onClick} disabled={refreshing} aria-label="Refresh">
            <MdRefresh size={18} className={refreshing ? "spin" : undefined} />
            <span className="d-none d-sm-inline">{refreshing ? "Refreshing" : "Refresh"}</span>
        </Button>
    );
}
